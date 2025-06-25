import * as OSMD from './libs/opensheetmusicdisplay.min.js';
const { OpenSheetMusicDisplay, LinearTimingSource, PlaybackManager, BasicAudioPlayer, ControlPanel } = OSMD;
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";


function osmdInitialSetup(osmd) {
  const timingSource = new LinearTimingSource();
  const playbackManager = new PlaybackManager(timingSource, undefined, new BasicAudioPlayer(), undefined);
  osmd.PlaybackManager = playbackManager;
  osmd.PlaybackManager.DoPlayback = true;
  const controlPanelContainer = document.getElementById('controlPanelContainer')
  const controlPanel = new ControlPanel(controlPanelContainer);
  controlPanel.addListener(playbackManager);
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
        
        // Set default instrument (piano) for each part
       // osmd.PlaybackManager.setSound(index, 1); 
        
        if (part.id !== mainPartId) {
          console.log(`${part.id} will be hidden`);
          part.Visible = false;
        } else {
          console.log(`${part.id} will be visible`);
        }
      });

      //initialize playback manager
      osmd.PlaybackManager.initialize(osmd.Sheet.musicPartManager);
      osmd.PlaybackManager.timingSource.Settings = osmd.Sheet.playbackSettings;
      
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

  