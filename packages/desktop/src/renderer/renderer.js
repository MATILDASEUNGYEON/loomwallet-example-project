// renderer.js
const {ipcRenderer} = require('electron');
const log = document.getElementById('log');
function append(type, data) {
  const p = document.createElement('pre');
  p.className = 'msg';
  p.textContent = `[${type}] ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// proxy-cli → (pipe) → main → (ipc) → renderer
window.electronAPI.onFromProxy((msg) => {
  console.log('[REN] from-proxy', msg);
  document.getElementById('log').textContent += `\n\n${JSON.stringify(msg.payload)}`;
});


// renderer → main → (pipe) → proxy-cli
document.getElementById('send').onclick = async () => {
  const raw = document.getElementById('outgoing').value.trim();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    // 문자열도 허용
    payload = { text: raw };
  }
  try {
    const res = await window.electronAPI.sendToProxy(payload);
    document.getElementById('log').textContent += `\n\n${JSON.stringify(payload)}`;
    // append('to-proxy:ack', res);
  } catch (e) {
    append('to-proxy:error', String(e.message || e));
  }
};
document.getElementById('register-btn').addEventListener('click', () => {
  const extId = document.getElementById('extId-input').value;
  ipcRenderer.send('register-native-host', extId);
});
ipcRenderer.on('registration-status', (event, response) => {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = response.message;
    if (response.success) {
      statusEl.style.color = 'green';
    } else {
      statusEl.style.color = 'red';
    }
  });

