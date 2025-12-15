const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script to expose Panfu Desktop APIs to the renderer process
 * This allows Flash ExternalInterface to communicate with Electron features
 */

// Discord Rich Presence API
contextBridge.exposeInMainWorld('discordRPC', {
  updateActivity: (activityData) => {
    if (!activityData || typeof activityData !== 'object') {
      return Promise.resolve({ success: false, error: 'Invalid activity data' });
    }
    return ipcRenderer.invoke('discord-rpc-update', activityData);
  },
  enable: () => ipcRenderer.invoke('discord-rpc-enable'),
  disable: () => ipcRenderer.invoke('discord-rpc-disable'),
});

// Panfu Desktop utility API
contextBridge.exposeInMainWorld('panfuDesktop', {
  flashTaskbar: () => ipcRenderer.send('flash-taskbar'),
});
