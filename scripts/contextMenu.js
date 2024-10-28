// contextMenu.js
class ContextMenuSystem {
    constructor() {
      this.menuElement = null;
      this.activeTarget = null;
      this.menuItems = new Map();
      this.init();
    }
  
    init() {
      this.createMenuElement();
      this.registerDefaultMenuItems();
      this.attachEventListeners();
    }
  
    createMenuElement() {
      this.menuElement = document.createElement('div');
      this.menuElement.className = 'custom-context-menu';
      document.body.appendChild(this.menuElement);
    }
  
    registerDefaultMenuItems() {
      // Video item context menu
      this.registerMenuItem('video', 'Add to Watch Later', (target) => {
        const videoId = target.dataset.videoId;
        this.addToWatchLater(videoId);
      });
  
      this.registerMenuItem('video', 'Add to Playlist', (target) => {
        const videoId = target.dataset.videoId;
        this.showPlaylistSelector(videoId);
      });
  
      this.registerMenuItem('video', 'Share', (target) => {
        const videoId = target.dataset.videoId;
        this.showShareOptions(videoId);
      });
  
      this.registerMenuItem('video', 'Open in New Tab', (target) => {
        const videoId = target.dataset.videoId;
        window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
      });
  
      // Watch Later context menu
      this.registerMenuItem('watchLater', 'Remove', (target) => {
        const videoId = target.dataset.videoId;
        this.removeFromWatchLater(videoId);
      });
  
      this.registerMenuItem('watchLater', 'Move Up', (target) => {
        this.moveItemUp(target);
      });
  
      this.registerMenuItem('watchLater', 'Move Down', (target) => {
        this.moveItemDown(target);
      });
  
      this.registerMenuItem('watchLater', 'Clear All', () => {
        this.clearWatchLater();
      });
  
      // Playlist context menu
      this.registerMenuItem('playlist', 'Rename', (target) => {
        const playlistId = target.dataset.playlistId;
        this.showPlaylistRename(playlistId);
      });
  
      this.registerMenuItem('playlist', 'Delete', (target) => {
        const playlistId = target.dataset.playlistId;
        this.deletePlaylist(playlistId);
      });
  
      // Panel context menu
      this.registerMenuItem('panel', 'Maximize', (target) => {
        this.maximizePanel(target);
      });
  
      this.registerMenuItem('panel', 'Reset Size', (target) => {
        this.resetPanelSize(target);
      });
  
      this.registerMenuItem('panel', 'Settings', (target) => {
        this.showPanelSettings(target);
      });
    }
  
    registerMenuItem(context, label, handler) {
      if (!this.menuItems.has(context)) {
        this.menuItems.set(context, []);
      }
      this.menuItems.get(context).push({ label, handler });
    }
  
    attachEventListeners() {
      document.addEventListener('contextmenu', (e) => {
        const context = this.getElementContext(e.target);
        if (context) {
          e.preventDefault();
          this.showMenu(e, context);
        }
      });
  
      document.addEventListener('click', () => {
        this.hideMenu();
      });
  
      document.addEventListener('scroll', () => {
        this.hideMenu();
      });
  
      // Prevent menu from going off-screen
      window.addEventListener('resize', () => {
        if (this.menuElement.style.display === 'block') {
          this.adjustMenuPosition();
        }
      });
    }
  
    getElementContext(element) {
      if (element.closest('.video-item')) return 'video';
      if (element.closest('.watch-later-item')) return 'watchLater';
      if (element.closest('.playlist-item')) return 'playlist';
      if (element.closest('.panel')) return 'panel';
      return null;
    }
  
    showMenu(event, context) {
      this.activeTarget = event.target;
      this.menuElement.innerHTML = '';
      
      const items = this.menuItems.get(context) || [];
      items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          item.handler(this.activeTarget);
          this.hideMenu();
        });
        this.menuElement.appendChild(menuItem);
      });
  
      this.menuElement.style.display = 'block';
      this.positionMenu(event);
    }
  
    positionMenu(event) {
      const { clientX: mouseX, clientY: mouseY } = event;
      const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
      const { offsetWidth: menuWidth, offsetHeight: menuHeight } = this.menuElement;
  
      let x = mouseX;
      let y = mouseY;
  
      if (mouseX + menuWidth > windowWidth) {
        x = mouseX - menuWidth;
      }
  
      if (mouseY + menuHeight > windowHeight) {
        y = mouseY - menuHeight;
      }
  
      this.menuElement.style.transform = `translate(${x}px, ${y}px)`;
    }
  
    hideMenu() {
      this.menuElement.style.display = 'none';
      this.activeTarget = null;
    }
  
    // Menu item handlers
    async addToWatchLater(videoId) {
      try {
        await this.dispatchEvent('addToWatchLater', { videoId });
        this.showToast('Added to Watch Later');
      } catch (error) {
        this.showToast('Failed to add to Watch Later', 'error');
      }
    }
  
    async showPlaylistSelector(videoId) {
      const modal = new Modal({
        title: 'Add to Playlist',
        content: await this.createPlaylistSelector(videoId),
        onClose: () => {
          this.hideMenu();
        }
      });
      modal.show();
    }
  
    async createPlaylistSelector(videoId) {
      const playlists = await this.fetchPlaylists();
      const container = document.createElement('div');
      container.className = 'playlist-selector';
  
      playlists.forEach(playlist => {
        const item = document.createElement('div');
        item.className = 'playlist-option';
        item.textContent = playlist.title;
        item.addEventListener('click', () => {
          this.addToPlaylist(videoId, playlist.id);
        });
        container.appendChild(item);
      });
  
      return container;
    }
  
    showShareOptions(videoId) {
      const shareUrl = `https://youtube.com/watch?v=${videoId}`;
      const modal = new Modal({
        title: 'Share Video',
        content: this.createShareOptions(shareUrl),
        onClose: () => {
          this.hideMenu();
        }
      });
      modal.show();
    }
  
    createShareOptions(url) {
      const container = document.createElement('div');
      container.className = 'share-options';
  
      const platforms = [
        { name: 'Copy Link', icon: '🔗', action: () => this.copyToClipboard(url) },
        { name: 'Twitter', icon: '🐦', action: () => this.shareToTwitter(url) },
        { name: 'Facebook', icon: '👥', action: () => this.shareToFacebook(url) },
        { name: 'Email', icon: '📧', action: () => this.shareViaEmail(url) }
      ];
  
      platforms.forEach(platform => {
        const button = document.createElement('button');
        button.className = 'share-button';
        button.innerHTML = `${platform.icon} ${platform.name}`;
        button.addEventListener('click', platform.action);
        container.appendChild(button);
      });
  
      return container;
    }
  
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.showToast('Link copied to clipboard');
      } catch (error) {
        this.showToast('Failed to copy link', 'error');
      }
    }
  
    showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
  
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  
    // Event dispatch helper
    dispatchEvent(name, detail) {
      const event = new CustomEvent(name, { detail });
      document.dispatchEvent(event);
    }
  }
  
  export default ContextMenuSystem;