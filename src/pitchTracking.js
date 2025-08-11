import { PitchDetector } from "pitchy";/**
 * Pitch Tracking Module - Basic implementation
 */

let isTracking = false;
let trackingInterval = null;
let audioContext = null;
let analyser = null;
let microphoneSource = null;

/**
 * Start pitch tracking
 * @param {AudioContext} context - The audio context to use for analysis
 */
export function trackPitch(context) {
  if (isTracking) {
    console.log('Pitch tracking is already running');
    return;
  }

  if (!context) {
    console.error('Audio context is required for pitch tracking');
    return;
  }

  // Check if microphone access is available
  if (!window.microphoneManager || !window.microphoneManager.hasMicrophoneAccess()) {
    console.error('Microphone access not available');
    return;
  }

  console.log('Starting pitch tracking...');
  isTracking = true;
  audioContext = context;
  
  try {
    // Create analyser node
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    
    // Get microphone stream from the microphone manager
    const microphoneStream = window.microphoneManager.getStream();
    if (!microphoneStream) {
      throw new Error('Microphone stream not available');
    }
    
    // Create microphone source from the stream
    microphoneSource = audioContext.createMediaStreamSource(microphoneStream);
    
    // Connect the microphone to the analyser
    microphoneSource.connect(analyser);
    
    console.log('Microphone connected to analyser node');
    
    // Start tracking at 10Hz (every 100ms)
    trackingInterval = window.setInterval(() => {
      console.log('pitch tracking running');
      if (audioContext) {
        console.log('audio context state:', audioContext.state);
      }
      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
     // detector.minVolumeDecibels = -10;
      const input = new Float32Array(detector.inputLength);
      analyser.getFloatTimeDomainData(input);
      const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);
      console.log('pitch:', pitch, 'clarity:', clarity);
      // TODO: Add actual pitch analysis here
    }, 100);
    
    console.log('Pitch tracking started successfully');
    
  } catch (error) {
    console.error('Error starting pitch tracking:', error);
    isTracking = false;
    cleanup();
  }
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
  
  cleanup();
  isTracking = false;
  console.log('Pitch tracking stopped');
}

/**
 * Clean up audio resources
 */
function cleanup() {
  if (microphoneSource) {
    microphoneSource.disconnect();
    microphoneSource = null;
  }
  
  if (analyser) {
    analyser.disconnect();
    analyser = null;
  }
  
  audioContext = null;
}

/**
 * Get current audio analysis data
 * @returns {Object|null} Audio analysis data or null if not tracking
 */
export function getAudioAnalysisData() {
  if (!isTracking || !analyser) {
    return null;
  }

  try {
    // Get frequency data
    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    analyser.getFloatFrequencyData(frequencyData);
    
    // Get time domain data
    const timeData = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(timeData);
    
    return {
      frequencyData,
      timeData,
      sampleRate: audioContext ? audioContext.sampleRate : null,
      bufferLength
    };
  } catch (error) {
    console.error('Error getting audio analysis data:', error);
    return null;
  }
}

/**
 * Check if pitch tracking is currently active
 * @returns {boolean}
 */
export function isPitchTrackingActive() {
  return isTracking;
} 