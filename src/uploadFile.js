import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { isVocalPart, isMonophonic, isFileSupported, numberOfVocalParts, getDataForChart } from "./processingFile";


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

      

    osmd
      .load(e.target.result)
      .then(
        function() {          
          if (!isFileSupported(osmd.sheet).supported){
            throw new Error('File is not supported');
            return;
          }
        }
      )
      .then(
        function() {
         // const vocalPartsCount = numberOfVocalParts(osmd.sheet);
          const mainPartId = isFileSupported(osmd.sheet).mainPartId;
         if (osmd.sheet.Instruments.length > 1) {
            //Hide non-vocal parts
            osmd.sheet.Instruments.forEach((part, index) => {
                if (part.id !== mainPartId){
                  console.log(`${part} will be hidden`);
                  part.Visible = false;
                }
                else (console.log(`${part} will be visible`));
          })
            osmd.updateGraphic();
          } 
          
          osmd.render();
          window.osmd = osmd;       
          osmd.cursor.show(); // this would show the cursor on the first note
          // osmd.cursor.next(); // advance the cursor one note
        }
      )
      .then(
        //update the chart
        function() {
          //get data for chart
          const notationData = getDataForChart(osmd.sheet).data;
          console.log('notation data: ', notationData);
          window.series.add(notationData);
        }
      )
      .catch(err => {
        alert(err.message)
      });
  };

  if (file.name.match('.*\.mxl')) {
    // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }
}

  