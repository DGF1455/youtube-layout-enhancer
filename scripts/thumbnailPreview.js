// thumbnailPreview.js
class ThumbnailPreviewSystem {
    constructor() {
      this.previewContainer = this.createPreviewContainer();
      this.currentVideo = null;
      this.previewFrames = new Map();
      this.hoverTimer = null;
      this.frameIndex = 0;
      this.isPlaying = false;
      
      // Configuration
      this.config = {
        frameCount: 6,
        hoverDelay: 500,
        frameInterval: 800,
        previewWidth: 320,
        previewHeight: 180
      };
      
      this.init();
    }
  
    createPreviewContainer() {
      const container = document.createElement('div');
      container.className = 'thumbnail-preview-container';
      container.style.cssText = `
        position: fixed;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        background: black;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      `;
      document.body.appendChild(container);
      return container;
    }
  
    init() {
      this.attachEventListeners();
      this.initializePreviewCanvas();
    }
  
    initializePreviewCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.config.previewWidth;
      this.canvas.height = this.config.previewHeight;
      this.ctx = this.canvas.getContext('2d');
      this.previewContainer.appendChild(this.canvas);
    }
  
    attachEventListeners() {
      document.addEventListener('mouseover', (e) => {
        const videoItem = e.target.closest('.video-item');
        if (videoItem) {
          this.handleVideoHover(videoItem, e);
        }
      }, true);
  
      document.addEventListener('mousemove', (e) => {
        if (this.previewContainer.style.opacity !== '0') {
          this.updatePreviewPosition(e);
        }
      });
  
      document.addEventListener('mouseout', (e) => {
        const videoItem = e.target.closest('.video-item');
        if (videoItem) {
          this.handleVideoUnhover();
        }
      });
    }
  
    handleVideoHover(videoItem, event) {
      clearTimeout(this.hoverTimer);
      
      this.hoverTimer = setTimeout(async () => {
        const videoId = videoItem.dataset.videoId;
        if (videoId !== this.currentVideo) {
          this.currentVideo = videoId;
          await this.loadPreviewFrames(videoId);
          this.showPreview(event);
        }
      }, this.config.hoverDelay);
    }
  
    handleVideoUnhover() {
      clearTimeout(this.hoverTimer);
      this.hidePreview();
      this.currentVideo = null;
      this.isPlaying = false;
    }
  
    async loadPreviewFrames(videoId) {
      if (this.previewFrames.has(videoId)) {
        return;
      }
  
      try {
        const frames = await this.fetchPreviewFrames(videoId);
        this.previewFrames.set(videoId, frames);
        this.startPreviewAnimation();
      } catch (error) {
        console.error('Error loading preview frames:', error);
      }
    }
  
    async fetchPreviewFrames(videoId) {
      // YouTube's storyboard URL pattern
      const storyboardUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      const frames = [];
  
      for (let i = 0; i < this.config.frameCount; i++) {
        const frame = new Image();
        frame.src = storyboardUrl.replace('maxresdefault', `hq${i + 1}`);
        await new Promise((resolve, reject) => {
          frame.onload = resolve;
          frame.onerror = reject;
        });
        frames.push(frame);
      }
  
      return frames;
    }
  
    showPreview(event) {
      this.updatePreviewPosition(event);
      this.previewContainer.style.opacity = '1';
      this.isPlaying = true;
    }
  
    hidePreview() {
      this.previewContainer.style.opacity = '0';
      this.isPlaying = false;
    }
  
    // thumbnailPreview.js (continued)
  updatePreviewPosition(event) {
    const margin = 20;
    const rect = this.previewContainer.getBoundingClientRect();
    
    let x = event.clientX + margin;
    let y = event.clientY + margin;

    // Ensure preview stays within viewport
    if (x + rect.width > window.innerWidth) {
      x = event.clientX - rect.width - margin;
    }
    
    if (y + rect.height > window.innerHeight) {
      y = event.clientY - rect.height - margin;
    }

    this.previewContainer.style.transform = `translate(${x}px, ${y}px)`;
  }

  startPreviewAnimation() {
    if (!this.isPlaying || !this.currentVideo) return;

    const frames = this.previewFrames.get(this.currentVideo);
    if (!frames || !frames.length) return;

    this.frameIndex = (this.frameIndex + 1) % frames.length;
    this.renderFrame(frames[this.frameIndex]);

    setTimeout(() => {
      requestAnimationFrame(() => this.startPreviewAnimation());
    }, this.config.frameInterval);
  }

  renderFrame(frame) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(
      frame,
      0,
      0,
      this.config.previewWidth,
      this.config.previewHeight
    );
  }

  // Advanced preview features
  async generateStoryboard(videoId) {
    const frames = [];
    const timestamps = [];
    const duration = await this.getVideoDuration(videoId);
    const interval = duration / this.config.frameCount;

    for (let i = 0; i < this.config.frameCount; i++) {
      const timestamp = Math.floor(i * interval);
      timestamps.push(timestamp);
      const frame = await this.captureFrameAtTimestamp(videoId, timestamp);
      frames.push(frame);
    }

    return { frames, timestamps };
  }

  async getVideoDuration(videoId) {
    // Use YouTube API to get video duration
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${this.apiKey}`);
      const data = await response.json();
      return this.parseDuration(data.items[0].contentDetails.duration);
    } catch (error) {
      console.error('Error fetching video duration:', error);
      return 0;
    }
  }

  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  async captureFrameAtTimestamp(videoId, timestamp) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = `https://i.ytimg.com/vi/${videoId}/${timestamp}.jpg`;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  // High-quality preview generation
  enhancePreviewQuality() {
    this.canvas.style.imageRendering = 'pixelated';
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  // Preview overlay information
  addPreviewOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.innerHTML = `
      <div class="preview-timestamp"></div>
      <div class="preview-progress"></div>
    `;
    this.previewContainer.appendChild(overlay);
  }

  updatePreviewOverlay(timestamp, duration) {
    const timestampEl = this.previewContainer.querySelector('.preview-timestamp');
    const progressEl = this.previewContainer.querySelector('.preview-progress');
    
    if (timestampEl && progressEl) {
      timestampEl.textContent = this.formatTimestamp(timestamp);
      progressEl.style.width = `${(timestamp / duration) * 100}%`;
    }
  }

  formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Memory management
  clearUnusedPreviews() {
    const maxCachedPreviews = 20;
    if (this.previewFrames.size > maxCachedPreviews) {
      const oldestEntries = Array.from(this.previewFrames.keys())
        .slice(0, this.previewFrames.size - maxCachedPreviews);
      
      oldestEntries.forEach(key => {
        this.previewFrames.delete(key);
      });
    }
  }

  // Performance optimization
  optimizePerformance() {
    // Use RequestAnimationFrame for smooth animations
    let rafId = null;
    const animate = () => {
      if (this.isPlaying) {
        this.renderCurrentFrame();
        rafId = requestAnimationFrame(animate);
      }
    };

    this.startAnimation = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    };

    this.stopAnimation = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }

  // Error handling and recovery
  handlePreviewError(videoId) {
    console.error(`Failed to load preview for video ${videoId}`);
    this.previewContainer.innerHTML = `
      <div class="preview-error">
        <span>Preview not available</span>
      </div>
    `;
    
    // Retry loading after a delay
    setTimeout(() => {
      this.loadPreviewFrames(videoId);
    }, 5000);
  }

  // Clean up resources
  destroy() {
    this.isPlaying = false;
    this.previewFrames.clear();
    this.previewContainer.remove();
    clearTimeout(this.hoverTimer);
  }
}

export default ThumbnailPreviewSystem;