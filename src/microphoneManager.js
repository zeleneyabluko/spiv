/**
 * Microphone Manager - Handles microphone permissions and overlay display
 */

class MicrophoneManager {
  constructor() {
    this.micAccessGranted = false;
    this.micStream = null;
    this.overlay = null;
  }

  /**
   * Initialize microphone access for the given OSMD instance
   * @param {Object} osmd - OSMD instance
   * @param {HTMLElement} panel - Panel element to attach overlay to
   */
  initialize(osmd, panel) {
    if (!panel) {
      console.error('Panel element is required for microphone initialization');
      return;
    }

    // Check if microphone access is already granted (either from current session or previous sessions)
    if (this.micAccessGranted) {
      // Microphone access already granted in current session, enable playback controls directly
      console.log('Microphone access already granted in current session');
      this.enablePlaybackControls(osmd);
      return;
    }

    // Check if permission was granted in a previous session using the Permissions API
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((permissionStatus) => {
          console.log('Current microphone permission state:', permissionStatus.state);
          
          if (permissionStatus.state === 'granted') {
            // Permission already granted from previous session, enable playback controls directly
            console.log('Microphone permission already granted from previous session');
            this.micAccessGranted = true;
            this.enablePlaybackControls(osmd);
          } else {
            // Permission not granted, show the overlay
            console.log('Microphone permission not granted, showing overlay');
            this.showOverlay(panel, osmd);
          }
        })
        .catch(() => {
          // Permissions API not supported, show the overlay
          console.log('Permissions API not supported, showing overlay');
          this.showOverlay(panel, osmd);
        });
    } else {
      // Permissions API not supported, show the overlay
      console.log('Permissions API not supported, showing overlay');
      this.showOverlay(panel, osmd);
    }
  }

  /**
   * Show the microphone permission overlay
   * @param {HTMLElement} panel - Panel element to attach overlay to
   * @param {Object} osmd - OSMD instance
   */
  showOverlay(panel, osmd) {
    // Ensure parent is positioned
    panel.style.position = 'relative';
    panel.style.minHeight = '60px';

    // Remove any existing overlay
    this.removeOverlay();

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = 0;
    this.overlay.style.left = 0;
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.background = 'rgba(255,0,0,0.3)'; // RED for debugging
    this.overlay.style.zIndex = 1000;
    this.overlay.style.cursor = 'pointer';
    this.overlay.id = 'mic-overlay';
    this.overlay.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:1.2em;text-align:center;">Click to enable microphone for playback</div>';

    panel.appendChild(this.overlay);

    // Add click event listener to request microphone permission
    this.overlay.addEventListener('click', (e) => this.handleOverlayClick(e, osmd));
    
    // Add additional event listeners to ensure clicks are captured
    this.overlay.addEventListener('mousedown', () => console.log('Overlay mousedown!'));
    this.overlay.addEventListener('mouseup', () => console.log('Overlay mouseup!'));
    this.overlay.addEventListener('touchstart', () => console.log('Overlay touchstart!'));
  }

  /**
   * Handle overlay click to request microphone permission
   * @param {Event} e - Click event
   * @param {Object} osmd - OSMD instance
   */
  handleOverlayClick(e, osmd) {
    console.log('Overlay clicked!');
    e.stopPropagation();
    e.preventDefault();
    
    // First, check the current permission state
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((permissionStatus) => {
          console.log('Current microphone permission state:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            // Permission was previously denied, show instructions
            alert('Microphone access was previously denied. Please click the microphone icon in your browser\'s address bar and allow microphone access, then try again.');
            return;
          }
          
          // Try to request microphone access
          console.log('About to request microphone access...');
          return navigator.mediaDevices.getUserMedia({ audio: true });
        })
        .then((stream) => {
          if (!stream) return; // Permission was denied
          
          console.log('Microphone access granted!', stream);
          this.onMicrophoneGranted(stream, osmd);
        })
        .catch((err) => {
          console.error('Microphone access error:', err);
          if (err.name === 'NotAllowedError') {
            alert('Microphone access denied. Please allow microphone access in your browser settings and try again.');
          } else {
            alert('Error accessing microphone: ' + err.message);
          }
        });
    } else {
      // Permissions API not supported, try direct getUserMedia
      console.log('About to request microphone access...');
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log('Microphone access granted!', stream);
          this.onMicrophoneGranted(stream, osmd);
        })
        .catch((err) => {
          console.error('Microphone access denied:', err);
          alert('Microphone access denied. Playback cannot start.');
        });
    }
  }

  /**
   * Handle successful microphone permission grant
   * @param {MediaStream} stream - Microphone stream
   * @param {Object} osmd - OSMD instance
   */
  onMicrophoneGranted(stream, osmd) {
    this.micAccessGranted = true;
    this.micStream = stream;
    
    // Remove the overlay
    this.removeOverlay();
    
    // Enable playback controls and functionality
    this.enablePlaybackControls(osmd);
    
    // Notify user
    alert('Microphone enabled! Now click Play.');
  }

  /**
   * Enable playback controls for the OSMD instance
   * @param {Object} osmd - OSMD instance
   */
  enablePlaybackControls(osmd) {
    // Enable playback functionality
    osmd.PlaybackManager.DoPlayback = true;
    
    // Enable control panel buttons
    const controlPanel = document.getElementById('controlPanelContainer');
    if (controlPanel) {
      const buttons = controlPanel.querySelectorAll('button');
      buttons.forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      });
    }
    
    // Enable canvas scrolling
    const canvasWrapper = document.getElementById('canvasWrapper');
    if (canvasWrapper) {
      canvasWrapper.classList.add('scroll-enabled');
    }
  }

  /**
   * Remove the microphone overlay
   */
  removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * Check if microphone access is currently granted
   * @returns {boolean}
   */
  isAccessGranted() {
    return this.micAccessGranted;
  }

  /**
   * Get the current microphone stream
   * @returns {MediaStream|null}
   */
  getStream() {
    return this.micStream;
  }

  /**
   * Clean up microphone resources
   */
  cleanup() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    this.micAccessGranted = false;
    this.removeOverlay();
  }
}

// Export the class
export default MicrophoneManager; 