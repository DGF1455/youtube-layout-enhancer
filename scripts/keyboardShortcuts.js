// keyboardShortcuts.js
class KeyboardShortcutManager {
    constructor() {
      this.shortcuts = new Map();
      this.defaultSizes = new Map();
      this.history = {
        back: [],
        forward: []
      };
      this.init();
    }
  
    init() {
      this.registerDefaultShortcuts();
      this.attachEventListeners();
      this.saveDefaultPanelSizes();
    }
  
    registerDefaultShortcuts() {
      // Panel focus shortcuts
      this.register('Alt+1', () => this.focusPanel('main-player'));
      this.register('Alt+2', () => this.focusPanel('watch-later'));
      this.register('Alt+3', () => this.focusPanel('search-results'));
      this.register('Alt+4', () => this.focusPanel('folders'));
  
      // Panel size shortcuts
      this.register('Alt+M', () => this.maximizePanel(document.activeElement.closest('.panel')));
      this.register('Alt+R', () => this.resetPanelSize(document.activeElement.closest('.panel')));
      
      // Navigation shortcuts
      this.register('Alt+ArrowLeft', () => this.navigateBack());
      this.register('Alt+ArrowRight', () => this.navigateForward());
      
      // Watch later shortcuts
      this.register('Alt+S', () => this.addSelectedToWatchLater());
      this.register('Alt+C', () => this.clearWatchLater());
  
      // Layout shortcuts
      this.register('Alt+L', () => this.cycleLayout());
      this.register('Alt+H', () => this.toggleShortcutsHelp());
      
      // Playback shortcuts (when main player is focused)
      this.register('Space', () => this.togglePlayPause());
      this.register('ArrowLeft', () => this.seekBackward());
      this.register('ArrowRight', () => this.seekForward());
      this.register('M', () => this.toggleMute());
    }
  
    register(shortcut, callback) {
      this.shortcuts.set(shortcut, callback);
    }
  
    attachEventListeners() {
      document.addEventListener('keydown', e => {
        const shortcut = this.getShortcutString(e);
        const callback = this.shortcuts.get(shortcut);
        
        if (callback && this.isShortcutAllowed(e)) {
          e.preventDefault();
          callback();
        }
      });
    }
  
