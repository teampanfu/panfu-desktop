const path = require('path');

const initializeFlashPlugin = (app) => {
  const platformConfig = {
    win32: { plugin: 'pepflashplayer.dll', dir: 'win' },
    darwin: { plugin: 'PepperFlashPlayer.plugin', dir: 'mac' },
    linux: { plugin: 'libpepflashplayer.so', dir: 'linux' },
  };

  const config = platformConfig[process.platform];
  if (!config) {
    console.error(`Unsupported platform: ${process.platform}`);
    return;
  }

  const pluginSubdir = app.isPackaged ? '' : path.join(config.dir, process.arch);
  const resourcesPath = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');
  const pluginPath = path.join(resourcesPath, 'plugins', pluginSubdir, config.plugin);

  // Enable sandbox bypass only for Linux (required for Flash)
  if (process.platform === 'linux') {
    app.commandLine.appendSwitch('no-sandbox');
  }

  app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
  app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');

  console.log('Flash plugin initialized:', pluginPath);
};

module.exports = {
  initializeFlashPlugin,
};
