// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onFromProxy: (cb) => {
        const fn = (_e, msg) => cb(msg);
        ipcRenderer.on('from-proxy', fn);
        return () => ipcRenderer.removeListener('from-proxy', fn);
    },
    sendToProxy: (payload) => ipcRenderer.invoke('to-proxy', payload),
    
    registerNativeHost: (extId) => ipcRenderer.send('register-native-host', extId),
    onRegistrationStatus: (cb) => {
        const fn = (_e, response) => cb(response);
        ipcRenderer.on('registration-status', fn);
        return () => ipcRenderer.removeListener('registration-status', fn);
    }
});