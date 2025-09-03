
document.addEventListener('DOMContentLoaded', () => {
  const $btn = document.getElementById('sendMessageBtn');
  const $input = document.getElementById('messageInput');
  const $resp = document.getElementById('response');
  const hostName = 'com.lsware.totalproject_host';

  $btn.onclick = () => {
    console.log('[EXT] connectNative to', hostName);
    const port = chrome.runtime.connectNative(hostName);

    let payload;
    const raw = ($input.value || '').trim();
    try { payload = JSON.parse(raw); } catch { payload = { text: raw || 'hello' }; }

    console.log('[EXT] postMessage =>', payload);
    port.postMessage(payload);

    port.onMessage.addListener((msg) => {
      console.log('[EXT] onMessage <=', msg);
      $resp.textContent = `Response: ${JSON.stringify(msg)}`;
    });

    port.onDisconnect.addListener(() => {
      const err = chrome.runtime.lastError && chrome.runtime.lastError.message;
      console.error('[EXT] onDisconnect:', err);
      $resp.textContent = `Disconnected: ${err || 'unknown'}`;
    });
  };
});
