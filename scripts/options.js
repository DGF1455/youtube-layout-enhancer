// scripts/options.js
class OptionsManager {
    constructor() {
      this.elements = {
        // Navigation
        navButtons: document.querySelectorAll('.nav-button'),
        sections: document.querySelectorAll('.settings-section'),
        
        // Layout
        layoutButtons: document.querySelectorAll('.preset-button'),
        playerPosition: document.getElementById('playerPosition'),
        watchLaterPosition: document.getElementById('watchLaterPosition'),
        searchPosition: document.getElementById('searchPosition'),
        
        // Features
        enhancedPlayer: document.getElementById('enhancedPlayer'),
        autoplayNext: document.getElementById('autoplayNext'),
        rememberSpeed: document.getElementById('rememberSpeed'),
        rememberQuality: document.getElementById('rememberQuality'),
        thumbnailPreviews: document.getElementById('thumbnailPreviews'),
        previewDelay: document.getElementById('previewDelay'),
        previewSize: document.getElementById('previewSize'),
        cinemaMode: document.getElementById('cinemaMode'),
        dimmingLevel: document.getElementById('dimmingLevel'),
        hideComments: document.getElementById('hideComments'),
        
        // Appearance
        themeButtons: document.querySelectorAll('.theme-button'),
        accentColor: document.getElementById('accentColor'),
        backgroundColor: document.getElementById('backgroundColor'),
        
        // Advanced
        exportData: document.getElementById('exportData'),
        importData: document.getElementById('importData'),
        importFile: document.getElementById('importFile'),
        enableAnimations: document.getElementById('enableAnimations'),
        preloadThumbnails: document.getElementById('preloadThumbnails'),
        enableLogging: document.getElementById('enableLogging'),
        viewLogs: document.getElementById('viewLogs'),
        
        // Actions
        saveButton: document.getElementById('saveSettings'),
        resetButton: document.getElementById('resetButton'),
        saveStatus: document.querySelector('.save-status')
      };
  
      this.settings = null;
      this.hasChanges = false;
      this.init();
    }
  
    async init() {
      try {
        await this.loadSettings();
        this.initializeUI();
        this.attachEventListeners();
        this.initializeShortcuts();
      } catch (error) {
        console.error('Failed to initialize options:', error);
        this.showError('Failed to load settings');
      }
    }
  
    async loadSettings() {
      const { settings } = await chrome.storage.local.get('settings');
      this.settings = settings || this.getDefaultSettings();
      this.originalSettings = JSON.stringify(this.settings);
    }
  
    getDefaultSettings() {
      return {
        version: chrome.runtime.getManifest().version,
        layout: {
          preset: 'classic',
          playerPosition: 'top-left',
          watchLaterPosition: 'bottom-left',
          searchPosition: 'top-right'
        },
        features: {
          enhancedPlayer: true,
          autoplayNext: true,
          rememberSpeed: true,
          rememberQuality: true,
          thumbnailPreviews: true,
          previewDelay: 500,
          previewSize: 250,
          cinemaMode: true,
          dimmingLevel: 70,
          hideComments: false
        },
        appearance: {
          theme: 'system',
          accentColor: '#ff0000',
          backgroundColor: '#ffffff'
        },
        advanced: {
          enableAnimations: true,
          preloadThumbnails: true,
          enableLogging: false
        }
      };
    }
  
    initializeUI() {
      // Set initial values for all inputs
      this.setLayoutValues();
      this.setFeatureValues();
      this.setAppearanceValues();
      this.setAdvancedValues();
      
      // Initialize layout preview
      this.updateLayoutPreview(this.settings.layout.preset);
    }
  
    setLayoutValues() {
      // Set layout preset
      const activePreset = this.elements.layoutButtons.find(
        btn => btn.dataset.layout === this.settings.layout.preset
      );
      if (activePreset) {
        activePreset.classList.add('active');
      }
  
      // Set panel positions
      this.elements.playerPosition.value = this.settings.layout.playerPosition;
      this.elements.watchLaterPosition.value = this.settings.layout.watchLaterPosition;
      this.elements.searchPosition.value = this.settings.layout.searchPosition;
    }
  
