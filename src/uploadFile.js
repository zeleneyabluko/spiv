import * as OSMD from './libs/opensheetmusicdisplay.min.js';
const { OpenSheetMusicDisplay, LinearTimingSource, PlaybackManager, BasicAudioPlayer, ControlPanel } = OSMD;
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";

function osmdInitialSetup(osmd) {
  const timingSource = new LinearTimingSource();
  const audioPlayer = new BasicAudioPlayer();
  const playbackManager = new PlaybackManager(timingSource, undefined, audioPlayer, undefined);
  
  // Initialize audio player with default instrument
  audioPlayer.setSound(0, 1); // Set channel 0 to piano (instrument 1)
  
  osmd.PlaybackManager = playbackManager;
  osmd.PlaybackManager.DoPlayback = true;

  // Add debug logging for playback events
  playbackManager.addListener({
    playbackStarted: () => {
      console.log('Playback started');
      console.log('Current timestamp:', playbackManager.timingSource.getCurrentTimestamp());
      console.log('Timing source state:', playbackManager.timingSource.state);
    },
    playbackPaused: () => {
      console.log('Playback paused');
      console.log('Timing source state:', playbackManager.timingSource.state);
    },
    playbackStopped: () => console.log('Playback stopped'),
    playbackEnded: () => console.log('Playback ended'),
    cursorUpdated: () => console.log('Cursor updated'),
    resetOccurred: () => console.log('Reset occurred'),
    soundLoaded: () => console.log('Sound loaded'),
    allSoundsLoaded: () => console.log('All sounds loaded')
  });

  // Playback controls UI and event listeners have been removed from this file.
}

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
      
      // Initialize playback manager with the music part manager
      osmd.PlaybackManager.initialize(osmd.Sheet.musicPartManager);
      console.log('Playback manager initialized');
      
      // Set timing source settings
      osmd.PlaybackManager.timingSource.Settings = osmd.Sheet.playbackSettings;
      console.log('Timing source settings set');
      
      if (!isFileSupported(osmd.sheet).supported) {
        throw new Error('File is not supported');
      }

      const mainPartId = isFileSupported(osmd.sheet).mainPartId;
      
      // Set up all instruments for playback
      osmd.sheet.Instruments.forEach((part, index) => {
        console.log(`Setting up instrument ${part.id}`);
        // Set each instrument to be audible
        part.audible = true;
        
        // Set default instrument (piano) for each part
        osmd.PlaybackManager.setSound(index, 1); // 1 is the piano instrument
        
        if (part.id !== mainPartId) {
          console.log(`${part.id} will be hidden`);
          part.Visible = false;
        } else {
          console.log(`${part.id} will be visible`);
        }
      });
      
      osmd.updateGraphic();
      osmd.render();
      console.log('Sheet rendered');
      
      // Add cursor as listener
      osmd.PlaybackManager.addListener(osmd.cursor);
      
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

  