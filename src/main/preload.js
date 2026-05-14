window.addEventListener('DOMContentLoaded', () => {
    console.log("Sentinel loaded")
})

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getMalwareCount: () => ipcRenderer.invoke('get-malware-count'),
    onMalwareDetected: (callback) => ipcRenderer.on('malware-detected', callback)
});
