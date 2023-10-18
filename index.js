const { app, BrowserWindow, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const path = require('path');

// Allow only one instance of the application
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Create the application menu
  const createMenu = () => {
    const menu = Menu.getApplicationMenu();
    const filteredItems = menu.items.find(item => item.role === 'viewmenu').submenu.items;

    Menu.setApplicationMenu(Menu.buildFromTemplate(filteredItems));
  };

  // Create the main application window
  const createWindow = () => {
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1040,
      defaultHeight: 770,
    });

    const mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        plugins: true,
      },
    });

    // Show the window once it's ready to avoid a visual flash
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    // Open new windows with the default browser
    mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      shell.openExternal(url);
    });

    // Show the context menu
    mainWindow.webContents.on('context-menu', (event, params) => {
      Menu.getApplicationMenu().popup(mainWindow, params.x, params.y);
    });

    // Load the initial URL
    mainWindow.loadURL('https://www.panfu.us/play');

    // Manage the window's state
    mainWindowState.manage(mainWindow);
  };

  const initializeFlashPlugin = () => {
    const resourcesPath = app.isPackaged ? process.resourcesPath : __dirname;
    let pluginName;

    switch (process.platform) {
      case 'win32':
        pluginName = app.isPackaged ? 'pepflashplayer.dll' : 'win/x64/pepflashplayer.dll';
        break;
      case 'darwin':
        pluginName = 'PepperFlashPlayer.plugin';
        break;
      default:
        pluginName = 'libpepflashplayer.so';
    }

    // Disable Chromium's sandbox on Linux
    if (['freebsd', 'linux', 'netbsd', 'openbsd'].includes(process.platform)) {
      app.commandLine.appendSwitch('no-sandbox');
    }

    // Set Flash plugin path and version
    app.commandLine.appendSwitch('ppapi-flash-path', path.join(resourcesPath, 'plugins', pluginName));
    app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');
  };

  app.on('second-instance', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  initializeFlashPlugin();

  app.whenReady().then(() => {
    createMenu();
    createWindow();
    autoUpdater.checkForUpdates();

    // On macOS, open a new window if none exist when the app is activated
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}
