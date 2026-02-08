// GuildShopSync Tray Application v3.1
// Compiled .NET WinForms application - NOT a console process.
// Immune to console control signals (CTRL_LOGOFF_EVENT, CTRL_SHUTDOWN_EVENT)
// that killed all previous PowerShell-based versions.

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace GuildShopSync
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            // TLS 1.2 required for HTTPS API calls
            ServicePointManager.SecurityProtocol =
                SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;

            // Single instance via named mutex.
            // No Task Scheduler involved, so exit code doesn't matter.
            bool createdNew;
            using (var mutex = new Mutex(true, @"Global\GuildShopSyncTray", out createdNew))
            {
                if (!createdNew)
                    return; // Already running

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                // Global exception handlers - log errors instead of silent death
                Application.ThreadException += (s, e) =>
                {
                    TrayApp.WriteStaticLog("UI thread error: " + e.Exception.ToString());
                };
                AppDomain.CurrentDomain.UnhandledException += (s, e) =>
                {
                    TrayApp.WriteStaticLog("Fatal error: " + ((Exception)e.ExceptionObject).ToString());
                };

                Application.Run(new TrayApp());
            }
        }
    }

    class TrayApp : ApplicationContext
    {
        private const string Version = "3.1";
        private const string ApiUrl = "https://tbcguild.duckdns.org/api/consumes/prices";

        private static readonly string LogDir;
        private static readonly string LogFile;

        private NotifyIcon trayIcon;
        private System.Windows.Forms.Timer pollTimer;
        private string wowPath;
        private string watchPath;
        private int uploadCount;
        private string lastUploadTime = "Never";
        private Dictionary<string, long> lastPollHashes = new Dictionary<string, long>();

        private ToolStripMenuItem statusItem;
        private ToolStripMenuItem lastUploadItem;
        private ToolStripMenuItem countItem;

        static TrayApp()
        {
            LogDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "GuildShopSync");
            LogFile = Path.Combine(LogDir, "service.log");
        }

        public static void WriteStaticLog(string message)
        {
            try
            {
                Directory.CreateDirectory(LogDir);
                File.AppendAllText(LogFile,
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " - " + message + Environment.NewLine);
            }
            catch { }
        }

        public TrayApp()
        {
            Directory.CreateDirectory(LogDir);

            // Graceful cleanup on session end (logoff / shutdown)
            SystemEvents.SessionEnding += OnSessionEnding;

            wowPath = GetWoWPath();
            if (wowPath == null)
            {
                WriteLog("ERROR: Could not find TurtleWoW installation.");
                MessageBox.Show(
                    "Could not find TurtleWoW installation.\n" +
                    "Please reinstall GuildShopSync and select your WoW folder.",
                    "GuildShopSync", MessageBoxButtons.OK, MessageBoxIcon.Error);
                ExitThread();
                return;
            }

            watchPath = Path.Combine(wowPath, "WTF", "Account");
            if (!Directory.Exists(watchPath))
            {
                WriteLog("ERROR: WTF\\Account folder not found at " + watchPath);
                MessageBox.Show(
                    "WTF\\Account folder not found at:\n" + watchPath +
                    "\n\nPlease run TurtleWoW at least once.",
                    "GuildShopSync", MessageBoxButtons.OK, MessageBoxIcon.Error);
                ExitThread();
                return;
            }

            WriteLog("Service started. WoW path: " + wowPath);
            SetupTrayIcon();

            pollTimer = new System.Windows.Forms.Timer();
            pollTimer.Interval = 3000;
            pollTimer.Tick += PollTick;
            pollTimer.Start();

            WriteLog("Polling " + watchPath + " for GuildShopSync.lua changes (3s interval)");
        }

        // --- Session Ending ---
        // WinForms apps receive this as a Windows message, not a console signal.
        // This is the key difference from PowerShell: we can handle it gracefully.
        private void OnSessionEnding(object sender, SessionEndingEventArgs e)
        {
            WriteLog("Session ending (reason: " + e.Reason + "). Cleaning up.");
            if (trayIcon != null)
                trayIcon.Visible = false;
        }

        // --- Tray Icon Setup ---
        private void SetupTrayIcon()
        {
            var bmp = new Bitmap(16, 16);
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.Clear(Color.Transparent);
                g.FillEllipse(Brushes.LimeGreen, 1, 1, 14, 14);
                g.DrawEllipse(Pens.DarkGreen, 1, 1, 13, 13);
            }

            trayIcon = new NotifyIcon();
            trayIcon.Icon = Icon.FromHandle(bmp.GetHicon());
            trayIcon.Text = "GuildShopSync - Watching for scans";
            trayIcon.Visible = true;

            var menu = new ContextMenuStrip();

            var header = new ToolStripMenuItem("GuildShopSync v" + Version);
            header.Enabled = false;
            header.Font = new Font(header.Font, FontStyle.Bold);
            menu.Items.Add(header);

            menu.Items.Add(new ToolStripSeparator());

            statusItem = new ToolStripMenuItem("Status: Watching for price scans");
            statusItem.Enabled = false;
            menu.Items.Add(statusItem);

            lastUploadItem = new ToolStripMenuItem("Last Upload: Never");
            lastUploadItem.Enabled = false;
            menu.Items.Add(lastUploadItem);

            countItem = new ToolStripMenuItem("Uploads This Session: 0");
            countItem.Enabled = false;
            menu.Items.Add(countItem);

            menu.Items.Add(new ToolStripSeparator());

            var openLog = new ToolStripMenuItem("Open Log Folder");
            openLog.Click += (s, e) =>
            {
                if (Directory.Exists(LogDir))
                    System.Diagnostics.Process.Start("explorer.exe", LogDir);
            };
            menu.Items.Add(openLog);

            menu.Items.Add(new ToolStripSeparator());

            var exitItem = new ToolStripMenuItem("Exit");
            exitItem.Click += (s, e) =>
            {
                WriteLog("Service stopped by user via tray menu");
                Shutdown();
            };
            menu.Items.Add(exitItem);

            trayIcon.ContextMenuStrip = menu;

            trayIcon.DoubleClick += (s, e) =>
            {
                trayIcon.BalloonTipTitle = "GuildShopSync";
                trayIcon.BalloonTipText =
                    "Watching for price scans\n" +
                    "Last upload: " + lastUploadTime + "\n" +
                    "Uploads this session: " + uploadCount;
                trayIcon.BalloonTipIcon = ToolTipIcon.Info;
                trayIcon.ShowBalloonTip(5000);
            };
        }

        // --- Polling ---
        private void PollTick(object sender, EventArgs e)
        {
            try
            {
                string[] files = Directory.GetFiles(watchPath, "GuildShopSync.lua", SearchOption.AllDirectories);
                foreach (string filePath in files)
                {
                    try
                    {
                        var fi = new FileInfo(filePath);
                        long currentWrite = fi.LastWriteTime.Ticks;
                        long lastWrite;
                        bool existed = lastPollHashes.TryGetValue(filePath, out lastWrite);

                        if (!existed || lastWrite != currentWrite)
                        {
                            lastPollHashes[filePath] = currentWrite;
                            if (existed) // Skip initial detection
                                UploadPrices(filePath);
                        }
                    }
                    catch (Exception ex)
                    {
                        WriteLog("Error checking " + filePath + ": " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                WriteLog("Poll error: " + ex.Message);
            }
        }

        // --- Upload ---
        private void UploadPrices(string filePath)
        {
            try
            {
                if (!File.Exists(filePath)) return;

                string content;
                try
                {
                    content = File.ReadAllText(filePath);
                }
                catch (IOException)
                {
                    return; // File locked by WoW - retry next poll cycle
                }

                if (string.IsNullOrEmpty(content)) return;
                if (!Regex.IsMatch(content, @"\[""triggerUpload""\]\s*=\s*true")) return;

                statusItem.Text = "Status: Uploading prices...";
                trayIcon.Text = "GuildShopSync - Uploading...";

                // Extract prices from Lua table
                var prices = new Dictionary<string, int>();
                var section = Regex.Match(content, @"\[""prices""\]\s*=\s*\{([^}]+)\}");
                if (section.Success)
                {
                    var matches = Regex.Matches(section.Groups[1].Value, @"\[""(\w+)""\]\s*=\s*(\d+)");
                    foreach (Match m in matches)
                        prices[m.Groups[1].Value] = int.Parse(m.Groups[2].Value);
                }

                if (prices.Count == 0)
                {
                    statusItem.Text = "Status: Watching for price scans";
                    trayIcon.Text = "GuildShopSync - Watching for scans";
                    return;
                }

                // Build JSON
                var sb = new StringBuilder();
                sb.Append("{\"prices\":{");
                bool first = true;
                foreach (var kvp in prices)
                {
                    if (!first) sb.Append(",");
                    sb.AppendFormat("\"{0}\":{1}", kvp.Key, kvp.Value);
                    first = false;
                }
                sb.Append("},\"source\":\"GuildShopSync-addon\",\"updatedBy\":\"GuildShopSync\"}");

                // HTTP PUT
                var request = (HttpWebRequest)WebRequest.Create(ApiUrl);
                request.Method = "PUT";
                request.ContentType = "application/json";
                request.Timeout = 30000;
                byte[] data = Encoding.UTF8.GetBytes(sb.ToString());
                request.ContentLength = data.Length;

                using (var stream = request.GetRequestStream())
                    stream.Write(data, 0, data.Length);

                using (var response = (HttpWebResponse)request.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream()))
                {
                    string body = reader.ReadToEnd();

                    if (body.Contains("\"success\""))
                    {
                        // Clear trigger flag in SavedVariables
                        content = Regex.Replace(content,
                            @"\[""triggerUpload""\]\s*=\s*true",
                            "[\"triggerUpload\"] = false");
                        File.WriteAllText(filePath, content);

                        uploadCount++;
                        lastUploadTime = DateTime.Now.ToString("h:mm tt");
                        statusItem.Text = "Status: Watching for price scans";
                        lastUploadItem.Text = "Last Upload: " + lastUploadTime;
                        countItem.Text = "Uploads This Session: " + uploadCount;
                        trayIcon.Text = "GuildShopSync - Last upload: " + lastUploadTime;

                        WriteLog("Uploaded " + prices.Count + " prices successfully");

                        trayIcon.BalloonTipTitle = "Guild Shop Sync";
                        trayIcon.BalloonTipText = "Uploaded " + prices.Count + " prices to guild website!";
                        trayIcon.BalloonTipIcon = ToolTipIcon.Info;
                        trayIcon.ShowBalloonTip(5000);
                    }
                    else
                    {
                        WriteLog("Unexpected API response: " + body);
                        statusItem.Text = "Status: Upload issue - retrying on next scan";
                        trayIcon.Text = "GuildShopSync - Upload issue";
                    }
                }
            }
            catch (Exception ex)
            {
                statusItem.Text = "Status: Upload failed - retrying on next scan";
                trayIcon.Text = "GuildShopSync - Upload failed";
                WriteLog("Upload failed: " + ex.Message);

                trayIcon.BalloonTipTitle = "Guild Shop Sync";
                trayIcon.BalloonTipText = "Upload failed. Will retry on next scan.";
                trayIcon.BalloonTipIcon = ToolTipIcon.Error;
                trayIcon.ShowBalloonTip(5000);
            }
        }

        // --- WoW Path Resolution ---
        private string GetWoWPath()
        {
            // 1. Registry (set by installer)
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\GuildShopSync"))
                {
                    if (key != null)
                    {
                        string path = key.GetValue("WoWPath") as string;
                        if (!string.IsNullOrEmpty(path) && Directory.Exists(path))
                            return path;
                    }
                }
            }
            catch { }

            // 2. Environment variable (legacy v2.5 support)
            string envPath = Environment.GetEnvironmentVariable("GUILDSHOPSYNC_WOWPATH");
            if (!string.IsNullOrEmpty(envPath) && Directory.Exists(envPath))
                return envPath;

            // 3. Common install paths
            string[] paths =
            {
                @"C:\turtlewow",
                @"D:\turtlewow",
                @"C:\Games\turtlewow",
                @"D:\Games\turtlewow",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "turtlewow"),
                @"C:\Program Files\turtlewow",
                @"C:\Program Files (x86)\turtlewow"
            };

            foreach (string p in paths)
            {
                if (File.Exists(Path.Combine(p, "WoW.exe")))
                    return p;
            }

            return null;
        }

        // --- Logging ---
        private void WriteLog(string message)
        {
            WriteStaticLog(message);
        }

        // --- Shutdown ---
        private void Shutdown()
        {
            if (pollTimer != null) { pollTimer.Stop(); pollTimer.Dispose(); }
            trayIcon.Visible = false;
            trayIcon.Dispose();
            WriteLog("Service stopped");
            Application.Exit();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                SystemEvents.SessionEnding -= OnSessionEnding;
                if (pollTimer != null) { pollTimer.Stop(); pollTimer.Dispose(); }
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
            }
            base.Dispose(disposing);
        }
    }
}
