const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const DiscordRPCManager = require('./src/discord-rpc');
const { createBrowserWindow, createMenu, setupDiscordRPCHandlers, setupNavigationRPCHandler } = require('./src/window-manager');
const { initializeFlashPlugin } = require('./src/flash-plugin');

// Initialize Discord RPC Manager
const discordRPC = new DiscordRPCManager();

// Create the main application window
const createWindow = () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1040,
    defaultHeight: 750,
  });

  const mainWindow = createBrowserWindow({
    ...mainWindowState,
    show: false,
  });

  mainWindow.loadURL('https://www.panfu.me/play');
  mainWindowState.manage(mainWindow);
  setupNavigationRPCHandler(mainWindow, discordRPC);

  return mainWindow;
};

// App event handlers
app.on('second-instance', () => {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
});

app.on('window-all-closed', () => {
  discordRPC.disconnect();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Setup IPC handlers
const setupIPCHandlers = () => {
  ipcMain.on('flash-taskbar', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow && !mainWindow.isFocused()) {
      mainWindow.flashFrame(true);
    }
  });

  setupDiscordRPCHandlers(discordRPC);
};

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // App initialization
  initializeFlashPlugin(app);

  app.whenReady().then(() => {
    createMenu();
    setupIPCHandlers();
    createWindow();

    // Check for updates (production only)
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    }
  });
}
