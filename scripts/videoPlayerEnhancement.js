// videoPlayerEnhancement.js
class EnhancedVideoPlayer {
    constructor() {
      this.player = null;
      this.controlsContainer = null;
      this.settings = {
        playbackSpeed: 1,
        loopEnabled: false,
        autoQuality: true,
        annotations: true,
        cinemaMode: false,
        subtitleSettings: {
          enabled: false,
          fontSize: 16,
          color: '#ffffff',
          backgroundColor: '#000000',
          opacity: 0.75
        }
      };
  
      this.markers = new Map();
      this.shortcuts = new Map();
      this.gestureController = null;
      
      this.init();
    }
  
    init() {
      this.waitForYouTubePlayer()
        .then(() => {
          this.player = document.querySelector('#movie_player');
          this.setupEnhancements();
          this.loadUserSettings();
          this.initializeGestureControl();
        });
    }
  
    waitForYouTubePlayer() {
      return new Promise(resolve => {
        const checkPlayer = setInterval(() => {
          if (document.querySelector('#movie_player')) {
            clearInterval(checkPlayer);
            resolve();
          }
        }, 100);
      });
    }
  
    setupEnhancements() {
      this.createCustomControls();
      this.setupAdvancedFeatures();
      this.registerKeyboardShortcuts();
      this.initializeAnalytics();
    }
  
    createCustomControls() {
      this.controlsContainer = document.createElement('div');
      this.controlsContainer.className = 'enhanced-player-controls';
      
      const controls = [
        this.createSpeedControl(),
        this.createQualityControl(),
        this.createLoopControl(),
        this.createMarkerControl(),
        this.createScreenshotButton(),
        this.createCinemaModeToggle(),
        this.createAdvancedSettingsButton()
      ];
  
      controls.forEach(control => this.controlsContainer.appendChild(control));
      this.player.appendChild(this.controlsContainer);
    }
  
    createSpeedControl() {
      const container = document.createElement('div');
      container.className = 'speed-control';
      
      const speedButton = document.createElement('button');
      speedButton.className = 'speed-button';
      speedButton.innerHTML = `${this.settings.playbackSpeed}x`;
  
      const speedMenu = document.createElement('div');
      speedMenu.className = 'speed-menu';
      
      const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
      speeds.forEach(speed => {
        const option = document.createElement('div');
        option.className = 'speed-option';
        option.textContent = `${speed}x`;
        option.addEventListener('click', () => this.setPlaybackSpeed(speed));
        speedMenu.appendChild(option);
      });
  
      // Custom speed input
      const customSpeed = document.createElement('input');
      customSpeed.type = 'number';
      customSpeed.min = '0.1';
      customSpeed.max = '5';
      customSpeed.step = '0.1';
      customSpeed.addEventListener('change', (e) => {
        this.setPlaybackSpeed(parseFloat(e.target.value));
      });
      
      speedMenu.appendChild(customSpeed);
      container.appendChild(speedButton);
      container.appendChild(speedMenu);
      
      return container;
    }
  
    createQualityControl() {
      const container = document.createElement('div');
      container.className = 'quality-control';
      
      const qualityButton = document.createElement('button');
      qualityButton.className = 'quality-button';
      qualityButton.innerHTML = 'Auto';
  
      const qualityMenu = document.createElement('div');
      qualityMenu.className = 'quality-menu';
      
      // Quality options will be populated dynamically
      this.updateAvailableQualities().then(qualities => {
        qualities.forEach(quality => {
          const option = document.createElement('div');
          option.className = 'quality-option';
          option.textContent = quality.label;
          option.addEventListener('click', () => this.setVideoQuality(quality.value));
          qualityMenu.appendChild(option);
        });
      });
  
      container.appendChild(qualityButton);
      container.appendChild(qualityMenu);
      
      return container;
    }
  
