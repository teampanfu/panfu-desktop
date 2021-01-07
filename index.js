const { app, BrowserWindow } = require('electron')
const path = require('path')

/**
 * Setup the Flash Player plugin.
 */

let pluginName

switch (process.platform) {
    case 'win32':
        pluginName = 'pepflashplayer.dll'
        break
    case 'darwin':
        pluginName = 'PepperFlashPlayer.plugin'
}

app.commandLine.appendSwitch('ppapi-flash-path', path.join(process.resourcesPath, 'plugins', pluginName))
app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.363')

/**
 * Create the main window.
 */

let window

function createWindow() {
    window = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            plugins: true
        }
    })

    window.loadURL('https://www.panfu.us/play')

    window.once('ready-to-show', () => {
        window.show()
    })
}

/**
 * Create the application.
 */

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (window) {
            if (window.isMinimized()) window.restore()
            window.focus()
        }
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    app.whenReady().then(createWindow)
}