// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 프록시 통신을 위한 기존 함수
    onFromProxy: (cb) => {
        const fn = (_e, msg) => cb(msg);
        ipcRenderer.on('from-proxy', fn);
        return () => ipcRenderer.removeListener('from-proxy', fn);
    },
    sendToProxy: (payload) => ipcRenderer.invoke('to-proxy', payload),
    
    // 네이티브 호스트 등록을 위한 새로운 함수
    registerNativeHost: (extId) => ipcRenderer.send('register-native-host', extId),
    onRegistrationStatus: (cb) => {
        const fn = (_e, response) => cb(response);
        ipcRenderer.on('registration-status', fn);
        return () => ipcRenderer.removeListener('registration-status', fn);
    }
});