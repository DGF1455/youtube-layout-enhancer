// folderManager.js
class FolderManager {
    constructor(folderPanel) {
      this.folderPanel = folderPanel;
      this.currentPath = [];
      this.init();
    }
  
    async init() {
      this.createFolderStructure();
      await this.loadFolders();
      this.initializeDragAndDrop();
    }
  
    createFolderStructure() {
      const structure = document.createElement('div');
      structure.className = 'folder-structure';
      
      const navigation = document.createElement('div');
      navigation.className = 'folder-navigation';
      
      const content = document.createElement('div');
      content.className = 'folder-content';
      
      structure.appendChild(navigation);
      structure.appendChild(content);
      this.folderPanel.appendChild(structure);
      
      this.navigation = navigation;
      this.content = content;
    }
  
    async loadFolders() {
      try {
        // Get playlists and folders from YouTube
        const playlists = await this.fetchYouTubePlaylists();
        this.displayFolders(playlists);
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    }
  
    async fetchYouTubePlaylists() {
      // Using YouTube's existing playlist functionality
      const response = await fetch('/playlist');
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      return Array.from(doc.querySelectorAll('ytd-playlist-renderer')).map(playlist => ({
        id: playlist.getAttribute('playlist-id'),
        title: playlist.querySelector('#video-title')?.textContent,
        count: playlist.querySelector('#video-count')?.textContent,
        thumbnail: playlist.querySelector('img')?.src
      }));
    }
  
    displayFolders(folders) {
      this.content.innerHTML = '';
      
      folders.forEach(folder => {
        const folderElement = this.createFolderElement(folder);
        this.content.appendChild(folderElement);
      });
      
      this.updateNavigation();
    }
  
    createFolderElement(folder) {
      const element = document.createElement('div');
      element.className = 'folder-item';
      element.dataset.folderId = folder.id;
      
      element.innerHTML = `
        <div class="folder-icon">📁</div>
        <div class="folder-info">
          <h3 class="folder-title">${folder.title}</h3>
          <span class="folder-count">${folder.count}</span>
        </div>
      `;
      
      element.addEventListener('click', () => this.openFolder(folder));
      
      return element;
    }
  
    updateNavigation() {
      this.navigation.innerHTML = '';
      
      const breadcrumbs = document.createElement('div');
      breadcrumbs.className = 'breadcrumbs';
      
      this.currentPath.forEach((folder, index) => {
        const crumb = document.createElement('span');
        crumb.className = 'breadcrumb';
        crumb.textContent = folder.title;
        crumb.addEventListener('click', () => this.navigateToPath(index));
        
        breadcrumbs.appendChild(crumb);
        
        if (index < this.currentPath.length - 1) {
          const separator = document.createElement('span');
          separator.className = 'breadcrumb-separator';
          separator.textContent = '>';
          breadcrumbs.appendChild(separator);
        }
      });
      
      this.navigation.appendChild(breadcrumbs);
    }
  
    async openFolder(folder) {
      try {
        const videos = await this.fetchFolderVideos(folder.id);
        this.currentPath.push(folder);
        this.displayVideos(videos);
        this.updateNavigation();
      } catch (error) {
        console.error('Error opening folder:', error);
      }
    }
  
    async fetchFolderVideos(folderId) {
      // Using YouTube's existing playlist video functionality
      const response = await fetch(`/playlist?list=${folderId}`);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      return Array.from(doc.querySelectorAll('ytd-playlist-video-renderer')).map(video => ({
        id: video.getAttribute('video-id'),
        title: video.querySelector('#video-title')?.textContent,
        thumbnail: video.querySelector('img')?.src,
        duration: video.querySelector('.ytd-thumbnail-overlay-time-status-renderer')?.textContent
      }));
    }
  
    displayVideos(videos) {
      this.content.innerHTML = '';
      
      videos.forEach(video => {
        const videoElement = this.createVideoElement(video);
        this.content.appendChild(videoElement);
      });
    }
  
    createVideoElement(video) {
      const element = document.createElement('div');
      element.className = 'folder-video-item';
      element.draggable = true;
      element.dataset.videoId = video.id;
      
      element.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
        <div class="video-info">
          <h3 class="video-title">${video.title}</h3>
          <span class="video-duration">${video.duration}</span>
        </div>
      `;
      
      this.initializeDragEvents(element, video);
      
      return element;
    }
  
    initializeDragEvents(element, video) {
      element.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/json', JSON.stringify(video));
        element.classList.add('dragging');
      });
      
      element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
      });
    }
  
    navigateToPath(index) {
      this.currentPath = this.currentPath.slice(0, index + 1);
      this.loadFolders();
    }
  }
  
  export default FolderManager;