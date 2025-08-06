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
  const audioContext = osmd.PlaybackManager.audioPlayer.ac;

  //add listeners to playback manager
  let myListener = {
    selectionEndReached: function(o) { 
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
      // Reset cursor to beginning
      if (osmd.cursor) {
        osmd.cursor.reset();
      }
      
      // Enable manual scrolling when stopped
      // enableManualScrolling(); // Removed
    },
    cursorPositionChanged: function(timestamp, data) {
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
      // Enable manual scrolling when paused
      enableManualScrolling();
      
      // Pitch tracking is now handled by the separate pitch-detection.js
    },
    notesPlaybackEventOccurred: function(o) {
      // Optional: handle note playback events
    },
    soundLoaded: function(instrumentId, instrumentName) {
      // Sound loaded for instrument
    },
    allSoundsLoaded: function() {
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

  overlay.addEventListener('click', function handler(e) {
    e.stopPropagation();
    e.preventDefault();
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        window.micAccessGranted = true;
        window.micStream = stream;
        const audioContext = osmd.PlaybackManager.audioPlayer.ac;
        const micSource = audioContext.createMediaStreamSource(stream);
        
        // Hide overlay instead of removing it
        overlay.style.display = 'none';
        
        // Enable playback controls and functionality
        enablePlaybackControls();
        osmd.PlaybackManager.DoPlayback = true;
        
        alert('Microphone enabled! Now click Play.');
      })
      .catch(function(err) {
        alert('Microphone access denied. Playback cannot start.');
      });
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