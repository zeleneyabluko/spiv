import { Instrument, OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { isVocalPart } from "./processingFile";
export function uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log('file uploading');
  const file = inputField.files[0];
  let reader = new FileReader();

  reader.onload = function(e) {
    let osmd = new OpenSheetMusicDisplay("osmdContainer", {
      backend: "svg",
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER
    });
    console.log('osmd created')
    
    sessionStorage.setItem('fileName', file.name);
  
    osmd
      .load(e.target.result)
      .then(
        function() {
          // Find vocal/voice parts
          const vocalPartIndices = [];
          osmd.sheet.Instruments.forEach((part, index) => {
            console.log(part.nameLabel.text);
            const partName = part.nameLabel.text.toLowerCase() || '';
            if (isVocalPart(part)) {
              vocalPartIndices.push(index);
            }
          });          
          console.log('Found vocal parts:', vocalPartIndices.length);
          
          // If vocal parts found, update the display
          if (vocalPartIndices.length == 1) {
            //Hide non-vocal parts
            osmd.sheet.Instruments.forEach((part, index) => {
              if (!isVocalPart(part)) {
                part.Visible = false;
              }
            })
            // Clear the container and re-render
            document.getElementById("osmdContainer").innerHTML = '';
            osmd.updateGraphic();
            osmd.render();
          } else {
            osmd.render();
          }
          
          window.osmd = osmd;
          osmd.cursor.show(); // this would show the cursor on the first note
          // osmd.cursor.next(); // advance the cursor one note
        }
      );
  };

  if (file.name.match('.*\.mxl')) {
    // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
}

  