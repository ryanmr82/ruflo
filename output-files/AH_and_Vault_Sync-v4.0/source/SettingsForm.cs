using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using Microsoft.Win32;

namespace AH_and_VaultSync
{
    /// <summary>
    /// Settings dialog for AH &amp; Vault Sync v5.0
    /// Allows users to select which accounts/characters should sync bank alt data.
    /// </summary>
    public partial class SettingsForm : Form
    {
        private SyncSettings settings;
        private string wowPath;
        private bool suppressCheck = false;

        public SettingsForm()
        {
            InitializeComponent();
        }

        public SettingsForm(string currentWoWPath) : this()
        {
            wowPath = currentWoWPath;
        }

        private void SettingsForm_Load(object sender, EventArgs e)
        {
            // Load existing settings
            settings = SyncSettings.Load();

            // Populate UI from settings
            chkSyncPrices.Checked = settings.SyncPrices;
            chkSyncGuildBank.Checked = settings.SyncGuildBank;
            chkSyncBankAlts.Checked = settings.SyncBankAlts;

            // Set WoW path - prefer current, then settings, then auto-detect
            if (!string.IsNullOrEmpty(wowPath))
                txtWoWPath.Text = wowPath;
            else if (!string.IsNullOrEmpty(settings.LastWoWPath))
                txtWoWPath.Text = settings.LastWoWPath;
            else
                txtWoWPath.Text = GetWoWPathFromRegistry() ?? "";

            // Populate bank alts tree
            PopulateBankAltsTree();
        }

        /// <summary>
        /// Scan WTF/Account folder and populate TreeView with accounts and characters.
        /// </summary>
        private void PopulateBankAltsTree()
        {
            treeBankAlts.Nodes.Clear();
            suppressCheck = true;

            string path = txtWoWPath.Text.Trim();
            if (string.IsNullOrEmpty(path) || !Directory.Exists(path))
            {
                treeBankAlts.Nodes.Add("(Set WoW path first)");
                suppressCheck = false;
                return;
            }

            string wtfPath = Path.Combine(path, "WTF", "Account");
            if (!Directory.Exists(wtfPath))
            {
                treeBankAlts.Nodes.Add("(No WTF/Account folder found)");
                suppressCheck = false;
                return;
            }

            // Scan for accounts (subdirectories of WTF/Account)
            string[] accountDirs = Directory.GetDirectories(wtfPath);
            int totalAccounts = 0;
            int totalChars = 0;

            foreach (string accountDir in accountDirs)
            {
                string accountName = Path.GetFileName(accountDir);

                // Skip special folders
                if (accountName.Equals("SavedVariables", StringComparison.OrdinalIgnoreCase))
                    continue;

                // Check if account has BankAltExport.lua SavedVariables
                string svPath = Path.Combine(accountDir, "SavedVariables", "BankAltExport.lua");
                List<string> characters = new List<string>();

                if (File.Exists(svPath))
                {
                    // Parse the file to extract character names
                    characters = ExtractCharactersFromSV(svPath);
                }

                // Also scan for realm folders with character folders
                // Format: WTF/Account/<Account>/<Realm>/<Character>/
                string[] realmDirs = Directory.GetDirectories(accountDir);
                foreach (string realmDir in realmDirs)
                {
                    string realmName = Path.GetFileName(realmDir);
                    if (realmName.Equals("SavedVariables", StringComparison.OrdinalIgnoreCase))
                        continue;

                    string[] charDirs = Directory.GetDirectories(realmDir);
                    foreach (string charDir in charDirs)
                    {
                        string charName = Path.GetFileName(charDir);
                        // Check for character-specific SavedVariables
                        string charSvPath = Path.Combine(charDir, "SavedVariables", "BankAltExport.lua");
                        if (File.Exists(charSvPath) || File.Exists(Path.Combine(charDir, "SavedVariables")))
                        {
                            if (!characters.Contains(charName))
                                characters.Add(charName);
                        }
                    }
                }

                // Only add accounts that have data or potential characters
                if (characters.Count > 0)
                {
                    var accountNode = new TreeNode(accountName);
                    accountNode.Tag = "account:" + accountName;

                    foreach (string charName in characters)
                    {
                        var charNode = new TreeNode(charName);
                        charNode.Tag = "char:" + accountName + ":" + charName;

                        // Check if enabled in settings
                        charNode.Checked = settings.IsBankAltEnabled(accountName, charName);
                        accountNode.Nodes.Add(charNode);
                        totalChars++;
                    }

                    // Check account node if any children are checked
                    bool anyChecked = false;
                    foreach (TreeNode child in accountNode.Nodes)
                    {
                        if (child.Checked) { anyChecked = true; break; }
                    }
                    accountNode.Checked = anyChecked;

                    treeBankAlts.Nodes.Add(accountNode);
                    accountNode.Expand();
                    totalAccounts++;
                }
            }

            if (treeBankAlts.Nodes.Count == 0)
            {
                treeBankAlts.Nodes.Add("(No accounts with BankAltExport data found)");
                treeBankAlts.Nodes.Add("Run /bae scan in-game first!");
            }
            else
            {
                lblBankAltsInfo.Text = string.Format(
                    "Found {0} account(s) with {1} character(s). Check the ones to sync:",
                    totalAccounts, totalChars);
            }

            suppressCheck = false;
        }

