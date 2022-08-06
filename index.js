const { app, BrowserWindow } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

const menu = require('./menu')

let mainWindow

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    // Initialize the Flash Player plugin.
    initFlashPlayer()

    // Create the window, load the rest of the app, etc.
    app.whenReady().then(() => {
        createWindow()
        autoUpdater.checkForUpdates()
    })

    // Create a window when none are open. (macOS)
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    // Someone tried to run a second instance, we should focus our window.
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    // Listen for the context menu event for each created window.
    app.on('browser-window-created', (event, window) => {
        window.webContents.on('context-menu', (event, params) => {
            menu.popup(window, params.x, params.y)
        })
    })

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit()
    })
}

function initFlashPlayer() {
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

    // Disable Chromium's sandbox on Linux.
    if (['freebsd', 'linux', 'netbsd', 'openbsd'].includes(process.platform)) {
        app.commandLine.appendSwitch('no-sandbox')
    }

    const resourcesPath = (app.isPackaged) ? process.resourcesPath : __dirname

    app.commandLine.appendSwitch('ppapi-flash-path', path.join(resourcesPath, 'plugins', pluginName))
    app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465')
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1056,
        height: 720,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            plugins: true
        }
    })

    mainWindow.loadURL('https://www.panfu.us/play')
}