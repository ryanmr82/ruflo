// AH & Vault Sync - Unified Tray Application v5.0
// Combines GuildShopSync (AH price upload) + GBankExport (guild bank export)
// + BankAltExport (bank alt inventory export) into a single compiled .NET WinForms system tray app.
//
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

namespace AH_and_VaultSync
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
            bool createdNew;
            using (var mutex = new Mutex(true, @"Global\AH_and_VaultSync", out createdNew))
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
        private const string Version = "5.0";
        private const string ApiUrl = "https://tbcguild.duckdns.org/api/consumes/prices";
        private const string GBankApiUrl = "https://tbcguild.duckdns.org/api/guild-bank/inventory";
        private const string BankAltApiUrl = "https://tbcguild.duckdns.org/api/bank-alts/inventory";
        private const long MaxLogSizeBytes = 2 * 1024 * 1024; // 2MB log rotation

        private static readonly string LogDir;
        private static readonly string LogFile;

        private NotifyIcon trayIcon;
        private SyncSettings settings;

        // --- AH Price Watcher ---
        private System.Windows.Forms.Timer priceTimer;
        private int priceUploadCount;
        private string lastPriceUploadTime = "Never";
        private Dictionary<string, long> pricePollHashes = new Dictionary<string, long>();

        // --- Guild Bank Watcher ---
        private System.Windows.Forms.Timer gbankTimer;
        private int gbankExportCount;
        private string lastGbankExportTime = "Never";
        private Dictionary<string, long> gbankPollHashes = new Dictionary<string, long>();
        private const int GbankDebounceMs = 1500;

        // --- Bank Alt Watcher ---
        private System.Windows.Forms.Timer bankAltTimer;
        private int bankAltExportCount;
        private string lastBankAltExportTime = "Never";
        private Dictionary<string, long> bankAltPollHashes = new Dictionary<string, long>();
        private const int BankAltDebounceMs = 1500;

        // Quality name map
        private static readonly Dictionary<int, string> QualityNames = new Dictionary<int, string>
        {
            { 0, "Poor" }, { 1, "Common" }, { 2, "Uncommon" },
            { 3, "Rare" }, { 4, "Epic" }, { 5, "Legendary" }
        };

        // --- Shared ---
        private string wowPath;
        private string watchPath;

        // Menu items
        private ToolStripMenuItem priceStatusItem;
        private ToolStripMenuItem priceLastUploadItem;
        private ToolStripMenuItem priceCountItem;
        private ToolStripMenuItem gbankStatusItem;
        private ToolStripMenuItem gbankLastExportItem;
        private ToolStripMenuItem gbankCountItem;
        private ToolStripMenuItem bankAltStatusItem;
        private ToolStripMenuItem bankAltLastExportItem;
        private ToolStripMenuItem bankAltCountItem;

        static TrayApp()
        {
            LogDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AH_and_VaultSync", "Logs");
            LogFile = Path.Combine(LogDir, "tray-app.log");
        }

        public static void WriteStaticLog(string message)
        {
            try
            {
                Directory.CreateDirectory(LogDir);

                // Rotate log if too big
                if (File.Exists(LogFile) && new FileInfo(LogFile).Length > MaxLogSizeBytes)
                {
                    string backup = Path.Combine(LogDir, "tray-app.log.1");
                    if (File.Exists(backup)) File.Delete(backup);
                    File.Move(LogFile, backup);
                }

                File.AppendAllText(LogFile, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + message + "\n");
            }
            catch { }
        }

        public TrayApp()
        {
            // Load settings
            settings = SyncSettings.Load();

            wowPath = GetWoWPath();
            watchPath = wowPath != null ? Path.Combine(wowPath, "WTF", "Account") : "";

            WriteLog("AH & Vault Sync v" + Version + " starting...");
            WriteLog("WoW path: " + (wowPath ?? "NOT FOUND"));

            // Handle system shutdown/logoff
            SystemEvents.SessionEnding += OnSessionEnding;

            // Setup tray icon
            trayIcon = new NotifyIcon();
            trayIcon.Icon = CreateCustomIcon();
            trayIcon.Text = "AH & Vault Sync v" + Version;
            trayIcon.Visible = true;

            // Context menu
            var menu = new ContextMenuStrip();

            // Title/Header
            var header = new ToolStripMenuItem("AH & Vault Sync v" + Version);
            header.Font = new Font(header.Font, FontStyle.Bold);
            header.Enabled = false;
            menu.Items.Add(header);
            menu.Items.Add(new ToolStripSeparator());

            // --- AH Prices Section ---
            var priceHeader = new ToolStripMenuItem("--- AH Prices ---");
            priceHeader.Enabled = false;
            menu.Items.Add(priceHeader);

            priceStatusItem = new ToolStripMenuItem("Status: Watching for price scans");
            priceStatusItem.Enabled = false;
            menu.Items.Add(priceStatusItem);

            priceLastUploadItem = new ToolStripMenuItem("Last Upload: Never");
            priceLastUploadItem.Enabled = false;
            menu.Items.Add(priceLastUploadItem);

            priceCountItem = new ToolStripMenuItem("Uploads This Session: 0");
            priceCountItem.Enabled = false;
            menu.Items.Add(priceCountItem);

            menu.Items.Add(new ToolStripSeparator());

            // --- Guild Bank Section ---
            var gbankHeader = new ToolStripMenuItem("--- Guild Bank ---");
            gbankHeader.Enabled = false;
            menu.Items.Add(gbankHeader);

            gbankStatusItem = new ToolStripMenuItem("Status: Watching for bank scans");
            gbankStatusItem.Enabled = false;
            menu.Items.Add(gbankStatusItem);

            gbankLastExportItem = new ToolStripMenuItem("Last Export: Never");
            gbankLastExportItem.Enabled = false;
            menu.Items.Add(gbankLastExportItem);

            gbankCountItem = new ToolStripMenuItem("Exports This Session: 0");
            gbankCountItem.Enabled = false;
            menu.Items.Add(gbankCountItem);

            menu.Items.Add(new ToolStripSeparator());

            // --- Bank Alts Section ---
            var bankAltHeader = new ToolStripMenuItem("--- Bank Alts ---");
            bankAltHeader.Enabled = false;
            menu.Items.Add(bankAltHeader);

            bankAltStatusItem = new ToolStripMenuItem("Status: Watching for bank alt scans");
            bankAltStatusItem.Enabled = false;
            menu.Items.Add(bankAltStatusItem);

            bankAltLastExportItem = new ToolStripMenuItem("Last Export: Never");
            bankAltLastExportItem.Enabled = false;
            menu.Items.Add(bankAltLastExportItem);

            bankAltCountItem = new ToolStripMenuItem("Exports This Session: 0");
            bankAltCountItem.Enabled = false;
            menu.Items.Add(bankAltCountItem);

            menu.Items.Add(new ToolStripSeparator());

            // --- Actions ---
            var settingsItem = new ToolStripMenuItem("Settings...");
            settingsItem.Click += (s, e) => OpenSettings();
            menu.Items.Add(settingsItem);

            var openWebsiteItem = new ToolStripMenuItem("Open Guild Website");
            openWebsiteItem.Click += (s, e) =>
            {
                try { System.Diagnostics.Process.Start("https://tbcguild.duckdns.org"); }
                catch { }
            };
            menu.Items.Add(openWebsiteItem);

            var openLogItem = new ToolStripMenuItem("View Log File");
            openLogItem.Click += (s, e) =>
            {
                try
                {
                    if (File.Exists(LogFile))
                        System.Diagnostics.Process.Start("notepad.exe", "\"" + LogFile + "\"");
                }
                catch { }
            };
            menu.Items.Add(openLogItem);

            menu.Items.Add(new ToolStripSeparator());

            var exitItem = new ToolStripMenuItem("Exit");
            exitItem.Click += (s, e) => Shutdown();
            menu.Items.Add(exitItem);

            trayIcon.ContextMenuStrip = menu;

            // Start watchers if path found
            if (!string.IsNullOrEmpty(wowPath) && Directory.Exists(watchPath))
            {
                // AH Price Watcher - poll every 3 seconds
                if (settings.SyncPrices)
                {
                    priceTimer = new System.Windows.Forms.Timer();
                    priceTimer.Interval = 3000;
                    priceTimer.Tick += PricePollTick;
                    priceTimer.Start();
                    WriteLog("Price watcher started");
                }
                else
                {
                    priceStatusItem.Text = "Status: Disabled in settings";
                }

                // Guild Bank Watcher - poll every 2 seconds
                if (settings.SyncGuildBank)
                {
                    gbankTimer = new System.Windows.Forms.Timer();
                    gbankTimer.Interval = 2000;
                    gbankTimer.Tick += GbankPollTick;
                    gbankTimer.Start();
                    WriteLog("Guild bank watcher started");
                }
                else
                {
                    gbankStatusItem.Text = "Status: Disabled in settings";
                }

                // Bank Alt Watcher - poll every 2 seconds
                if (settings.SyncBankAlts)
                {
                    bankAltTimer = new System.Windows.Forms.Timer();
                    bankAltTimer.Interval = 2000;
                    bankAltTimer.Tick += BankAltPollTick;
                    bankAltTimer.Start();
                    WriteLog("Bank alt watcher started");
                }
                else
                {
                    bankAltStatusItem.Text = "Status: Disabled in settings";
                }

                WriteLog("All watchers initialized");
            }
            else
            {
                priceStatusItem.Text = "Status: WoW path not found!";
                gbankStatusItem.Text = "Status: WoW path not found!";
                bankAltStatusItem.Text = "Status: WoW path not found!";
                WriteLog("ERROR: WoW path not configured - watchers not started");

                trayIcon.BalloonTipTitle = "AH & Vault Sync";
                trayIcon.BalloonTipText = "TurtleWoW not found. Click Settings to configure.";
                trayIcon.BalloonTipIcon = ToolTipIcon.Warning;
                trayIcon.ShowBalloonTip(10000);
            }

            // Double-click shows status
            trayIcon.DoubleClick += (s, e) =>
            {
                trayIcon.BalloonTipTitle = "AH & Vault Sync v" + Version;
                trayIcon.BalloonTipText =
                    "AH Prices: " + lastPriceUploadTime + " (" + priceUploadCount + " uploads)\n" +
                    "Guild Bank: " + lastGbankExportTime + " (" + gbankExportCount + " exports)\n" +
                    "Bank Alts: " + lastBankAltExportTime + " (" + bankAltExportCount + " exports)";
                trayIcon.BalloonTipIcon = ToolTipIcon.Info;
                trayIcon.ShowBalloonTip(5000);
            };
        }

        private void OpenSettings()
        {
            using (var form = new SettingsForm(wowPath))
            {
                if (form.ShowDialog() == DialogResult.OK)
                {
                    // Reload settings
                    settings = SyncSettings.Load();

                    // Update wowPath if changed
                    if (!string.IsNullOrEmpty(settings.LastWoWPath))
                    {
                        wowPath = settings.LastWoWPath;
                        watchPath = Path.Combine(wowPath, "WTF", "Account");
                    }

                    // Restart watchers based on new settings
                    RestartWatchers();

                    WriteLog("Settings updated and watchers restarted");
                }
            }
        }

        private void RestartWatchers()
        {
            // Stop existing timers
            if (priceTimer != null) { priceTimer.Stop(); priceTimer.Dispose(); priceTimer = null; }
            if (gbankTimer != null) { gbankTimer.Stop(); gbankTimer.Dispose(); gbankTimer = null; }
            if (bankAltTimer != null) { bankAltTimer.Stop(); bankAltTimer.Dispose(); bankAltTimer = null; }

            if (!string.IsNullOrEmpty(wowPath) && Directory.Exists(watchPath))
            {
                if (settings.SyncPrices)
                {
                    priceTimer = new System.Windows.Forms.Timer();
                    priceTimer.Interval = 3000;
                    priceTimer.Tick += PricePollTick;
                    priceTimer.Start();
                    priceStatusItem.Text = "Status: Watching for price scans";
                }
                else
                {
                    priceStatusItem.Text = "Status: Disabled in settings";
                }

                if (settings.SyncGuildBank)
                {
                    gbankTimer = new System.Windows.Forms.Timer();
                    gbankTimer.Interval = 2000;
                    gbankTimer.Tick += GbankPollTick;
                    gbankTimer.Start();
                    gbankStatusItem.Text = "Status: Watching for bank scans";
                }
                else
                {
                    gbankStatusItem.Text = "Status: Disabled in settings";
                }

                if (settings.SyncBankAlts)
                {
                    bankAltTimer = new System.Windows.Forms.Timer();
                    bankAltTimer.Interval = 2000;
                    bankAltTimer.Tick += BankAltPollTick;
                    bankAltTimer.Start();
                    bankAltStatusItem.Text = "Status: Watching for bank alt scans";
                }
                else
                {
                    bankAltStatusItem.Text = "Status: Disabled in settings";
                }
            }
        }

        private void OnSessionEnding(object sender, SessionEndingEventArgs e)
        {
            WriteLog("Session ending: " + e.Reason);
            Shutdown();
        }

        private Icon CreateCustomIcon()
        {
            var bmp = new Bitmap(16, 16);
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                using (var brush = new LinearGradientBrush(
                    new Rectangle(0, 0, 16, 16),
                    Color.FromArgb(0, 100, 200), Color.FromArgb(0, 60, 120),
                    LinearGradientMode.Vertical))
                {
                    g.FillEllipse(brush, 1, 1, 14, 14);
                }
                using (var pen = new Pen(Color.Gold, 1.5f))
                {
                    g.DrawLine(pen, 5, 8, 11, 8);
                    g.DrawLine(pen, 8, 5, 8, 11);
                }
            }
            return Icon.FromHandle(bmp.GetHicon());
        }

        // =====================================================================
        // AH PRICE WATCHER
        // =====================================================================
        private void PricePollTick(object sender, EventArgs e)
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
                        bool existed = pricePollHashes.TryGetValue(filePath, out lastWrite);

                        if (!existed || lastWrite != currentWrite)
                        {
                            pricePollHashes[filePath] = currentWrite;
                            if (existed) // Skip initial detection
                                UploadPrices(filePath);
                        }
                    }
                    catch (Exception ex)
                    {
                        WriteLog("[Prices] Error checking " + filePath + ": " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                WriteLog("[Prices] Poll error: " + ex.Message);
            }
        }

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

                priceStatusItem.Text = "Status: Uploading prices...";
                trayIcon.Text = "AH & Vault Sync - Uploading prices...";

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
                    priceStatusItem.Text = "Status: Watching for price scans";
                    trayIcon.Text = "AH & Vault Sync - Watching";
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

                        priceUploadCount++;
                        lastPriceUploadTime = DateTime.Now.ToString("h:mm tt");
                        priceStatusItem.Text = "Status: Watching for price scans";
                        priceLastUploadItem.Text = "Last Upload: " + lastPriceUploadTime;
                        priceCountItem.Text = "Uploads This Session: " + priceUploadCount;
                        trayIcon.Text = "AH & Vault Sync - Prices: " + lastPriceUploadTime;

                        WriteLog("[Prices] Uploaded " + prices.Count + " prices successfully");

                        trayIcon.BalloonTipTitle = "AH & Vault Sync";
                        trayIcon.BalloonTipText = "Uploaded " + prices.Count + " prices to guild website!";
                        trayIcon.BalloonTipIcon = ToolTipIcon.Info;
                        trayIcon.ShowBalloonTip(5000);
                    }
                    else
                    {
                        WriteLog("[Prices] Unexpected API response: " + body);
                        priceStatusItem.Text = "Status: Upload issue - retrying on next scan";
                        trayIcon.Text = "AH & Vault Sync - Upload issue";
                    }
                }
            }
            catch (Exception ex)
            {
                priceStatusItem.Text = "Status: Upload failed - retrying on next scan";
                trayIcon.Text = "AH & Vault Sync - Upload failed";
                WriteLog("[Prices] Upload failed: " + ex.Message);

                trayIcon.BalloonTipTitle = "AH & Vault Sync";
                trayIcon.BalloonTipText = "Price upload failed. Will retry on next scan.";
                trayIcon.BalloonTipIcon = ToolTipIcon.Error;
                trayIcon.ShowBalloonTip(5000);
            }
        }

        // =====================================================================
        // GUILD BANK WATCHER
        // =====================================================================
        private void GbankPollTick(object sender, EventArgs e)
        {
            try
            {
                string[] files = Directory.GetFiles(watchPath, "GBankExport.lua", SearchOption.AllDirectories);
                foreach (string filePath in files)
                {
                    try
                    {
                        if (!filePath.Contains("SavedVariables")) continue;

                        var fi = new FileInfo(filePath);
                        long currentWrite = fi.LastWriteTime.Ticks;
                        long lastWrite;
                        bool existed = gbankPollHashes.TryGetValue(filePath, out lastWrite);

                        if (!existed)
                        {
                            gbankPollHashes[filePath] = currentWrite;
                            string accountName = ExtractAccountName(filePath);
                            if (accountName != null)
                            {
                                string jsonPath = Path.Combine(wowPath, "Interface", "AddOns", "GBankExport",
                                    "GuildBank_" + accountName + ".json");
                                if (!File.Exists(jsonPath) || new FileInfo(jsonPath).LastWriteTime.Ticks < currentWrite)
                                {
                                    WriteLog("[GBank] Initial export for " + accountName + " (data newer than export)");
                                    ExportGuildBank(filePath, accountName);
                                }
                            }
                        }
                        else if (lastWrite != currentWrite)
                        {
                            gbankPollHashes[filePath] = currentWrite;
                            Thread.Sleep(GbankDebounceMs);
                            fi.Refresh();
                            gbankPollHashes[filePath] = fi.LastWriteTime.Ticks;

                            string accountName = ExtractAccountName(filePath);
                            if (accountName != null)
                            {
                                WriteLog("[GBank] Change detected: " + accountName);
                                ExportGuildBank(filePath, accountName);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        WriteLog("[GBank] Error checking " + filePath + ": " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                WriteLog("[GBank] Poll error: " + ex.Message);
            }
        }

        // =====================================================================
        // BANK ALT WATCHER (NEW in v5.0)
        // =====================================================================
        private void BankAltPollTick(object sender, EventArgs e)
        {
            try
            {
                string[] files = Directory.GetFiles(watchPath, "BankAltExport.lua", SearchOption.AllDirectories);
                foreach (string filePath in files)
                {
                    try
                    {
                        if (!filePath.Contains("SavedVariables")) continue;

                        var fi = new FileInfo(filePath);
                        long currentWrite = fi.LastWriteTime.Ticks;
                        long lastWrite;
                        bool existed = bankAltPollHashes.TryGetValue(filePath, out lastWrite);

                        if (!existed)
                        {
                            bankAltPollHashes[filePath] = currentWrite;
                            // Skip initial detection
                        }
                        else if (lastWrite != currentWrite)
                        {
                            bankAltPollHashes[filePath] = currentWrite;
                            Thread.Sleep(BankAltDebounceMs);
                            fi.Refresh();
                            bankAltPollHashes[filePath] = fi.LastWriteTime.Ticks;

                            string accountName = ExtractAccountName(filePath);
                            if (accountName != null)
                            {
                                WriteLog("[BankAlt] Change detected: " + accountName);
                                ExportBankAlt(filePath, accountName);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        WriteLog("[BankAlt] Error checking " + filePath + ": " + ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                WriteLog("[BankAlt] Poll error: " + ex.Message);
            }
        }

        private void ExportBankAlt(string svFilePath, string accountName)
        {
            try
            {
                string content;
                try
                {
                    content = File.ReadAllText(svFilePath, Encoding.UTF8);
                }
                catch (IOException)
                {
                    WriteLog("[BankAlt] File locked - will retry next cycle");
                    return;
                }

                if (string.IsNullOrEmpty(content)) return;

                // Parse BankAltExport_FlatData string
                var flatMatch = Regex.Match(content, @"BankAltExport_FlatData\s*=\s*""((?:[^""\\]|\\.)*)""");
                if (!flatMatch.Success)
                {
                    WriteLog("[BankAlt] No FlatData in " + accountName + " - addon hasn't scanned yet.");
                    return;
                }

                string flatRaw = flatMatch.Groups[1].Value;
                if (string.IsNullOrEmpty(flatRaw))
                {
                    WriteLog("[BankAlt] Empty FlatData for " + accountName + " - no scan yet.");
                    return;
                }

                flatRaw = flatRaw.Replace("\\n", "\n").Replace("\\t", "\t")
                                 .Replace("\\\"", "\"").Replace("\\\\", "\\");

                string[] lines = flatRaw.Split(new[] { '\n' }, StringSplitOptions.None);
                if (lines.Length < 3 || lines[0] != "BANKALTEXPORT_V1")
                {
                    WriteLog("[BankAlt] Invalid FlatData format for " + accountName);
                    return;
                }

                // Parse flat format
                string scanTime = "";
                string currentAccount = "";
                var characters = new List<BankAltCharacter>();
                BankAltCharacter currentChar = null;
                int totalItems = 0;
                bool inSummary = false;

                foreach (string line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    string[] parts = line.Split('|');
                    string tag = parts[0];

                    switch (tag)
                    {
                        case "SCAN_TIME":
                            if (parts.Length > 1) scanTime = parts[1];
                            break;

                        case "ACCOUNT":
                            if (parts.Length > 1) currentAccount = parts[1];
                            break;

                        case "CHAR":
                            if (currentChar != null) characters.Add(currentChar);
                            currentChar = new BankAltCharacter();
                            if (parts.Length > 1) currentChar.Name = parts[1];
                            if (parts.Length > 2) currentChar.Class = parts[2];
                            if (parts.Length > 3) int.TryParse(parts[3], out currentChar.Level);
                            inSummary = false;
                            break;

                        case "BAG":
                        case "BANK":
                            if (!inSummary && currentChar != null && parts.Length >= 6)
                            {
                                // Check if this character is enabled in settings
                                if (!settings.IsBankAltEnabled(accountName, currentChar.Name))
                                    continue;

                                var item = new BankAltItem
                                {
                                    Location = tag,
                                    BagId = int.Parse(parts[1]),
                                    Slot = int.Parse(parts[2]),
                                    Name = parts[3],
                                    Count = int.Parse(parts[4]),
                                    Quality = int.Parse(parts[5])
                                };
                                if (parts.Length > 6) item.ItemId = parts[6];
                                currentChar.Items.Add(item);
                            }
                            break;

                        case "ENDCHAR":
                            if (currentChar != null)
                            {
                                characters.Add(currentChar);
                                currentChar = null;
                            }
                            break;

                        case "SUMMARY":
                            inSummary = true;
                            break;

                        case "TOTAL_ITEMS":
                            if (parts.Length > 1) int.TryParse(parts[1], out totalItems);
                            break;
                    }
                }

                // Handle last character if no ENDCHAR
                if (currentChar != null) characters.Add(currentChar);

                // Filter characters based on settings
                var enabledChars = new List<BankAltCharacter>();
                foreach (var chr in characters)
                {
                    if (settings.IsBankAltEnabled(accountName, chr.Name))
                        enabledChars.Add(chr);
                }

                if (enabledChars.Count == 0)
                {
                    WriteLog("[BankAlt] No enabled characters for " + accountName + " - skipping.");
                    return;
                }

                bankAltStatusItem.Text = "Status: Exporting bank alt data...";

                // Build JSON for upload
                var sb = new StringBuilder();
                sb.AppendLine("{");
                sb.AppendLine("  \"exportVersion\": \"1.0\",");
                sb.AppendLine("  \"scanTime\": " + JsonEscape(scanTime) + ",");
                sb.AppendLine("  \"account\": " + JsonEscape(accountName) + ",");
                sb.AppendLine("  \"characters\": [");

                for (int c = 0; c < enabledChars.Count; c++)
                {
                    var chr = enabledChars[c];
                    sb.AppendLine("    {");
                    sb.AppendLine("      \"name\": " + JsonEscape(chr.Name) + ",");
                    sb.AppendLine("      \"class\": " + JsonEscape(chr.Class) + ",");
                    sb.AppendLine("      \"level\": " + chr.Level + ",");
                    sb.AppendLine("      \"items\": [");

                    for (int i = 0; i < chr.Items.Count; i++)
                    {
                        var item = chr.Items[i];
                        string qName = QualityNames.ContainsKey(item.Quality) ? QualityNames[item.Quality] : "Unknown";
                        sb.Append("        { ");
                        sb.Append("\"location\": " + JsonEscape(item.Location) + ", ");
                        sb.Append("\"bagId\": " + item.BagId + ", ");
                        sb.Append("\"slot\": " + item.Slot + ", ");
                        sb.Append("\"name\": " + JsonEscape(item.Name) + ", ");
                        sb.Append("\"count\": " + item.Count + ", ");
                        sb.Append("\"quality\": " + item.Quality + ", ");
                        sb.Append("\"qualityName\": " + JsonEscape(qName) + ", ");
                        sb.Append("\"itemId\": " + JsonEscape(item.ItemId));
                        sb.Append(" }");
                        sb.AppendLine(i < chr.Items.Count - 1 ? "," : "");
                    }

                    sb.AppendLine("      ]");
                    sb.Append("    }");
                    sb.AppendLine(c < enabledChars.Count - 1 ? "," : "");
                }

                sb.AppendLine("  ]");
                sb.AppendLine("}");

                string jsonData = sb.ToString();

                // Save local copy
                string outputDir = Path.Combine(wowPath, "Interface", "AddOns", "BankAltExport");
                Directory.CreateDirectory(outputDir);
                string jsonPath = Path.Combine(outputDir, "BankAlt_" + accountName + ".json");
                File.WriteAllText(jsonPath, jsonData, new UTF8Encoding(false));

                // Upload to server
                string uploadResult = UploadBankAlt(jsonData);

                bankAltExportCount++;
                lastBankAltExportTime = DateTime.Now.ToString("h:mm tt");
                bankAltStatusItem.Text = "Status: Watching for bank alt scans";
                bankAltLastExportItem.Text = "Last Export: " + lastBankAltExportTime;
                bankAltCountItem.Text = "Exports This Session: " + bankAltExportCount;

                int itemCount = 0;
                foreach (var chr in enabledChars) itemCount += chr.Items.Count;

                WriteLog("[BankAlt] Exported " + accountName + " : " + enabledChars.Count + " chars, " + itemCount + " items");

                trayIcon.BalloonTipTitle = "AH & Vault Sync";
                trayIcon.BalloonTipText = "Bank alt exported: " + enabledChars.Count + " character(s), " + itemCount + " items"
                    + (uploadResult != null ? "\nUploaded to website!" : "");
                trayIcon.BalloonTipIcon = ToolTipIcon.Info;
                trayIcon.ShowBalloonTip(5000);
            }
            catch (Exception ex)
            {
                bankAltStatusItem.Text = "Status: Export failed - retrying on next change";
                WriteLog("[BankAlt] Export failed for " + accountName + ": " + ex.Message);
            }
        }

        private string UploadBankAlt(string jsonData)
        {
            try
            {
                var request = (HttpWebRequest)WebRequest.Create(BankAltApiUrl);
                request.Method = "PUT";
                request.ContentType = "application/json";
                request.Timeout = 30000;
                byte[] data = Encoding.UTF8.GetBytes(jsonData);
                request.ContentLength = data.Length;

                using (var stream = request.GetRequestStream())
                    stream.Write(data, 0, data.Length);

                using (var response = (HttpWebResponse)request.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream()))
                {
                    string body = reader.ReadToEnd();
                    if (body.Contains("\"success\""))
                    {
                        WriteLog("[BankAlt] Uploaded to website successfully");
                        return body;
                    }
                    else
                    {
                        WriteLog("[BankAlt] Website upload unexpected response: " + body);
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                WriteLog("[BankAlt] Website upload failed (local export OK): " + ex.Message);
                return null;
            }
        }

        // =====================================================================
        // GUILD BANK EXPORT (existing from v4.0)
        // =====================================================================
        private string ExtractAccountName(string svFilePath)
        {
            try
            {
                string dir = Path.GetDirectoryName(svFilePath);
                dir = Path.GetDirectoryName(dir);
                return Path.GetFileName(dir);
            }
            catch
            {
                return null;
            }
        }

        private void ExportGuildBank(string svFilePath, string accountName)
        {
            try
            {
                string content;
                try
                {
                    content = File.ReadAllText(svFilePath, Encoding.UTF8);
                }
                catch (IOException)
                {
                    WriteLog("[GBank] File locked - will retry next cycle");
                    return;
                }

                if (string.IsNullOrEmpty(content)) return;

                var flatMatch = Regex.Match(content, @"GBankExport_FlatData\s*=\s*""((?:[^""\\]|\\.)*)""");
                if (!flatMatch.Success)
                {
                    WriteLog("[GBank] No FlatData in " + accountName);
                    return;
                }

                string flatRaw = flatMatch.Groups[1].Value;
                if (string.IsNullOrEmpty(flatRaw))
                {
                    WriteLog("[GBank] Empty FlatData for " + accountName);
                    return;
                }

                flatRaw = flatRaw.Replace("\\n", "\n").Replace("\\t", "\t")
                                 .Replace("\\\"", "\"").Replace("\\\\", "\\");

                string[] lines = flatRaw.Split(new[] { '\n' }, StringSplitOptions.None);
                if (lines.Length < 3 || lines[0] != "GBANKEXPORT_V1")
                {
                    WriteLog("[GBank] Invalid FlatData format for " + accountName);
                    return;
                }

                // Parse flat format (same as v4.0)
                string scanTime = "";
                string guildName = "";
                var tabs = new List<GBankTab>();
                GBankTab currentTab = null;
                var summaryItems = new List<GBankSummaryItem>();
                int totalItems = 0;
                int uniqueItems = 0;
                bool inSummary = false;

                foreach (string line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    string[] parts = line.Split('|');
                    string tag = parts[0];

                    switch (tag)
                    {
                        case "SCAN_TIME":
                            if (parts.Length > 1) scanTime = parts[1];
                            break;
                        case "GUILD":
                            if (parts.Length > 1) guildName = parts[1];
                            break;
                        case "TAB":
                            if (currentTab != null) tabs.Add(currentTab);
                            currentTab = new GBankTab();
                            if (parts.Length > 1) currentTab.TabIndex = int.Parse(parts[1]);
                            if (parts.Length > 2) currentTab.TabName = parts[2];
                            inSummary = false;
                            break;
                        case "ITEM":
                            if (!inSummary && currentTab != null && parts.Length >= 6)
                            {
                                currentTab.Items.Add(new GBankItem
                                {
                                    Name = parts[1],
                                    Count = int.Parse(parts[2]),
                                    Quality = int.Parse(parts[3]),
                                    ItemId = parts[4],
                                    Slot = int.Parse(parts[5])
                                });
                            }
                            break;
                        case "SUMMARY":
                            if (currentTab != null) { tabs.Add(currentTab); currentTab = null; }
                            inSummary = true;
                            break;
                        case "TOTAL_ITEMS":
                            if (parts.Length > 1) totalItems = int.Parse(parts[1]);
                            break;
                        case "UNIQUE_ITEMS":
                            if (parts.Length > 1) uniqueItems = int.Parse(parts[1]);
                            break;
                        case "TOTAL":
                            if (parts.Length >= 5)
                            {
                                summaryItems.Add(new GBankSummaryItem
                                {
                                    Name = parts[1],
                                    Count = int.Parse(parts[2]),
                                    Quality = int.Parse(parts[3]),
                                    ItemId = parts[4]
                                });
                            }
                            break;
                    }
                }

                if (currentTab != null) tabs.Add(currentTab);

                if (string.IsNullOrEmpty(scanTime))
                {
                    WriteLog("[GBank] No scan data found for " + accountName);
                    return;
                }

                gbankStatusItem.Text = "Status: Exporting guild bank...";

                string outputDir = Path.Combine(wowPath, "Interface", "AddOns", "GBankExport");
                Directory.CreateDirectory(outputDir);

                string jsonPath = Path.Combine(outputDir, "GuildBank_" + accountName + ".json");
                WriteJsonExport(jsonPath, scanTime, guildName, accountName, totalItems, uniqueItems, tabs, summaryItems);

                string txtPath = Path.Combine(outputDir, "GuildBank_" + accountName + ".txt");
                WriteTxtExport(txtPath, scanTime, guildName, accountName, totalItems, uniqueItems, tabs, summaryItems);

                gbankExportCount++;
                lastGbankExportTime = DateTime.Now.ToString("h:mm tt");
                gbankStatusItem.Text = "Status: Watching for bank scans";
                gbankLastExportItem.Text = "Last Export: " + lastGbankExportTime;
                gbankCountItem.Text = "Exports This Session: " + gbankExportCount;

                WriteLog("[GBank] Exported " + accountName + " : " + uniqueItems + " unique / " + totalItems + " total");

                string uploadResult = UploadGuildBank(jsonPath);

                trayIcon.BalloonTipTitle = "AH & Vault Sync";
                trayIcon.BalloonTipText = "Guild bank exported: " + uniqueItems + " unique items (" + totalItems + " total)"
                    + (uploadResult != null ? "\nUploaded to website!" : "");
                trayIcon.BalloonTipIcon = ToolTipIcon.Info;
                trayIcon.ShowBalloonTip(5000);
            }
            catch (Exception ex)
            {
                gbankStatusItem.Text = "Status: Export failed - retrying on next change";
                WriteLog("[GBank] Export failed for " + accountName + ": " + ex.Message);
            }
        }

        private void WriteJsonExport(string jsonPath, string scanTime, string guildName, string accountName,
            int totalItems, int uniqueItems, List<GBankTab> tabs, List<GBankSummaryItem> summaryItems)
        {
            var sb = new StringBuilder();
            sb.AppendLine("{");
            sb.AppendLine("  \"exportVersion\": \"1.0\",");
            sb.AppendLine("  \"scanTime\": " + JsonEscape(scanTime) + ",");
            sb.AppendLine("  \"guildName\": " + JsonEscape(guildName) + ",");
            sb.AppendLine("  \"account\": " + JsonEscape(accountName) + ",");
            sb.AppendLine("  \"totalItems\": " + totalItems + ",");
            sb.AppendLine("  \"uniqueItems\": " + uniqueItems + ",");
            sb.AppendLine("  \"tabs\": [");

            for (int t = 0; t < tabs.Count; t++)
            {
                var tab = tabs[t];
                sb.AppendLine("    {");
                sb.AppendLine("      \"tabIndex\": " + tab.TabIndex + ",");
                sb.AppendLine("      \"tabName\": " + JsonEscape(tab.TabName) + ",");
                sb.AppendLine("      \"items\": [");

                for (int i = 0; i < tab.Items.Count; i++)
                {
                    var item = tab.Items[i];
                    string qName = QualityNames.ContainsKey(item.Quality) ? QualityNames[item.Quality] : "Unknown";
                    sb.Append("        { ");
                    sb.Append("\"name\": " + JsonEscape(item.Name) + ", ");
                    sb.Append("\"count\": " + item.Count + ", ");
                    sb.Append("\"quality\": " + item.Quality + ", ");
                    sb.Append("\"qualityName\": " + JsonEscape(qName) + ", ");
                    sb.Append("\"itemId\": " + JsonEscape(item.ItemId) + ", ");
                    sb.Append("\"slot\": " + item.Slot);
                    sb.Append(" }");
                    sb.AppendLine(i < tab.Items.Count - 1 ? "," : "");
                }

                sb.AppendLine("      ]");
                sb.Append("    }");
                sb.AppendLine(t < tabs.Count - 1 ? "," : "");
            }

            sb.AppendLine("  ],");
            sb.AppendLine("  \"summary\": [");

            for (int i = 0; i < summaryItems.Count; i++)
            {
                var item = summaryItems[i];
                string qName = QualityNames.ContainsKey(item.Quality) ? QualityNames[item.Quality] : "Unknown";
                sb.Append("    { ");
                sb.Append("\"name\": " + JsonEscape(item.Name) + ", ");
                sb.Append("\"count\": " + item.Count + ", ");
                sb.Append("\"quality\": " + item.Quality + ", ");
                sb.Append("\"qualityName\": " + JsonEscape(qName) + ", ");
                sb.Append("\"itemId\": " + JsonEscape(item.ItemId));
                sb.Append(" }");
                sb.AppendLine(i < summaryItems.Count - 1 ? "," : "");
            }

            sb.AppendLine("  ]");
            sb.AppendLine("}");

            File.WriteAllText(jsonPath, sb.ToString(), new UTF8Encoding(false));
        }

        private void WriteTxtExport(string txtPath, string scanTime, string guildName, string accountName,
            int totalItems, int uniqueItems, List<GBankTab> tabs, List<GBankSummaryItem> summaryItems)
        {
            var sb = new StringBuilder();
            sb.AppendLine("========================================");
            sb.AppendLine("  GUILD BANK EXPORT");
            sb.AppendLine("========================================");
            sb.AppendLine("Scan Time : " + scanTime);
            sb.AppendLine("Guild     : " + guildName);
            sb.AppendLine("Account   : " + accountName);
            sb.AppendLine("Total     : " + uniqueItems + " unique items, " + totalItems + " total");
            sb.AppendLine();

            foreach (var tab in tabs)
            {
                sb.AppendLine("----------------------------------------");
                sb.AppendLine("  TAB " + tab.TabIndex + ": " + tab.TabName);
                sb.AppendLine("----------------------------------------");

                var sorted = new List<GBankItem>(tab.Items);
                sorted.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));

                foreach (var item in sorted)
                {
                    string qName = QualityNames.ContainsKey(item.Quality) ? QualityNames[item.Quality] : "Unknown";
                    sb.AppendLine("  " + item.Name + "  x" + item.Count + "  [" + qName + "]");
                }
                sb.AppendLine();
            }

            sb.AppendLine("========================================");
            sb.AppendLine("  COMBINED SUMMARY (A-Z)");
            sb.AppendLine("========================================");

            var sortedSummary = new List<GBankSummaryItem>(summaryItems);
            sortedSummary.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));

            int maxLen = 20;
            foreach (var item in sortedSummary)
            {
                if (item.Name.Length > maxLen) maxLen = item.Name.Length;
            }

            foreach (var item in sortedSummary)
            {
                string qName = QualityNames.ContainsKey(item.Quality) ? QualityNames[item.Quality] : "Unknown";
                string padded = item.Name.PadRight(maxLen + 2);
                sb.AppendLine("  " + padded + "x" + item.Count.ToString().PadLeft(5) + "  [" + qName + "]");
            }

            sb.AppendLine();
            sb.AppendLine("Total: " + uniqueItems + " unique items, " + totalItems + " total");
            sb.AppendLine("Exported: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));

            File.WriteAllText(txtPath, sb.ToString(), new UTF8Encoding(false));
        }

        private string UploadGuildBank(string jsonPath)
        {
            try
            {
                string jsonData = File.ReadAllText(jsonPath, new UTF8Encoding(false));
                if (string.IsNullOrEmpty(jsonData)) return null;

                var request = (HttpWebRequest)WebRequest.Create(GBankApiUrl);
                request.Method = "PUT";
                request.ContentType = "application/json";
                request.Timeout = 30000;
                byte[] data = Encoding.UTF8.GetBytes(jsonData);
                request.ContentLength = data.Length;

                using (var stream = request.GetRequestStream())
                    stream.Write(data, 0, data.Length);

                using (var response = (HttpWebResponse)request.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream()))
                {
                    string body = reader.ReadToEnd();
                    if (body.Contains("\"success\""))
                    {
                        WriteLog("[GBank] Uploaded to website successfully");
                        return body;
                    }
                    else
                    {
                        WriteLog("[GBank] Website upload unexpected response: " + body);
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                WriteLog("[GBank] Website upload failed (local export OK): " + ex.Message);
                return null;
            }
        }

        private static string JsonEscape(string s)
        {
            if (s == null) return "\"\"";
            return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"")
                          .Replace("\n", "\\n").Replace("\r", "\\r")
                          .Replace("\t", "\\t") + "\"";
        }

        // =====================================================================
        // WOW PATH RESOLUTION
        // =====================================================================
        private string GetWoWPath()
        {
            // 1. Settings file
            if (!string.IsNullOrEmpty(settings.LastWoWPath) && Directory.Exists(settings.LastWoWPath))
                return settings.LastWoWPath;

            // 2. Registry
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\AH_and_VaultSync"))
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

            // 3. Environment variable
            string envPath = Environment.GetEnvironmentVariable("GUILDSHOPSYNC_WOWPATH");
            if (!string.IsNullOrEmpty(envPath) && Directory.Exists(envPath))
                return envPath;

            // 4. Common install paths
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

        // =====================================================================
        // LOGGING
        // =====================================================================
        private void WriteLog(string message)
        {
            WriteStaticLog(message);
        }

        // =====================================================================
        // SHUTDOWN
        // =====================================================================
        private void Shutdown()
        {
            if (priceTimer != null) { priceTimer.Stop(); priceTimer.Dispose(); }
            if (gbankTimer != null) { gbankTimer.Stop(); gbankTimer.Dispose(); }
            if (bankAltTimer != null) { bankAltTimer.Stop(); bankAltTimer.Dispose(); }
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
                if (priceTimer != null) { priceTimer.Stop(); priceTimer.Dispose(); }
                if (gbankTimer != null) { gbankTimer.Stop(); gbankTimer.Dispose(); }
                if (bankAltTimer != null) { bankAltTimer.Stop(); bankAltTimer.Dispose(); }
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
            }
            base.Dispose(disposing);
        }

        // =====================================================================
        // DATA CLASSES
        // =====================================================================
        private class GBankTab
        {
            public int TabIndex;
            public string TabName = "";
            public List<GBankItem> Items = new List<GBankItem>();
        }

        private class GBankItem
        {
            public string Name = "";
            public int Count;
            public int Quality;
            public string ItemId = "";
            public int Slot;
        }

        private class GBankSummaryItem
        {
            public string Name = "";
            public int Count;
            public int Quality;
            public string ItemId = "";
        }

        private class BankAltCharacter
        {
            public string Name = "";
            public string Class = "";
            public int Level;
            public List<BankAltItem> Items = new List<BankAltItem>();
        }

        private class BankAltItem
        {
            public string Location = "";
            public int BagId;
            public int Slot;
            public string Name = "";
            public int Count;
            public int Quality;
            public string ItemId = "";
        }
    }
}