        /// <summary>
        /// Extract character names from BankAltExport.lua SavedVariables file.
        /// </summary>
        private List<string> ExtractCharactersFromSV(string filePath)
        {
            var characters = new List<string>();
            try
            {
                string content = File.ReadAllText(filePath);
                // Look for CHAR|<name>|<class>|<level> pattern
                var matches = Regex.Matches(content, @"CHAR\|([^|]+)\|");
                foreach (Match m in matches)
                {
                    string charName = m.Groups[1].Value;
                    if (!characters.Contains(charName))
                        characters.Add(charName);
                }
            }
            catch { }
            return characters;
        }

        private void treeBankAlts_AfterCheck(object sender, TreeViewEventArgs e)
        {
            if (suppressCheck) return;

            suppressCheck = true;

            // If account node is checked/unchecked, apply to all children
            if (e.Node.Tag != null && e.Node.Tag.ToString().StartsWith("account:"))
            {
                foreach (TreeNode child in e.Node.Nodes)
                {
                    child.Checked = e.Node.Checked;
                }
            }
            // If character node is checked, ensure parent shows correct state
            else if (e.Node.Tag != null && e.Node.Tag.ToString().StartsWith("char:"))
            {
                if (e.Node.Parent != null)
                {
                    bool anyChecked = false;
                    foreach (TreeNode sibling in e.Node.Parent.Nodes)
                    {
                        if (sibling.Checked) { anyChecked = true; break; }
                    }
                    e.Node.Parent.Checked = anyChecked;
                }
            }

            suppressCheck = false;
        }

        private void btnSelectAll_Click(object sender, EventArgs e)
        {
            suppressCheck = true;
            foreach (TreeNode acctNode in treeBankAlts.Nodes)
            {
                acctNode.Checked = true;
                foreach (TreeNode charNode in acctNode.Nodes)
                    charNode.Checked = true;
            }
            suppressCheck = false;
        }

        private void btnSelectNone_Click(object sender, EventArgs e)
        {
            suppressCheck = true;
            foreach (TreeNode acctNode in treeBankAlts.Nodes)
            {
                acctNode.Checked = false;
                foreach (TreeNode charNode in acctNode.Nodes)
                    charNode.Checked = false;
            }
            suppressCheck = false;
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            PopulateBankAltsTree();
        }

        private void btnBrowse_Click(object sender, EventArgs e)
        {
            using (var dialog = new FolderBrowserDialog())
            {
                dialog.Description = "Select TurtleWoW installation folder (containing WoW.exe)";
                if (!string.IsNullOrEmpty(txtWoWPath.Text) && Directory.Exists(txtWoWPath.Text))
                    dialog.SelectedPath = txtWoWPath.Text;

                if (dialog.ShowDialog() == DialogResult.OK)
                {
                    string selected = dialog.SelectedPath;
                    if (File.Exists(Path.Combine(selected, "WoW.exe")))
                    {
                        txtWoWPath.Text = selected;
                        PopulateBankAltsTree();
                    }
                    else
                    {
                        MessageBox.Show("WoW.exe not found in selected folder.\nPlease select the TurtleWoW root folder.",
                            "Invalid Path", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                }
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            // Validate WoW path
            string path = txtWoWPath.Text.Trim();
            if (!string.IsNullOrEmpty(path) && !File.Exists(Path.Combine(path, "WoW.exe")))
            {
                MessageBox.Show("WoW.exe not found at the specified path.\nPlease correct the TurtleWoW path.",
                    "Invalid Path", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Update settings from UI
            settings.SyncPrices = chkSyncPrices.Checked;
            settings.SyncGuildBank = chkSyncGuildBank.Checked;
            settings.SyncBankAlts = chkSyncBankAlts.Checked;
            settings.LastWoWPath = path;

            // Update bank alt selections from tree
            settings.EnabledBankAlts.Clear();
            foreach (TreeNode acctNode in treeBankAlts.Nodes)
            {
                if (acctNode.Tag == null || !acctNode.Tag.ToString().StartsWith("account:"))
                    continue;

                string accountName = acctNode.Tag.ToString().Substring(8);
                var enabledChars = new List<string>();

                foreach (TreeNode charNode in acctNode.Nodes)
                {
                    if (charNode.Checked && charNode.Tag != null && charNode.Tag.ToString().StartsWith("char:"))
                    {
                        string[] parts = charNode.Tag.ToString().Split(':');
                        if (parts.Length >= 3)
                            enabledChars.Add(parts[2]);
                    }
                }

                if (enabledChars.Count > 0)
                    settings.EnabledBankAlts[accountName] = enabledChars;
            }

            // Save to disk
            settings.Save();

            // Update registry if path changed
            if (!string.IsNullOrEmpty(path))
            {
                try
                {
                    using (var key = Registry.CurrentUser.CreateSubKey(@"Software\AH_and_VaultSync"))
                    {
                        key.SetValue("WoWPath", path);
                    }
                }
                catch { }
            }

            this.DialogResult = DialogResult.OK;
            this.Close();
        }

        private void btnCancel_Click(object sender, EventArgs e)
        {
            this.DialogResult = DialogResult.Cancel;
            this.Close();
        }

        private string GetWoWPathFromRegistry()
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\AH_and_VaultSync"))
                {
                    if (key != null)
                        return key.GetValue("WoWPath") as string;
                }
            }
            catch { }

            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\GuildShopSync"))
                {
                    if (key != null)
                        return key.GetValue("WoWPath") as string;
                }
            }
            catch { }

            return null;
        }
    }
}
