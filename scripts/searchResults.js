// searchResults.js
class SearchManager {
    constructor(searchPanel) {
      this.searchPanel = searchPanel;
      this.searchInput = this.createSearchInput();
      this.resultsContainer = this.createResultsContainer();
      this.init();
    }
  
    createSearchInput() {
      const searchContainer = document.createElement('div');
      searchContainer.className = 'search-container';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Search YouTube...';
      input.className = 'search-input';
      
      const searchButton = document.createElement('button');
      searchButton.textContent = 'Search';
      searchButton.className = 'search-button';
      
      searchContainer.appendChild(input);
      searchContainer.appendChild(searchButton);
      this.searchPanel.appendChild(searchContainer);
      
      return input;
    }
  
    createResultsContainer() {
      const container = document.createElement('div');
      container.className = 'search-results-container';
      this.searchPanel.appendChild(container);
      return container;
    }
  
    init() {
      this.searchInput.addEventListener('input', debounce(e => {
        this.performSearch(e.target.value);
      }, 300));
  
      this.initializeInfiniteScroll();
    }
  
    async performSearch(query) {
      if (!query) {
        this.resultsContainer.innerHTML = '';
        return;
      }
  
      try {
        const results = await this.fetchSearchResults(query);
        this.displayResults(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  
    async fetchSearchResults(query) {
      // Using YouTube's existing search functionality
      const url = new URL(window.location.href);
      url.searchParams.set('search_query', query);
      
      const response = await fetch(url);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      return Array.from(doc.querySelectorAll('ytd-video-renderer')).map(video => ({
        id: video.getAttribute('video-id'),
        title: video.querySelector('#video-title')?.textContent,
        thumbnail: video.querySelector('img')?.src,
        duration: video.querySelector('.ytd-thumbnail-overlay-time-status-renderer')?.textContent,
        channel: video.querySelector('#channel-name')?.textContent
      }));
    }
  
    displayResults(results) {
      this.resultsContainer.innerHTML = '';
      
      results.forEach(video => {
        const videoElement = this.createVideoElement(video);
        this.resultsContainer.appendChild(videoElement);
      });
    }
  
    createVideoElement(video) {
      const element = document.createElement('div');
      element.className = 'search-result-item';
      element.draggable = true;
      element.dataset.videoId = video.id;
      
      element.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}" class="result-thumbnail">
        <div class="result-info">
          <h3 class="result-title">${video.title}</h3>
          <p class="result-channel">${video.channel}</p>
          <span class="result-duration">${video.duration}</span>
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
  
    initializeInfiniteScroll() {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load more results when near the bottom
            this.loadMoreResults();
          }
        });
      }, { threshold: 0.1 });
  
      const sentinel = document.createElement('div');
      sentinel.className = 'scroll-sentinel';
      this.resultsContainer.appendChild(sentinel);
      observer.observe(sentinel);
    }
  
    async loadMoreResults() {
      // Implement pagination logic here
    }
  }
  
  export default SearchManager;