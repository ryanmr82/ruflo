const logsPathInput = document.getElementById('logsPath');
const browseBtn = document.getElementById('browseBtn');
const rotateBtn = document.getElementById('rotateBtn');
const statusLog = document.getElementById('statusLog');

// Load saved settings on startup
window.addEventListener('DOMContentLoaded', async () => {
  const settings = await window.api.loadSettings();
  if (settings.logsPath) {
    logsPathInput.value = settings.logsPath;
  }
});

// Browse for folder
browseBtn.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) {
    logsPathInput.value = folder;
    await window.api.saveSettings({ logsPath: folder });
    addStatus('info', `Folder set: ${folder}`);
  }
});

// Rotate logs
rotateBtn.addEventListener('click', async () => {
  const logsPath = logsPathInput.value;

  if (!logsPath) {
    addStatus('error', 'Please select a Logs folder first.');
    return;
  }

  rotateBtn.disabled = true;
  rotateBtn.textContent = 'Rotating...';
  clearStatus();
  addStatus('info', 'Starting log rotation...');

  try {
    const results = await window.api.rotateLogs(logsPath);

    let hasSuccess = false;
    for (const result of results) {
      if (result.status === 'success') {
        addStatus('success', `${result.file}: ${result.message}`);
        addStatus('info', `  -> ${result.archive}`);
        hasSuccess = true;
      } else if (result.status === 'skipped') {
        addStatus('skipped', `${result.file}: ${result.message}`);
      } else {
        addStatus('error', `${result.file}: ${result.message}`);
      }
    }

    if (hasSuccess) {
      addStatus('success', 'Done! Logs have been rotated.');
    } else {
      addStatus('skipped', 'No logs were rotated.');
    }

  } catch (err) {
    addStatus('error', `Error: ${err.message}`);
  }

  rotateBtn.disabled = false;
  rotateBtn.textContent = 'Rotate Logs';
});

function addStatus(type, message) {
  const div = document.createElement('div');
  div.className = type;
  div.textContent = message;
  statusLog.appendChild(div);
  statusLog.scrollTop = statusLog.scrollHeight;
}

function clearStatus() {
  statusLog.innerHTML = '';
}
