const DiscordRPC = require('discord-rpc');

class DiscordRPCManager {
  constructor() {
    this.client = null;
    this.clientId = '665701009800167426';
    this.isConnected = false;
    this.isInitialized = false;
    this.isEnabled = false;
    this.currentActivity = null;
    this.reconnectTimer = null;
    this.startTimestamp = null;
  }

  enable() {
    this.isEnabled = true;
    this.startTimestamp = Date.now();
    return { success: true, enabled: true };
  }

  disable() {
    this.isEnabled = false;
    this.disconnect();
    return { success: true, enabled: false };
  }

  async initialize() {
    if (!this.isEnabled || this.isInitialized) {
      return;
    }

    try {
      this.client = new DiscordRPC.Client({ transport: 'ipc' });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('Discord RPC connected');
      });

      this.client.on('disconnected', () => {
        console.log('Discord RPC disconnected');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      await this.client.login({ clientId: this.clientId });
      this.isInitialized = true;
    } catch (error) {
      console.warn('Discord RPC connection failed - Discord may not be running:', error.message);
      this.isInitialized = false;
      this.client = null;
      this.scheduleReconnect();
    }
  }

  async updateActivity(activityData) {
    if (!this.isEnabled || !activityData || !activityData.details) {
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isConnected || !this.client) {
      return;
    }

    this.applyActivity(activityData);
  }

  applyActivity(activityData) {
    const activity = {
      details: activityData.details || undefined,
      state: activityData.state || undefined,
      startTimestamp: this.startTimestamp || undefined,
      largeImageKey: 'panfu_icon',
      largeImageText: 'Panfu.me',
      smallImageKey: activityData.smallImageKey || undefined,
      smallImageText: activityData.smallImageText || undefined,
      instance: false,
    };

    this.client.setActivity(activity).catch(error => {
      console.error('Failed to set Discord activity:', error);
    });

    this.currentActivity = activity;
  }

  scheduleReconnect() {
    if (!this.isEnabled || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.isEnabled) {
        console.log('Attempting to reconnect Discord RPC...');
        this.isInitialized = false;
        this.initialize();
      }
    }, 30000);
  }

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        console.error('Error during Discord RPC disconnect:', error);
      }
      this.client = null;
    }

    this.isConnected = false;
    this.isInitialized = false;
    this.currentActivity = null;
    this.startTimestamp = null;
  }
}

module.exports = DiscordRPCManager;
