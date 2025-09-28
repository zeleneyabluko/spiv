import * as OSMD from './libs/opensheetmusicdisplay.min.js';
import './demo.css';
import './annotations-ui.css';
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";
import MicrophoneManager from './microphoneManager.js';
import { playbackProgressTracker } from './playbackProgress.js';

// Create a global microphone manager instance
const microphoneManager = new MicrophoneManager();
console.log('MicrophoneManager instance created:', microphoneManager);

// Expose globally for debugging and access from other modules
window.microphoneManager = microphoneManager;

// Simple and reliable binary-to-base64 converter
function binaryStringToBase64(binaryString) {
  // Convert each character to its byte value and then to base64
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i) & 0xff;
  }
  
  // Convert bytes to binary string safely
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

// Simple and reliable base64-to-binary converter
function base64ToBinaryString(base64String) {
  // Decode base64 to get the binary string
  const binaryString = atob(base64String);
  
  // Return the binary string directly - no additional conversion needed
  return binaryString;
}

// Simplified approach: Store binary string directly as base64
function saveFileAsArrayBuffer(file, fileContent) {
  try {
    // Only support .mxl files for now
    if (!file.name.match('.*\.mxl')) {
      console.log('Skipping non-.mxl file:', file.name);
      return;
    }
    
    console.log('Saving .mxl file to localStorage:', file.name, 'Size:', file.size);
    console.log('Original binary content length:', fileContent.length);
    
    // Remove existing file if it exists
    localStorage.removeItem('spiv_uploaded_file');
    localStorage.removeItem('spiv_uploaded_file_content');
    
    // Save file metadata
    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/vnd.recordare.musicxml',
      lastModified: file.lastModified,
      isMxl: true,
      useArrayBuffer: true
    };
    
    // Convert binary string to base64 using robust method
    const base64Content = binaryStringToBase64(fileContent);
    
    localStorage.setItem('spiv_uploaded_file', JSON.stringify(fileData));
    localStorage.setItem('spiv_uploaded_file_content', base64Content);
    
    console.log('✅ .mxl file saved to localStorage:', file.name);
    console.log('📊 Base64 content length:', base64Content.length);
    console.log('📊 Original binary length:', fileContent.length);
    
    // Debug: Check first few bytes of original data
    console.log('🔍 Original first 20 bytes:', fileContent.substring(0, 20).split('').map(c => c.charCodeAt(0)).join(','));
    
    // Debug: Test round-trip conversion
    const testDecoded = atob(base64Content);
    console.log('🔍 Decoded first 20 bytes:', testDecoded.substring(0, 20).split('').map(c => c.charCodeAt(0)).join(','));
    console.log('🔍 Round-trip match:', fileContent === testDecoded ? 'YES' : 'NO');
    
    // Verify the save worked
    const verifyData = localStorage.getItem('spiv_uploaded_file');
    const verifyContent = localStorage.getItem('spiv_uploaded_file_content');
    console.log('🔍 Verification - Data saved:', verifyData ? 'YES' : 'NO');
    console.log('🔍 Verification - Content saved:', verifyContent ? `YES (${verifyContent.length} chars)` : 'NO');
    
  } catch (error) {
    console.error('❌ Error saving .mxl file to localStorage:', error);
  }
}

// Local storage functions for .mxl binary file management
function saveFileToLocalStorage(file, fileContent) {
  // Use the new ArrayBuffer approach
  saveFileAsArrayBuffer(file, fileContent);
}

function loadFileFromLocalStorage() {
  try {
    const fileDataStr = localStorage.getItem('spiv_uploaded_file');
    const fileContent = localStorage.getItem('spiv_uploaded_file_content');
    
    if (fileDataStr && fileContent) {
      const fileData = JSON.parse(fileDataStr);
      
      // Only load .mxl files
      if (!fileData.isMxl) {
        console.log('Skipping non-.mxl file from localStorage:', fileData.name);
        return null;
      }
      
      console.log('Loading .mxl file from localStorage:', fileData.name);
      
      // Convert base64 back to binary string
      let actualContent;
      try {
        if (fileData.useArrayBuffer) {
          // Decode base64 to binary string using robust method
          actualContent = base64ToBinaryString(fileContent);
          console.log('✅ ArrayBuffer decoded successfully, binary length:', actualContent.length);
          
          // Debug: Check first few bytes of reconstructed data
          console.log('🔍 Reconstructed first 20 bytes:', actualContent.substring(0, 20).split('').map(c => c.charCodeAt(0)).join(','));
        } else {
          // Fallback to old method
          actualContent = base64ToBinaryString(fileContent);
          console.log('✅ Base64 decoded successfully (fallback), binary length:', actualContent.length);
        }
      } catch (base64Error) {
        console.error('❌ Error decoding base64 content:', base64Error);
        return null;
      }
      
      // Create a File object from the stored data
      const blob = new Blob([actualContent], { type: fileData.type || 'application/vnd.recordare.musicxml' });
      const file = new File([blob], fileData.name, {
        type: fileData.type || 'application/vnd.recordare.musicxml',
        lastModified: fileData.lastModified || Date.now()
      });
      
      console.log('✅ .mxl file reconstructed from localStorage:', file.name, 'Size:', file.size);
      return file;
    }
  } catch (error) {
    console.error('❌ Error loading .mxl file from localStorage:', error);
  }
  
  return null;
}

