import * as OSMD from './libs/opensheetmusicdisplay.min.js';
import './demo.css';
import './annotations-ui.css';
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";


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
        window.updatePlaybackCursor(iteratorCurrentTimeStampInMs, songLength);
      }
      
      // Auto-scroll the chart to keep current position in the middle
      scrollChartToPosition(iteratorCurrentTimeStampInMs, osmd.PlaybackManager.getSheetDurationInMs());
      
      // Disable manual scrolling during playback
      // disableManualScrolling(); // Removed
      
      // Pitch tracking is now handled by the separate pitch-detection.js
    },
    pauseOccurred: function(o) {
      console.log('pauseOccurred - Audio context state:', linearSourceAudioContext.state);
      // Enable manual scrolling when paused
      enableManualScrolling();
      
      // Pitch tracking is now handled by the separate pitch-detection.js
    },
    notesPlaybackEventOccurred: function(o) {
      console.log('notesPlaybackEventOccurred - Audio context state:', linearSourceAudioContext.state);
      // Optional: handle note playback events
    },
    soundLoaded: function(instrumentId, instrumentName) {
      console.log('soundLoaded - Audio context state:', linearSourceAudioContext.state);
      // Sound loaded for instrument
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
  
  // Disable playback controls initially
  disablePlaybackControls();
  
  // osmd initial setup done
};

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

function disablePlaybackControls() {
  const controlPanel = document.getElementById('controlPanelContainer');
  if (controlPanel) {
    const buttons = controlPanel.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';
    });
  }
  
  // Also disable canvas scrolling
  const canvasWrapper = document.getElementById('canvasWrapper');
  if (canvasWrapper) {
    canvasWrapper.classList.remove('scroll-enabled');
  }
}

function enablePlaybackControls() {
  const controlPanel = document.getElementById('controlPanelContainer');
  if (controlPanel) {
    const buttons = controlPanel.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
    });
  }
  
  // Also enable canvas scrolling
  const canvasWrapper = document.getElementById('canvasWrapper');
  if (canvasWrapper) {
    canvasWrapper.classList.add('scroll-enabled');
  }
}

function addMicOverlay(osmd) {
  const panel = document.getElementById('canvasWrapper');
  if (!panel) return;

  // Check if microphone access is already granted (either from current session or previous sessions)
  if (window.micAccessGranted) {
    // Microphone access already granted in current session, enable playback controls directly
    console.log('Microphone access already granted in current session');
    enablePlaybackControls();
    osmd.PlaybackManager.DoPlayback = true;
    return;
  }

  // Check if permission was granted in a previous session using the Permissions API
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'microphone' })
      .then(function(permissionStatus) {
        console.log('Current microphone permission state:', permissionStatus.state);
        
        if (permissionStatus.state === 'granted') {
          // Permission already granted from previous session, enable playback controls directly
          console.log('Microphone permission already granted from previous session');
          window.micAccessGranted = true;
          enablePlaybackControls();
          osmd.PlaybackManager.DoPlayback = true;
        } else {
          // Permission not granted, show the overlay
          console.log('Microphone permission not granted, showing overlay');
          showMicOverlay(panel, osmd);
        }
      })
      .catch(function() {
        // Permissions API not supported, show the overlay
        console.log('Permissions API not supported, showing overlay');
        showMicOverlay(panel, osmd);
      });
  } else {
    // Permissions API not supported, show the overlay
    console.log('Permissions API not supported, showing overlay');
    showMicOverlay(panel, osmd);
  }
}

function showMicOverlay(panel, osmd) {
  // Ensure parent is positioned
  panel.style.position = 'relative';
  panel.style.minHeight = '60px';

  // Remove any existing overlay
  const old = document.getElementById('mic-overlay');
  if (old) old.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(255,0,0,0.3)'; // RED for debugging
  overlay.style.zIndex = 1000;
  overlay.style.cursor = 'pointer';
  overlay.id = 'mic-overlay';
  overlay.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:1.2em;text-align:center;">Click to enable microphone for playback</div>';

  panel.appendChild(overlay);

  // Step 2: When user clicks overlay, trigger browser's permission request dialog
  overlay.addEventListener('click', function handler(e) {
    console.log('Overlay clicked!');
    e.stopPropagation();
    e.preventDefault();
    
    // First, check the current permission state
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then(function(permissionStatus) {
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
        .then(function(stream) {
          if (!stream) return; // Permission was denied
          
          console.log('Microphone access granted!', stream);
          // Step 3: When access is granted, remove overlay and enable controls
          window.micAccessGranted = true;
          window.micStream = stream;
          
          // Remove the overlay
          overlay.remove();
          
          // Enable playback controls and functionality
          enablePlaybackControls();
          osmd.PlaybackManager.DoPlayback = true;
          
          alert('Microphone enabled! Now click Play.');
        })
        .catch(function(err) {
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
        .then(function(stream) {
          console.log('Microphone access granted!', stream);
          // Step 3: When access is granted, remove overlay and enable controls
          window.micAccessGranted = true;
          window.micStream = stream;
          
          // Remove the overlay
          overlay.remove();
          
          // Enable playback controls and functionality
          enablePlaybackControls();
          osmd.PlaybackManager.DoPlayback = true;
          
          alert('Microphone enabled! Now click Play.');
        })
        .catch(function(err) {
          console.error('Microphone access denied:', err);
          alert('Microphone access denied. Playback cannot start.');
        });
    }
  });
  
  // Add additional event listeners to ensure clicks are captured
  overlay.addEventListener('mousedown', function(e) {
    console.log('Overlay mousedown!');
  });
  
  overlay.addEventListener('mouseup', function(e) {
    console.log('Overlay mouseup!');
  });
  
  // Also try touch events for mobile
  overlay.addEventListener('touchstart', function(e) {
    console.log('Overlay touchstart!');
  });
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
    try {
      let osmd = new OSMD.OpenSheetMusicDisplay("osmdContainer", {
        backend: "svg",
        drawFromMeasureNumber: 1,
        drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER
      });
      osmdInitialSetup(osmd);


      await osmd.load(e.target.result);

   
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
      addMicOverlay(osmd);
      
    
      // Store osmd instance globally
      window.osmd = osmd;
      osmd.cursor.show(); // this would show the cursor on the first note
      
      //update the chart
      const dataForChart = await getDataForChart(osmd.sheet);
      const notationData = dataForChart.data;
      const songLengthSec = dataForChart.songLength; // Already in seconds, don't divide by 1000
      const chartModule = await import('./soundFrequencyChart.js');
      await chartModule.defineCanvasSize(dataForChart);
      await chartModule.drawTimeAxis(songLengthSec);
      await chartModule.drawNotes(songLengthSec, notationData);
      
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

  if (file.name.match('.*\.mxl')) {
    // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
}