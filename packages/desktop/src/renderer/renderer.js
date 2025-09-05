// renderer.js

const log = document.getElementById('log');

function append(type, data) {
  const p = document.createElement('pre');
  p.className = 'msg';
  p.textContent = `[${type}] ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// 프록시 통신 (기존 코드)
window.electronAPI.onFromProxy((msg) => {
    console.log('[REN] from-proxy', msg);
    document.getElementById('log').textContent += `\n\n${JSON.stringify(msg.payload)}`;
});

document.getElementById('send').onclick = async () => {
    const raw = document.getElementById('outgoing').value.trim();
    let payload;
    try {
        payload = JSON.parse(raw);
    } catch {
        payload = { text: raw };
    }
    try {
        const res = await window.electronAPI.sendToProxy(payload);
        document.getElementById('log').textContent += `\n\n${JSON.stringify(payload)}`;
    } catch (e) {
        append('to-proxy:error', String(e.message || e));
    }
};

document.getElementById('register-btn').addEventListener('click', () => {
    const extId = document.getElementById('extId-input').value;
    window.electronAPI.registerNativeHost(extId);
});

window.electronAPI.onRegistrationStatus((response) => {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = response.message;
    if (response.success) {
        statusEl.style.color = 'green';
    } else {
        statusEl.style.color = 'red';
    }
});