    createLoopControl() {
      const container = document.createElement('div');
      container.className = 'loop-control';
      
      const loopButton = document.createElement('button');
      loopButton.className = 'loop-button';
      loopButton.innerHTML = '🔁';
      
      const loopMenu = document.createElement('div');
      loopMenu.className = 'loop-menu';
      
      // Loop section selector
      const startInput = document.createElement('input');
      startInput.type = 'text';
      startInput.placeholder = 'Start time (0:00)';
      
      const endInput = document.createElement('input');
      endInput.type = 'text';
      endInput.placeholder = 'End time (0:00)';
      
      const setLoopButton = document.createElement('button');
      setLoopButton.textContent = 'Set Loop';
      setLoopButton.addEventListener('click', () => {
        this.setLoopSection(this.parseTime(startInput.value), this.parseTime(endInput.value));
      });
      
      loopMenu.appendChild(startInput);
      loopMenu.appendChild(endInput);
      loopMenu.appendChild(setLoopButton);
      
      container.appendChild(loopButton);
      container.appendChild(loopMenu);
      
      return container;
    }
  
    createMarkerControl() {
      const container = document.createElement('div');
      container.className = 'marker-control';
      
      const markerButton = document.createElement('button');
      markerButton.className = 'marker-button';
      markerButton.innerHTML = '📍';
      
      markerButton.addEventListener('click', () => {
        this.addMarker(this.player.getCurrentTime());
      });
      
      const markerList = document.createElement('div');
      markerList.className = 'marker-list';
      
      container.appendChild(markerButton);
      container.appendChild(markerList);
      
      return container;
    }
  
    createScreenshotButton() {
      const button = document.createElement('button');
      button.className = 'screenshot-button';
      button.innerHTML = '📸';
      button.addEventListener('click', () => this.takeScreenshot());
      return button;
    }
  
    createCinemaModeToggle() {
      const button = document.createElement('button');
      button.className = 'cinema-mode-button';
      button.innerHTML = '🎦';
      button.addEventListener('click', () => this.toggleCinemaMode());
      return button;
    }
  
    createAdvancedSettingsButton() {
      const container = document.createElement('div');
      container.className = 'advanced-settings';
      
      const button = document.createElement('button');
      button.className = 'settings-button';
      button.innerHTML = '⚙️';
      
      const menu = this.createAdvancedSettingsMenu();
      
      container.appendChild(button);
      container.appendChild(menu);
      
      return container;
    }
  
    createAdvancedSettingsMenu() {
      const menu = document.createElement('div');
      menu.className = 'advanced-settings-menu';
      
      // Subtitle settings
      const subtitleSection = this.createSettingSection('Subtitles', [
        {
          type: 'checkbox',
          label: 'Enable Subtitles',
          value: this.settings.subtitleSettings.enabled,
          onChange: (value) => this.updateSubtitleSetting('enabled', value)
        },
        {
          type: 'range',
          label: 'Font Size',
          min: 12,
          max: 32,
          value: this.settings.subtitleSettings.fontSize,
          onChange: (value) => this.updateSubtitleSetting('fontSize', value)
        },
        {
          type: 'color',
          label: 'Text Color',
          value: this.settings.subtitleSettings.color,
          onChange: (value) => this.updateSubtitleSetting('color', value)
        }
      ]);
      
      // Video settings
      const videoSection = this.createSettingSection('Video', [
        {
          type: 'checkbox',
          label: 'Auto Quality',
          value: this.settings.autoQuality,
          onChange: (value) => this.updateVideoSetting('autoQuality', value)
        },
        {
          type: 'checkbox',
          label: 'Annotations',
          value: this.settings.annotations,
          onChange: (value) => this.updateVideoSetting('annotations', value)
        }
      ]);
      
      menu.appendChild(subtitleSection);
      menu.appendChild(videoSection);
      
      return menu;
    }
  
    createSettingSection(title, settings) {
      const section = document.createElement('div');
      section.className = 'settings-section';
      
      const heading = document.createElement('h3');
      heading.textContent = title;
      section.appendChild(heading);
      
      settings.forEach(setting => {
        const container = document.createElement('div');
        container.className = 'setting-item';
        
        const label = document.createElement('label');
        label.textContent = setting.label;
        
        const input = document.createElement('input');
        input.type = setting.type;
        
        if (setting.type === 'range') {
          input.min = setting.min;
          input.max = setting.max;
        }
        
        input.value = setting.value;
        input.addEventListener('change', (e) => {
          const value = setting.type === 'checkbox' ? e.target.checked : e.target.value;
          setting.onChange(value);
        });
        
        container.appendChild(label);
        container.appendChild(input);
        section.appendChild(container);
      });
      
      return section;
    }
  
