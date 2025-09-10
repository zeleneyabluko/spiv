import { PitchDetector } from "pitchy";
import { playbackProgressTracker } from './playbackProgress.js';

/**
 * Pitch Tracking Module - Basic implementation
 */

let isTracking = false;
let trackingInterval = null;
let audioContext = null;
let analyser = null;
let microphoneSource = null;

// Canvas drawing variables
let canvas = null;
let ctx = null;
let pitchDataPoints = []; // Array of {x: playbackPosition, y: pitch, clarity: clarity}
let canvasWidth = 0;
let canvasHeight = 0;
let pixelsPerSecond = 100; // How many pixels per second of playback
let pixelsPerHz = 2; // How many pixels per Hz of pitch

/**
 * Initialize canvas for pitch visualization
 */
function initializeCanvas() {
  canvas = document.getElementById('chart');
  if (!canvas) {
    console.error('Canvas element not found');
    return false;
  }
  
  ctx = canvas.getContext('2d');
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  
  // Only clear pitch data if we don't have any (fresh start)
  // Preserve existing data when resuming
  if (pitchDataPoints.length === 0) {
    console.log('No existing pitch data, starting fresh');
  } else {
    console.log('Preserving existing pitch data:', pitchDataPoints.length, 'points');
  }
  
  console.log('Canvas initialized for pitch visualization:', canvasWidth + 'x' + canvasHeight);
  return true;
}

/**
 * Draw the pitch line on canvas
 */
function drawPitchLine() {
  console.log('drawPitchLine called with', pitchDataPoints.length, 'points');
  
  if (!ctx || pitchDataPoints.length < 2) {
    if (pitchDataPoints.length === 1) {
      console.log('Only 1 pitch point, need at least 2 to draw line');
    }
    return;
  }
  
  console.log('Drawing pitch line with', pitchDataPoints.length, 'points');
  
  
  // Set up drawing style
  ctx.strokeStyle = '#00ff00'; // Green line for pitch
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  // Draw the pitch line
  ctx.beginPath();
  
  for (let i = 0; i < pitchDataPoints.length; i++) {
    const point = pitchDataPoints[i];
    
    // Convert playback position (seconds) to X coordinate
    // Use the same calculation as the chart: marginLeft + (timeSec * pxPerSec)
    const marginLeft = window.marginLeft || 50; // Chart's left margin
    const x = marginLeft + (point.x * (window.pxPerSec || 100));
    
    // Convert pitch (Hz) to Y coordinate
    // Use the same pitch range as the chart (80-700 Hz)
    const minPitch = window.minHz || 80;
    const maxPitch = window.maxHz || 700;
    const normalizedPitch = Math.max(0, Math.min(1, (point.y - minPitch) / (maxPitch - minPitch)));
    const y = (window.chartHeight || canvasHeight) - (normalizedPitch * (window.chartHeight || canvasHeight));
    
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  
  // Draw current point
  if (pitchDataPoints.length > 0) {
    const lastPoint = pitchDataPoints[pitchDataPoints.length - 1];
    const marginLeft = window.marginLeft || 50;
    const x = marginLeft + (lastPoint.x * (window.pxPerSec || 100));
    const minPitch = window.minHz || 80;
    const maxPitch = window.maxHz || 700;
    const normalizedPitch = Math.max(0, Math.min(1, (lastPoint.pitch - minPitch) / (maxPitch - minPitch)));
    const y = (window.chartHeight || canvasHeight) - (normalizedPitch * (window.chartHeight || canvasHeight));
    
    ctx.fillStyle = '#ff0000'; // Red dot for current point
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
  
}

/**
 * Add a new pitch data point
 * @param {number} playbackPositionSec - Current playback position in seconds
 * @param {number} pitch - Detected pitch in Hz
 * @param {number} clarity - Pitch clarity (0-1)
 */
function addPitchDataPoint(playbackPositionSec, pitch, clarity) {
  // Only add points with valid pitch data
  if (pitch && pitch > 0 && clarity > 0.99) {
    pitchDataPoints.push({
      x: playbackPositionSec,
      y: pitch,
      clarity: clarity
    });
    
    // Keep only recent data points (last 30 seconds)
    const maxDataPoints = 30 * 10; // 30 seconds * 10 points per second
    if (pitchDataPoints.length > maxDataPoints) {
      pitchDataPoints.shift();
    }
  }
}

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
    // Initialize canvas for visualization
    if (!initializeCanvas()) {
      throw new Error('Failed to initialize canvas');
    }
    
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
    
    // Start tracking at 500Hz (every 2ms)
    trackingInterval = window.setInterval(() => {
      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const input = new Float32Array(detector.inputLength);
      analyser.getFloatTimeDomainData(input);
      const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);
      
      // Get current playback position in seconds
      const playbackPositionSec = playbackProgressTracker.getCurrentPlaybackProgressSeconds();
      
      // Add pitch data point (don't draw immediately - will be drawn by chart update)
      if (playbackPositionSec > 0) {
        console.log('Attempting to add pitch point:', {
          playbackPositionSec: playbackPositionSec,
          pitch: pitch,
          clarity: clarity,
          isValid: pitch && pitch > 0 && clarity > 0.3
        });
        
        addPitchDataPoint(playbackPositionSec, pitch, clarity);
        
        // Log every point for debugging
        console.log('Pitch:', pitch?.toFixed(1) + 'Hz', 'Clarity:', clarity?.toFixed(2), 'Position:', playbackPositionSec.toFixed(2) + 's', 'Total points:', pitchDataPoints.length);
      } else {
        console.log('Playback position is 0, not adding pitch point');
      }
    }, 2);
    
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
 * Clear the pitch line from canvas
 */
function clearPitchLine() {
  if (ctx) {
    // Clear the entire canvas (this will also clear the existing chart)
    // Note: This is a simple approach - in a real app you'd want to redraw the chart
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
  pitchDataPoints = [];
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
  // Don't clear pitch data during pause - only clear canvas
  if (ctx) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }
  // Keep pitchDataPoints for resume
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

/**
 * Get the current pitch data points
 * @returns {Array} Array of pitch data points
 */
export function getPitchData() {
  return [...pitchDataPoints]; // Return a copy
}

/**
 * Clear the pitch visualization
 */
export function clearPitchVisualization() {
  clearPitchLine();
}

/**
 * Set the visualization parameters
 * @param {number} pixelsPerSec - Pixels per second for X-axis
 * @param {number} minPitch - Minimum pitch for Y-axis mapping
 * @param {number} maxPitch - Maximum pitch for Y-axis mapping
 */
export function setVisualizationParams(pixelsPerSec, minPitch = 80, maxPitch = 800) {
  pixelsPerSecond = pixelsPerSec;
  // Update the drawing function to use these parameters
  // For now, we'll use the hardcoded values in drawPitchLine
}

// Make drawPitchLine available globally
if (typeof window !== 'undefined') {
  window.drawPitchLine = drawPitchLine;
} 