function clearFileFromLocalStorage() {
  try {
    localStorage.removeItem('spiv_uploaded_file');
    localStorage.removeItem('spiv_uploaded_file_content');
    console.log('File cleared from localStorage');
  } catch (error) {
    console.error('Error clearing file from localStorage:', error);
  }
}

// Make localStorage functions globally accessible for debugging
window.saveFileToLocalStorage = saveFileToLocalStorage;
window.clearFileFromLocalStorage = clearFileFromLocalStorage;

// Debug function to inspect localStorage contents
window.debugLocalStorage = function() {
  console.log('🔍 localStorage Debug Info:');
  console.log('Total localStorage items:', localStorage.length);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`Key: ${key}, Value length: ${value ? value.length : 0}`);
    
    if (key === 'spiv_uploaded_file') {
      try {
        const fileData = JSON.parse(value);
        console.log('File data:', fileData);
      } catch (e) {
        console.log('File data (raw):', value);
      }
    }
  }
  
  // Check our specific keys
  const fileData = localStorage.getItem('spiv_uploaded_file');
  const fileContent = localStorage.getItem('spiv_uploaded_file_content');
  
  console.log('spiv_uploaded_file:', fileData ? 'EXISTS' : 'MISSING');
  console.log('spiv_uploaded_file_content:', fileContent ? `EXISTS (${fileContent.length} chars)` : 'MISSING');
  
  if (fileData) {
    try {
      const parsed = JSON.parse(fileData);
      console.log('Parsed file data:', parsed);
    } catch (e) {
      console.log('Could not parse file data:', e);
    }
  }
};

// Test localStorage functionality
function testLocalStorage() {
  try {
    console.log('Testing localStorage...');
    const testKey = 'spiv_test';
    const testValue = 'test_value';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    
    if (retrieved === testValue) {
      console.log('✅ localStorage is working correctly');
      localStorage.removeItem(testKey);
    } else {
      console.error('❌ localStorage test failed - retrieved value does not match');
    }
  } catch (error) {
    console.error('❌ localStorage test failed:', error);
  }
}

// Run localStorage test on load
testLocalStorage();

// Track pause state for canvas updates
let isPaused = false;
let wasPaused = false; // Track if we were previously paused
console.log('MicrophoneManager exposed globally as window.microphoneManager:', window.microphoneManager);