    initializeGestureControl() {
      this.gestureController = new PlayerGestureController(this);
    }
  
    // Player control methods
    setPlaybackSpeed(speed) {
      if (speed >= 0.1 && speed <= 5) {
        this.settings.playbackSpeed = speed;
        this.player.setPlaybackRate(speed);
        this.saveUserSettings();
        this.updateSpeedDisplay();
      }
    }
  
    async setVideoQuality(quality) {
      try {
        await this.player.setPlaybackQuality(quality);
        this.settings.autoQuality = false;
        this.saveUserSettings();
        this.updateQualityDisplay();
      } catch (error) {
        console.error('Failed to set video quality:', error);
      }
    }
  
    setLoopSection(start, end) {
      if (start >= 0 && end > start) {
        this.settings.loopEnabled = true;
        this.settings.loopStart = start;
        this.settings.loopEnd = end;
        
        // Monitor playback position
        this.startLoopMonitoring();
      }
    }
  
    startLoopMonitoring() {
      if (this.loopInterval) clearInterval(this.loopInterval);
      
      this.loopInterval = setInterval(() => {
        if (this.settings.loopEnabled) {
          const currentTime = this.player.getCurrentTime();
          if (currentTime >= this.settings.loopEnd) {
            this.player.seekTo(this.settings.loopStart);
          }
        }
      }, 100);
    }
  
    addMarker(time) {
      const marker = {
        id: Date.now(),
        time,
        label: `Marker ${this.markers.size + 1}`
      };
      
      this.markers.set(marker.id, marker);
      this.updateMarkerDisplay();
      this.saveUserSettings();
    }
  
    async takeScreenshot() {
      try {
        // Create canvas and draw current frame
        const canvas = document.createElement('canvas');
        const video = this.player.querySelector('video');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to blob and download
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `youtube-screenshot-${Date.now()}.png`;
        link.click();
        
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to take screenshot:', error);
      }
    }
  
    toggleCinemaMode() {
      this.settings.cinemaMode = !this.settings.cinemaMode;
      document.body.classList.toggle('cinema-mode', this.settings.cinemaMode);
      this.saveUserSettings();
    }
  
    // Settings management
    updateSubtitleSetting(key, value) {
      this.settings.subtitleSettings[key] = value;
      this.applySubtitleSettings();
      this.saveUserSettings();
    }
  
    updateVideoSetting(key, value) {
      this.settings[key] = value;
      this.applyVideoSettings();
      this.saveUserSettings();
    }
  
    applySubtitleSettings() {
      const subtitles = this.player.querySelector('.ytp-subtitles-player-content');
      if (subtitles) {
        subtitles.style.fontSize = `${this.settings.subtitleSettings.fontSize}px`;
        subtitles.style.color = this.settings.subtitleSettings.color;
        subtitles.style.opacity = this.settings.subtitleSettings.opacity;
      }
    }
  
    applyVideoSettings() {
      if (this.settings.autoQuality) {
        this.player.setPlaybackQuality('auto');
      }
      
      const annotations = this.player.querySelector('.ytp-iv-player-content');
      if (annotations) {
        annotations.style.display = this.settings.annotations ? 'block' : 'none';
      }
    }
  
    // Utilities
    parseTime(timeString) {
      const parts = timeString.split(':').map(Number);
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return 0;
    }
  
    formatTime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
  
    // Settings storage
    saveUserSettings() {
      chrome.storage.local.set({
        playerSettings: this.settings,
        markers: Array.from(this.markers.entries())
      });
    }
  
