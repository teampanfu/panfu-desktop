const { Menu } = require('electron')

const template = [
    { role: 'reload' },
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomIn' },
    { role: 'zoomout' },
    { type: 'separator' },
    {
        label: 'Clear Cache',
        click: (menuItem, browserWindow, event) => {
            browserWindow.webContents.session.clearCache()
        }
    }
]

module.exports = Menu.buildFromTemplate(template)