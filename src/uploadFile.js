import * as OSMD from './libs/opensheetmusicdisplay.min.js';
import './demo.css';
import './annotations-ui.css';
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";
import MicrophoneManager from './microphoneManager.js';
import { playbackProgressTracker } from './playbackProgress.js';
import { stopPitchTracking, clearAllPitchData, clearPitchVisualization } from './pitchTracking.js';

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


// Save .mxl file to localStorage
function saveFileAsArrayBuffer(file, fileContent) {
  try {
    // Only support .mxl files
    if (!file.name.match('.*\.mxl')) {
      return;
    }
    
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
    
    // Convert binary string to base64
    const base64Content = binaryStringToBase64(fileContent);
    
    localStorage.setItem('spiv_uploaded_file', JSON.stringify(fileData));
    localStorage.setItem('spiv_uploaded_file_content', base64Content);
    
  } catch (error) {
    console.error('Error saving .mxl file to localStorage:', error);
  }
}

// Local storage functions for .mxl binary file management
function saveFileToLocalStorage(file, fileContent) {
  // Use the new ArrayBuffer approach
  saveFileAsArrayBuffer(file, fileContent);
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

function showPlaybackControls() {
  try {
    // Show control panel
    const controlPanelContainer = document.getElementById('controlPanelContainer');
    if (controlPanelContainer) {
      controlPanelContainer.style.display = 'block';
    }

    // Show any playback buttons that might have been created
    const playbackButtons = document.querySelector('.playback-buttons');
    if (playbackButtons) {
      playbackButtons.style.display = 'block';
    }

    // Show any control panel elements
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel) {
      controlPanel.style.display = 'block';
    }

    console.log('Playback controls shown');
  } catch (error) {
    console.error('Error showing playback controls:', error);
  }
}

function hideAllUIElements() {
  try {
    // Hide transpose input
    const transposeInput = document.getElementById('transposeInput');
    if (transposeInput) {
      transposeInput.classList.remove('show');
    }

    // Hide canvas and notation containers
    const canvasWrapper = document.getElementById('canvasWrapper');
    if (canvasWrapper) {
      canvasWrapper.classList.remove('show');
    }
    
    const notationContainer = document.querySelector('.notation-container');
    if (notationContainer) {
      notationContainer.classList.remove('show');
    }

    // Hide control panel and clear its contents
    const controlPanelContainer = document.getElementById('controlPanelContainer');
    if (controlPanelContainer) {
      controlPanelContainer.style.display = 'none';
      controlPanelContainer.innerHTML = '';
    }

    // Hide any playback buttons that might have been created
    const playbackButtons = document.querySelector('.playback-buttons');
    if (playbackButtons) {
      playbackButtons.style.display = 'none';
    }

    // Hide any control panel elements
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel) {
      controlPanel.style.display = 'none';
    }

    // Clear OSMD container
    const osmdContainer = document.getElementById('osmdContainer');
    if (osmdContainer) {
      osmdContainer.innerHTML = '';
    }

    // Clear global references
    window.osmd = null;
    window.currentChartData = null;
    window.updatePlaybackCursor = null;

    console.log('All UI elements hidden due to error');
  } catch (error) {
    console.error('Error hiding UI elements:', error);
  }
}

// Redraw the base chart (axes + expected notes) without the live pitch line
async function redrawBaseChart() {
  try {
    if (window.currentChartData) {
      const chartModule = await import('./soundFrequencyChart.js');
      const dataForChart = window.currentChartData;
      const songLengthSec = dataForChart.songLength;
      await chartModule.defineCanvasSize(dataForChart);
      await chartModule.drawTimeAxis(songLengthSec);
      await chartModule.drawNotes(songLengthSec, dataForChart.data, 0);
      console.log('Base chart redrawn (axes + expected notes)');
    } else {
      console.warn('No currentChartData available to redraw base chart');
    }
  } catch (e) {
    console.warn('Failed to redraw base chart:', e);
  }
}