    setFeatureValues() {
      const features = this.settings.features;
      
      // Enhanced player settings
      this.elements.enhancedPlayer.checked = features.enhancedPlayer;
      this.elements.autoplayNext.checked = features.autoplayNext;
      this.elements.rememberSpeed.checked = features.rememberSpeed;
      this.elements.rememberQuality.checked = features.rememberQuality;
      
      // Thumbnail preview settings
      this.elements.thumbnailPreviews.checked = features.thumbnailPreviews;
      this.elements.previewDelay.value = features.previewDelay;
      this.elements.previewSize.value = features.previewSize;
      
      // Cinema mode settings
      this.elements.cinemaMode.checked = features.cinemaMode;
      this.elements.dimmingLevel.value = features.dimmingLevel;
      this.elements.hideComments.checked = features.hideComments;
      
      // Update range values display
      this.updateRangeValues();
    }
  
    setAppearanceValues() {
      const appearance = this.settings.appearance;
      
      // Set theme
      const activeTheme = this.elements.themeButtons.find(
        btn => btn.dataset.theme === appearance.theme
      );
      if (activeTheme) {
        activeTheme.classList.add('active');
      }
  
      // Set colors
      this.elements.accentColor.value = appearance.accentColor;
      this.elements.backgroundColor.value = appearance.backgroundColor;
    }
  
    setAdvancedValues() {
      const advanced = this.settings.advanced;
      
      this.elements.enableAnimations.checked = advanced.enableAnimations;
      this.elements.preloadThumbnails.checked = advanced.preloadThumbnails;
      this.elements.enableLogging.checked = advanced.enableLogging;
    }
  
    attachEventListeners() {
      // Navigation
      this.elements.navButtons.forEach(button => {
        button.addEventListener('click', () => this.switchSection(button.dataset.section));
      });
  
      // Layout
      this.elements.layoutButtons.forEach(button => {
        button.addEventListener('click', () => this.selectLayout(button.dataset.layout));
      });
  
      // Panel positions
      this.elements.playerPosition.addEventListener('change', () => this.updatePanelPosition('player'));
      this.elements.watchLaterPosition.addEventListener('change', () => this.updatePanelPosition('watchLater'));
      this.elements.searchPosition.addEventListener('change', () => this.updatePanelPosition('search'));
  
      // Features
      this.attachFeatureListeners();
  
      // Appearance
      this.elements.themeButtons.forEach(button => {
        button.addEventListener('click', () => this.selectTheme(button.dataset.theme));
      });
  
      this.elements.accentColor.addEventListener('change', () => this.updateColors());
      this.elements.backgroundColor.addEventListener('change', () => this.updateColors());
  
      // Advanced
      this.elements.exportData.addEventListener('click', () => this.exportSettings());
      this.elements.importData.addEventListener('click', () => this.elements.importFile.click());
      this.elements.importFile.addEventListener('change', (e) => this.importSettings(e));
      this.elements.viewLogs.addEventListener('click', () => this.viewDebugLogs());
  
      // Actions
      this.elements.saveButton.addEventListener('click', () => this.saveSettings());
      this.elements.resetButton.addEventListener('click', () => this.resetSettings());
  
      // Track changes
      this.trackChanges();
    }
  
    attachFeatureListeners() {
      // Enhanced player
      this.elements.enhancedPlayer.addEventListener('change', () => this.updateFeature('enhancedPlayer'));
      this.elements.autoplayNext.addEventListener('change', () => this.updateFeature('autoplayNext'));
      this.elements.rememberSpeed.addEventListener('change', () => this.updateFeature('rememberSpeed'));
      this.elements.rememberQuality.addEventListener('change', () => this.updateFeature('rememberQuality'));
  
      // Thumbnail previews
      this.elements.thumbnailPreviews.addEventListener('change', () => this.updateFeature('thumbnailPreviews'));
      this.elements.previewDelay.addEventListener('input', () => this.updateFeature('previewDelay'));
      this.elements.previewSize.addEventListener('input', () => this.updateFeature('previewSize'));
  
      // Cinema mode
      this.elements.cinemaMode.addEventListener('change', () => this.updateFeature('cinemaMode'));
      this.elements.dimmingLevel.addEventListener('input', () => this.updateFeature('dimmingLevel'));
      this.elements.hideComments.addEventListener('change', () => this.updateFeature('hideComments'));
    }
  
