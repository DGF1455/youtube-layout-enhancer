// contentScript.js
class YouTubeEnhancer {
    constructor() {
      this.initialized = false;
      this.videoPlayer = null;
      this.thumbnailPreview = null;
      this.contextMenu = null;
      this.init();
    }
  
    async init() {
      if (this.initialized) return;
      
      // Wait for YouTube to be fully loaded
      await this.waitForYouTube();
      
      // Initialize components
      this.videoPlayer = new EnhancedVideoPlayer();
      this.thumbnailPreview = new ThumbnailPreviewSystem();
      this.contextMenu = new ContextMenuSystem();
      
      // Load custom styles
      this.injectStyles();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('YouTube Enhancer initialized');
    }
  
    async waitForYouTube() {
      return new Promise(resolve => {
        const check = setInterval(() => {
          if (document.querySelector('#movie_player')) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
    }
  
    injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* Injected styles will be added here */
        .enhanced-player-controls {
          position: absolute;
          bottom: 40px;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.7);
          padding: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
  
        .enhanced-player-controls:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
  
    setupEventListeners() {
      // Handle YouTube navigation
      this.observeNavigation();
      
      // Handle messages from background script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
      });
    }
  
    observeNavigation() {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            this.handleNavigationChange();
          }
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  
    handleNavigationChange() {
      // Reinitialize components if needed
      if (window.location.pathname === '/watch') {
        this.videoPlayer?.reinitialize();
      }
    }
  
    handleMessage(message, sender, sendResponse) {
      switch (message.type) {
        case 'TOGGLE_FEATURE':
          this.toggleFeature(message.feature);
          break;
        case 'UPDATE_SETTINGS':
          this.updateSettings(message.settings);
          break;
        // Add more message handlers as needed
      }
    }
  
    toggleFeature(feature) {
      switch (feature) {
        case 'cinemaMode':
          this.videoPlayer?.toggleCinemaMode();
          break;
        case 'thumbnailPreviews':
          this.thumbnailPreview?.toggle();
          break;
        // Add more feature toggles as needed
      }
    }
  
    updateSettings(settings) {
      this.videoPlayer?.updateSettings(settings);
      chrome.storage.local.set({ settings });
    }
  }
  
  // Initialize the enhancer
  const enhancer = new YouTubeEnhancer();