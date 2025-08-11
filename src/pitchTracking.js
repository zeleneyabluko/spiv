/**
 * Pitch Tracking Module - Basic implementation
 */

let isTracking = false;
let trackingInterval = null;

/**
 * Start pitch tracking
 */
export function trackPitch() {
  if (isTracking) {
    console.log('Pitch tracking is already running');
    return;
  }

  console.log('Starting pitch tracking...');
  isTracking = true;
  
  // Log "pitch tracking running" 10 times per second (every 100ms)
  trackingInterval = window.setInterval(() => {
    console.log('pitch tracking running');
  }, 100);
  
  console.log('Pitch tracking started successfully');
}

/**
 * Stop pitch tracking
 */
export function stopPitchTracking() {
  if (!isTracking) {
    console.log('Pitch tracking is not running');
    return;
  }

  console.log('Stopping pitch tracking...');
  
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  isTracking = false;
  console.log('Pitch tracking stopped');
}

/**
 * Check if pitch tracking is currently active
 * @returns {boolean}
 */
export function isPitchTrackingActive() {
  return isTracking;
} 