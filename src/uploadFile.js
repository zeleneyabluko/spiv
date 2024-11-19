import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";


export  function  uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log('file uploading');
  const file = inputField.files[0];
  let reader = new FileReader();

  reader.onload = function(e) {
    let osmd = new OpenSheetMusicDisplay("osmdContainer", {
      // set options here
      backend: "svg",
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
    });
    console.log('osmd created')
    sessionStorage.setItem('fileName', file.name);




  
    osmd
      .load(e.target.result)
        .then(
           function() {
               console.log('osmd before rendering ', osmd);
               const instruments = osmd.sheet.instruments;
               const voices = [];
               for (let i = 0; i < instruments.length; i++) {
                   voices.push(instruments[i].voices);
               }
               console.log(`count of voices: `, voices.length);

           }
        )
      .then(
        function() {
          window.osmd = osmd; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
          //console.log("e.target.result: " + e.target.result);
          osmd.render();
          //console.log("osmd after rendering: ", osmd);
          //now we'll get information about each voice in the file and handle the file appropriately


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

  