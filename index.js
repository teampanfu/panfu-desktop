const { app, BrowserWindow, Menu, screen, shell } = require('electron');
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

const reloadPage = (webContents, clearCache = false) => {
  if (clearCache) {
    webContents.session.clearCache().then(() => {
      webContents.reload();
    });
  } else {
    webContents.reload();
  }
};

const createMenu = () => {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  const viewMenu = menu.items.find(item => item.role === 'viewmenu');
  if (!viewMenu?.submenu?.items) return;

  Menu.setApplicationMenu(Menu.buildFromTemplate(viewMenu.submenu.items));
};

const createBrowserWindow = (options = {}) => {
  const window = new BrowserWindow({
    minWidth: 640,
    minHeight: 480,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      plugins: true,
    },
    ...options,
  });

  window.once('ready-to-show', () => window.show());

  window.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5' || (input.key === 'r' && (input.control || input.meta))) {
      reloadPage(window.webContents, input.control || input.shift || input.meta);
      event.preventDefault();
    } else if ((input.control || input.meta) && (input.key === '+' || input.key === '-' || input.key === '=')) {
      handleZoom(window.webContents, input.key === '+' || input.key === '=');
      event.preventDefault();
    }
  });

  window.webContents.on('context-menu', (event, params) => {
    const appMenu = Menu.getApplicationMenu();
    if (appMenu) {
      appMenu.popup(window, params.x, params.y);
    }
  });

  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();

    if (url.includes('oloko.me')) {
      const existingOlokoWindow = BrowserWindow.getAllWindows().find(win => {
        const winURL = win.webContents.getURL();
        return winURL && winURL.includes('oloko.me');
      });

      if (existingOlokoWindow) {
        existingOlokoWindow.focus();
      } else if (BrowserWindow.getAllWindows().length === 1) {
        const currentWindow = BrowserWindow.getAllWindows()[0];
        const [currentX, currentY] = currentWindow.getPosition();
        const [width, height] = currentWindow.getSize();

        const currentScreen = screen.getDisplayNearestPoint({ x: currentX, y: currentY });

        let newX = currentX + 50;
        let newY = currentY + 50;

        const margin = 20;

        if (newX + width > currentScreen.workArea.x + currentScreen.workArea.width - margin) {
          newX = currentScreen.workArea.x + margin;
          newY += 50;
        }

        if (newY + height > currentScreen.workArea.y + currentScreen.workArea.height - margin) {
          newY = currentScreen.workArea.y + margin;
        }

        const newWindow = createBrowserWindow({
          x: newX,
          y: newY,
          width: width,
          height: height
        });
        newWindow.loadURL(url);
      }
    } else {
      shell.openExternal(url);
    }
  });

  return window;
};

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
