const { app, BrowserWindow, Menu } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

// Allow users to only have one instance of the application
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    // Specify the path to the Flash Player plugin
    let pluginName

    switch (process.platform) {
        case 'win32':
            pluginName = 'pepflashplayer.dll'
            break
        case 'darwin':
            pluginName = 'PepperFlashPlayer.plugin'
            break
        case 'linux':
            pluginName = 'libpepflashplayer.so'
    }

    app.commandLine.appendSwitch('ppapi-flash-path', path.join(process.resourcesPath, 'plugins', pluginName))

    // Create the main window
    let window = null

    function createWindow() {
        window = new BrowserWindow({
            width: 1056,
            height: 720,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                plugins: true
            }
        })

        window.once('ready-to-show', () => window.show())

        window.loadURL('https://www.panfu.us/play')
    }

    // Context menu
    const menu = Menu.buildFromTemplate([
        { role: 'reload' }, { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }
    ])

    app.on('browser-window-created', (event, win) => {
        win.webContents.on('context-menu', (event, params) => {
            menu.popup(win, params.x, params.y)
        })
    })

    // Application is ready
    app.whenReady().then(() => {
        createWindow();

        // Open a window if none are open (macOS)
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })

        // Someone tried to run a second instance, we should focus our window
        app.on('second-instance', () => {
            if (window) {
                if (window.isMinimized()) window.restore()
                window.focus()
            }
        })

        // Quit the app when all windows are closed
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') app.quit()
        })

        // Check for updates
        autoUpdater.checkForUpdatesAndNotify()
    })
}
