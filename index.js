const { app, BrowserWindow, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const path = require('path');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
}

// Window management functions
const handleZoom = (webContents, zoomIn) => {
  const newZoomLevel = webContents.zoomLevel + (zoomIn ? 0.5 : -0.5);
  if (newZoomLevel >= -5.0 && newZoomLevel <= 5.0) {
    webContents.zoomLevel = newZoomLevel;
  }
};

const createMenu = () => {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  const viewMenu = menu.items.find(item => item.role === 'viewmenu');
  if (!viewMenu?.submenu?.items) return;

  Menu.setApplicationMenu(Menu.buildFromTemplate(viewMenu.submenu.items));
};

const createWindow = () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1040,
    defaultHeight: 730,
  });

  const mainWindow = new BrowserWindow({
    ...mainWindowState,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      plugins: true,
    },
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (process.platform === 'win32') {
      if (input.key === 'F5') {
        if (input.control) {
          mainWindow.webContents.session.clearCache().then(() => {
            mainWindow.webContents.reloadIgnoringCache();
          });
        } else {
          mainWindow.webContents.reload();
        }
        event.preventDefault();
      } else if (input.control && (input.key === '+' || input.key === '-')) {
        handleZoom(mainWindow.webContents, input.key === '+');
        event.preventDefault();
      }
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.on('context-menu', (event, params) => {
    Menu.getApplicationMenu().popup(mainWindow, params.x, params.y);
  });

  mainWindow.loadURL('https://www.panfu.me/play');
  mainWindowState.manage(mainWindow);
};

// Flash plugin configuration
const initializeFlashPlugin = () => {
  const platformPlugins = {
    win32: app.isPackaged ? 'pepflashplayer.dll' : 'win/x64/pepflashplayer.dll',
    darwin: 'PepperFlashPlayer.plugin',
    default: 'libpepflashplayer.so',
  };

  const pluginName = platformPlugins[process.platform] || platformPlugins.default;
  const resourcesPath = app.isPackaged ? process.resourcesPath : __dirname;

  if (process.platform !== 'win32' && process.platform !== 'darwin') {
    app.commandLine.appendSwitch('no-sandbox');
  }

  app.commandLine.appendSwitch('ppapi-flash-path', path.join(resourcesPath, 'plugins', pluginName));
  app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');
};

// App event handlers
app.on('second-instance', () => {
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// App initialization
initializeFlashPlugin();

app.whenReady().then(() => {
  createMenu();
  createWindow();
  autoUpdater.checkForUpdates();
});
