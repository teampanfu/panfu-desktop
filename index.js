const { app, BrowserWindow, Menu, MenuItem } = require('electron')
const path = require('path')

let window

function createWindow() {
    window = new BrowserWindow({
        width: 1060,
        height: 700,
        useContentSize: true,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            plugins: true
        }
    })

    window.loadURL('https://www.panfu.us/play')

    window.once('ready-to-show', () => window.show())

    // Context menu
    const menu = Menu.buildFromTemplate([
        { role: 'reload' }, { type: 'separator' },
        { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }, { type: 'separator' },
        { role: 'quit' }
    ])

    window.webContents.on('context-menu', (e, params) => {
        menu.popup(window, params.x, params.y)
    })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    // Setup the Flash Player plugin
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

    // Create the application
    app.on('second-instance', () => window.focus())

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })

    app.on('activate', () => {
        if (!window) createWindow()
    })

    app.whenReady().then(createWindow)
}
