// D:\native-host-clean\host.js
const fs = require('fs');
const net = require('net');

const LOG = 'D:\\loomwallet-example-final\\packages\\proxy-cli\\logs\\host.log';
const PIPE = '\\\\.\\pipe\\loomwallet-ipc';
const log  = (m) => fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${m}\n`);

// ---- once-logger -------------------------------------------------
const loggedOnce = new Set();
function logOnce(key, line) {
  if (loggedOnce.has(key)) return;
  log(line);
  loggedOnce.add(key);
}
// ------------------------------------------------------------------

// -------- Native Messaging (stdin) 비동기 파서 --------
let nmBuf = Buffer.alloc(0);
process.stdin.on('data', (chunk) => {
  nmBuf = Buffer.concat([nmBuf, chunk]);
  parseNM();
});
process.stdin.on('end', () => log('[NM] stdin EOF'));

function parseNM() {
  while (nmBuf.length >= 4) {
    const len = nmBuf.readUInt32LE(0);
    if (nmBuf.length < 4 + len) break;
    const body = nmBuf.slice(4, 4 + len);
    nmBuf = nmBuf.slice(4 + len);

    const s = body.toString('utf8');
    log(`[NM] in ${s}`);
    let msg;
    try { msg = JSON.parse(s); }
    catch (e) { log(`[NM] parse error ${e.message}`); continue; }

    // 데스크톱으로 포워딩 (연결 전이면 큐)
    safeWriteDesktop({ type: 'from-proxy', payload: msg });

    // 확장에 ACK
    writeNM({ ok: true, forwarded: true });
  }
}

function writeNM(obj) {
  const s = JSON.stringify(obj);
  const b = Buffer.from(s, 'utf8');
  const h = Buffer.alloc(4); h.writeUInt32LE(b.length, 0);
  process.stdout.write(h);
  process.stdout.write(b);
  log(`[NM] out ${s}`);
}

// -------- 파이프 연결 관리 (큐 + 재시도 + 안전전송) --------
let desktop = null;
let connecting = false;
const pendingToDesktop = [];

function connectDesktop() {
  if (desktop && !desktop.destroyed) return;
  if (connecting) return;
  connecting = true;

  const sock = net.connect(PIPE);

  sock.once('connect', () => {
    desktop = sock;
    connecting = false;

    let pbuf = Buffer.alloc(0);
    desktop.on('data', (chunk) => {
      pbuf = Buffer.concat([pbuf, chunk]);
      while (pbuf.length >= 4) {
        const len = pbuf.readUInt32LE(0);
        if (pbuf.length < 4 + len) break;
        const body = pbuf.slice(4, 4 + len);
        pbuf = pbuf.slice(4 + len);

        try {
          const s = body.toString('utf8');
          
          const obj = JSON.parse(s);
          writeNM(obj);
        } catch (e) {
        }
      }
    });

    while (pendingToDesktop.length) rawWriteDesktop(pendingToDesktop.shift());
  });

  sock.on('error', (e) => {
    // ENOENT는 한 번만
    if (e && e.code === 'ENOENT') {
      logOnce('PIPE_ENOENT', `[PIPE] error ENOENT connect ENOENT ${PIPE}`);
    } else {
      log(`[PIPE] error ${e.code || ''} ${e.message}`);
    }
    connecting = false;
    desktop = null;
    setTimeout(connectDesktop, 500);
  });

  sock.on('close', () => {
    desktop = null;
    setTimeout(connectDesktop, 500);
  });
}

function rawWriteDesktop(obj) {
  if (!desktop || desktop.destroyed) throw new Error('Desktop not connected');
  const s = JSON.stringify(obj);
  const body = Buffer.from(s, 'utf8');
  const hdr  = Buffer.alloc(4); hdr.writeUInt32LE(body.length, 0);
  desktop.write(hdr); desktop.write(body);
  log(`[PIPE] out ${s}`);
}

function safeWriteDesktop(obj) {
  if (!desktop || desktop.destroyed) {
    pendingToDesktop.push(obj);
    connectDesktop();
    return;
  }
  rawWriteDesktop(obj);
}


log('host start');
connectDesktop();
