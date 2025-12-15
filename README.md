<p align="center"><a href="https://www.panfu.me"><img src="https://user-images.githubusercontent.com/59781900/183257850-f4b5362a-c090-4ec4-8892-addbd0d2d22b.svg"></a></p>

<p align="center">
<a href="https://github.com/teampanfu/panfu-desktop/actions"><img src="https://img.shields.io/github/actions/workflow/status/teampanfu/panfu-desktop/build.yml?style=flat-square" alt="Build Status"></a>
<a href="https://github.com/teampanfu/panfu-desktop/releases"><img src="https://img.shields.io/github/downloads/teampanfu/panfu-desktop/total.svg?style=flat-square" alt="Total Downloads"></a>
<a href="https://github.com/teampanfu/panfu-desktop/releases/latest"><img src="https://img.shields.io/github/v/release/teampanfu/panfu-desktop.svg?style=flat-square" alt="Latest Version"></a>
<a href="LICENSE"><img src="https://img.shields.io/github/license/teampanfu/panfu-desktop.svg?style=flat-square" alt="License"></a>
</p>

# Panfu Desktop

The official desktop application for Panfu.me with integrated Flash Player support.

## Features

- Flash Player 32.0.0.465
- Cross-platform support (Windows, macOS, Linux)
- Automatic updates
- Window state persistence
- Zoom controls
- Reload shortcuts
- API bridge for Discord RPC and game integration

> **Note:** This application uses Electron 11, as it's the last version with PPAPI Flash support. We've implemented multiple security measures to ensure safe operation.

## Project Structure

```
panfu-desktop/
├── index.js                   # Main entry point
├── src/
│   ├── discord-rpc.js         # Discord Rich Presence manager
│   ├── window-manager.js      # Window creation and event handling
│   ├── flash-plugin.js        # Flash plugin initialization
│   └── preload.js             # Secure API bridge
├── plugins/                   # Flash Player plugins
├── build/                     # Build assets
```

## Download

Get the latest version from our [official website](https://www.panfu.me/download) or [GitHub releases](https://github.com/teampanfu/panfu-desktop/releases).

## Development

Prerequisites: [Node.js](https://nodejs.org) and [Git](https://git-scm.com)

```bash
git clone https://github.com/teampanfu/panfu-desktop.git
cd panfu-desktop
npm install
npm start
```

## License

Panfu Desktop is open-source software licensed under the [MIT License](LICENSE).
