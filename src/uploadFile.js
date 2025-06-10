import * as OSMD from './libs/opensheetmusicdisplay.min.js';
const { OpenSheetMusicDisplay, LinearTimingSource, PlaybackManager, BasicAudioPlayer, ControlPanel } = OSMD;
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";

function osmdInitialSetup(osmd) {
  const timingSource = new LinearTimingSource();
  const audioPlayer = new BasicAudioPlayer();
  const playbackManager = new PlaybackManager(timingSource, undefined, audioPlayer, undefined);
  osmd.PlaybackManager = playbackManager;
  osmd.PlaybackManager.DoPlayback = true;

  // Setup control panel
  const playbackControlsContainer = document.getElementById("playback-controls-container");
  if (playbackControlsContainer) {
    const controlPanel = new ControlPanel(playbackControlsContainer, playbackManager);
    controlPanel.show();
  } else {
    console.error("Playback controls container not found. Make sure you added the HTML with id 'playback-controls-container'.");
  }
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
      osmd.PlaybackManager.initialize(osmd.Sheet.musicPartManager);
      osmd.PlaybackManager.timingSource.Settings = osmd.Sheet.playbackSettings;
      
      if (!isFileSupported(osmd.sheet).supported) {
        throw new Error('File is not supported');
      }

      const mainPartId = isFileSupported(osmd.sheet).mainPartId;
      if (osmd.sheet.Instruments.length > 1) {
        //Hide non-vocal parts
        osmd.sheet.Instruments.forEach((part, index) => {
          if (part.id !== mainPartId) {
            console.log(`${part} will be hidden`);
            part.Visible = false;
          } else {
            console.log(`${part} will be visible`);
          }
        });
        osmd.updateGraphic();
      }

      osmd.render();
      osmd.PlaybackManager.addListener(osmd.cursor); 
      await osmd.PlaybackManager.pause();
      osmd.PlaybackManager.reset();
      window.osmd = osmd;
      osmd.cursor.show(); // this would show the cursor on the first note
      osmd.PlaybackManager.initialize(osmd.Sheet.musicPartManager);
      osmd.PlaybackManager.timingSource.Settings = osmd.Sheet.playbackSettings;
      
      //update the chart
      const notationData = getDataForChart(osmd.sheet).data;
      console.log('notation data: ', notationData);
      window.series.add(notationData);

    } catch (err) {
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

  