    switchSection(sectionId) {
      // Update navigation
      this.elements.navButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.section === sectionId);
      });
  
      // Update sections
      this.elements.sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
      });
    }
  
    selectLayout(layout) {
      this.settings.layout.preset = layout;
      
      // Update UI
      this.elements.layoutButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.layout === layout);
      });
  
      // Update preview
      this.updateLayoutPreview(layout);
      this.markAsChanged();
    }
  
    updateLayoutPreview(layout) {
      const preview = document.querySelector('.preview-container');
      preview.innerHTML = '';
  
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
        ],
        custom: [
          { width: '45%', height: '45%', top: '0', left: '0' },
          { width: '45%', height: '45%', top: '0', right: '0' },
          { width: '100%', height: '45%', bottom: '0', left: '0' }
        ]
      };
  
      const currentLayout = layouts[layout] || layouts.classic;
      
      currentLayout.forEach((panel, index) => {
        const div = document.createElement('div');
        div.className = 'preview-panel';
        Object.assign(div.style, {
          position: 'absolute',
          transition: 'all 0.3s ease-in-out',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--border-radius)',
          ...panel
        });
        preview.appendChild(div);
      });
    }
  
    updatePanelPosition(panel) {
      const position = this.elements[`${panel}Position`].value;
      this.settings.layout[`${panel}Position`] = position;
      this.markAsChanged();
    }
  
    updateFeature(feature) {
      const element = this.elements[feature];
      if (element.type === 'checkbox') {
        this.settings.features[feature] = element.checked;
      } else if (element.type === 'range') {
        this.settings.features[feature] = parseInt(element.value);
        this.updateRangeValue(feature);
      }
      this.markAsChanged();
    }
  
    updateRangeValues() {
      ['previewDelay', 'previewSize', 'dimmingLevel'].forEach(feature => {
        this.updateRangeValue(feature);
      });
    }
  
    updateRangeValue(feature) {
      const element = this.elements[feature];
      const valueDisplay = element.parentElement.querySelector('.range-value');
      if (valueDisplay) {
        let value = element.value;
        switch (feature) {
          case 'previewDelay':
            valueDisplay.textContent = `${value}ms`;
            break;
          case 'previewSize':
            valueDisplay.textContent = `${value}px`;
            break;
          case 'dimmingLevel':
            valueDisplay.textContent = `${value}%`;
            break;
        }
      }
    }
  
    selectTheme(theme) {
      this.settings.appearance.theme = theme;
      
      this.elements.themeButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.theme === theme);
      });
  
      this.applyTheme(theme);
      this.markAsChanged();
    }
  
    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'system') {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  
    updateColors() {
      this.settings.appearance.accentColor = this.elements.accentColor.value;
      this.settings.appearance.backgroundColor = this.elements.backgroundColor.value;
      
      document.documentElement.style.setProperty('--primary-color', this.settings.appearance.accentColor);
      document.documentElement.style.setProperty('--bg-primary', this.settings.appearance.backgroundColor);
      
      this.markAsChanged();
    }
  
    async exportSettings() {
      const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-enhancer-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  
    async importSettings(event) {
      const file = event.target.files[0];
      if (!file) return;
  
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        
        // Validate imported settings
        if (!this.validateImportedSettings(imported)) {
          throw new Error('Invalid settings format');
        }
  
        this.settings = imported;
        this.initializeUI();
        this.markAsChanged();
        this.showSuccess('Settings imported successfully');
      } catch (error) {
        console.error('Import error:', error);
        this.showError('Failed to import settings');
      }
      
      // Reset file input
      event.target.value = '';
    }
  
    validateImportedSettings(settings) {
      // Add validation logic here
      return settings && settings.version && settings.layout && settings.features;
    }
  
    async viewDebugLogs() {
      const { errorLog = [] } = await chrome.storage.local.get('errorLog');
      
      const modal = document.createElement('div');
      modal.className = 'debug-modal';
      modal.innerHTML = `
      <div class="debug-modal-content">
        <div class="debug-modal-header">
          <h2>Debug Logs</h2>
          <button class="close-button">&times;</button>
        </div>
        <div class="debug-modal-body">
          <pre>${JSON.stringify(errorLog, null, 2)}</pre>
        </div>
        <div class="debug-modal-footer">
          <button class="clear-logs">Clear Logs</button>
          <button class="export-logs">Export Logs</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.close-button').addEventListener('click', () => modal.remove());
    modal.querySelector('.clear-logs').addEventListener('click', async () => {
      await chrome.storage.local.set({ errorLog: [] });
      modal.remove();
      this.showSuccess('Logs cleared');
    });
    modal.querySelector('.export-logs').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(errorLog, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-enhancer-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  initializeShortcuts() {
    const shortcutInputs = document.querySelectorAll('.shortcut-input');
    
    shortcutInputs.forEach(input => {
      input.addEventListener('click', () => this.recordShortcut(input));
    });
  }

  recordShortcut(element) {
    const command = element.dataset.command;
    element.textContent = 'Press shortcut...';
    element.classList.add('recording');

    const handleKeyDown = (e) => {
      e.preventDefault();

      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      if (e.key.toLowerCase() !== 'control' && 
          e.key.toLowerCase() !== 'shift' && 
          e.key.toLowerCase() !== 'alt') {
        keys.push(e.key.toUpperCase());
      }

      if (keys.length > 0) {
        const shortcut = keys.join(' + ');
        this.updateShortcut(command, shortcut);
        element.innerHTML = keys.map(key => `<kbd>${key}</kbd>`).join(' + ');
      }

      element.classList.remove('recording');
      document.removeEventListener('keydown', handleKeyDown);
    };

    document.addEventListener('keydown', handleKeyDown);
  }

  updateShortcut(command, shortcut) {
    if (!this.settings.shortcuts) {
      this.settings.shortcuts = {};
    }
    this.settings.shortcuts[command] = shortcut;
    this.markAsChanged();
  }

  markAsChanged() {
    this.hasChanges = true;
    this.elements.saveButton.disabled = false;
    this.elements.saveStatus.textContent = 'Unsaved changes';
    this.elements.saveStatus.classList.add('pending');
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ settings: this.settings });
      
      // Notify all tabs about the settings change
      const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: this.settings
        });
      });

      this.hasChanges = false;
      this.elements.saveButton.disabled = true;
      this.showSuccess('Settings saved successfully');
      
      // Update original settings reference
      this.originalSettings = JSON.stringify(this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError('Failed to save settings');
    }
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.settings = this.getDefaultSettings();
      this.initializeUI();
      this.markAsChanged();
      this.showSuccess('Settings reset to default');
    }
  }

  trackChanges() {
    // Check for unsaved changes before leaving
    window.addEventListener('beforeunload', (e) => {
      if (this.hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  showSuccess(message) {
    this.elements.saveStatus.textContent = message;
    this.elements.saveStatus.className = 'save-status success';
    setTimeout(() => {
      this.elements.saveStatus.textContent = this.hasChanges ? 'Unsaved changes' : '';
      this.elements.saveStatus.className = this.hasChanges ? 'save-status pending' : 'save-status';
    }, 3000);
  }

  showError(message) {
    this.elements.saveStatus.textContent = message;
    this.elements.saveStatus.className = 'save-status error';
    setTimeout(() => {
      this.elements.saveStatus.textContent = this.hasChanges ? 'Unsaved changes' : '';
      this.elements.saveStatus.className = this.hasChanges ? 'save-status pending' : 'save-status';
    }, 3000);
  }
}

// Initialize options page
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});