function osmdInitialSetup(osmd) {
  const timingSource = new OSMD.LinearTimingSource();
  const playbackManager = new OSMD.PlaybackManager(timingSource, undefined, new OSMD.BasicAudioPlayer(), undefined);
  const transposeCalculator = new OSMD.TransposeCalculator();
  osmd.FollowCursor = true;
  osmd.PlaybackManager = playbackManager;
  osmd.TransposeCalculator = transposeCalculator;
  osmd.PlaybackManager.DoPlayback = false; // Disable playback initially
  osmd.PlaybackManager.Metronome.Volume = 0.5;
  osmd.PlaybackManager.PreCountMeasures = 2;
  //const audioContext = osmd.PlaybackManager.audioPlayer.ac;
  const linearSourceAudioContext = timingSource.audioContext;
  
  // Make LinearTimingSource audio context available globally for other modules
  window.linearTimingSourceAudioContext = linearSourceAudioContext;
  
  // Monitor audio context state changes for pitch tracking
  let previousAudioContextState = linearSourceAudioContext.state;
  const audioContextStateObserver = setInterval(() => {
    const currentState = linearSourceAudioContext.state;
    if (currentState !== previousAudioContextState) {
      console.log('Audio context state changed from', previousAudioContextState, 'to', currentState);
      
      // Handle pitch tracking based on audio context state
      if (currentState === 'running' && previousAudioContextState !== 'running') {
        // Audio context started running (playback started/resumed) - start pitch tracking
        console.log('Starting pitch tracking due to audio context running (resume detected)');
        startPitchTrackingIfAvailable();
      } else if ((currentState === 'suspended' || currentState === 'closed') && previousAudioContextState === 'running') {
        // Audio context stopped running (playback paused/stopped) - stop pitch tracking
        console.log('Stopping pitch tracking due to audio context state change to', currentState);
        stopPitchTrackingIfActive();
      }
      
      previousAudioContextState = currentState;
    }
  }, 100); // Check every 100ms
  
  // Store observer for cleanup
  window.audioContextStateObserver = audioContextStateObserver;

  //add listeners to playback manager
  let myListener = {
    selectionEndReached: function(o) { 
      console.log('selectionEndReached - Audio context state:', linearSourceAudioContext.state);
      // Reset cursor to beginning when playback ends
      /*if (osmd.cursor) {
        osmd.cursor.reset();
      }*/
      // Manually reset the play/pause button state
      const playPauseButton = document.querySelector('.playpause-button');
      if (playPauseButton && playPauseButton.classList.contains('playing')) {
        playPauseButton.classList.remove('playing');
        // Manually reset play/pause button state
      }
      // Manually reset playback manager to ensure button state is updated
      setTimeout(() => {
        osmd.PlaybackManager.reset();
      }, 100);
      
      // Notify playback progress tracker that playback has stopped
      playbackProgressTracker.onPlaybackStopped(o);
      
      // Redraw the complete pitch line after playback ends
      if (window.redrawCompletePitchLine) {
        console.log('Playback ended - redrawing complete pitch line');
        window.redrawCompletePitchLine();
      }
    },
    resetOccurred: function(o) {
      console.log('resetOccurred - Audio context state:', linearSourceAudioContext.state);
      // Reset cursor to beginning
      if (osmd.cursor) {
        osmd.cursor.reset();
      }
      
      // Enable manual scrolling when stopped
      // enableManualScrolling(); // Removed
    },
    cursorPositionChanged: function(timestamp, data) {
      console.log('cursorPositionChanged - Audio context state:', linearSourceAudioContext.state);
      
      // Detect resume from pause - when we were paused and audio context is running
      if (wasPaused && linearSourceAudioContext.state === 'running') {
        console.log('Resume detected - clearing pause state');
        isPaused = false;
        wasPaused = false;
      }
      
      const iterator = osmd.cursor.Iterator;
      const iteratorCurrentTimeStampInMs = osmd.PlaybackManager.timingSource.getDurationInMs(iterator.currentTimeStamp);
      // Get the audio context from the BasicAudioPlayer
     // const audioContext = osmd.PlaybackManager.audioPlayer.ac;

    // Example usage:
    // console.log('audio context: ', audioContext);
    // console.log('Audio context state:', audioContext.state);

      // Scroll the x axis of the soundFrequencyChart
      const chart = window.soundFrequencyChart;
      if (chart && chart.axisX) {
        const center = iteratorCurrentTimeStampInMs;
        const songLength = osmd.PlaybackManager.getSheetDurationInMs(); // respects each measure's bpm. Assumes playbackmanager.setBpm() was set to the first measure's bpm or the other way round. (you may need to set `sourceMeasure.TempoInBPM`)
        const start = Math.max(0, center - 5000);
        const end = Math.min(center + 5000, songLength);
        chart.axisX.setInterval({ start, end });
      }
      
      // Draw red vertical line on the chart at current playback position
      const canvas = document.getElementById('chart');
      if (canvas && window.updatePlaybackCursor) {
        const songLength = osmd.PlaybackManager.getSheetDurationInMs();
        console.log('Calling updatePlaybackCursor with isPaused:', isPaused, 'audioContext state:', linearSourceAudioContext.state);
        
        // If we're paused, don't update the canvas at all
        if (isPaused) {
          console.log('Skipping canvas update because paused');
          return;
        }
        
        window.updatePlaybackCursor(iteratorCurrentTimeStampInMs, songLength, isPaused);
      }
      
      // Auto-scroll the chart to keep current position in the middle
      scrollChartToPosition(iteratorCurrentTimeStampInMs, osmd.PlaybackManager.getSheetDurationInMs());
      
      // Disable manual scrolling during playback
      // disableManualScrolling(); // Removed
      
      // Log actual playback progress (excluding metronome time)
      const actualProgressSeconds = playbackProgressTracker.getCurrentPlaybackProgressSeconds();
      const actualProgressMs = playbackProgressTracker.getCurrentPlaybackProgressMs();
      const progressPercentage = playbackProgressTracker.getPlaybackProgressPercentage();
      const formattedTime = playbackProgressTracker.getFormattedProgressTime();
      
      if (actualProgressSeconds > 0) {
        console.log('Actual playback progress:', {
          seconds: actualProgressSeconds.toFixed(2),
          milliseconds: actualProgressMs.toFixed(0),
          percentage: progressPercentage.toFixed(1) + '%',
          formattedTime: formattedTime,
          // Compare with OSMD timestamp (includes metronome)
          osmdTimestampMs: iteratorCurrentTimeStampInMs,
          osmdTimestampSec: (iteratorCurrentTimeStampInMs / 1000).toFixed(2)
        });
      }
      
      // Pitch tracking is now handled by the separate pitch-detection.js
    },
    pauseOccurred: function(o) {
      console.log('pauseOccurred - Audio context state:', linearSourceAudioContext.state);
      // Enable manual scrolling when paused
      enableManualScrolling();
      
      // Set pause state
      isPaused = true;
      wasPaused = true; // Mark that we were paused
      console.log('Pause state set to true');
      
      // Manually redraw everything to preserve content during pause
      const canvas = document.getElementById('chart');
      if (canvas && window.updatePlaybackCursor) {
        const iterator = osmd.cursor.Iterator;
        const iteratorCurrentTimeStampInMs = osmd.PlaybackManager.timingSource.getDurationInMs(iterator.currentTimeStamp);
        const songLength = osmd.PlaybackManager.getSheetDurationInMs();
        console.log('Manually redrawing everything during pause');
        
        // Temporarily set isPaused to false to force a full redraw
        const originalPausedState = isPaused;
        isPaused = false;
        window.updatePlaybackCursor(iteratorCurrentTimeStampInMs, songLength, isPaused);
        isPaused = originalPausedState; // Restore original state
        
        // Also update again after a short delay to ensure it sticks
        setTimeout(() => {
          console.log('Delayed full redraw during pause');
          isPaused = false;
          window.updatePlaybackCursor(iteratorCurrentTimeStampInMs, songLength, isPaused);
          isPaused = originalPausedState;
        }, 100);
      }
      
      // Notify playback progress tracker that playback is paused
      playbackProgressTracker.onPlaybackPaused(o);
      
      // Pitch tracking is now handled by the separate pitch-detection.js
    },
    notesPlaybackEventOccurred: function(o) {
      console.log('notesPlaybackEventOccurred - Audio context state:', linearSourceAudioContext.state);
      // Don't clear pause state here - let cursorPositionChanged handle it
      // This prevents clearing the canvas when resuming
      
      // Notify playback progress tracker that actual music has started
      playbackProgressTracker.onNotesPlaybackStarted(o);
    },
    soundLoaded: function(instrumentId, instrumentName) {
      try {
        console.log('soundLoaded - Audio context state:', linearSourceAudioContext.state);
        console.log('Sound loaded for instrument:', instrumentId, instrumentName);
        // Sound loaded for instrument - return true to indicate success
        return true;
      } catch (error) {
        console.error('Error in soundLoaded:', error);
        return false;
      }
    },
    allSoundsLoaded: function() {
      console.log('allSoundsLoaded - Audio context state:', linearSourceAudioContext.state);
      // All sounds loaded. Ready for playback
    }
  };
  osmd.PlaybackManager.addListener(myListener);

  // Set up control panel and ensure it's properly connected
  const controlPanelContainer = document.getElementById('controlPanelContainer')
  const controlPanel = new OSMD.ControlPanel(controlPanelContainer);
  controlPanel.addListener(playbackManager);
  
  // Store control panel globally for debugging
  window.controlPanel = controlPanel;
  
  // Disable playback controls initially (will be enabled by microphone manager when access is granted)
  const controlPanelButtons = controlPanelContainer.querySelectorAll('button');
  controlPanelButtons.forEach(button => {
    button.disabled = true;
    button.style.opacity = '0.5';
    button.style.cursor = 'not-allowed';
  });
  
  // Also disable canvas scrolling initially
  const canvasWrapper = document.getElementById('canvasWrapper');
  if (canvasWrapper) {
    canvasWrapper.classList.remove('scroll-enabled');
  }
  
  // osmd initial setup done
};

