// main.js
const { app, BrowserWindow,ipcMain } = require('electron');
const {exec} = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

const PIPE = '\\\\.\\pipe\\loomwallet-ipc';
const LOG = path.join(app.getPath('userData'), 'main.log');
const log = (m) => { console.log(m); fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${m}\n`); };

let win = null;
const pendingToRenderer = [];
let lastSocket=null;

ipcMain.on('register-native-host', (event, extId) => {
  if (!extId) {
    event.sender.send('registration-status', { success: false, message: '확장 프로그램 ID가 필요합니다.' });
    return;
  }

  const appDir     = path.dirname(process.execPath);          // 설치 루트 (…\LoomWallet\)
  const scriptPath = path.join(appDir, 'resources', 'install-native-host.ps1');
  const installerDir = path.join(appDir, 'resources');        // PS1이 기대하는 InstallerDir

  const command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -ExtensionId "${extId}" -InstallerDir "${installerDir}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('exec error:', error, stderr);
      event.sender.send('registration-status', { success: false, message: `등록 실패: ${stderr || error.message}` });
      return;
    }
    event.sender.send('registration-status', { success: true, message: `등록 완료: ${stdout}` });
  });
});

function safeSendToRenderer(msg) {
  if (!win || win.isDestroyed() || !win.webContents || win.webContents.isLoading()) {
    pendingToRenderer.push(msg);
    return;
  }
  win.webContents.send('from-proxy', msg);
}
function frameWrite(sock,obj){
    const body = Buffer.from(JSON.stringify(obj),'utf8');
    const hdr = Buffer.alloc(4);
    hdr.writeUInt32LE(body.length,0);
    sock.write(hdr);
    sock.write(body);
}
function startPipeServer() {
  const server = net.createServer((socket) => {
    log('[PIPE] client connected');
    lastSocket = socket;
    let buf = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 4) {
        const len = buf.readUInt32LE(0);
        if (buf.length < 4 + len) break;
        const json = buf.slice(4, 4 + len).toString('utf8');
        buf = buf.slice(4 + len);
        log(`[PIPE] in ${json}`);
        try {
          const msg = JSON.parse(json);
          safeSendToRenderer(msg);
        } catch(e) {
          log(`[ERR] JSON parse: ${e.message}`);
        }
      }
    });

    socket.on('error', (e) => log(`[PIPE] error ${e.message}`));
    socket.on('close',  () => log('[PIPE] closed'));
  });

  server.listen(PIPE, () => log(`[PIPE] listening ${PIPE}`));
  server.on('error', (e) => log(`[PIPE] server error ${e.message}`));
}
ipcMain.handle('to-proxy', async (_evt, payload) => {
  if (!lastSocket || lastSocket.destroyed) throw new Error('proxy-cli not connected');
  frameWrite(lastSocket, payload);  
  return { ok: true };
});
function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 640,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'renderer.html'));
}

app.whenReady().then(() => {
  startPipeServer();
  createWindow();
});
