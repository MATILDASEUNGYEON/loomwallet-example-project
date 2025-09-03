// renderer.js
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