/**
 * Start pitch tracking if microphone access is available
 */
async function startPitchTrackingIfAvailable() {
  console.log('startPitchTrackingIfAvailable called');
  
  if (window.microphoneManager && window.microphoneManager.hasMicrophoneAccess()) {
    console.log('Microphone access available, proceeding with pitch tracking start');
    try {
      // Try to refresh the microphone stream if needed
      if (window.microphoneManager.micAccessGranted && !window.microphoneManager.micStream) {
        console.log('Permission granted but no stream, attempting to refresh...');
        const refreshed = await window.microphoneManager.refreshMicrophoneStream();
        if (!refreshed) {
          console.error('Failed to refresh microphone stream');
          return;
        }
      }
      
      // Get the LinearTimingSource audio context
      const audioContext = window.linearTimingSourceAudioContext;
      if (!audioContext) {
        console.error('LinearTimingSource audio context not available');
        return;
      }
      
      console.log('Starting pitch tracking with LinearTimingSource audio context');
      const { trackPitch } = await import('./pitchTracking.js');
      trackPitch(audioContext);
      
    } catch (error) {
      console.error('Failed to start pitch tracking:', error);
    }
  } else {
    console.log('Microphone access not available, skipping pitch tracking');
  }
}

/**
 * Stop pitch tracking if it's currently active
 */
