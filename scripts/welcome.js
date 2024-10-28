// scripts/welcome.js
class WelcomeManager {
    constructor() {
      this.elements = {
        // Layout buttons
        layoutButtons: document.querySelectorAll('.layout-button'),
        
        // Feature toggles
        enhancedPlayer: document.getElementById('enhancedPlayer'),
        thumbnailPreviews: document.getElementById('thumbnailPreviews'),
        cinemaMode: document.getElementById('cinemaMode'),
        
        // Action buttons
        completeSetup: document.getElementById('completeSetup'),
        skipButton: document.getElementById('skipButton'),
        
        // Resource links
        tutorialLink: document.getElementById('tutorialLink'),
        shortcutsLink: document.getElementById('shortcutsLink'),
        supportLink: document.getElementById('supportLink')
      };
  
      this.selectedLayout = 'classic';
      this.init();
    }
  
    init() {
      this.loadDefaultSettings();
      this.attachEventListeners();
      this.initializeAnimations();
      this.checkForExistingInstallation();
    }
  
    loadDefaultSettings() {
      // Default configuration
      this.settings = {
        layout: this.selectedLayout,
        features: {
          enhancedPlayer: true,
          thumbnailPreviews: true,
          cinemaMode: true
        },
        firstRun: true,
        version: chrome.runtime.getManifest().version
      };
    }
  
    attachEventListeners() {
      // Layout selection
      this.elements.layoutButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.selectLayout(button.dataset.layout);
        });
      });
  
      // Feature toggles
      this.elements.enhancedPlayer.addEventListener('change', 
        () => this.updateFeature('enhancedPlayer', this.elements.enhancedPlayer.checked));
      
      this.elements.thumbnailPreviews.addEventListener('change',
        () => this.updateFeature('thumbnailPreviews', this.elements.thumbnailPreviews.checked));
      
      this.elements.cinemaMode.addEventListener('change',
        () => this.updateFeature('cinemaMode', this.elements.cinemaMode.checked));
  
      // Complete setup
      this.elements.completeSetup.addEventListener('click', () => this.completeSetup());
      
      // Skip setup
      this.elements.skipButton.addEventListener('click', () => this.skipSetup());
  
      // Resource links
      this.elements.tutorialLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openTutorial();
      });
  
      this.elements.shortcutsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openShortcutsGuide();
      });
  
      this.elements.supportLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSupport();
      });
    }
  
    initializeAnimations() {
      // Add staggered animation to feature cards
      const cards = document.querySelectorAll('.feature-card');
      cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
      });
  
      // Add staggered animation to steps
      const steps = document.querySelectorAll('.step');
      steps.forEach((step, index) => {
        step.style.animationDelay = `${index * 0.1}s`;
      });
    }
  
    async checkForExistingInstallation() {
      try {
        const { settings } = await chrome.storage.local.get('settings');
        if (settings) {
          // Pre-select existing settings if found
          this.settings = settings;
          this.updateUIFromSettings();
        }
      } catch (error) {
        console.error('Error checking existing installation:', error);
      }
    }
  
    selectLayout(layout) {
      this.selectedLayout = layout;
      this.settings.layout = layout;
  
      // Update UI
      this.elements.layoutButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.layout === layout);
      });
  
      // Show preview of selected layout
      this.previewLayout(layout);
    }
  
    previewLayout(layout) {
      // Create layout preview animation
      const layouts = {
        classic: [
          { width: '70%', height: '60%', top: '0', left: '0' },
          { width: '30%', height: '100%', top: '0', right: '0' },
          { width: '70%', height: '40%', bottom: '0', left: '0' }
        ],
        modern: [
          { width: '60%', height: '100%', top: '0', left: '0' },
          { width: '40%', height: '50%', top: '0', right: '0' },
          { width: '40%', height: '50%', bottom: '0', right: '0' }
        ],
        compact: [
          { width: '50%', height: '100%', top: '0', left: '0' },
          { width: '50%', height: '50%', top: '0', right: '0' },
          { width: '50%', height: '50%', bottom: '0', right: '0' }
        ]
      };
  
      // Apply layout preview animation
      const preview = layouts[layout] || layouts.classic;
      this.animateLayoutPreview(preview);
    }
  
    animateLayoutPreview(layout) {
      const container = document.querySelector('.layout-preview');
      if (!container) return;
  
      container.innerHTML = '';
      layout.forEach((panel, index) => {
        const div = document.createElement('div');
        div.className = 'preview-panel';
        Object.assign(div.style, {
          position: 'absolute',
          transition: 'all 0.3s ease-in-out',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius)',
          ...panel
        });
        container.appendChild(div);
      });
    }
  
    updateFeature(feature, enabled) {
      this.settings.features[feature] = enabled;
    }
  
    updateUIFromSettings() {
      // Update layout selection
      this.selectLayout(this.settings.layout);
  
      // Update feature toggles
      Object.entries(this.settings.features).forEach(([feature, enabled]) => {
        const element = this.elements[feature];
        if (element) {
          element.checked = enabled;
        }
      });
    }
  
    async completeSetup() {
      try {
        // Save settings
        await chrome.storage.local.set({
          settings: {
            ...this.settings,
            firstRun: false
          }
        });
  
        // Notify background script
        chrome.runtime.sendMessage({
          type: 'SETUP_COMPLETED',
          settings: this.settings
        });
  
        // Show success message
        this.showSuccessMessage();
  
        // Redirect to YouTube after short delay
        setTimeout(() => {
          window.location.href = 'https://youtube.com';
        }, 2000);
      } catch (error) {
        console.error('Error completing setup:', error);
        this.showError('Failed to save settings');
      }
    }
  
    async skipSetup() {
      try {
        // Save default settings
        await chrome.storage.local.set({
          settings: {
            ...this.settings,
            firstRun: false
          }
        });
  
        // Redirect to YouTube
        window.location.href = 'https://youtube.com';
      } catch (error) {
        console.error('Error skipping setup:', error);
        this.showError('Failed to save settings');
      }
    }
  
    openTutorial() {
      chrome.tabs.create({
        url: 'https://github.com/yourusername/youtube-enhancer/wiki/tutorial'
      });
    }
  
    openShortcutsGuide() {
      chrome.tabs.create({
        url: 'https://github.com/yourusername/youtube-enhancer/wiki/shortcuts'
      });
    }
  
    openSupport() {
      chrome.tabs.create({
        url: 'https://github.com/yourusername/youtube-enhancer/issues'
      });
    }
  
    showSuccessMessage() {
      const message = document.createElement('div');
      message.className = 'success-message';
      message.innerHTML = `
        <div class="success-content">
          <div class="success-icon">✓</div>
          <h2>Setup Complete!</h2>
          <p>Redirecting to YouTube...</p>
        </div>
      `;
  
      document.body.appendChild(message);
      requestAnimationFrame(() => message.classList.add('show'));
    }
  
    showError(message) {
      const error = document.createElement('div');
      error.className = 'error-message';
      error.textContent = message;
  
      document.body.appendChild(error);
      requestAnimationFrame(() => error.classList.add('show'));
  
      setTimeout(() => {
        error.classList.remove('show');
        setTimeout(() => error.remove(), 300);
      }, 3000);
    }
  }
  
  // Initialize welcome page
  document.addEventListener('DOMContentLoaded', () => {
    new WelcomeManager();
  });