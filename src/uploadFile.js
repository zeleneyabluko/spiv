import { Instrument, OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import {
  isVocalPart,
  isMonophonic,
  isFileSupported,
  numberOfVocalParts,
} from "./processingFile";
export function uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log("file uploading");
  const file = inputField.files[0];
  let reader = new FileReader();

  reader.onload = function (e) {
    let osmd = new OpenSheetMusicDisplay("osmdContainer", {
      backend: "svg",
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER,
    });
    console.log("osmd created");

    osmd
      .load(e.target.result)
      .then(function () {
        if (!isFileSupported(osmd.sheet)) {
          alert("The file is not supported!");
          return;
        }
      })
      .then(function () {
        if (
          osmd.sheet.Instruments.length > 1 &&
          numberOfVocalParts(osmd.sheet) == 1
        ) {
          //Hide non-vocal parts
          osmd.sheet.Instruments.forEach((part, index) => {
            if (!isVocalPart(part)) {
              console.log(`${part} is not vocal part`);
              part.Visible = false;
            }
          });
          // Render the sheet music
          osmd.updateGraphic();
        }
        osmd.render();
        window.osmd = osmd;
        osmd.cursor.show(); // this would show the cursor on the first note
        // osmd.cursor.next(); // advance the cursor one note
      });
  };

  if (file.name.match(".*\.mxl")) {
    // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
}