async function stopPitchTrackingIfActive() {
  try {
    const { stopPitchTracking } = await import('./pitchTracking.js');
    stopPitchTracking();
  } catch (error) {
    console.error('Failed to stop pitch tracking:', error);
  }
}

function setupNotationToggle() {
  const toggleButton = document.getElementById('toggleNotation');
  const notationContainer = document.querySelector('.notation-container');
  
  if (toggleButton && notationContainer) {
    // Show the toggle button
    toggleButton.classList.add('show');
    
    // Collapse the notation container by default
    notationContainer.classList.add('collapsed');
    toggleButton.textContent = 'Show Music Sheet';
    toggleButton.classList.remove('btn-secondary');
    toggleButton.classList.add('btn-success');
    
    toggleButton.addEventListener('click', function() {
      const isCollapsed = notationContainer.classList.contains('collapsed');
      
      if (isCollapsed) {
        // Expand
        notationContainer.classList.remove('collapsed');
        toggleButton.textContent = 'Hide Music Sheet';
        toggleButton.classList.remove('btn-success');
        toggleButton.classList.add('btn-secondary');
      } else {
        // Collapse
        notationContainer.classList.add('collapsed');
        toggleButton.textContent = 'Show Music Sheet';
        toggleButton.classList.remove('btn-secondary');
        toggleButton.classList.add('btn-success');
      }
    });
  }
}

function scrollChartToPosition(currentTimeMs, songLengthMs) {
  const canvasWrapper = document.getElementById('canvasWrapper');
  if (!canvasWrapper) return;
  
  const currentTimeSec = currentTimeMs / 1000;
  const songLengthSec = songLengthMs / 1000;
  
  // Don't scroll during first 5 seconds or last 5 seconds
  if (currentTimeSec < 5 || currentTimeSec > songLengthSec - 5) {
    return;
  }
  
  // Calculate the target scroll position
  const pxPerSec = 72; // Same as in soundFrequencyChart.js
  const marginLeft = 40;
  const currentX = marginLeft + (currentTimeSec * pxPerSec);
  
  // Calculate the center of the visible area
  const wrapperWidth = canvasWrapper.clientWidth;
  const targetScrollLeft = currentX - (wrapperWidth / 2);
  
  // Smooth scroll to the target position
  canvasWrapper.scrollTo({
    left: targetScrollLeft,
    behavior: 'smooth'
  });
}

function enableManualScrolling() {
  const canvasWrapper = document.getElementById('canvasWrapper');
  if (canvasWrapper) {
    canvasWrapper.style.pointerEvents = 'auto';
    canvasWrapper.style.userSelect = 'auto';
    
    // Remove scroll prevention
    canvasWrapper.removeEventListener('wheel', preventScroll);
    canvasWrapper.removeEventListener('touchmove', preventScroll);
  }
}

function disableManualScrolling() {
  const canvasWrapper = document.getElementById('canvasWrapper');
  if (canvasWrapper) {
    canvasWrapper.style.pointerEvents = 'none';
    canvasWrapper.style.userSelect = 'none';
  }
}

