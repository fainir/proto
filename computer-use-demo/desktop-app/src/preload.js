const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // VM Management
  getVMStatus: () => ipcRenderer.invoke('get-vm-status'),
  startVM: () => ipcRenderer.invoke('start-vm'),
  stopVM: () => ipcRenderer.invoke('stop-vm'),
  restartVM: () => ipcRenderer.invoke('restart-vm'),
  
  // Container Management
  getContainerLogs: () => ipcRenderer.invoke('get-container-logs'),
  
  // Configuration
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  
  // App Info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Event Listeners
  onStatusUpdate: (callback) => {
    ipcRenderer.on('status-update', (event, data) => callback(data));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
}); 