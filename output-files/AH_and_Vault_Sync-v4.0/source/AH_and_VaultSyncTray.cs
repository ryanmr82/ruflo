// AH & Vault Sync - Unified Tray Application v4.0
// Combines GuildShopSync (AH price upload) + GBankExport (guild bank local export)
// into a single compiled .NET WinForms system tray app.
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
        private const string Version = "4.0";
        private const string ApiUrl = "https://tbcguild.duckdns.org/api/consumes/prices";
        private const string GBankApiUrl = "https://tbcguild.duckdns.org/api/guild-bank/inventory";
        private const long MaxLogSizeBytes = 2 * 1024 * 1024; // 2MB log rotation

        private static readonly string LogDir;
        private static readonly string LogFile;

        private NotifyIcon trayIcon;

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

        // Quality name map (matches AutoExport.ps1)
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

        static TrayApp()
        {
            LogDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AH_and_VaultSync");
            LogFile = Path.Combine(LogDir, "service.log");
        }

        public static void WriteStaticLog(string message)
        {
            try
            {
                Directory.CreateDirectory(LogDir);

                // Log rotation: if over 2MB, rename to _prev.log
                if (File.Exists(LogFile))
                {
                    var fi = new FileInfo(LogFile);
                    if (fi.Length > MaxLogSizeBytes)
                    {
                        string prevLog = Path.Combine(LogDir, "service_prev.log");
                        if (File.Exists(prevLog))
                            File.Delete(prevLog);
                        File.Move(LogFile, prevLog);
                    }
                }

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
                    "Please reinstall AH & Vault Sync and select your WoW folder.",
                    "AH & Vault Sync", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
                    "AH & Vault Sync", MessageBoxButtons.OK, MessageBoxIcon.Error);
                ExitThread();
                return;
            }

            WriteLog("========================================");
            WriteLog("AH & Vault Sync v" + Version + " started");
            WriteLog("WoW path: " + wowPath);
            WriteLog("Watch path: " + watchPath);
            WriteLog("========================================");

            SetupTrayIcon();

            // AH Price watcher: 3-second poll interval
            priceTimer = new System.Windows.Forms.Timer();
            priceTimer.Interval = 3000;
            priceTimer.Tick += PricePollTick;
            priceTimer.Start();
            WriteLog("[Prices] Polling for GuildShopSync.lua changes (3s interval)");

            // Guild Bank watcher: 5-second poll interval
            gbankTimer = new System.Windows.Forms.Timer();
            gbankTimer.Interval = 5000;
            gbankTimer.Tick += GbankPollTick;
            gbankTimer.Start();
            WriteLog("[GBank] Polling for GBankExport.lua changes (5s interval)");
        }

        // =====================================================================
        // SESSION ENDING
        // =====================================================================
        private void OnSessionEnding(object sender, SessionEndingEventArgs e)
        {
            WriteLog("Session ending (reason: " + e.Reason + "). Cleaning up.");
            if (trayIcon != null)
                trayIcon.Visible = false;
        }

        // =====================================================================
        // TRAY ICON SETUP
        // =====================================================================
        private void SetupTrayIcon()
        {
            var bmp = new Bitmap(16, 16);
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.Clear(Color.Transparent);
                // Two-tone icon: green (AH) + blue (vault) split
                g.FillPie(Brushes.LimeGreen, 1, 1, 13, 13, 180, 180);  // top half green
                g.FillPie(Brushes.DodgerBlue, 1, 1, 13, 13, 0, 180);   // bottom half blue
                g.DrawEllipse(Pens.DarkGreen, 1, 1, 13, 13);
            }

            trayIcon = new NotifyIcon();
            trayIcon.Icon = Icon.FromHandle(bmp.GetHicon());
            trayIcon.Text = "AH & Vault Sync - Watching";
            trayIcon.Visible = true;

            var menu = new ContextMenuStrip();

            // Header
            var header = new ToolStripMenuItem("AH & Vault Sync v" + Version);
            header.Enabled = false;
            header.Font = new Font(header.Font, FontStyle.Bold);
            menu.Items.Add(header);
            menu.Items.Add(new ToolStripSeparator());

            // --- AH Prices Section ---
            var priceHeader = new ToolStripMenuItem("-- Auction Prices --");
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
            var gbankHeader = new ToolStripMenuItem("-- Guild Bank Export --");
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

            // --- Actions ---
            var openLog = new ToolStripMenuItem("Open Log Folder");
            openLog.Click += (s, e) =>
            {
                if (Directory.Exists(LogDir))
                    System.Diagnostics.Process.Start("explorer.exe", LogDir);
            };
            menu.Items.Add(openLog);

            var openExports = new ToolStripMenuItem("Open Export Folder");
            openExports.Click += (s, e) =>
            {
                string exportDir = Path.Combine(wowPath, "Interface", "AddOns", "GBankExport");
                if (Directory.Exists(exportDir))
                    System.Diagnostics.Process.Start("explorer.exe", exportDir);
            };
            menu.Items.Add(openExports);

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
                trayIcon.BalloonTipTitle = "AH & Vault Sync";
                trayIcon.BalloonTipText =
                    "AH Prices: " + lastPriceUploadTime + " (" + priceUploadCount + " uploads)\n" +
                    "Guild Bank: " + lastGbankExportTime + " (" + gbankExportCount + " exports)";
                trayIcon.BalloonTipIcon = ToolTipIcon.Info;
                trayIcon.ShowBalloonTip(5000);
            };
        }

        // =====================================================================
        // AH PRICE WATCHER (ported from GuildShopSyncTray.cs)
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
        // GUILD BANK WATCHER (ported from AutoExport.ps1)
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
                        // Only look at files under SavedVariables subfolders
                        if (!filePath.Contains("SavedVariables")) continue;

                        var fi = new FileInfo(filePath);
                        long currentWrite = fi.LastWriteTime.Ticks;
                        long lastWrite;
                        bool existed = gbankPollHashes.TryGetValue(filePath, out lastWrite);

                        if (!existed)
                        {
                            // First detection - record and check if export is stale
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
                                else
                                {
                                    WriteLog("[GBank] Skipping " + accountName + " - export already up to date");
                                }
                            }
                        }
                        else if (lastWrite != currentWrite)
                        {
                            gbankPollHashes[filePath] = currentWrite;

                            // Debounce: wait 1.5s for WoW to finish writing
                            Thread.Sleep(GbankDebounceMs);

                            // Re-read mod time after debounce
                            fi.Refresh();
                            gbankPollHashes[filePath] = fi.LastWriteTime.Ticks;

                            string accountName = ExtractAccountName(filePath);
                            if (accountName != null)
                            {
                                WriteLog("[GBank] Change detected: " + accountName + " (modified " + fi.LastWriteTime + ")");
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

        private string ExtractAccountName(string svFilePath)
        {
            // Path format: .../WTF/Account/<ACCOUNTNAME>/SavedVariables/GBankExport.lua
            try
            {
                string dir = Path.GetDirectoryName(svFilePath); // SavedVariables
                dir = Path.GetDirectoryName(dir);               // <ACCOUNTNAME>
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

                // Parse GBankExport_FlatData string from the Lua file
                var flatMatch = Regex.Match(content, @"GBankExport_FlatData\s*=\s*""((?:[^""\\]|\\.)*)""");
                if (!flatMatch.Success)
                {
                    WriteLog("[GBank] No FlatData in " + accountName + " - addon hasn't scanned yet.");
                    return;
                }

                // Unescape Lua string
                string flatRaw = flatMatch.Groups[1].Value;
                if (string.IsNullOrEmpty(flatRaw))
                {
                    WriteLog("[GBank] Empty FlatData for " + accountName + " - no guild bank scan yet.");
                    return;
                }

                flatRaw = flatRaw.Replace("\\n", "\n").Replace("\\t", "\t")
                                 .Replace("\\\"", "\"").Replace("\\\\", "\\");

                string[] lines = flatRaw.Split(new[] { '\n' }, StringSplitOptions.None);
                if (lines.Length < 3 || lines[0] != "GBANKEXPORT_V1")
                {
                    WriteLog("[GBank] Invalid FlatData format for " + accountName + " (header: " +
                        (lines.Length > 0 ? lines[0] : "empty") + ").");
                    return;
                }

                // Parse flat format
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

                // Handle last tab if no SUMMARY tag
                if (currentTab != null) tabs.Add(currentTab);

                if (string.IsNullOrEmpty(scanTime))
                {
                    WriteLog("[GBank] No scan data found for " + accountName + ".");
                    return;
                }

                gbankStatusItem.Text = "Status: Exporting guild bank...";

                // Output directory: WoW/Interface/AddOns/GBankExport/
                string outputDir = Path.Combine(wowPath, "Interface", "AddOns", "GBankExport");
                Directory.CreateDirectory(outputDir);

                // --- Build JSON ---
                string jsonPath = Path.Combine(outputDir, "GuildBank_" + accountName + ".json");
                WriteJsonExport(jsonPath, scanTime, guildName, accountName, totalItems, uniqueItems, tabs, summaryItems);

                // --- Build TXT ---
                string txtPath = Path.Combine(outputDir, "GuildBank_" + accountName + ".txt");
                WriteTxtExport(txtPath, scanTime, guildName, accountName, totalItems, uniqueItems, tabs, summaryItems);

                gbankExportCount++;
                lastGbankExportTime = DateTime.Now.ToString("h:mm tt");
                gbankStatusItem.Text = "Status: Watching for bank scans";
                gbankLastExportItem.Text = "Last Export: " + lastGbankExportTime;
                gbankCountItem.Text = "Exports This Session: " + gbankExportCount;

                WriteLog("[GBank] Exported " + accountName + " : " + uniqueItems + " unique / " + totalItems + " total -> JSON + TXT");

                // Upload to guild website
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

        // --- JSON Export ---
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

        // --- TXT Export ---
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

                // Sort items by name
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

            // Sort summary by name
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

        // --- Guild Bank Upload to Server ---
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

        // --- JSON string escaping ---
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
            // 1. New unified registry key
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

            // 2. Legacy GuildShopSync registry key (upgrade path)
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

            // 3. Environment variable (legacy v2.5 support)
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
    }
}
