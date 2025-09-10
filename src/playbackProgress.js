/**
 * Playback Progress Tracker
 * Tracks actual playback progress in seconds, excluding metronome count-in time
 */

class PlaybackProgressTracker {
  constructor() {
    this.playbackStartTime = null; // When actual music playback started (after metronome)
    this.metronomeDurationMs = 0; // Duration of metronome count-in in milliseconds
    this.isPlaybackActive = false;
    this.osmd = null;
    this.listener = null;
  }

  /**
   * Initialize the playback progress tracker with OSMD instance
   * @param {Object} osmd - OSMD instance
   */
  initialize(osmd) {
    this.osmd = osmd;
    this.calculateMetronomeDuration();
    this.setupPlaybackListeners();
  }

  /**
   * Calculate the duration of the metronome count-in based on PreCountMeasures and BPM
   */
  calculateMetronomeDuration() {
    if (!this.osmd || !this.osmd.PlaybackManager) {
      console.warn('OSMD not available for metronome duration calculation');
      return;
    }

    const preCountMeasures = this.osmd.PlaybackManager.PreCountMeasures || 2;
    const bpm = this.osmd.PlaybackManager.timingSource.Settings?.tempoInBPM || 120;
    
    // Calculate metronome duration: measures * beats per measure * milliseconds per beat
    const beatsPerMeasure = 4; // Assuming 4/4 time signature
    const millisecondsPerBeat = 60000 / bpm; // 60 seconds / BPM
    this.metronomeDurationMs = preCountMeasures * beatsPerMeasure * millisecondsPerBeat;
    
    console.log('Metronome duration calculated:', {
      preCountMeasures,
      bpm,
      beatsPerMeasure,
      millisecondsPerBeat,
      metronomeDurationMs: this.metronomeDurationMs,
      metronomeDurationSec: this.metronomeDurationMs / 1000
    });
  }

  /**
   * Set up playback event listeners to detect when actual music starts
   * Note: This method is called but doesn't add its own listener to avoid conflicts
   * Instead, it relies on the existing listener in uploadFile.js to call its methods
   */
  setupPlaybackListeners() {
    if (!this.osmd || !this.osmd.PlaybackManager) {
      console.warn('OSMD PlaybackManager not available for listener setup');
      return;
    }

    console.log('Playback progress tracker ready to receive events from existing listener');
  }

  /**
   * Handle when actual music notes start playing (after metronome)
   * @param {Object} event - Playback event
   */
  onNotesPlaybackStarted(event) {
    if (!this.playbackStartTime) {
      // Initial start - set start time
      this.playbackStartTime = performance.now();
      this.isPlaybackActive = true;
      console.log('Actual music playback started at:', this.playbackStartTime);
      console.log('Metronome duration (ms):', this.metronomeDurationMs);
    } else {
      // Resume - just reactivate playback
      this.isPlaybackActive = true;
      console.log('Playback resumed - reactivating progress tracking');
    }
  }

  /**
   * Handle when playback is paused
   * @param {Object} event - Pause event
   */
  onPlaybackPaused(event) {
    this.isPlaybackActive = false;
    console.log('Playback paused');
  }

  /**
   * Handle when playback is stopped
   * @param {Object} event - Stop event
   */
  onPlaybackStopped(event) {
    this.isPlaybackActive = false;
    this.playbackStartTime = null;
    console.log('Playback stopped, progress tracker reset');
  }

  /**
   * Get the current playback progress in seconds (excluding metronome time)
   * @returns {number} Progress in seconds, or 0 if not playing
   */
  getCurrentPlaybackProgressSeconds() {
    if (!this.isPlaybackActive || !this.playbackStartTime) {
      return 0;
    }

    const currentTime = performance.now();
    const elapsedMs = currentTime - this.playbackStartTime;
    const progressSeconds = elapsedMs / 1000;
    
    return Math.max(0, progressSeconds);
  }

  /**
   * Get the current playback progress in milliseconds (excluding metronome time)
   * @returns {number} Progress in milliseconds, or 0 if not playing
   */
  getCurrentPlaybackProgressMs() {
    return this.getCurrentPlaybackProgressSeconds() * 1000;
  }

  /**
   * Get the total song duration in seconds (excluding metronome)
   * @returns {number} Song duration in seconds
   */
  getSongDurationSeconds() {
    if (!this.osmd || !this.osmd.PlaybackManager) {
      return 0;
    }

    const totalDurationMs = this.osmd.PlaybackManager.getSheetDurationInMs();
    const songDurationMs = Math.max(0, totalDurationMs - this.metronomeDurationMs);
    return songDurationMs / 1000;
  }

  /**
   * Get the total song duration in milliseconds (excluding metronome)
   * @returns {number} Song duration in milliseconds
   */
  getSongDurationMs() {
    return this.getSongDurationSeconds() * 1000;
  }

  /**
   * Get playback progress as a percentage (0-100)
   * @returns {number} Progress percentage
   */
  getPlaybackProgressPercentage() {
    const currentProgress = this.getCurrentPlaybackProgressSeconds();
    const totalDuration = this.getSongDurationSeconds();
    
    if (totalDuration <= 0) {
      return 0;
    }
    
    return Math.min(100, (currentProgress / totalDuration) * 100);
  }

  /**
   * Get formatted time string (MM:SS) for current progress
   * @returns {string} Formatted time string
   */
  getFormattedProgressTime() {
    const seconds = Math.floor(this.getCurrentPlaybackProgressSeconds());
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted time string (MM:SS) for total song duration
   * @returns {string} Formatted time string
   */
  getFormattedSongDuration() {
    const seconds = Math.floor(this.getSongDurationSeconds());
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if playback is currently active
   * @returns {boolean} True if playback is active
   */
  isPlaying() {
    return this.isPlaybackActive;
  }

  /**
   * Reset the progress tracker
   */
  reset() {
    this.playbackStartTime = null;
    this.isPlaybackActive = false;
    console.log('Playback progress tracker reset');
  }

  /**
   * Clean up listeners and resources
   */
  cleanup() {
    // No listener to remove since we use the existing listener in uploadFile.js
    console.log('Playback progress tracker cleaned up');
    this.reset();
  }

  /**
   * Get debug information about the current state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      playbackStartTime: this.playbackStartTime,
      metronomeDurationMs: this.metronomeDurationMs,
      isPlaybackActive: this.isPlaybackActive,
      currentProgressSeconds: this.getCurrentPlaybackProgressSeconds(),
      currentProgressMs: this.getCurrentPlaybackProgressMs(),
      songDurationSeconds: this.getSongDurationSeconds(),
      songDurationMs: this.getSongDurationMs(),
      progressPercentage: this.getPlaybackProgressPercentage(),
      formattedProgressTime: this.getFormattedProgressTime(),
      formattedSongDuration: this.getFormattedSongDuration()
    };
  }
}

// Create and export a singleton instance
const playbackProgressTracker = new PlaybackProgressTracker();

// Export both the class and the singleton instance
export { PlaybackProgressTracker, playbackProgressTracker };

// Make the singleton available globally for easy access
if (typeof window !== 'undefined') {
  window.playbackProgressTracker = playbackProgressTracker;
}