    async loadUserSettings() {
        try {
          const { playerSettings, markers } = await chrome.storage.local.get([
            'playerSettings',
            'markers'
          ]);
          
          if (playerSettings) {
            this.settings = { ...this.settings, ...playerSettings };
          }
          
          if (markers) {
            this.markers = new Map(markers);
          }
          
          this.applySettings();
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
    
      applySettings() {
        this.setPlaybackSpeed(this.settings.playbackSpeed);
        this.applySubtitleSettings();
        this.applyVideoSettings();
        this.updateMarkerDisplay();
        
        if (this.settings.cinemaMode) {
          this.toggleCinemaMode();
        }
      }
    
      // Analytics and stats tracking
      initializeAnalytics() {
        this.analytics = {
          watchTime: 0,
          pauseCount: 0,
          speedChanges: 0,
          qualityChanges: 0,
          startTime: Date.now()
        };
    
        this.startAnalyticsTracking();
      }
    
      startAnalyticsTracking() {
        setInterval(() => {
          if (!this.player.paused) {
            this.analytics.watchTime += 1;
          }
        }, 1000);
    
        // Track player events
        this.player.addEventListener('pause', () => {
          this.analytics.pauseCount++;
        });
    
        // Save analytics periodically
        setInterval(() => {
          this.saveAnalytics();
        }, 60000); // Every minute
      }
    
      saveAnalytics() {
        chrome.storage.local.set({
          playerAnalytics: this.analytics
        });
      }
    
      // Gesture Controller Class
      class PlayerGestureController {
        constructor(player) {
          this.player = player;
          this.touching = false;
          this.startX = 0;
          this.startY = 0;
          this.startVolume = 0;
          this.startTime = 0;
          
          this.init();
        }
    
        init() {
          this.addTouchListeners();
          this.addMouseListeners();
          this.addWheelListener();
        }
    
        addTouchListeners() {
          const playerElement = this.player.player;
          
          playerElement.addEventListener('touchstart', (e) => {
            this.touching = true;
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
            this.startVolume = this.player.player.getVolume();
            this.startTime = this.player.player.getCurrentTime();
          });
    
          playerElement.addEventListener('touchmove', (e) => {
            if (!this.touching) return;
            
            const deltaX = e.touches[0].clientX - this.startX;
            const deltaY = e.touches[0].clientY - this.startY;
            
            // Horizontal gesture for seeking
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              const seekTime = this.startTime + (deltaX / 5);
              this.player.player.seekTo(seekTime);
            }
            // Vertical gesture for volume
            else {
              const newVolume = this.startVolume - (deltaY / 2);
              this.player.player.setVolume(Math.max(0, Math.min(100, newVolume)));
            }
          });
    
          playerElement.addEventListener('touchend', () => {
            this.touching = false;
          });
        }
    
        addMouseListeners() {
          let seeking = false;
          const playerElement = this.player.player;
          
          playerElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
              seeking = true;
              this.startX = e.clientX;
              this.startTime = this.player.player.getCurrentTime();
            }
          });
    
          playerElement.addEventListener('mousemove', (e) => {
            if (!seeking) return;
            
            const deltaX = e.clientX - this.startX;
            const seekTime = this.startTime + (deltaX / 5);
            this.player.player.seekTo(seekTime);
          });
    
          playerElement.addEventListener('mouseup', () => {
            seeking = false;
          });
        }
    
        addWheelListener() {
          this.player.player.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Ctrl + wheel for speed adjustment
            if (e.ctrlKey) {
              const currentSpeed = this.player.settings.playbackSpeed;
              const newSpeed = e.deltaY < 0 ? 
                Math.min(currentSpeed + 0.25, 5) : 
                Math.max(currentSpeed - 0.25, 0.25);
              this.player.setPlaybackSpeed(newSpeed);
            }
            // Regular wheel for volume
            else {
              const currentVolume = this.player.player.getVolume();
              const newVolume = e.deltaY < 0 ?
                Math.min(currentVolume + 5, 100) :
                Math.max(currentVolume - 5, 0);
              this.player.player.setVolume(newVolume);
            }
          });
        }
      }
    }
    
    export default EnhancedVideoPlayer;