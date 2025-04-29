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
            console.log(part);
            if (isVocalPart(part)) {
              vocalPartIndices.push(index);
            }
          });          
          console.log('Found vocal parts:', vocalPartIndices.length);
          
          // If vocal parts found, update the display
          if (osmd.sheet.Instruments.length == 1 && !isVocalPart(osmd.sheet.Instruments[0])) {
            //if there is only one instrument and it is monophonic, render this part, otherwise show alert
            //todo: if there are more than one vocal part or no vocal parts, show alert
          }
          else if (vocalPartIndices.length == 1) {
            //Hide non-vocal parts
            osmd.sheet.Instrument.forEach((part, index) => {
              console.log(part.subInstruments.length);

              /*part.subInstruments.forEach((subinstrument, index) => {
                if (!isVocalPart(subinstrument)) {
                  console.log(subinstrument);
                  part.Visible = false;
                }

              })*/

            })
            // Render the sheet music
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

  