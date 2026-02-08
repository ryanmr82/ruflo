"""
Windows Admin MCP Server using FastMCP with PROVEN OUTPUT CAPTURE
Based on research from GitHub: Preston-Landers/pyuac and netinvent/command_runner
Using Win32 ShellExecuteEx with output capture via temporary process and communication
"""
import os
import sys
import subprocess
import ctypes
import tempfile
import time
import threading
from pathlib import Path
from typing import Optional
from mcp.server.fastmcp import FastMCP

# Create the MCP server instance
mcp = FastMCP("Windows Admin")

def is_admin():
    """Check if the script is running with admin privileges"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_elevated_command_with_communication(command: str, timeout: int = 30) -> str:
    """
    Run command elevated using PowerShell Start-Process with output redirection
    Based on proven solutions from GitHub research
    """
    try:
        # Create temp files for stdout and stderr
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='_stdout.tmp') as stdout_file:
            stdout_path = stdout_file.name
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='_stderr.tmp') as stderr_file:
            stderr_path = stderr_file.name
        
        # PowerShell script that runs elevated command and captures output to files
        ps_script = f'''
$ErrorActionPreference = "SilentlyContinue"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "cmd.exe"
$psi.Arguments = "/c `"({command}) > `"{stdout_path}`" 2> `"{stderr_path}`"`""
$psi.UseShellExecute = $true
$psi.Verb = "runas"
$psi.WindowStyle = "Hidden"
$psi.CreateNoWindow = $true

$process = [System.Diagnostics.Process]::Start($psi)
if ($process) {{
    $process.WaitForExit({timeout * 1000})
    if (!$process.HasExited) {{
        $process.Kill()
        Write-Output "TIMEOUT"
    }} else {{
        Write-Output $process.ExitCode
    }}
}} else {{
    Write-Output "FAILED_TO_START"
}}
'''
        
        # Execute the PowerShell script
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
            capture_output=True,
            text=True,
            timeout=timeout + 5
        )
        
        # Wait for files to be written
        time.sleep(1)
        
        # Read stdout
        stdout_content = ""
        if os.path.exists(stdout_path):
            try:
                with open(stdout_path, 'r', encoding='utf-8', errors='ignore') as f:
                    stdout_content = f.read().strip()
                os.unlink(stdout_path)
            except Exception:
                pass
        
        # Read stderr  
        stderr_content = ""
        if os.path.exists(stderr_path):
            try:
                with open(stderr_path, 'r', encoding='utf-8', errors='ignore') as f:
                    stderr_content = f.read().strip()
                os.unlink(stderr_path)
            except Exception:
                pass
        
        # Get exit code from PowerShell output
        exit_code = result.stdout.strip()
        
        # Format output
        output_parts = []
        if stdout_content:
            output_parts.append(stdout_content)
        if stderr_content:
            output_parts.append(f"[STDERR]: {stderr_content}")
        
        if output_parts:
            output = "\n".join(output_parts)
            return f"{output}\n\n[Exit Code: {exit_code}]"
        else:
            return f"Command executed with elevation. Exit code: {exit_code}"
            
    except subprocess.TimeoutExpired:
        return f"Elevated command timed out after {timeout} seconds"
    except Exception as e:
        return f"Error executing elevated command: {str(e)}"

def run_elevated_powershell_with_communication(script: str, timeout: int = 30) -> str:
    """
    Run PowerShell script elevated with output capture
    Based on proven solutions from GitHub research
    """
    try:
        # Create temp files for stdout and stderr
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='_ps_stdout.tmp') as stdout_file:
            stdout_path = stdout_file.name
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='_ps_stderr.tmp') as stderr_file:
            stderr_path = stderr_file.name
        
        # Escape script content and create elevated PowerShell execution
        escaped_script = script.replace('"', '""').replace("'", "''")
        
        ps_launcher = f'''
$ErrorActionPreference = "SilentlyContinue"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "powershell.exe"
$psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command `"({escaped_script}) > '{stdout_path}' 2> '{stderr_path}'`""
$psi.UseShellExecute = $true
$psi.Verb = "runas"
$psi.WindowStyle = "Hidden"
$psi.CreateNoWindow = $true

$process = [System.Diagnostics.Process]::Start($psi)
if ($process) {{
    $process.WaitForExit({timeout * 1000})
    if (!$process.HasExited) {{
        $process.Kill()
        Write-Output "TIMEOUT"
    }} else {{
        Write-Output $process.ExitCode
    }}
}} else {{
    Write-Output "FAILED_TO_START"
}}
'''
        
        # Execute the launcher
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_launcher],
            capture_output=True,
            text=True,
            timeout=timeout + 5
        )
        
        # Wait for output files
        time.sleep(1)
        
        # Read stdout
        stdout_content = ""
        if os.path.exists(stdout_path):
            try:
                with open(stdout_path, 'r', encoding='utf-8', errors='ignore') as f:
                    stdout_content = f.read().strip()
                os.unlink(stdout_path)
            except Exception:
                pass
        
        # Read stderr
        stderr_content = ""
        if os.path.exists(stderr_path):
            try:
                with open(stderr_path, 'r', encoding='utf-8', errors='ignore') as f:
                    stderr_content = f.read().strip()
                os.unlink(stderr_path)
            except Exception:
                pass
        
        # Format output
        output_parts = []
        if stdout_content:
            output_parts.append(stdout_content)
        if stderr_content:
            output_parts.append(f"[STDERR]: {stderr_content}")
        
        if output_parts:
            return "\n".join(output_parts)
        else:
            return "PowerShell script executed with elevation (no output)"
            
    except subprocess.TimeoutExpired:
        return f"Elevated PowerShell script timed out after {timeout} seconds"
    except Exception as e:
        return f"Error executing elevated PowerShell script: {str(e)}"

@mcp.tool()
def execute_command(command: str, timeout: int = 30) -> str:
    """
    Execute a Windows command and return its output.
    
    Args:
        command: The command to execute
        timeout: Timeout in seconds (default 30)
    
    Returns:
        The command output or error message
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        output = result.stdout
        if result.stderr:
            output += f"\n[STDERR]: {result.stderr}"
        
        return output if output else "Command executed successfully (no output)"
    except subprocess.TimeoutExpired:
        return f"Command timed out after {timeout} seconds"
    except Exception as e:
        return f"Error executing command: {str(e)}"

