using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

namespace AH_and_VaultSync
{
    /// <summary>
    /// Settings model for AH &amp; Vault Sync v5.0
    /// Persists account/character selections and sync preferences.
    /// </summary>
    public class SyncSettings
    {
        // Default settings file location: %LocalAppData%\AH_and_VaultSync\settings.json
        private static readonly string SettingsDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "AH_and_VaultSync");
        private static readonly string SettingsPath = Path.Combine(SettingsDir, "settings.json");

        // Account/character selection for bank alt sync
        // Key: account name, Value: list of enabled character names (empty = all disabled)
        public Dictionary<string, List<string>> EnabledBankAlts { get; set; }

        // Whether to sync AH prices (GuildShopSync)
        public bool SyncPrices { get; set; }

        // Whether to sync guild bank (GBankExport)
        public bool SyncGuildBank { get; set; }

        // Whether to sync bank alts (BankAltExport)
        public bool SyncBankAlts { get; set; }

        // Last WoW path used (for validation)
        public string LastWoWPath { get; set; }

        public SyncSettings()
        {
            EnabledBankAlts = new Dictionary<string, List<string>>();
            SyncPrices = true;
            SyncGuildBank = true;
            SyncBankAlts = true;
            LastWoWPath = "";
        }

        /// <summary>
        /// Check if a specific account/character combo is enabled for bank alt sync.
        /// If account not in settings, defaults to DISABLED (user must explicitly enable).
        /// </summary>
        public bool IsBankAltEnabled(string account, string character)
        {
            if (!SyncBankAlts) return false;
            if (!EnabledBankAlts.ContainsKey(account)) return false;
            var chars = EnabledBankAlts[account];
            return chars != null && chars.Contains(character);
        }

        /// <summary>
        /// Enable a specific account/character for bank alt sync.
        /// </summary>
        public void EnableBankAlt(string account, string character)
        {
            if (!EnabledBankAlts.ContainsKey(account))
                EnabledBankAlts[account] = new List<string>();
            if (!EnabledBankAlts[account].Contains(character))
                EnabledBankAlts[account].Add(character);
        }

        /// <summary>
        /// Disable a specific account/character for bank alt sync.
        /// </summary>
        public void DisableBankAlt(string account, string character)
        {
            if (EnabledBankAlts.ContainsKey(account))
                EnabledBankAlts[account].Remove(character);
        }

        /// <summary>
        /// Enable all characters under an account.
        /// </summary>
        public void EnableAccount(string account, List<string> characters)
        {
            EnabledBankAlts[account] = new List<string>(characters);
        }

        /// <summary>
        /// Disable all characters under an account.
        /// </summary>
        public void DisableAccount(string account)
        {
            if (EnabledBankAlts.ContainsKey(account))
                EnabledBankAlts[account].Clear();
        }

        /// <summary>
        /// Load settings from disk. Returns default settings if file doesn't exist.
        /// </summary>
        public static SyncSettings Load()
        {
            try
            {
                if (!File.Exists(SettingsPath))
                    return new SyncSettings();

                string json = File.ReadAllText(SettingsPath, Encoding.UTF8);
                return ParseJson(json);
            }
            catch
            {
                return new SyncSettings();
            }
        }

        /// <summary>
        /// Save settings to disk.
        /// </summary>
        public void Save()
        {
            try
            {
                Directory.CreateDirectory(SettingsDir);
                string json = ToJson();
                File.WriteAllText(SettingsPath, json, new UTF8Encoding(false));
            }
            catch
            {
                // Silently fail - settings are non-critical
            }
        }

        /// <summary>
        /// Convert settings to JSON string (manual serialization for .NET 3.5 compat).
        /// </summary>
        public string ToJson()
        {
            var sb = new StringBuilder();
            sb.AppendLine("{");
            sb.AppendLine("  \"syncPrices\": " + (SyncPrices ? "true" : "false") + ",");
            sb.AppendLine("  \"syncGuildBank\": " + (SyncGuildBank ? "true" : "false") + ",");
            sb.AppendLine("  \"syncBankAlts\": " + (SyncBankAlts ? "true" : "false") + ",");
            sb.AppendLine("  \"lastWoWPath\": " + JsonEscape(LastWoWPath) + ",");
            sb.AppendLine("  \"enabledBankAlts\": {");

            int acctIndex = 0;
            foreach (var kvp in EnabledBankAlts)
            {
                sb.Append("    " + JsonEscape(kvp.Key) + ": [");
                if (kvp.Value != null && kvp.Value.Count > 0)
                {
                    for (int i = 0; i < kvp.Value.Count; i++)
                    {
                        sb.Append(JsonEscape(kvp.Value[i]));
                        if (i < kvp.Value.Count - 1) sb.Append(", ");
                    }
                }
                sb.Append("]");
                if (acctIndex < EnabledBankAlts.Count - 1) sb.Append(",");
                sb.AppendLine();
                acctIndex++;
            }

            sb.AppendLine("  }");
            sb.AppendLine("}");
            return sb.ToString();
        }

        /// <summary>
        /// Parse settings from JSON string (manual parsing for .NET 3.5 compat).
        /// </summary>
        private static SyncSettings ParseJson(string json)
        {
            var settings = new SyncSettings();

            // Parse boolean flags
            if (Regex.IsMatch(json, @"""syncPrices""\s*:\s*false", RegexOptions.IgnoreCase))
                settings.SyncPrices = false;
            if (Regex.IsMatch(json, @"""syncGuildBank""\s*:\s*false", RegexOptions.IgnoreCase))
                settings.SyncGuildBank = false;
            if (Regex.IsMatch(json, @"""syncBankAlts""\s*:\s*false", RegexOptions.IgnoreCase))
                settings.SyncBankAlts = false;

            // Parse lastWoWPath
            var pathMatch = Regex.Match(json, @"""lastWoWPath""\s*:\s*""([^""]*)""");
            if (pathMatch.Success)
                settings.LastWoWPath = pathMatch.Groups[1].Value.Replace("\\\\", "\\");

            // Parse enabledBankAlts object
            var bankAltsMatch = Regex.Match(json, @"""enabledBankAlts""\s*:\s*\{([^}]*)\}", RegexOptions.Singleline);
            if (bankAltsMatch.Success)
            {
                string inner = bankAltsMatch.Groups[1].Value;
                // Match each account: ["char1", "char2"]
                var acctMatches = Regex.Matches(inner, @"""([^""]+)""\s*:\s*\[([^\]]*)\]");
                foreach (Match m in acctMatches)
                {
                    string account = m.Groups[1].Value;
                    string charsStr = m.Groups[2].Value;
                    var charList = new List<string>();

                    var charMatches = Regex.Matches(charsStr, @"""([^""]+)""");
                    foreach (Match cm in charMatches)
                        charList.Add(cm.Groups[1].Value);

                    settings.EnabledBankAlts[account] = charList;
                }
            }

            return settings;
        }

        private static string JsonEscape(string s)
        {
            if (s == null) return "\"\"";
            return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"")
                          .Replace("\n", "\\n").Replace("\r", "\\r")
                          .Replace("\t", "\\t") + "\"";
        }
    }
}