// Reset playback and pitch tracking state
function resetPlaybackAndPitch() {
  try {
    // 1) Reset playback progress to beginning
    if (window.osmd && window.osmd.cursor) {
      try {
        window.osmd.cursor.reset();
      } catch (e) {
        console.warn('Failed to reset OSMD cursor:', e);
      }
    }
    if (window.osmd && window.osmd.PlaybackManager) {
      try {
        window.osmd.PlaybackManager.reset();
      } catch (e) {
        console.warn('Failed to reset PlaybackManager:', e);
      }
    }
    if (playbackProgressTracker && typeof playbackProgressTracker.reset === 'function') {
      playbackProgressTracker.reset();
    }

    // 2) Clear pitch tracking state and visualization
    try {
      stopPitchTracking();
    } catch (e) {
      console.warn('stopPitchTracking failed (may not be running):', e);
    }
    try {
      clearAllPitchData();
      clearPitchVisualization();
    } catch (e) {
      console.warn('Failed to clear pitch data/visualization:', e);
    }

    // 3) Delete any pitch tracking data from localStorage
    try {
      // Remove known pitch-related keys if present
      localStorage.removeItem('pitch_data_points');
      localStorage.removeItem('pitch_tracking_state');
      // Also remove uploaded file cache to fully reset state
      localStorage.removeItem('spiv_uploaded_file');
      localStorage.removeItem('spiv_uploaded_file_content');
    } catch (e) {
      console.warn('Failed to clear pitch data from localStorage:', e);
    }

    // Redraw base chart (axes + expected notes)
    redrawBaseChart();

    console.log('Playback and pitch tracking reset completed');
  } catch (error) {
    console.error('Error during resetPlaybackAndPitch:', error);
  }
}

// Expose reset function globally so UI can call it
if (typeof window !== 'undefined') {
  window.resetPlaybackAndPitch = resetPlaybackAndPitch;
}




