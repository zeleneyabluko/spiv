import * as OSMD from './libs/opensheetmusicdisplay.min.js';
import './demo.css';
import './annotations-ui.css';
const { OpenSheetMusicDisplay, LinearTimingSource, PlaybackManager, BasicAudioPlayer, ControlPanel, TransposeCalculator } = OSMD;
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";


function osmdInitialSetup(osmd) {
  const timingSource = new LinearTimingSource();
  const playbackManager = new PlaybackManager(timingSource, undefined, new BasicAudioPlayer(), undefined);
  const transposeCalculator = new TransposeCalculator();
  osmd.FollowCursor = true;
  osmd.PlaybackManager = playbackManager;
  osmd.TransposeCalculator = transposeCalculator;
  osmd.PlaybackManager.DoPlayback = true;
  osmd.PlaybackManager.Metronome.Volume = 0.5;
  osmd.PlaybackManager.PreCountMeasures = 2;

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
  const controlPanel = new ControlPanel(controlPanelContainer);
  controlPanel.addListener(playbackManager);
  
  // Store control panel globally for debugging
  window.controlPanel = controlPanel;
  
  console.log('osmd initial setup done');
};

export function uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log('file uploading');
  const file = inputField.files[0];
  let reader = new FileReader();

  reader.onload = async function(e) {
    try {
      let osmd = new OpenSheetMusicDisplay("osmdContainer", {
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
      //osmd.sheet.Transpose = 4;
      
      osmd.updateGraphic();
      osmd.render();
      osmd.PlaybackManager.addListener(osmd.cursor);
      console.log('Sheet rendered');
      
    
      // Store osmd instance globally
      window.osmd = osmd;
      osmd.cursor.show(); // this would show the cursor on the first note
      
      //update the chart
      const notationData = getDataForChart(osmd.sheet).data;
      console.log('notation data: ', notationData);
      window.series.add(notationData);

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

  