function preventScroll(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

export function uploadFile(e) {
  const inputField = e.target;
  const file = inputField.files[0];
  let reader = new FileReader();

  reader.onload = async function(e) {
    // Convert ArrayBuffer to binary string for OSMD
    const arrayBuffer = e.target.result;
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to binary string
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    
    // Debug: Check the original file content
    console.log('📁 File loaded, ArrayBuffer length:', arrayBuffer.byteLength);
    console.log('📁 File loaded, binary string length:', binaryString.length);
    console.log('🔍 Original file first 20 bytes:', binaryString.substring(0, 20).split('').map(c => c.charCodeAt(0)).join(','));
    console.log('🔍 Original file last 20 bytes:', binaryString.substring(binaryString.length - 20).split('').map(c => c.charCodeAt(0)).join(','));
    
    // Save file to localStorage
    console.log('📁 File loaded, saving to localStorage:', file.name, 'Size:', file.size);
    saveFileToLocalStorage(file, binaryString);
    
    // Debug: Check if data was actually saved
    setTimeout(() => {
      const savedData = localStorage.getItem('spiv_uploaded_file');
      const savedContent = localStorage.getItem('spiv_uploaded_file_content');
      console.log('🔍 Debug - Saved file data:', savedData ? 'EXISTS' : 'MISSING');
      console.log('🔍 Debug - Saved content:', savedContent ? `EXISTS (${savedContent.length} chars)` : 'MISSING');
    }, 100);
    try {
      let osmd = new OSMD.OpenSheetMusicDisplay("osmdContainer", {
        backend: "svg",
        drawFromMeasureNumber: 1,
        drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER
      });
      osmdInitialSetup(osmd);


      await osmd.load(binaryString);

   
      if (!isFileSupported(osmd.sheet).supported) {
        throw new Error('File is not supported');
      }

      const mainPartId = isFileSupported(osmd.sheet).mainPartId;
      
      // Set up all instruments for playback
      osmd.sheet.Instruments.forEach((part, index) => {
        
        if (part.id !== mainPartId) {
          part.Visible = false;
        } else {
          //play main vocal part with piano
          part.MidiInstrumentId = 0;
        }
      });

      //initialize playback manager
      osmd.PlaybackManager.initialize(osmd.Sheet.musicPartManager);
      osmd.PlaybackManager.timingSource.Settings = osmd.Sheet.playbackSettings;
      
      osmd.updateGraphic();
      osmd.render();
      osmd.PlaybackManager.addListener(osmd.cursor);
      
      // Initialize microphone access using the microphone manager
      const micPanel = document.getElementById('canvasWrapper');
      microphoneManager.initialize(osmd, micPanel);
      
    
      // Store osmd instance globally
      window.osmd = osmd;
      
      // Initialize playback progress tracker
      playbackProgressTracker.initialize(osmd);
      console.log('Playback progress tracker initialized');
      
      osmd.cursor.show(); // this would show the cursor on the first note
      
      //update the chart
      const dataForChart = await getDataForChart(osmd.sheet);
      const notationData = dataForChart.data;
      const songLengthSec = dataForChart.songLength; // Already in seconds, don't divide by 1000
      const chartModule = await import('./soundFrequencyChart.js');
      await chartModule.defineCanvasSize(dataForChart);
      await chartModule.drawTimeAxis(songLengthSec);
      await chartModule.drawNotes(songLengthSec, notationData, 0);
      
      // Store chart data and functions globally for cursor updates
      window.currentChartData = dataForChart;
      window.updatePlaybackCursor = chartModule.updatePlaybackCursor;

      // Show transpose input after successful upload
      const transposeInput = document.getElementById('transposeInput');
      if (transposeInput) {
        transposeInput.classList.add('show');
      }

      // Show canvas and notation containers
      const canvasWrapper = document.getElementById('canvasWrapper');
      if (canvasWrapper) {
        canvasWrapper.classList.add('show');
      }
      
      const notationContainer = document.querySelector('.notation-container');
      if (notationContainer) {
        notationContainer.classList.add('show');
        
        // Re-render OSMD after container becomes visible
        setTimeout(() => {
          osmd.updateGraphic();
          osmd.render();
        }, 100);
      }

      // Setup notation toggle functionality
      setupNotationToggle();


    } catch (err) {
      console.error('Error during file processing:', err);
      alert(err.message);
    }
  };

  // Always read as ArrayBuffer for .mxl files to avoid binary corruption
  if (file.name.match('.*\.mxl')) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}