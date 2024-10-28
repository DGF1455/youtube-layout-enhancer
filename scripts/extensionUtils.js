// scripts/extensionUtils.js
class ExtensionUtils {
  static formatters = {
    /**
     * Format duration from seconds to HH:MM:SS or MM:SS
     */
    formatDuration(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      
      if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      return `${m}:${String(s).padStart(2, '0')}`;
    },

    /**
     * Format number to compact form (e.g., 1.2K, 1.5M)
     */
    formatNumber(num) {
      const formatter = new Intl.NumberFormat('en', { notation: 'compact' });
      return formatter.format(num);
    },

    /**
     * Format date to relative time (e.g., 2 hours ago, 3 days ago)
     */
    formatRelativeTime(date) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days !== 0) return rtf.format(days, 'day');
      if (hours !== 0) return rtf.format(hours, 'hour');
      if (minutes !== 0) return rtf.format(minutes, 'minute');
      return rtf.format(seconds, 'second');
    },

    /**
     * Format filesize (e.g., 1.5 MB, 800 KB)
     */
    formatFileSize(bytes) {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
  };

  static dom = {
    /**
     * Wait for an element to be present in the DOM
     */
    async waitForElement(selector, options = {}) {
      const { timeout = 5000, interval = 100, parent = document } = options;
      
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
          const element = parent.querySelector(selector);
          if (element) {
            resolve(element);
            return;
          }
          
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout waiting for element: ${selector}`));
            return;
          }
          
          setTimeout(check, interval);
        };
        
        check();
      });
    },

    /**
     * Create an element with attributes and properties
     */
    createElement(tag, options = {}) {
      const element = document.createElement(tag);
      
      Object.entries(options).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else if (key === 'children') {
          if (Array.isArray(value)) {
            value.forEach(child => element.appendChild(child));
          } else {
            element.appendChild(value);
          }
        } else if (key === 'text') {
          element.textContent = value;
        } else if (key === 'html') {
          element.innerHTML = value;
        } else if (key.startsWith('on')) {
          element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          element.setAttribute(key, value);
        }
      });
      
      return element;
    },

    /**
     * Insert CSS styles into the document
     */
    injectStyles(styles, id = null) {
      const style = document.createElement('style');
      if (id) style.id = id;
      style.textContent = styles;
      document.head.appendChild(style);
      return style;
    },

    /**
     * Create a draggable element
     */
    makeDraggable(element, options = {}) {
      const {
        handle = element,
        bounds = null,
        onDragStart = null,
        onDrag = null,
        onDragEnd = null
      } = options;

      let isDragging = false;
      let startX, startY, initialX, initialY;

      handle.style.cursor = 'move';

      const start = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        initialX = element.offsetLeft;
        initialY = element.offsetTop;

        if (onDragStart) onDragStart(e);

        document.addEventListener('mousemove', move);
        document.addEventListener('touchmove', move);
        document.addEventListener('mouseup', end);
        document.addEventListener('touchend', end);
      };

      const move = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        let newX = initialX + deltaX;
        let newY = initialY + deltaY;

        if (bounds) {
          newX = Math.max(bounds.left, Math.min(bounds.right - element.offsetWidth, newX));
          newY = Math.max(bounds.top, Math.min(bounds.bottom - element.offsetHeight, newY));
        }

        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;

        if (onDrag) onDrag(e, { x: newX, y: newY });
      };

      const end = (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        if (onDragEnd) onDragEnd(e);

        document.removeEventListener('mousemove', move);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('mouseup', end);
        document.removeEventListener('touchend', end);
      };

      handle.addEventListener('mousedown', start);
      handle.addEventListener('touchstart', start);

      return {
        destroy() {
          handle.removeEventListener('mousedown', start);
          handle.removeEventListener('touchstart', start);
          end();
        }
      };
    }
  };

  static storage = {
    /**
     * Get multiple items from storage with default values
     */
    async getStorageItems(keys, defaults = {}) {
      const result = await chrome.storage.local.get(keys);
      return { ...defaults, ...result };
    },

    /**
     * Set storage items with automatic error handling
     */
    async setStorageItems(items) {
      try {
        await chrome.storage.local.set(items);
        return true;
      } catch (error) {
        console.error('Storage error:', error);
        return false;
      }
    },

    /**
     * Remove multiple items from storage
     */
    async removeStorageItems(keys) {
      try {
        await chrome.storage.local.remove(keys);
        return true;
      } catch (error) {
        console.error('Storage removal error:', error);
        return false;
      }
    },

    /**
     * Watch for storage changes
     */
    watchStorage(keys, callback) {
      const handler = (changes, areaName) => {
        if (areaName !== 'local') return;
        
        const relevantChanges = {};
        let hasRelevantChanges = false;

        for (const [key, change] of Object.entries(changes)) {
          if (keys.includes(key)) {
            relevantChanges[key] = {
              oldValue: change.oldValue,
              newValue: change.newValue
            };
            hasRelevantChanges = true;
          }
        }

        if (hasRelevantChanges) {
          callback(relevantChanges);
        }
      };

      chrome.storage.onChanged.addListener(handler);
      return () => chrome.storage.onChanged.removeListener(handler);
    }
  };

  static async = {
    /**
     * Debounce function
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Retry a function with exponential backoff
     */
    async retry(fn, options = {}) {
      const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        onRetry = null
      } = options;

      let attempt = 1;
      
      while (true) {
        try {
          return await fn();
        } catch (error) {
          if (attempt >= maxAttempts) throw error;
          
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt - 1),
            maxDelay
          );
          
          if (onRetry) {
            onRetry(error, attempt, delay);
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        }
      }
    },

    /**
     * Create a queue for sequential async operations
     */
    createQueue() {
      const queue = [];
      let isProcessing = false;

      const processQueue = async () => {
        if (isProcessing || queue.length === 0) return;
        
        isProcessing = true;
        const { task, resolve, reject } = queue.shift();

        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          isProcessing = false;
          processQueue();
        }
      };

      return {
        add(task) {
          return new Promise((resolve, reject) => {
            queue.push({ task, resolve, reject });
            processQueue();
          });
        },
        clear() {
          queue.length = 0;
        }
      };
    }
  };

  static validation = {
    /**
     * Validate YouTube video ID
     */
    isValidVideoId(id) {
      return /^[a-zA-Z0-9_-]{11}$/.test(id);
    },

    /**
     * Validate YouTube playlist ID
     */
    isValidPlaylistId(id) {
      return /^PL[a-zA-Z0-9_-]+$/.test(id);
    },

    /**
     * Validate YouTube URL
     */
    isYouTubeUrl(url) {
      try {
        const urlObj = new URL(url);
        return ['youtube.com', 'youtu.be'].includes(urlObj.hostname.replace('www.', ''));
      } catch {
        return false;
      }
    },

    /**
     * Validate timestamp format (HH:MM:SS or MM:SS)
     */
    isValidTimestamp(timestamp) {
      return /^(?:(?:\d{1,2}:)?\d{1,2}:)?\d{1,2}$/.test(timestamp);
    }
  };

  static url = {
    /**
     * Extract video ID from various YouTube URL formats
     */
    extractVideoId(url) {
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
          return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
          return urlObj.searchParams.get('v');
        }
      } catch {
        return null;
      }
      return null;
    },

    /**
     * Generate YouTube video URL from ID
     */
    getVideoUrl(videoId, options = {}) {
      const { timestamp, playlist, autoplay } = options;
      const url = new URL(`https://www.youtube.com/watch`);
      url.searchParams.set('v', videoId);
      
      if (timestamp) url.searchParams.set('t', timestamp);
      if (playlist) url.searchParams.set('list', playlist);
      if (autoplay) url.searchParams.set('autoplay', '1');
      
      return url.toString();
    },

    /**
     * Generate thumbnail URL from video ID
     */
    getThumbnailUrl(videoId, quality = 'default') {
      const qualities = {
        default: '',
        medium: 'mq',
        high: 'hq',
        standard: 'sd',
        maxres: 'maxres'
      };
      
      const suffix = qualities[quality] || '';
      return `https://i.ytimg.com/vi/${videoId}/${suffix}default.jpg`;
    },

    /**
     * Parse YouTube timestamps (e.g., 1:30, 1:23:45)
     */
    parseTimestamp(timestamp) {
      const parts = timestamp.split(':').map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
      return parts[0];
    }
  };

  static events = {
    /**
     * Create a custom event dispatcher
     */
    createEventDispatcher() {
      const listeners = new Map();
      
      return {
        on(event, callback) {
          if (!listeners.has(event)) {
            listeners.set(event, new Set());
          }
          listeners.get(event).add(callback);
          return () => this.off(event, callback);
        },
        
        off(event, callback) {
          const eventListeners = listeners.get(event);
          if (eventListeners) {
            eventListeners.delete(callback);
          }
        },
        
        emit(event, data) {
          const eventListeners = listeners.get(event);
          if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
          }
        },

        once(event, callback) {
          const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
          };
          return this.on(event, wrapper);
        },

        clear() {
          listeners.clear();
        }
      };
    },
    /**
     * Create a message handler for communication between extension parts
     */
    createMessageHandler() {
      const handlers = new Map();
      
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const handler = handlers.get(message.type);
        if (handler) {
          Promise.resolve(handler(message, sender))
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
          return true;
        }
      });
      
      return {
        addHandler(type, handler) {
          handlers.set(type, handler);
        },
        
        removeHandler(type) {
          handlers.delete(type);
        },

        send(type, data = {}) {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type, ...data }, response => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(response);
              }
            });
          });
        }
      };
    }
  };

  static ui = {
    /**
     * Create a toast notification
     */
    showToast(message, options = {}) {
      const {
        duration = 3000,
        type = 'info',
        position = 'bottom-right'
      } = options;

      const toast = ExtensionUtils.dom.createElement('div', {
        className: `extension-toast toast-${type} toast-${position}`,
        text: message
      });

      document.body.appendChild(toast);
      
      // Trigger animation
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, duration);

      return toast;
    },

    /**
     * Create a modal dialog
     */
    createModal(options = {}) {
      const {
        title = '',
        content = '',
        buttons = [],
        closeOnOverlayClick = true,
        width = '400px'
      } = options;

      const modal = ExtensionUtils.dom.createElement('div', {
        className: 'extension-modal-overlay',
        html: `
          <div class="extension-modal" style="width: ${width}">
            <div class="extension-modal-header">
              <h2>${title}</h2>
              <button class="extension-modal-close">&times;</button>
            </div>
            <div class="extension-modal-content">
              ${typeof content === 'string' ? content : ''}
            </div>
            <div class="extension-modal-footer">
              ${buttons.map(btn => `
                <button class="extension-modal-button ${btn.class || ''}"
                        data-action="${btn.action}">
                  ${btn.text}
                </button>
              `).join('')}
            </div>
          </div>
        `
      });

      if (typeof content === 'object') {
        modal.querySelector('.extension-modal-content').appendChild(content);
      }

      const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      };

      modal.querySelector('.extension-modal-close').addEventListener('click', closeModal);

      if (closeOnOverlayClick) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
      }

      buttons.forEach(btn => {
        modal.querySelector(`[data-action="${btn.action}"]`).addEventListener('click', (e) => {
          if (btn.handler) {
            btn.handler(e);
          }
          if (btn.closeOnClick !== false) {
            closeModal();
          }
        });
      });

      document.body.appendChild(modal);
      requestAnimationFrame(() => modal.classList.add('show'));

      return {
        close: closeModal,
        element: modal
      };
    },

    /**
     * Create a context menu
     */
    createContextMenu(items, options = {}) {
      const menu = ExtensionUtils.dom.createElement('div', {
        className: 'extension-context-menu',
        style: {
          position: 'fixed',
          zIndex: 9999
        }
      });

      items.forEach(item => {
        if (item.separator) {
          menu.appendChild(ExtensionUtils.dom.createElement('div', {
            className: 'extension-context-menu-separator'
          }));
          return;
        }

        const menuItem = ExtensionUtils.dom.createElement('div', {
          className: 'extension-context-menu-item',
          html: `
            ${item.icon ? `<span class="menu-icon">${item.icon}</span>` : ''}
            <span class="menu-text">${item.text}</span>
            ${item.shortcut ? `<span class="menu-shortcut">${item.shortcut}</span>` : ''}
          `
        });

        if (item.disabled) {
          menuItem.classList.add('disabled');
        } else {
          menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.handler) item.handler(e);
            menu.remove();
          });
        }

        menu.appendChild(menuItem);
      });

      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
          document.removeEventListener('contextmenu', closeMenu);
        }
      };

      document.addEventListener('click', closeMenu);
      document.addEventListener('contextmenu', closeMenu);

      return menu;
    },

    /**
     * Create a tooltip
     */
    createTooltip(element, text, options = {}) {
      const {
        position = 'top',
        delay = 500,
        offset = 8
      } = options;

      let tooltipElement = null;
      let showTimeout = null;

      const showTooltip = () => {
        if (tooltipElement) return;

        tooltipElement = ExtensionUtils.dom.createElement('div', {
          className: `extension-tooltip tooltip-${position}`,
          text: text
        });

        document.body.appendChild(tooltipElement);

        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();

        let top, left;

        switch (position) {
          case 'top':
            top = elementRect.top - tooltipRect.height - offset;
            left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
            break;
          case 'bottom':
            top = elementRect.bottom + offset;
            left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
            break;
          case 'left':
            top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
            left = elementRect.left - tooltipRect.width - offset;
            break;
          case 'right':
            top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
            left = elementRect.right + offset;
            break;
        }

        tooltipElement.style.top = `${top}px`;
        tooltipElement.style.left = `${left}px`;
        requestAnimationFrame(() => tooltipElement.classList.add('show'));
      };

      const hideTooltip = () => {
        if (tooltipElement) {
          tooltipElement.remove();
          tooltipElement = null;
        }
        if (showTimeout) {
          clearTimeout(showTimeout);
          showTimeout = null;
        }
      };

      element.addEventListener('mouseenter', () => {
        showTimeout = setTimeout(showTooltip, delay);
      });

      element.addEventListener('mouseleave', hideTooltip);
      element.addEventListener('click', hideTooltip);

      return {
        destroy() {
          hideTooltip();
          element.removeEventListener('mouseenter', showTooltip);
          element.removeEventListener('mouseleave', hideTooltip);
          element.removeEventListener('click', hideTooltip);
        },
        update(newText) {
          text = newText;
          if (tooltipElement) {
            tooltipElement.textContent = newText;
          }
        }
      };
    }
  };

  static device = {
    /**
     * Check if device is mobile
     */
    isMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Check if device is in dark mode
     */
    isDarkMode() {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    /**
     * Watch for dark mode changes
     */
    watchDarkMode(callback) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addListener(callback);
      return () => media.removeListener(callback);
    },

    /**
     * Get device pixel ratio
     */
    getPixelRatio() {
      return window.devicePixelRatio || 1;
    }
  };
}

// Export the utility class
export default ExtensionUtils;