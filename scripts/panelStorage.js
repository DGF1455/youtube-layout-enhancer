// panelStorage.js
class PanelSizeManager {
    constructor() {
      this.defaultSizes = {
        'main-player': { width: '640px', height: '480px' },
        'watch-later': { width: '640px', height: '400px' },
        'search-results': { width: '400px', height: '480px' },
        'folders': { width: '400px', height: '400px' }
      };
    }
  
    savePanelSizes() {
      const panels = document.querySelectorAll('.panel');
      const sizes = {};
      
      panels.forEach(panel => {
        const className = Array.from(panel.classList)
          .find(cls => cls !== 'panel');
        
        sizes[className] = {
          width: panel.style.width,
          height: panel.style.height
        };
      });
  
      chrome.storage.local.set({ panelSizes: sizes });
    }
  
    async loadPanelSizes() {
      try {
        const { panelSizes } = await chrome.storage.local.get('panelSizes');
        const panels = document.querySelectorAll('.panel');
        
        panels.forEach(panel => {
          const className = Array.from(panel.classList)
            .find(cls => cls !== 'panel');
          
          const sizes = panelSizes?.[className] || this.defaultSizes[className];
          
          if (sizes) {
            panel.style.width = sizes.width;
            panel.style.height = sizes.height;
          }
        });
      } catch (error) {
        console.error('Error loading panel sizes:', error);
      }
    }
  
    initializeResizeObserver() {
      const resizeObserver = new ResizeObserver(this.debouncedSave.bind(this));
      document.querySelectorAll('.panel').forEach(panel => {
        resizeObserver.observe(panel);
      });
    }
  
    debouncedSave = debounce(() => this.savePanelSizes(), 500);
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  export default PanelSizeManager;