// background.js
class YouTubeEnhancerBackground {
    constructor() {
      this.settings = null;
      this.init();
    }
  
    async init() {
      // Initialize extension
      this.setupListeners();
      await this.loadSettings();
      this.createContextMenus();
    }
  
    setupListeners() {
      // Handle installation and updates
      chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
  
      // Handle messages from content scripts
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  
      // Handle tab updates
      chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
  
      // Handle context menu clicks
      chrome.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this));
    }
  
    async handleInstalled(details) {
      if (details.reason === 'install') {
        // Set default settings on first installation
        const defaultSettings = {
          version: chrome.runtime.getManifest().version,
          features: {
            enhancedPlayer: true,
            thumbnailPreviews: true,
            customLayout: false,
            cinemaMode: false
          },
          player: {
            defaultSpeed: 1,
            defaultQuality: 'auto',
            autoplayNext: true,
            annotations: false,
            subtitles: {
              enabled: false,
              fontSize: 16,
              color: '#ffffff'
            }
          },
          layout: {
            watchLaterPosition: 'bottom-left',
            searchPosition: 'top-right',
            foldersPosition: 'bottom-right'
          }
        };
  
        await chrome.storage.local.set({ settings: defaultSettings });
        this.settings = defaultSettings;
  
        // Open welcome page
        chrome.tabs.create({
          url: chrome.runtime.getURL('welcome.html')
        });
      } else if (details.reason === 'update') {
        // Handle any necessary migrations
        await this.handleUpdate(details.previousVersion);
      }
    }
  
    async handleUpdate(previousVersion) {
      const settings = await this.loadSettings();
      settings.version = chrome.runtime.getManifest().version;
      
      // Add any new features or migrate old settings
      if (this.versionLessThan(previousVersion, '1.1.0')) {
        settings.features = {
          ...settings.features,
          newFeature: true // Example of adding new feature
        };
      }
  
      await chrome.storage.local.set({ settings });
      this.settings = settings;
    }
  
    versionLessThan(v1, v2) {
      const v1Parts = v1.split('.').map(Number);
      const v2Parts = v2.split('.').map(Number);
      
      for (let i = 0; i < v1Parts.length; i++) {
        if (v1Parts[i] < v2Parts[i]) return true;
        if (v1Parts[i] > v2Parts[i]) return false;
      }
      return false;
    }
  
    async loadSettings() {
      const data = await chrome.storage.local.get('settings');
      this.settings = data.settings;
      return this.settings;
    }
  
    createContextMenus() {
      // Remove existing menu items
      chrome.contextMenus.removeAll();
  
      // Create new menu items
      chrome.contextMenus.create({
        id: 'addToWatchLater',
        title: 'Add to Watch Later',
        contexts: ['video', 'link']
      });
  
      chrome.contextMenus.create({
        id: 'enhancerSettings',
        title: 'YouTube Enhancer Settings',
        contexts: ['page']
      });
  
      // Add separator
      chrome.contextMenus.create({
        id: 'separator1',
        type: 'separator',
        contexts: ['page']
      });
  
      // Add feature toggles
      const features = [
        { id: 'togglePlayer', title: 'Enhanced Player' },
        { id: 'togglePreviews', title: 'Thumbnail Previews' },
        { id: 'toggleLayout', title: 'Custom Layout' },
        { id: 'toggleCinema', title: 'Cinema Mode' }
      ];
  
      features.forEach(feature => {
        chrome.contextMenus.create({
          id: feature.id,
          title: feature.title,
          type: 'checkbox',
          checked: this.settings?.features[feature.id] ?? true,
          contexts: ['page']
        });
      });
    }
  
    async handleMessage(message, sender, sendResponse) {
      switch (message.type) {
        case 'GET_SETTINGS':
          sendResponse({ settings: this.settings });
          break;
  
        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;
  
        case 'SAVE_STATE':
          await this.saveState(sender.tab.id, message.state);
          sendResponse({ success: true });
          break;
  
        case 'GET_STATE':
          const state = await this.getState(sender.tab.id);
          sendResponse({ state });
          break;
  
        case 'ERROR':
          this.handleError(message.error);
          sendResponse({ success: true });
          break;
      }
      return true; // Keep message channel open for async response
    }
  
    async handleTabUpdate(tabId, changeInfo, tab) {
      if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com')) {
        const settings = await this.loadSettings();
        chrome.tabs.sendMessage(tabId, {
          type: 'TAB_READY',
          settings
        });
      }
    }
  
    async handleContextMenu(info, tab) {
      switch (info.menuItemId) {
        case 'addToWatchLater':
          const videoId = this.extractVideoId(info.linkUrl || info.pageUrl);
          if (videoId) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'ADD_TO_WATCH_LATER',
              videoId
            });
          }
          break;
  
        case 'enhancerSettings':
          chrome.runtime.openOptionsPage();
          break;
  
        case 'togglePlayer':
        case 'togglePreviews':
        case 'toggleLayout':
        case 'toggleCinema':
          await this.toggleFeature(info.menuItemId.replace('toggle', '').toLowerCase());
          break;
      }
    }
  
    async updateSettings(newSettings) {
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      await chrome.storage.local.set({ settings: this.settings });
      this.createContextMenus(); // Recreate context menus with new settings
    }
  
    async toggleFeature(featureName) {
      const features = this.settings.features;
      features[featureName] = !features[featureName];
      
      await this.updateSettings({ features });
  
      // Notify all YouTube tabs of the change
      const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'FEATURE_TOGGLED',
          feature: featureName,
          enabled: features[featureName]
        });
      });
    }
  
    async saveState(tabId, state) {
      await chrome.storage.local.set({
        [`tabState_${tabId}`]: {
          timestamp: Date.now(),
          state
        }
      });
    }
  
    async getState(tabId) {
      const data = await chrome.storage.local.get(`tabState_${tabId}`);
      return data[`tabState_${tabId}`]?.state || null;
    }
  
    async cleanupOldStates() {
      const storage = await chrome.storage.local.get(null);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
      for (const [key, value] of Object.entries(storage)) {
        if (key.startsWith('tabState_') && value.timestamp < oneHourAgo) {
          await chrome.storage.local.remove(key);
        }
      }
    }
  
    handleError(error) {
      console.error('YouTube Enhancer Error:', error);
  
      // Log errors to storage for debugging
      chrome.storage.local.get('errorLog', (data) => {
        const errorLog = data.errorLog || [];
        errorLog.push({
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            stack: error.stack,
            context: error.context
          }
        });
  
        // Keep only last 100 errors
        if (errorLog.length > 100) {
          errorLog.shift();
        }
  
        chrome.storage.local.set({ errorLog });
      });
    }
  
    extractVideoId(url) {
      try {
        const urlObj = new URL(url);
        if (urlObj.pathname === '/watch') {
          return urlObj.searchParams.get('v');
        }
        // Handle shortened URLs
        if (urlObj.host === 'youtu.be') {
          return urlObj.pathname.slice(1);
        }
      } catch (error) {
        this.handleError({
          message: 'Failed to extract video ID',
          stack: error.stack,
          context: 'extractVideoId'
        });
      }
      return null;
    }
  
    async updateBadgeText(tabId) {
      const state = await this.getState(tabId);
      if (state?.watchLaterCount) {
        chrome.action.setBadgeText({
          text: state.watchLaterCount.toString(),
          tabId
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#ff0000',
          tabId
        });
      } else {
        chrome.action.setBadgeText({
          text: '',
          tabId
        });
      }
    }
  
    async checkForUpdates() {
      try {
        const response = await fetch('https://api.github.com/repos/yourusername/youtube-enhancer/releases/latest');
        const data = await response.json();
        
        const latestVersion = data.tag_name.replace('v', '');
        const currentVersion = chrome.runtime.getManifest().version;
        
        if (this.versionLessThan(currentVersion, latestVersion)) {
          this.notifyUpdate(latestVersion);
        }
      } catch (error) {
        this.handleError({
          message: 'Failed to check for updates',
          stack: error.stack,
          context: 'checkForUpdates'
        });
      }
    }
  
    notifyUpdate(newVersion) {
      chrome.notifications.create('update-available', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Update Available',
        message: `A new version (${newVersion}) of YouTube Enhancer is available!`,
        buttons: [
          { title: 'Update Now' },
          { title: 'Later' }
        ],
        priority: 1
      });
    }
  
    // Analytics tracking
    async trackEvent(category, action, label = null, value = null) {
      const event = {
        category,
        action,
        label,
        value,
        timestamp: new Date().toISOString()
      };
  
      const { analytics = [] } = await chrome.storage.local.get('analytics');
      analytics.push(event);
  
      // Keep only last 1000 events
      if (analytics.length > 1000) {
        analytics.shift();
      }
  
      await chrome.storage.local.set({ analytics });
    }
  
    async generateAnalyticsReport() {
      const { analytics = [] } = await chrome.storage.local.get('analytics');
      
      // Group events by category and action
      const report = analytics.reduce((acc, event) => {
        const key = `${event.category}_${event.action}`;
        if (!acc[key]) {
          acc[key] = {
            count: 0,
            lastOccurrence: null,
            labels: new Set()
          };
        }
        
        acc[key].count++;
        acc[key].lastOccurrence = event.timestamp;
        if (event.label) {
          acc[key].labels.add(event.label);
        }
        
        return acc;
      }, {});
  
      return report;
    }
  
    // Performance monitoring
    startPerformanceMonitoring() {
      chrome.webNavigation.onCompleted.addListener(async (details) => {
        if (details.url.includes('youtube.com')) {
          const tab = await chrome.tabs.get(details.tabId);
          
          chrome.tabs.sendMessage(details.tabId, {
            type: 'MEASURE_PERFORMANCE'
          }, response => {
            if (response?.metrics) {
              this.trackEvent('Performance', 'PageLoad', tab.url, response.metrics.loadTime);
            }
          });
        }
      });
    }
  }
  
  // Initialize the background script
  const enhancerBackground = new YouTubeEnhancerBackground();