    isShortcutAllowed(e) {
      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return false;
      }
      return true;
    }
  
    getShortcutString(e) {
      const parts = [];
      if (e.altKey) parts.push('Alt');
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.key !== 'Alt' && e.key !== 'Control' && e.key !== 'Shift') {
        parts.push(e.key);
      }
      return parts.join('+');
    }
  
    saveDefaultPanelSizes() {
      document.querySelectorAll('.panel').forEach(panel => {
        const styles = window.getComputedStyle(panel);
        this.defaultSizes.set(panel.classList[1], {
          width: styles.width,
          height: styles.height
        });
      });
    }
  
    focusPanel(panelClass) {
      const panel = document.querySelector(`.${panelClass}`);
      if (panel) {
        panel.focus();
        this.addToHistory('focus', panelClass);
      }
    }
  
    maximizePanel(panel) {
      if (!panel) return;
      
      const wasMaximized = panel.classList.contains('maximized');
      
      // Save current size before maximizing
      if (!wasMaximized) {
        panel.dataset.prevWidth = panel.style.width;
        panel.dataset.prevHeight = panel.style.height;
      }
      
      panel.classList.toggle('maximized');
      
      if (wasMaximized) {
        // Restore previous size
        panel.style.width = panel.dataset.prevWidth;
        panel.style.height = panel.dataset.prevHeight;
      } else {
        // Maximize
        panel.style.width = '100%';
        panel.style.height = '100%';
      }
      
      this.addToHistory('maximize', panel.classList[1]);
    }
  
    resetPanelSize(panel) {
      if (!panel) return;
      const defaultSize = this.defaultSizes.get(panel.classList[1]);
      if (defaultSize) {
        panel.style.width = defaultSize.width;
        panel.style.height = defaultSize.height;
        panel.classList.remove('maximized');
        this.addToHistory('reset', panel.classList[1]);
      }
    }
  
    navigateBack() {
      const action = this.history.back.pop();
      if (action) {
        this.history.forward.push(action);
        this.executeHistoryAction(action);
      }
    }
  
    navigateForward() {
      const action = this.history.forward.pop();
      if (action) {
        this.history.back.push(action);
        this.executeHistoryAction(action);
      }
    }
  
    addToHistory(type, target) {
      this.history.back.push({ type, target });
      this.history.forward = []; // Clear forward history
    }
  
    executeHistoryAction(action) {
      switch (action.type) {
        case 'focus':
          this.focusPanel(action.target);
          break;
        case 'maximize':
          this.maximizePanel(document.querySelector(`.${action.target}`));
          break;
        case 'reset':
          this.resetPanelSize(document.querySelector(`.${action.target}`));
          break;
      }
    }
  
    addSelectedToWatchLater() {
      const activePanel = document.activeElement.closest('.panel');
      if (!activePanel) return;
      
      const selectedVideo = activePanel.querySelector('.selected-video');
      if (selectedVideo) {
        const event = new CustomEvent('addToWatchLater', {
          detail: { videoId: selectedVideo.dataset.videoId }
        });
        document.dispatchEvent(event);
      }
    }
  
    clearWatchLater() {
      const event = new CustomEvent('clearWatchLater');
      document.dispatchEvent(event);
    }
  
    cycleLayout() {
      const layouts = ['default', 'wide-player', 'split-view'];
      const container = document.querySelector('.yt-custom-layout');
      
      if (!container) return;
      
      const currentLayout = container.dataset.layout || 'default';
      const currentIndex = layouts.indexOf(currentLayout);
      const nextLayout = layouts[(currentIndex + 1) % layouts.length];
      
      container.dataset.layout = nextLayout;
      this.applyLayout(nextLayout);
    }
  
    applyLayout(layout) {
      const container = document.querySelector('.yt-custom-layout');
      container.className = `yt-custom-layout layout-${layout}`;
    }
  
    toggleShortcutsHelp() {
      let helpDialog = document.querySelector('.shortcuts-help');
      if (!helpDialog) {
        helpDialog = this.createShortcutsHelpDialog();
        document.body.appendChild(helpDialog);
      }
      helpDialog.classList.toggle('visible');
    }
  
    createShortcutsHelpDialog() {
      const dialog = document.createElement('div');
      dialog.className = 'shortcuts-help';
      
      const content = document.createElement('div');
      content.className = 'shortcuts-help-content';
      
      const title = document.createElement('h2');
      title.textContent = 'Keyboard Shortcuts';
      
      const shortcuts = this.createShortcutsList();
      
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.addEventListener('click', () => dialog.classList.remove('visible'));
      
      content.appendChild(title);
      content.appendChild(shortcuts);
      content.appendChild(closeButton);
      dialog.appendChild(content);
      
      return dialog;
    }
  
    createShortcutsList() {
      const list = document.createElement('ul');
      list.className = 'shortcuts-list';
      
      const shortcutGroups = {
        'Panel Navigation': [
          ['Alt + 1', 'Focus main player'],
          ['Alt + 2', 'Focus watch later'],
          ['Alt + 3', 'Focus search results'],
          ['Alt + 4', 'Focus folders']
        ],
        'Panel Management': [
          ['Alt + M', 'Maximize/restore panel'],
          ['Alt + R', 'Reset panel size'],
          ['Alt + L', 'Cycle layout']
        ],
        'Navigation': [
          ['Alt + ←', 'Go back'],
          ['Alt + →', 'Go forward']
        ],
        'Watch Later': [
          ['Alt + S', 'Add selected to watch later'],
          ['Alt + C', 'Clear watch later']
        ],
        'Playback': [
          ['Space', 'Play/Pause'],
          ['←', 'Seek backward'],
          ['→', 'Seek forward'],
          ['M', 'Toggle mute']
        ]
      };
      
      Object.entries(shortcutGroups).forEach(([group, shortcuts]) => {
        const groupEl = document.createElement('li');
        groupEl.className = 'shortcut-group';
        
        const groupTitle = document.createElement('h3');
        groupTitle.textContent = group;
        groupEl.appendChild(groupTitle);
        
        const groupList = document.createElement('ul');
        shortcuts.forEach(([key, description]) => {
          const shortcutEl = document.createElement('li');
          shortcutEl.innerHTML = `<kbd>${key}</kbd> <span>${description}</span>`;
          groupList.appendChild(shortcutEl);
        });
        
        groupEl.appendChild(groupList);
        list.appendChild(groupEl);
      });
      
      return list;
    }
  
    // Playback control methods
    togglePlayPause() {
      const player = document.querySelector('#movie_player');
      if (player && typeof player.playVideo === 'function') {
        if (player.getPlayerState() === 1) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }
    }
  
    seekBackward() {
      const player = document.querySelector('#movie_player');
      if (player && typeof player.seekTo === 'function') {
        const currentTime = player.getCurrentTime();
        player.seekTo(currentTime - 5, true);
      }
    }
  
    seekForward() {
      const player = document.querySelector('#movie_player');
      if (player && typeof player.seekTo === 'function') {
        const currentTime = player.getCurrentTime();
        player.seekTo(currentTime + 5, true);
      }
    }
  
    toggleMute() {
      const player = document.querySelector('#movie_player');
      if (player && typeof player.mute === 'function') {
        if (player.isMuted()) {
          player.unMute();
        } else {
          player.mute();
        }
      }
    }
  }
  
  export default KeyboardShortcutManager;