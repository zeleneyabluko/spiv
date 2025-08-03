import * as OSMD from './libs/opensheetmusicdisplay.min.js';
import './demo.css';
import './annotations-ui.css';
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";
// import { defineCanvasSize } from './soundFrequencyChart.js';

// Temporary inline function to test
function defineCanvasSize(dataForChart, canvas) {
    const ctx = canvas.getContext('2d');
    
    const songLengthSec = dataForChart.songLength/1000; // e.g. 2 minutes
    const pxPerSec = 80;       // e.g. 800px = 10 seconds visible
    
    canvas.width = songLengthSec * pxPerSec;
    console.log(`canvas width in px: `, canvas.width);
    //paint canvas blue
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}


function osmdInitialSetup(osmd) {
  const timingSource = new OSMD.LinearTimingSource();
  const playbackManager = new OSMD.PlaybackManager(timingSource, undefined, new OSMD.BasicAudioPlayer(), undefined);
  const transposeCalculator = new OSMD.TransposeCalculator();
  osmd.FollowCursor = true;
  osmd.PlaybackManager = playbackManager;
  osmd.TransposeCalculator = transposeCalculator;
  osmd.PlaybackManager.DoPlayback = true;
  osmd.PlaybackManager.Metronome.Volume = 0.5;
  osmd.PlaybackManager.PreCountMeasures = 2;
  const audioContext = osmd.PlaybackManager.audioPlayer.ac;

  //add listeners to playback manager
  let myListener = {
    selectionEndReached: function(o) { 
      console.log("Playback reached end");
      // Reset cursor to beginning when playback ends
      /*if (osmd.cursor) {
        osmd.cursor.reset();
      }*/
      // Manually reset the play/pause button state
      const playPauseButton = document.querySelector('.playpause-button');
      if (playPauseButton && playPauseButton.classList.contains('playing')) {
        playPauseButton.classList.remove('playing');
        console.log("Manually reset play/pause button state");
      }
      // Manually reset playback manager to ensure button state is updated
      setTimeout(() => {
        osmd.PlaybackManager.reset();
      }, 100);
    },
    resetOccurred: function(o) {
      console.log("Reset occurred");
      // Reset cursor to beginning
      if (osmd.cursor) {
        osmd.cursor.reset();
      }
    },
    cursorPositionChanged: function(timestamp, data) {
      console.log('cursor position changed!');
      const iterator = osmd.cursor.Iterator;
      const iteratorCurrentTimeStampInMs = osmd.PlaybackManager.timingSource.getDurationInMs(iterator.currentTimeStamp);
      console.log(iteratorCurrentTimeStampInMs);

    // Example usage:
    console.log('audio context: ', audioContext);
    console.log('Audio context state:', audioContext.state);

      // Scroll the x axis of the soundFrequencyChart
      const chart = window.soundFrequencyChart;
      if (chart && chart.axisX) {
        const center = iteratorCurrentTimeStampInMs;
        const songLength = osmd.PlaybackManager.getSheetDurationInMs(); // respects each measure's bpm. Assumes playbackmanager.setBpm() was set to the first measure's bpm or the other way round. (you may need to set `sourceMeasure.TempoInBPM`)
        const start = Math.max(0, center - 5000);
        const end = Math.min(center + 5000, songLength);
        chart.axisX.setInterval({ start, end });
      }
    },
    pauseOccurred: function(o) {
      console.log("Pause occurred");
      console.log('Audio context state:', audioContext.state);
    },
    notesPlaybackEventOccurred: function(o) {
      // Optional: handle note playback events
    },
    soundLoaded: function(instrumentId, instrumentName) {
      console.log(`Sound loaded for instrument: ${instrumentName}`);
    },
    allSoundsLoaded: function() {
      console.log("All sounds loaded. Ready for playback");
    }
  };
  osmd.PlaybackManager.addListener(myListener);

  // Set up control panel and ensure it's properly connected
  const controlPanelContainer = document.getElementById('controlPanelContainer')
  const controlPanel = new OSMD.ControlPanel(controlPanelContainer);
  controlPanel.addListener(playbackManager);
  
  // Store control panel globally for debugging
  window.controlPanel = controlPanel;
  
  console.log('osmd initial setup done');
};

function addMicOverlay(osmd) {
  const panel = document.getElementById('controlPanelContainer');
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
        overlay.remove();
        alert('Microphone enabled! Now click Play.');
      })
      .catch(function(err) {
        alert('Microphone access denied. Playback cannot start.');
      });
  });
}

export function uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log('file uploading');
  const file = inputField.files[0];
  let reader = new FileReader();

  reader.onload = async function(e) {
    try {
      let osmd = new OSMD.OpenSheetMusicDisplay("osmdContainer", {
        backend: "svg",
        drawFromMeasureNumber: 1,
        drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER
      });
      console.log('osmd created');
      osmdInitialSetup(osmd);


      await osmd.load(e.target.result);
      console.log('Sheet loaded');  

   
      if (!isFileSupported(osmd.sheet).supported) {
        throw new Error('File is not supported');
      }

      const mainPartId = isFileSupported(osmd.sheet).mainPartId;
      
      // Set up all instruments for playback
      osmd.sheet.Instruments.forEach((part, index) => {
        console.log(`Setting up instrument ${part.id}`);
        // Set each instrument to be audible
        part.audible = true;
        
 
        if (part.id !== mainPartId) {
          console.log(`${part.id} will be hidden`);
          part.Visible = false;
        } else {
          console.log(`${part.id} will be visible`);
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
      console.log('Sheet rendered');
      
    
      // Store osmd instance globally
      window.osmd = osmd;
      osmd.cursor.show(); // this would show the cursor on the first note
      
      //update the chart
      const dataForChart = await getDataForChart(osmd.sheet);
      const notationData = dataForChart.data;
      const canvas = document.getElementById('chart');
      console.log('canvas: ', canvas);
      console.log('notation data: ', notationData);
      console.log('defineCanvasSize function: ', defineCanvasSize);
      console.log('typeof defineCanvasSize: ', typeof defineCanvasSize);
      
      if (typeof defineCanvasSize === 'function') {
        await defineCanvasSize(dataForChart, canvas);
      } else {
        console.error('defineCanvasSize is not a function:', defineCanvasSize);
        throw new Error('defineCanvasSize function not available');
      }


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

  