const { app, BrowserWindow, clipboard, dialog, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const path = require('path');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  const createMenu = () => {
    const menu = Menu.getApplicationMenu();
    const filteredItems = menu.items.find(item => item.role === 'viewmenu').submenu.items;
    Menu.setApplicationMenu(Menu.buildFromTemplate(filteredItems));
  };

  const createWindow = () => {
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1040,
      defaultHeight: 730,
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

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      openNewWindow(url);
    });

    mainWindow.webContents.on('context-menu', (event, params) => {
      Menu.getApplicationMenu().popup(mainWindow, params.x, params.y);
    });

    mainWindow.loadURL('https://www.panfu.us/play');

    mainWindowState.manage(mainWindow);
  };

  const openNewWindow = (url) => {
    const options = {
      type: 'question',
      buttons: ['Open in Default Browser', 'Copy to Clipboard', 'Cancel'],
      defaultId: 0,
      title: 'Open Link',
      message: 'Choose an action for the link:',
      detail: url,
    };
  
    dialog.showMessageBox(null, options).then(({ response }) => {
      if (response === 0) {
        shell.openExternal(url);
      } else if (response === 1) {
        clipboard.writeText(url);
      }
    });
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

    if (['freebsd', 'linux', 'netbsd', 'openbsd'].includes(process.platform)) {
      app.commandLine.appendSwitch('no-sandbox');
    }

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

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}
