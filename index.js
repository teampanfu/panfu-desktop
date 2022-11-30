const { app, BrowserWindow, shell, Menu } = require('electron')
const { autoUpdater } = require('electron-updater')
const windowStateKeeper = require('electron-window-state')
const path = require('path')

let mainWindow

// Allow only one instance of our application at the same time
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  const createMenu = () => {
    const menu = Menu.getApplicationMenu()
    const items = menu.items.filter(item => item.role !== 'help')

    Menu.setApplicationMenu(Menu.buildFromTemplate(items))
  }

  const createWindow = () => {
    // Load the previous state with fallback to defaults
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1040,
      defaultHeight: 770
    })

    // Create the window using the state information
    mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        plugins: true
      }
    })

    // Open new windows with the default browser
    mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault()
      shell.openExternal(url)
    })

    // Show the context menu
    mainWindow.webContents.on('context-menu', (event, params) => {
      Menu.getApplicationMenu().popup(mainWindow, params.x, params.y)
    })

    // Navigate to the URL on the window
    mainWindow.loadURL('https://www.panfu.us/play')

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(mainWindow)
  }

  const setupFlashPlugin = () => {
    const resourcesPath = (app.isPackaged) ? process.resourcesPath : __dirname
    let pluginName

    switch (process.platform) {
      case 'win32':
        pluginName = (app.isPackaged) ? 'pepflashplayer.dll' : 'win/x64/pepflashplayer.dll'
        break
      case 'darwin':
        pluginName = 'PepperFlashPlayer.plugin'
        break
      default:
        pluginName = 'libpepflashplayer.so'
    }

    // Disable Chromium's sandbox on Linux
    if (['freebsd', 'linux', 'netbsd', 'openbsd'].includes(process.platform)) {
      app.commandLine.appendSwitch('no-sandbox')
    }

    app.commandLine.appendSwitch('ppapi-flash-path', path.join(resourcesPath, 'plugins', pluginName))
    app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465')
  }

  // Define the custom protocol handler
  app.setAsDefaultProtocolClient(app.getName())

  // Someone tried to run a second instance, we should focus our window
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  // The Flash path must be defined before the application is ready
  setupFlashPlugin()

  // Create the window, load the rest of the app, etc.
  app.whenReady().then(() => {
    createMenu()
    createWindow()

    autoUpdater.checkForUpdates()

    // Whereas Linux and Windows apps quit when they have no windows open,
    // macOS apps generally continue running even without any windows open,
    // and activating the app when no windows are available should open a new one.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}