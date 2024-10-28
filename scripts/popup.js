// scripts/popup.js
class PopupManager {
    constructor() {
      this.elements = {
        // Feature toggles
        enhancedPlayer: document.getElementById('enhancedPlayer'),
        thumbnailPreviews: document.getElementById('thumbnailPreviews'),
        customLayout: document.getElementById('customLayout'),
        
        // Action buttons
        toggleLayout: document.getElementById('toggleLayout'),
        toggleCinema: document.getElementById('toggleCinema'),
        settingsButton: document.getElementById('settingsButton'),
        
        // Stats elements
        watchedCount: document.getElementById('watchedCount'),
        timeSaved: document.getElementById('timeSaved'),
        
        // Footer buttons
        helpButton: document.getElementById('helpButton'),
        reportButton: document.getElementById('reportButton')
      };
  
      this.settings = null;
      this.stats = null;
      this.init();
    }
  
    async init() {
      try {
        await this.loadSettings();
        this.initializeUI();
        this.attachEventListeners();
        this.loadStats();
        this.startAutoRefresh();
      } catch (error) {
        console.error('Popup initialization error:', error);
        this.showError('Failed to initialize popup');
      }
    }
  
    async loadSettings() {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        this.settings = response.settings;
        this.updateToggleStates();
      } catch (error) {
        console.error('Failed to load settings:', error);
        throw error;
      }
    }
  
    updateToggleStates() {
      if (!this.settings?.features) return;
  
      this.elements.enhancedPlayer.checked = this.settings.features.enhancedPlayer;
      this.elements.thumbnailPreviews.checked = this.settings.features.thumbnailPreviews;
      this.elements.customLayout.checked = this.settings.features.customLayout;
    }
  
    initializeUI() {
      // Set initial button states
      this.updateLayoutButtonState();
      this.updateCinemaModeState();
      
      // Add ripple effect to buttons
      this.addRippleEffect(this.elements.toggleLayout);
      this.addRippleEffect(this.elements.toggleCinema);
      
      // Initialize tooltips
      this.initializeTooltips();
    }
  
    attachEventListeners() {
      // Feature toggles
      this.elements.enhancedPlayer.addEventListener('change', 
        () => this.updateFeature('enhancedPlayer', this.elements.enhancedPlayer.checked));
      
      this.elements.thumbnailPreviews.addEventListener('change',
        () => this.updateFeature('thumbnailPreviews', this.elements.thumbnailPreviews.checked));
      
      this.elements.customLayout.addEventListener('change',
        () => this.updateFeature('customLayout', this.elements.customLayout.checked));
  
      // Action buttons
      this.elements.toggleLayout.addEventListener('click', () => this.toggleLayout());
      this.elements.toggleCinema.addEventListener('click', () => this.toggleCinema());
      this.elements.settingsButton.addEventListener('click', () => this.openSettings());
  
      // Footer buttons
      this.elements.helpButton.addEventListener('click', () => this.showHelp());
      this.elements.reportButton.addEventListener('click', () => this.reportIssue());
  
      // Listen for messages from background script
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }
  
    async updateFeature(feature, enabled) {
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_FEATURE',
          feature,
          enabled
        });
  
        // Update active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('youtube.com')) {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'FEATURE_TOGGLED',
            feature,
            enabled
          });
        }
  
        this.showSuccess(`${feature} ${enabled ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Failed to update feature:', error);
        this.showError('Failed to update feature');
        // Revert toggle state
        this.elements[feature].checked = !enabled;
      }
    }
  
    async toggleLayout() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('youtube.com')) {
          await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_LAYOUT' });
          this.updateLayoutButtonState();
          this.showSuccess('Layout toggled');
        }
      } catch (error) {
        console.error('Failed to toggle layout:', error);
        this.showError('Failed to toggle layout');
      }
    }
  
    async toggleCinema() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.includes('youtube.com')) {
          await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_CINEMA' });
          this.updateCinemaModeState();
          this.showSuccess('Cinema mode toggled');
        }
      } catch (error) {
        console.error('Failed to toggle cinema mode:', error);
        this.showError('Failed to toggle cinema mode');
      }
    }
  
    async loadStats() {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
        this.stats = response.stats;
        this.updateStatsDisplay();
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }
  
    updateStatsDisplay() {
      if (!this.stats) return;
  
      // Format watch count with commas
      this.elements.watchedCount.textContent = 
        this.stats.watchedCount.toLocaleString();
  
      // Format time saved
      const minutes = Math.floor(this.stats.timeSaved / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        this.elements.timeSaved.textContent = `${hours}h ${minutes % 60}m`;
      } else {
        this.elements.timeSaved.textContent = `${minutes}m`;
      }
    }
  
    updateLayoutButtonState() {
      const isActive = this.settings?.features?.customLayout;
      this.elements.toggleLayout.classList.toggle('active', isActive);
    }
  
    updateCinemaModeState() {
      const isActive = this.settings?.features?.cinemaMode;
      this.elements.toggleCinema.classList.toggle('active', isActive);
    }
  
    openSettings() {
      chrome.runtime.openOptionsPage();
    }
  
    showHelp() {
      window.open('https://github.com/yourusername/youtube-enhancer/wiki', '_blank');
    }
  
    reportIssue() {
      window.open('https://github.com/yourusername/youtube-enhancer/issues/new', '_blank');
    }
  
    addRippleEffect(button) {
      button.addEventListener('click', e => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    }
  
    initializeTooltips() {
      const tooltips = [
        { element: this.elements.settingsButton, text: 'Open Settings' },
        { element: this.elements.toggleLayout, text: 'Toggle Custom Layout' },
        { element: this.elements.toggleCinema, text: 'Toggle Cinema Mode' }
      ];
  
      tooltips.forEach(({ element, text }) => {
        element.setAttribute('title', text);
      });
    }
  
    showSuccess(message) {
      this.showToast(message, 'success');
    }
  
    showError(message) {
      this.showToast(message, 'error');
    }
  
    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  
    startAutoRefresh() {
      // Refresh stats every 30 seconds
      setInterval(() => this.loadStats(), 30000);
    }
  
    handleMessage(message, sender, sendResponse) {
      switch (message.type) {
        case 'SETTINGS_UPDATED':
          this.loadSettings();
          break;
        case 'STATS_UPDATED':
          this.loadStats();
          break;
        case 'SHOW_MESSAGE':
          this.showToast(message.text, message.messageType);
          break;
      }
    }
  }
  
  // Initialize popup when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
  });