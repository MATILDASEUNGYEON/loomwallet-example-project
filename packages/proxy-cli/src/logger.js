const fs = require('fs');
const LOG  = 'D:\\native-host-clean\\host.log';
const loggedOnce = new Set();

function log(m) {
  fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${m}\n`);
}

function logOnce(key, msg) {
  if (loggedOnce.has(key)) return;
  log(msg);
  loggedOnce.add(key);
}

module.exports = { log, logOnce, LOG };