// Track pause state for canvas updates
let isPaused = false;
let wasPaused = false; // Track if we were previously paused
let suppressResetClear = false; // Suppress clearing pitch on reset when playback naturally ends
let awaitingRestartFromBeginning = false; // After natural end, clear pitch on next play from start
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
        // Suppress clearing of pitch data/visualization for this reset
        suppressResetClear = true;
        awaitingRestartFromBeginning = true;
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
      
      // Reset playback progress tracker
      try {
        if (playbackProgressTracker && typeof playbackProgressTracker.reset === 'function') {
          playbackProgressTracker.reset();
        }
      } catch (e) {
        console.warn('Failed to reset playbackProgressTracker on resetOccurred:', e);
      }
      
      // Stop pitch tracking; optionally preserve pitch data and drawing when suppressed
      try {
        stopPitchTracking();
        if (!suppressResetClear) {
          clearAllPitchData();
          clearPitchVisualization();
          // Redraw base chart so axes + expected notes remain visible
          redrawBaseChart();
        }
      } catch (e) {
        console.warn('Failed to clear pitch tracking on resetOccurred:', e);
      }
      
      // Remove any pitch tracking data from localStorage unless suppressed
      try {
        if (!suppressResetClear) {
          localStorage.removeItem('pitch_data_points');
          localStorage.removeItem('pitch_tracking_state');
        }
      } catch (e) {
        console.warn('Failed to clear pitch data from localStorage on resetOccurred:', e);
      }

      // Reset suppression flag after handling this reset
      suppressResetClear = false;
      
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
    
    // Save file to localStorage
    saveFileToLocalStorage(file, binaryString);
    try {
      let osmd = new OSMD.OpenSheetMusicDisplay("osmdContainer", {
        backend: "svg",
        drawFromMeasureNumber: 1,
        drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER
      });
      osmdInitialSetup(osmd);


      await osmd.load(binaryString);

      // Disable repetitions by forcing user number of repetitions to 1
      console.log('=== Disabling Repetitions ===');
      try {
        if (osmd.Sheet && osmd.Sheet.SourceMeasures && Array.isArray(osmd.Sheet.SourceMeasures)) {
          console.log('Found SourceMeasures:', osmd.Sheet.SourceMeasures.length);
          let repetitionCount = 0;
          
          osmd.Sheet.SourceMeasures.forEach((sourceMeasure, index) => {
            const first = sourceMeasure.firstRepetitionInstructions || [];
            const second = sourceMeasure.secondRepetitionInstructions || [];
            
            if (first.length > 0 || second.length > 0) {
              console.log(`Measure ${index + 1}: Found ${first.length} first repetitions, ${second.length} second repetitions`);
            }
            
            first.forEach((instr, i) => {
              if (instr && instr.parentRepetition) {
                console.log(`Setting first repetition ${i} in measure ${index + 1} to 1 repetition`);
                instr.parentRepetition.UserNumberOfRepetitions = 1;
                repetitionCount++;
              }
            });
            second.forEach((instr, i) => {
              if (instr && instr.parentRepetition) {
                console.log(`Setting second repetition ${i} in measure ${index + 1} to 1 repetition`);
                instr.parentRepetition.UserNumberOfRepetitions = 1;
                repetitionCount++;
              }
            });
          });
          
          console.log(`Total repetitions disabled: ${repetitionCount}`);
        } else {
          console.log('No SourceMeasures found or not an array');
        }
      } catch (e) {
        console.warn('Failed to set UserNumberOfRepetitions:', e);
      }

      
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
      
      // Recalculate playback entries after changing repetition settings
      console.log('=== Recalculating Playback Entries ===');
      try {
        if (osmd.PlaybackManager && typeof osmd.PlaybackManager.recalculatePlaybackEntriesAndRepetitions === 'function') {
          console.log('Calling recalculatePlaybackEntriesAndRepetitions()...');
          osmd.PlaybackManager.recalculatePlaybackEntriesAndRepetitions();
          console.log('Playback entries recalculated successfully');
        } else {
          console.log('recalculatePlaybackEntriesAndRepetitions method not available');
        }
      } catch (e) {
        console.warn('Failed to recalculate playback entries and repetitions:', e);
      }
      
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
      const dataForChart = await getDataForChart(osmd.sheet, osmd);
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

  // Show playback controls after successful upload
  showPlaybackControls();
  
  // Ensure the playback panel's Reset button triggers our reset
  try {
    const controlPanelContainer = document.getElementById('controlPanelContainer');
    if (controlPanelContainer) {
      // Delegate click to any button with text "Reset" within the control panel
      controlPanelContainer.addEventListener('click', (ev) => {
        const target = ev.target;
        if (target && target.tagName === 'BUTTON' && target.textContent && target.textContent.trim().toLowerCase() === 'reset') {
          if (typeof window.resetPlaybackAndPitch === 'function') {
            window.resetPlaybackAndPitch();
          }
        }
        // Handle Play button after natural end: clear pitch and restart from beginning
        if (target && target.tagName === 'BUTTON' && target.textContent && target.textContent.trim().toLowerCase() === 'play') {
          if (awaitingRestartFromBeginning) {
            try {
              // Call the same reset routine as the Reset control
              if (typeof window.resetPlaybackAndPitch === 'function') {
                window.resetPlaybackAndPitch();
              }
              awaitingRestartFromBeginning = false;
              // Ensure playback starts from beginning (cursor already reset in resetPlaybackAndPitch, but reset again defensively)
              if (window.osmd && window.osmd.cursor) {
                window.osmd.cursor.reset();
              }
              console.log('Reset via resetPlaybackAndPitch and restarting from beginning after natural end');
            } catch (e) {
              console.warn('Failed to prepare restart from beginning:', e);
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn('Failed to wire Reset button in control panel:', e);
  }

    } catch (err) {
      console.error('Error during file processing:', err);
      
      // Hide all UI elements on error
      hideAllUIElements();
      
      // Clear the file input to remove the invalid filename
      const musicxmlFile = document.getElementById('musicxmlFile');
      if (musicxmlFile) {
        musicxmlFile.value = '';
      }
      
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