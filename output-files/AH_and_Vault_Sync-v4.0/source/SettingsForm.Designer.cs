namespace AH_and_VaultSync
{
    partial class SettingsForm
    {
        private System.ComponentModel.IContainer components = null;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.tabControl = new System.Windows.Forms.TabControl();
            this.tabGeneral = new System.Windows.Forms.TabPage();
            this.tabBankAlts = new System.Windows.Forms.TabPage();

            // General tab controls
            this.chkSyncPrices = new System.Windows.Forms.CheckBox();
            this.chkSyncGuildBank = new System.Windows.Forms.CheckBox();
            this.chkSyncBankAlts = new System.Windows.Forms.CheckBox();
            this.lblWoWPath = new System.Windows.Forms.Label();
            this.txtWoWPath = new System.Windows.Forms.TextBox();
            this.btnBrowse = new System.Windows.Forms.Button();
            this.grpSyncOptions = new System.Windows.Forms.GroupBox();
            this.grpWoWPath = new System.Windows.Forms.GroupBox();

            // Bank Alts tab controls
            this.treeBankAlts = new System.Windows.Forms.TreeView();
            this.btnSelectAll = new System.Windows.Forms.Button();
            this.btnSelectNone = new System.Windows.Forms.Button();
            this.btnRefresh = new System.Windows.Forms.Button();
            this.lblBankAltsInfo = new System.Windows.Forms.Label();

            // Bottom buttons
            this.btnSave = new System.Windows.Forms.Button();
            this.btnCancel = new System.Windows.Forms.Button();

            // tabControl
            this.tabControl.Controls.Add(this.tabGeneral);
            this.tabControl.Controls.Add(this.tabBankAlts);
            this.tabControl.Location = new System.Drawing.Point(12, 12);
            this.tabControl.Name = "tabControl";
            this.tabControl.SelectedIndex = 0;
            this.tabControl.Size = new System.Drawing.Size(460, 380);
            this.tabControl.TabIndex = 0;

            // tabGeneral
            this.tabGeneral.Controls.Add(this.grpSyncOptions);
            this.tabGeneral.Controls.Add(this.grpWoWPath);
            this.tabGeneral.Location = new System.Drawing.Point(4, 22);
            this.tabGeneral.Name = "tabGeneral";
            this.tabGeneral.Padding = new System.Windows.Forms.Padding(3);
            this.tabGeneral.Size = new System.Drawing.Size(452, 354);
            this.tabGeneral.TabIndex = 0;
            this.tabGeneral.Text = "General";
            this.tabGeneral.UseVisualStyleBackColor = true;

            // grpSyncOptions
            this.grpSyncOptions.Controls.Add(this.chkSyncPrices);
            this.grpSyncOptions.Controls.Add(this.chkSyncGuildBank);
            this.grpSyncOptions.Controls.Add(this.chkSyncBankAlts);
            this.grpSyncOptions.Location = new System.Drawing.Point(15, 15);
            this.grpSyncOptions.Name = "grpSyncOptions";
            this.grpSyncOptions.Size = new System.Drawing.Size(420, 120);
            this.grpSyncOptions.TabIndex = 0;
            this.grpSyncOptions.TabStop = false;
            this.grpSyncOptions.Text = "Sync Options";

            // chkSyncPrices
            this.chkSyncPrices.AutoSize = true;
            this.chkSyncPrices.Checked = true;
            this.chkSyncPrices.CheckState = System.Windows.Forms.CheckState.Checked;
            this.chkSyncPrices.Location = new System.Drawing.Point(20, 30);
            this.chkSyncPrices.Name = "chkSyncPrices";
            this.chkSyncPrices.Size = new System.Drawing.Size(250, 17);
            this.chkSyncPrices.TabIndex = 0;
            this.chkSyncPrices.Text = "Sync AH Prices (GuildShopSync addon)";
            this.chkSyncPrices.UseVisualStyleBackColor = true;

            // chkSyncGuildBank
            this.chkSyncGuildBank.AutoSize = true;
            this.chkSyncGuildBank.Checked = true;
            this.chkSyncGuildBank.CheckState = System.Windows.Forms.CheckState.Checked;
            this.chkSyncGuildBank.Location = new System.Drawing.Point(20, 55);
            this.chkSyncGuildBank.Name = "chkSyncGuildBank";
            this.chkSyncGuildBank.Size = new System.Drawing.Size(250, 17);
            this.chkSyncGuildBank.TabIndex = 1;
            this.chkSyncGuildBank.Text = "Sync Guild Bank (GBankExport addon)";
            this.chkSyncGuildBank.UseVisualStyleBackColor = true;

            // chkSyncBankAlts
            this.chkSyncBankAlts.AutoSize = true;
            this.chkSyncBankAlts.Checked = true;
            this.chkSyncBankAlts.CheckState = System.Windows.Forms.CheckState.Checked;
            this.chkSyncBankAlts.Location = new System.Drawing.Point(20, 80);
            this.chkSyncBankAlts.Name = "chkSyncBankAlts";
            this.chkSyncBankAlts.Size = new System.Drawing.Size(280, 17);
            this.chkSyncBankAlts.TabIndex = 2;
            this.chkSyncBankAlts.Text = "Sync Bank Alt Inventories (BankAltExport addon)";
            this.chkSyncBankAlts.UseVisualStyleBackColor = true;

            // grpWoWPath
            this.grpWoWPath.Controls.Add(this.lblWoWPath);
            this.grpWoWPath.Controls.Add(this.txtWoWPath);
            this.grpWoWPath.Controls.Add(this.btnBrowse);
            this.grpWoWPath.Location = new System.Drawing.Point(15, 150);
            this.grpWoWPath.Name = "grpWoWPath";
            this.grpWoWPath.Size = new System.Drawing.Size(420, 90);
            this.grpWoWPath.TabIndex = 1;
            this.grpWoWPath.TabStop = false;
            this.grpWoWPath.Text = "TurtleWoW Installation";

            // lblWoWPath
            this.lblWoWPath.AutoSize = true;
            this.lblWoWPath.Location = new System.Drawing.Point(20, 28);
            this.lblWoWPath.Name = "lblWoWPath";
            this.lblWoWPath.Size = new System.Drawing.Size(300, 13);
            this.lblWoWPath.TabIndex = 0;
            this.lblWoWPath.Text = "Path to TurtleWoW folder (containing WoW.exe):";

            // txtWoWPath
            this.txtWoWPath.Location = new System.Drawing.Point(20, 50);
            this.txtWoWPath.Name = "txtWoWPath";
            this.txtWoWPath.Size = new System.Drawing.Size(300, 20);
            this.txtWoWPath.TabIndex = 1;

            // btnBrowse
            this.btnBrowse.Location = new System.Drawing.Point(330, 48);
            this.btnBrowse.Name = "btnBrowse";
            this.btnBrowse.Size = new System.Drawing.Size(75, 23);
            this.btnBrowse.TabIndex = 2;
            this.btnBrowse.Text = "Browse...";
            this.btnBrowse.UseVisualStyleBackColor = true;
            this.btnBrowse.Click += new System.EventHandler(this.btnBrowse_Click);

            // tabBankAlts
            this.tabBankAlts.Controls.Add(this.lblBankAltsInfo);
            this.tabBankAlts.Controls.Add(this.treeBankAlts);
            this.tabBankAlts.Controls.Add(this.btnSelectAll);
            this.tabBankAlts.Controls.Add(this.btnSelectNone);
            this.tabBankAlts.Controls.Add(this.btnRefresh);
            this.tabBankAlts.Location = new System.Drawing.Point(4, 22);
            this.tabBankAlts.Name = "tabBankAlts";
            this.tabBankAlts.Padding = new System.Windows.Forms.Padding(3);
            this.tabBankAlts.Size = new System.Drawing.Size(452, 354);
            this.tabBankAlts.TabIndex = 1;
            this.tabBankAlts.Text = "Bank Alt Accounts";
            this.tabBankAlts.UseVisualStyleBackColor = true;

            // lblBankAltsInfo
            this.lblBankAltsInfo.Location = new System.Drawing.Point(15, 10);
            this.lblBankAltsInfo.Name = "lblBankAltsInfo";
            this.lblBankAltsInfo.Size = new System.Drawing.Size(420, 35);
            this.lblBankAltsInfo.TabIndex = 0;
            this.lblBankAltsInfo.Text = "Select which accounts and characters should have their bank alt inventories synced to the guild website:";

            // treeBankAlts
            this.treeBankAlts.CheckBoxes = true;
            this.treeBankAlts.Location = new System.Drawing.Point(15, 50);
            this.treeBankAlts.Name = "treeBankAlts";
            this.treeBankAlts.Size = new System.Drawing.Size(330, 260);
            this.treeBankAlts.TabIndex = 1;
            this.treeBankAlts.AfterCheck += new System.Windows.Forms.TreeViewEventHandler(this.treeBankAlts_AfterCheck);

            // btnSelectAll
            this.btnSelectAll.Location = new System.Drawing.Point(360, 50);
            this.btnSelectAll.Name = "btnSelectAll";
            this.btnSelectAll.Size = new System.Drawing.Size(75, 23);
            this.btnSelectAll.TabIndex = 2;
            this.btnSelectAll.Text = "Select All";
            this.btnSelectAll.UseVisualStyleBackColor = true;
            this.btnSelectAll.Click += new System.EventHandler(this.btnSelectAll_Click);

            // btnSelectNone
            this.btnSelectNone.Location = new System.Drawing.Point(360, 80);
            this.btnSelectNone.Name = "btnSelectNone";
            this.btnSelectNone.Size = new System.Drawing.Size(75, 23);
            this.btnSelectNone.TabIndex = 3;
            this.btnSelectNone.Text = "Select None";
            this.btnSelectNone.UseVisualStyleBackColor = true;
            this.btnSelectNone.Click += new System.EventHandler(this.btnSelectNone_Click);

            // btnRefresh
            this.btnRefresh.Location = new System.Drawing.Point(360, 120);
            this.btnRefresh.Name = "btnRefresh";
            this.btnRefresh.Size = new System.Drawing.Size(75, 23);
            this.btnRefresh.TabIndex = 4;
            this.btnRefresh.Text = "Refresh";
            this.btnRefresh.UseVisualStyleBackColor = true;
            this.btnRefresh.Click += new System.EventHandler(this.btnRefresh_Click);

            // btnSave
            this.btnSave.Location = new System.Drawing.Point(290, 405);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(90, 28);
            this.btnSave.TabIndex = 1;
            this.btnSave.Text = "Save";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);

            // btnCancel
            this.btnCancel.Location = new System.Drawing.Point(390, 405);
            this.btnCancel.Name = "btnCancel";
            this.btnCancel.Size = new System.Drawing.Size(80, 28);
            this.btnCancel.TabIndex = 2;
            this.btnCancel.Text = "Cancel";
            this.btnCancel.UseVisualStyleBackColor = true;
            this.btnCancel.Click += new System.EventHandler(this.btnCancel_Click);

            // SettingsForm
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(484, 446);
            this.Controls.Add(this.tabControl);
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.btnCancel);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "SettingsForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "AH & Vault Sync - Settings";
            this.Load += new System.EventHandler(this.SettingsForm_Load);

            this.tabControl.ResumeLayout(false);
            this.tabGeneral.ResumeLayout(false);
            this.tabBankAlts.ResumeLayout(false);
            this.grpSyncOptions.ResumeLayout(false);
            this.grpSyncOptions.PerformLayout();
            this.grpWoWPath.ResumeLayout(false);
            this.grpWoWPath.PerformLayout();
            this.ResumeLayout(false);
        }

        #endregion

        private System.Windows.Forms.TabControl tabControl;
        private System.Windows.Forms.TabPage tabGeneral;
        private System.Windows.Forms.TabPage tabBankAlts;
        private System.Windows.Forms.CheckBox chkSyncPrices;
        private System.Windows.Forms.CheckBox chkSyncGuildBank;
        private System.Windows.Forms.CheckBox chkSyncBankAlts;
        private System.Windows.Forms.Label lblWoWPath;
        private System.Windows.Forms.TextBox txtWoWPath;
        private System.Windows.Forms.Button btnBrowse;
        private System.Windows.Forms.GroupBox grpSyncOptions;
        private System.Windows.Forms.GroupBox grpWoWPath;
        private System.Windows.Forms.TreeView treeBankAlts;
        private System.Windows.Forms.Button btnSelectAll;
        private System.Windows.Forms.Button btnSelectNone;
        private System.Windows.Forms.Button btnRefresh;
        private System.Windows.Forms.Label lblBankAltsInfo;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Button btnCancel;
    }
}