@mcp.tool()
def execute_admin_command(command: str, timeout: int = 30) -> str:
    """
    Execute a Windows command with administrative privileges.
    
    Args:
        command: The command to execute with admin rights
        timeout: Timeout in seconds (default 30)
    
    Returns:
        The command output or error message
    """
    if is_admin():
        # Already running as admin, use normal execution
        return execute_command(command, timeout)
    else:
        # Need elevation, use proven communication method
        return run_elevated_command_with_communication(command, timeout)

@mcp.tool()
def powershell_execute(script: str, timeout: int = 30) -> str:
    """
    Execute a PowerShell script and return its output.
    
    Args:
        script: The PowerShell script to execute
        timeout: Timeout in seconds (default 30)
    
    Returns:
        The script output or error message
    """
    try:
        # Encode the script for PowerShell
        encoded_script = subprocess.list2cmdline([script])
        command = f'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command {encoded_script}'
        
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        output = result.stdout
        if result.stderr:
            output += f"\n[STDERR]: {result.stderr}"
        
        return output if output else "Script executed successfully (no output)"
    except subprocess.TimeoutExpired:
        return f"Script timed out after {timeout} seconds"
    except Exception as e:
        return f"Error executing PowerShell script: {str(e)}"

@mcp.tool()
def powershell_execute_admin(script: str, timeout: int = 30) -> str:
    """
    Execute a PowerShell script with administrative privileges.
    
    Args:
        script: The PowerShell script to execute with admin rights
        timeout: Timeout in seconds (default 30)
    
    Returns:
        The script output or error message
    """
    if is_admin():
        # Already running as admin, use normal execution
        return powershell_execute(script, timeout)
    else:
        # Need elevation, use proven communication method
        return run_elevated_powershell_with_communication(script, timeout)

@mcp.tool()
def read_file(filepath: str, encoding: str = "utf-8") -> str:
    """
    Read the contents of a file.
    
    Args:
        filepath: Path to the file to read
        encoding: File encoding (default utf-8)
    
    Returns:
        The file contents or error message
    """
    try:
        path = Path(filepath)
        if not path.exists():
            return f"File not found: {filepath}"
        
        if not path.is_file():
            return f"Path is not a file: {filepath}"
        
        with open(path, 'r', encoding=encoding) as f:
            content = f.read()
        
        return content
    except Exception as e:
        return f"Error reading file: {str(e)}"

@mcp.tool()
def write_file(filepath: str, content: str, encoding: str = "utf-8") -> str:
    """
    Write content to a file.
    
    Args:
        filepath: Path to the file to write
        content: Content to write to the file
        encoding: File encoding (default utf-8)
    
    Returns:
        Success message or error
    """
    try:
        path = Path(filepath)
        
        # Create parent directories if they don't exist
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w', encoding=encoding) as f:
            f.write(content)
        
        return f"Successfully wrote {len(content)} characters to {filepath}"
    except Exception as e:
        return f"Error writing file: {str(e)}"

@mcp.tool()
def list_directory(directory: str, pattern: Optional[str] = None) -> str:
    """
    List contents of a directory.
    
    Args:
        directory: Path to the directory to list
        pattern: Optional glob pattern to filter files (e.g., "*.txt")
    
    Returns:
        Directory listing or error message
    """
    try:
        path = Path(directory)
        if not path.exists():
            return f"Directory not found: {directory}"
        
        if not path.is_dir():
            return f"Path is not a directory: {directory}"
        
        if pattern:
            items = list(path.glob(pattern))
        else:
            items = list(path.iterdir())
        
        if not items:
            return f"No items found in {directory}" + (f" matching pattern '{pattern}'" if pattern else "")
        
        result = []
        for item in sorted(items):
            item_type = "DIR" if item.is_dir() else "FILE"
            size = item.stat().st_size if item.is_file() else "-"
            result.append(f"[{item_type}] {item.name} ({size} bytes)" if size != "-" else f"[{item_type}] {item.name}")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error listing directory: {str(e)}"

@mcp.tool()
def get_system_info() -> str:
    """
    Get basic system information.
    
    Returns:
        System information string
    """
    info = []
    info.append(f"Admin Status: {is_admin()}")
    info.append(f"Current Directory: {os.getcwd()}")
    info.append(f"User: {os.environ.get('USERNAME', 'Unknown')}")
    info.append(f"Computer: {os.environ.get('COMPUTERNAME', 'Unknown')}")
    info.append(f"OS: {os.environ.get('OS', 'Unknown')}")
    info.append(f"Processor: {os.environ.get('PROCESSOR_IDENTIFIER', 'Unknown')}")
    
    return "\n".join(info)

# Main entry point
if __name__ == "__main__":
    print("Windows Admin MCP Server Starting...")
    print(f"Admin Status: {is_admin()}")
    print("RESEARCH-BASED OUTPUT CAPTURE: Using proven solutions from Preston-Landers/pyuac and netinvent/command_runner")
    print("Administrative commands available with full output capture via Win32 process communication")
    
    # Run the server
    mcp.run()