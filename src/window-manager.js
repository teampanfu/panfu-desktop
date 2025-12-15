const { BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

// Whitelist of allowed domains (including subdomains)
const ALLOWED_DOMAINS = ['panfu.me', 'oloko.me', 'panfu.test', 'oloko.test'];

const isAllowedDomain = (url) => {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
};

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

const setupKeyboardShortcuts = (window) => {
  window.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5' || (input.key === 'r' && (input.control || input.meta))) {
      reloadPage(window.webContents, input.control || input.shift || input.meta);
      event.preventDefault();
    } else if ((input.control || input.meta) && (input.key === '+' || input.key === '-' || input.key === '=')) {
      handleZoom(window.webContents, input.key === '+' || input.key === '=');
      event.preventDefault();
    }
  });

  window.webContents.on('zoom-changed', (event, zoomDirection) => {
    handleZoom(window.webContents, zoomDirection === 'in');
  });
};

const setupContextMenu = (window) => {
  window.webContents.on('context-menu', (event, params) => {
    const appMenu = Menu.getApplicationMenu();
    if (appMenu) {
      appMenu.popup(window, params.x, params.y);
    }
  });
};

const setupNewWindowHandler = (window) => {
  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();

    // Special handling for oloko.me links
    if (url.includes('oloko.me')) {
      const existingWindow = BrowserWindow.getAllWindows().find((win) =>
        win.webContents.getURL()?.includes('oloko.me'),
      );

      if (existingWindow) {
        existingWindow.focus();
        return;
      }

      const [x, y] = window.getPosition();
      const [width, height] = window.getSize();
      const newWindow = createBrowserWindow({ x: x + 50, y: y + 50, width, height });
      newWindow.loadURL(url);
    } else {
      // Open all other links in default browser
      shell.openExternal(url);
    }
  });
};

const createBrowserWindow = (options = {}) => {
  const window = new BrowserWindow({
    minWidth: 640,
    minHeight: 480,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      plugins: true,
    },
    ...options,
  });

  window.once('ready-to-show', () => window.show());

  setupKeyboardShortcuts(window);
  setupContextMenu(window);
  setupNewWindowHandler(window);
  setupDomainWhitelist(window);

  return window;
};

const setupDomainWhitelist = (window) => {
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedDomain(url)) {
      console.warn('Blocked navigation to:', url);
      event.preventDefault();
    }
  });

  window.webContents.on('will-redirect', (event, url) => {
    if (!isAllowedDomain(url)) {
      console.warn('Blocked redirect to:', url);
      event.preventDefault();
    }
  });
};

const createMenu = () => {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  const viewMenu = menu.items.find(item => item.role === 'viewmenu');
  if (!viewMenu?.submenu?.items) return;

  Menu.setApplicationMenu(Menu.buildFromTemplate(viewMenu.submenu.items));
};

const setupNavigationRPCHandler = (window, discordRPCManager) => {
  window.webContents.on('did-navigate', () => {
    if (discordRPCManager.isEnabled) {
      discordRPCManager.disable();
    }
  });
};

const setupDiscordRPCHandlers = (discordRPCManager) => {
  ipcMain.handle('discord-rpc-update', async (_event, activityData) => {
    try {
      await discordRPCManager.updateActivity(activityData);
      return { success: true };
    } catch (error) {
      console.error('Discord RPC update failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('discord-rpc-enable', async () => {
    try {
      return discordRPCManager.enable();
    } catch (error) {
      console.error('Discord RPC enable failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('discord-rpc-disable', async () => {
    try {
      return discordRPCManager.disable();
    } catch (error) {
      console.error('Discord RPC disable failed:', error);
      return { success: false, error: error.message };
    }
  });
};

module.exports = {
  createBrowserWindow,
  createMenu,
  setupDiscordRPCHandlers,
  setupNavigationRPCHandler,
};
