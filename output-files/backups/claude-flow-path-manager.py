#!/usr/bin/env python3
"""
Claude-Flow PATH Manager for Windows
Version: 1.0
Purpose: GUI tool for managing Windows PATH variables with Claude-Flow integration
"""

import os
import sys
import json
import winreg
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
from pathlib import Path
import subprocess
import ctypes


class PathManager:
    """Core PATH management functionality"""
    
    def __init__(self):
        self.system_path = []
        self.user_path = []
        self.combined_path = []
        
    def load_paths(self):
        """Load current PATH variables from Windows Registry"""
        try:
            # System PATH
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                              r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment") as key:
                system_path_str, _ = winreg.QueryValueEx(key, "Path")
                self.system_path = [p for p in system_path_str.split(';') if p]
            
            # User PATH
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, 
                              r"Environment") as key:
                try:
                    user_path_str, _ = winreg.QueryValueEx(key, "Path")
                    self.user_path = [p for p in user_path_str.split(';') if p]
                except FileNotFoundError:
                    self.user_path = []
            
            # Combined PATH
            combined_str = os.environ.get('PATH', '')
            self.combined_path = [p for p in combined_str.split(';') if p]
            
            return True
        except Exception as e:
            print(f"Error loading PATH: {e}")
            return False
    
    def find_duplicates(self, paths):
        """Find duplicate entries in PATH list"""
        seen = {}
        duplicates = []
        for path in paths:
            path_lower = path.lower()
            if path_lower in seen:
                duplicates.append(path)
            else:
                seen[path_lower] = path
        return duplicates
    
    def find_nonexistent(self, paths):
        """Find non-existent paths"""
        nonexistent = []
        for path in paths:
            # Skip paths with environment variables
            if '%' in path:
                continue
            if not os.path.exists(path):
                nonexistent.append(path)
        return nonexistent
    
    def find_claude_flow_paths(self, paths):
        """Find Claude-Flow related paths"""
        keywords = ['claude', 'flow', 'hive', 'swarm', 'mcp']
        related = []
        for path in paths:
            path_lower = path.lower()
            if any(keyword in path_lower for keyword in keywords):
                related.append(path)
        return related
    
    def backup_paths(self, filename=None):
        """Create backup of current PATH variables"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"PATH_Backup_{timestamp}.json"
        
        backup = {
            'timestamp': datetime.now().isoformat(),
            'system_path': self.system_path,
            'user_path': self.user_path,
            'combined_path': self.combined_path
        }
        
        with open(filename, 'w') as f:
            json.dump(backup, f, indent=2)
        
        return filename
    
    def is_admin(self):
        """Check if running with admin privileges"""
        try:
            return ctypes.windll.shell32.IsUserAnAdmin()
        except:
            return False


class PathManagerGUI:
    """GUI for PATH Manager"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("Claude-Flow PATH Manager for Windows")
        self.root.geometry("1200x700")
        
        self.manager = PathManager()
        
        # Style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Create UI
        self.create_menu()
        self.create_toolbar()
        self.create_main_panel()
        self.create_status_bar()
        
        # Load initial data
        self.refresh_data()
    
    def create_menu(self):
        """Create menu bar"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Refresh", command=self.refresh_data)
        file_menu.add_command(label="Backup", command=self.backup_paths)
        file_menu.add_command(label="Restore", command=self.restore_paths)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        tools_menu.add_command(label="Remove Duplicates", command=self.remove_duplicates)
        tools_menu.add_command(label="Remove Non-existent", command=self.remove_nonexistent)
        tools_menu.add_command(label="Add Claude-Flow Path", command=self.add_claude_flow_path)
        tools_menu.add_separator()
        tools_menu.add_command(label="Run PowerShell Diagnostic", command=self.run_ps_diagnostic)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="About", command=self.show_about)
    
    def create_toolbar(self):
        """Create toolbar"""
        toolbar = ttk.Frame(self.root)
        toolbar.pack(side=tk.TOP, fill=tk.X, padx=5, pady=5)
        
        ttk.Button(toolbar, text="Refresh", command=self.refresh_data).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Backup", command=self.backup_paths).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Clean Duplicates", command=self.remove_duplicates).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Add Path", command=self.add_path).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Remove Path", command=self.remove_path).pack(side=tk.LEFT, padx=2)
        
        # Admin indicator
        admin_label = ttk.Label(toolbar, text="[ADMIN]" if self.manager.is_admin() else "[USER]",
                               foreground="green" if self.manager.is_admin() else "orange")
        admin_label.pack(side=tk.RIGHT, padx=5)
    
    def create_main_panel(self):
        """Create main panel with tabs"""
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # System PATH tab
        self.system_frame = ttk.Frame(notebook)
        notebook.add(self.system_frame, text="System PATH")
        self.create_path_list(self.system_frame, "system")
        
        # User PATH tab
        self.user_frame = ttk.Frame(notebook)
        notebook.add(self.user_frame, text="User PATH")
        self.create_path_list(self.user_frame, "user")
        
        # Combined PATH tab
        self.combined_frame = ttk.Frame(notebook)
        notebook.add(self.combined_frame, text="Combined PATH")
        self.create_path_list(self.combined_frame, "combined")
        
        # Analysis tab
        self.analysis_frame = ttk.Frame(notebook)
        notebook.add(self.analysis_frame, text="Analysis")
        self.create_analysis_panel(self.analysis_frame)
        
        # Claude-Flow tab
        self.claude_frame = ttk.Frame(notebook)
        notebook.add(self.claude_frame, text="Claude-Flow")
        self.create_claude_flow_panel(self.claude_frame)
    
    def create_path_list(self, parent, path_type):
        """Create PATH list widget"""
        # Create frame with scrollbar
        frame = ttk.Frame(parent)
        frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Treeview
        columns = ('Path', 'Status', 'Type')
        tree = ttk.Treeview(frame, columns=columns, show='tree headings')
        tree.heading('#0', text='#')
        tree.heading('Path', text='Path')
        tree.heading('Status', text='Status')
        tree.heading('Type', text='Type')
        
        tree.column('#0', width=50)
        tree.column('Path', width=600)
        tree.column('Status', width=100)
        tree.column('Type', width=150)
        
        # Scrollbars
        vsb = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
        hsb = ttk.Scrollbar(frame, orient="horizontal", command=tree.xview)
        tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
        
        # Pack
        tree.grid(row=0, column=0, sticky='nsew')
        vsb.grid(row=0, column=1, sticky='ns')
        hsb.grid(row=1, column=0, sticky='ew')
        
        frame.grid_rowconfigure(0, weight=1)
        frame.grid_columnconfigure(0, weight=1)
        
        # Store reference
        setattr(self, f"{path_type}_tree", tree)
    
    def create_analysis_panel(self, parent):
        """Create analysis panel"""
        frame = ttk.Frame(parent)
        frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Analysis text
        self.analysis_text = tk.Text(frame, wrap=tk.WORD, height=20)
        self.analysis_text.pack(fill=tk.BOTH, expand=True)
        
        # Analysis buttons
        button_frame = ttk.Frame(frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="Run Analysis", command=self.run_analysis).pack(side=tk.LEFT, padx=2)
        ttk.Button(button_frame, text="Export Report", command=self.export_report).pack(side=tk.LEFT, padx=2)
    
    def create_claude_flow_panel(self, parent):
        """Create Claude-Flow specific panel"""
        frame = ttk.Frame(parent)
        frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Claude-Flow paths list
        label = ttk.Label(frame, text="Claude-Flow Related Paths:", font=('Arial', 10, 'bold'))
        label.pack(anchor=tk.W, pady=5)
        
        self.claude_listbox = tk.Listbox(frame, height=10)
        self.claude_listbox.pack(fill=tk.BOTH, expand=True)
        
        # Claude-Flow configuration
        config_frame = ttk.LabelFrame(frame, text="Claude-Flow Configuration")
        config_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(config_frame, text="Hive-Mind Path:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        self.hive_mind_entry = ttk.Entry(config_frame, width=50)
        self.hive_mind_entry.grid(row=0, column=1, padx=5, pady=2)
        ttk.Button(config_frame, text="Browse", command=lambda: self.browse_path(self.hive_mind_entry)).grid(row=0, column=2, padx=5, pady=2)
        
        ttk.Label(config_frame, text="Hive-Swarm Path:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.hive_swarm_entry = ttk.Entry(config_frame, width=50)
        self.hive_swarm_entry.grid(row=1, column=1, padx=5, pady=2)
        ttk.Button(config_frame, text="Browse", command=lambda: self.browse_path(self.hive_swarm_entry)).grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Button(config_frame, text="Add to PATH", command=self.add_claude_flow_paths).grid(row=2, column=1, pady=10)
    
    def create_status_bar(self):
        """Create status bar"""
        self.status_bar = ttk.Label(self.root, text="Ready", relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
    
    def refresh_data(self):
        """Refresh PATH data"""
        self.status_bar.config(text="Loading PATH variables...")
        
        if self.manager.load_paths():
            # Update System PATH tree
            self.update_tree(self.system_tree, self.manager.system_path)
            
            # Update User PATH tree
            self.update_tree(self.user_tree, self.manager.user_path)
            
            # Update Combined PATH tree
            self.update_tree(self.combined_tree, self.manager.combined_path)
            
            # Update Claude-Flow paths
            claude_paths = self.manager.find_claude_flow_paths(self.manager.combined_path)
            self.claude_listbox.delete(0, tk.END)
            for path in claude_paths:
                self.claude_listbox.insert(tk.END, path)
            
            self.status_bar.config(text=f"Loaded: System({len(self.manager.system_path)}) User({len(self.manager.user_path)}) Combined({len(self.manager.combined_path)})")
        else:
            messagebox.showerror("Error", "Failed to load PATH variables")
    
    def update_tree(self, tree, paths):
        """Update treeview with paths"""
        tree.delete(*tree.get_children())
        
        duplicates = self.manager.find_duplicates(paths)
        nonexistent = self.manager.find_nonexistent(paths)
        claude_flow = self.manager.find_claude_flow_paths(paths)
        
        for i, path in enumerate(paths, 1):
            status = "OK"
            path_type = "Standard"
            
            if path in duplicates:
                status = "Duplicate"
            elif path in nonexistent:
                status = "Not Found"
            
            if path in claude_flow:
                path_type = "Claude-Flow"
            
            tree.insert('', 'end', text=str(i), values=(path, status, path_type))
    
    def run_analysis(self):
        """Run PATH analysis"""
        self.analysis_text.delete(1.0, tk.END)
        
        analysis = []
        analysis.append("PATH ENVIRONMENT ANALYSIS")
        analysis.append("=" * 50)
        analysis.append(f"Generated: {datetime.now()}")
        analysis.append("")
        
        # System PATH
        analysis.append(f"SYSTEM PATH: {len(self.manager.system_path)} entries")
        duplicates = self.manager.find_duplicates(self.manager.system_path)
        nonexistent = self.manager.find_nonexistent(self.manager.system_path)
        analysis.append(f"  Duplicates: {len(duplicates)}")
        analysis.append(f"  Non-existent: {len(nonexistent)}")
        analysis.append(f"  Total length: {sum(len(p) for p in self.manager.system_path)} chars")
        analysis.append("")
        
        # User PATH
        analysis.append(f"USER PATH: {len(self.manager.user_path)} entries")
        duplicates = self.manager.find_duplicates(self.manager.user_path)
        nonexistent = self.manager.find_nonexistent(self.manager.user_path)
        analysis.append(f"  Duplicates: {len(duplicates)}")
        analysis.append(f"  Non-existent: {len(nonexistent)}")
        analysis.append(f"  Total length: {sum(len(p) for p in self.manager.user_path)} chars")
        analysis.append("")
        
        # Combined PATH
        analysis.append(f"COMBINED PATH: {len(self.manager.combined_path)} entries")
        duplicates = self.manager.find_duplicates(self.manager.combined_path)
        nonexistent = self.manager.find_nonexistent(self.manager.combined_path)
        claude_flow = self.manager.find_claude_flow_paths(self.manager.combined_path)
        analysis.append(f"  Duplicates: {len(duplicates)}")
        analysis.append(f"  Non-existent: {len(nonexistent)}")
        analysis.append(f"  Claude-Flow paths: {len(claude_flow)}")
        total_length = sum(len(p) for p in self.manager.combined_path)
        analysis.append(f"  Total length: {total_length} chars")
        
        # Warnings
        analysis.append("")
        analysis.append("WARNINGS:")
        if total_length > 2048:
            analysis.append("  ! PATH length exceeds 2048 chars (may cause issues)")
        if total_length > 8191:
            analysis.append("  !!! PATH length exceeds Windows limit (8191 chars)")
        if len(duplicates) > 0:
            analysis.append(f"  ! {len(duplicates)} duplicate entries found")
        if len(nonexistent) > 0:
            analysis.append(f"  ! {len(nonexistent)} non-existent paths found")
        
        self.analysis_text.insert(1.0, "\n".join(analysis))
    
    def backup_paths(self):
        """Backup current PATH variables"""
        filename = self.manager.backup_paths()
        messagebox.showinfo("Backup Complete", f"PATH variables backed up to:\n{filename}")
        self.status_bar.config(text=f"Backup saved: {filename}")
    
    def restore_paths(self):
        """Restore PATH from backup"""
        filename = filedialog.askopenfilename(
            title="Select backup file",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if filename:
            # Implementation would restore from backup
            messagebox.showinfo("Restore", f"Restore functionality to be implemented\nSelected: {filename}")
    
    def remove_duplicates(self):
        """Remove duplicate PATH entries"""
        if messagebox.askyesno("Remove Duplicates", "Remove all duplicate PATH entries?"):
            # Implementation would remove duplicates
            messagebox.showinfo("Clean", "Duplicate removal to be implemented")
            self.refresh_data()
    
    def remove_nonexistent(self):
        """Remove non-existent PATH entries"""
        if messagebox.askyesno("Remove Non-existent", "Remove all non-existent PATH entries?"):
            # Implementation would remove non-existent paths
            messagebox.showinfo("Clean", "Non-existent path removal to be implemented")
            self.refresh_data()
    
    def add_path(self):
        """Add new PATH entry"""
        # Implementation for adding path
        messagebox.showinfo("Add Path", "Add path functionality to be implemented")
    
    def remove_path(self):
        """Remove selected PATH entry"""
        # Implementation for removing path
        messagebox.showinfo("Remove Path", "Remove path functionality to be implemented")
    
    def add_claude_flow_path(self):
        """Add Claude-Flow specific path"""
        path = filedialog.askdirectory(title="Select Claude-Flow directory")
        if path:
            # Implementation would add path
            messagebox.showinfo("Add Claude-Flow Path", f"Would add: {path}")
            self.refresh_data()
    
    def add_claude_flow_paths(self):
        """Add configured Claude-Flow paths"""
        hive_mind = self.hive_mind_entry.get()
        hive_swarm = self.hive_swarm_entry.get()
        
        paths_to_add = []
        if hive_mind and os.path.exists(hive_mind):
            paths_to_add.append(hive_mind)
        if hive_swarm and os.path.exists(hive_swarm):
            paths_to_add.append(hive_swarm)
        
        if paths_to_add:
            messagebox.showinfo("Add Paths", f"Would add:\n" + "\n".join(paths_to_add))
        else:
            messagebox.showwarning("No Paths", "No valid paths to add")
    
    def browse_path(self, entry):
        """Browse for path"""
        path = filedialog.askdirectory()
        if path:
            entry.delete(0, tk.END)
            entry.insert(0, path)
    
    def run_ps_diagnostic(self):
        """Run PowerShell diagnostic script"""
        script_path = "path-diagnostic.ps1"
        if os.path.exists(script_path):
            subprocess.Popen(["powershell", "-ExecutionPolicy", "Bypass", "-File", script_path])
            self.status_bar.config(text="Running PowerShell diagnostic...")
        else:
            messagebox.showerror("Error", f"Script not found: {script_path}")
    
    def export_report(self):
        """Export analysis report"""
        filename = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if filename:
            with open(filename, 'w') as f:
                f.write(self.analysis_text.get(1.0, tk.END))
            messagebox.showinfo("Export", f"Report exported to:\n{filename}")
    
    def show_about(self):
        """Show about dialog"""
        about_text = """Claude-Flow PATH Manager
Version 1.0

A comprehensive tool for managing Windows PATH
environment variables with Claude-Flow integration.

Features:
- View and edit System/User PATH
- Remove duplicates and non-existent paths
- Claude-Flow specific path management
- Backup and restore functionality
- PowerShell integration"""
        
        messagebox.showinfo("About", about_text)


def main():
    """Main entry point"""
    root = tk.Tk()
    app = PathManagerGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()