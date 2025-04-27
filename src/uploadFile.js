import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

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
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER,
      partIndices: [] // Will be populated with vocal part indices
    });
    console.log('osmd created')
    
    sessionStorage.setItem('fileName', file.name);
  
    osmd
      .load(e.target.result)
      .then(
        function() {
          // Find vocal/voice parts
          const vocalPartIndices = [];
          osmd.sheet.Parts.forEach((part, index) => {
            const partName = part.Name?.toLowerCase() || '';
            if (partName.includes('voice') || partName.includes('vocal') || 
                partName.includes('soprano') || partName.includes('alto') || 
                partName.includes('tenor') || partName.includes('bass')) {
              vocalPartIndices.push(index);
            }
          });
          
          // If vocal parts found, update the display
          if (vocalPartIndices.length > 0) {
            console.log(vocalPartIndices)
            osmd.setOptions({ partIndices: vocalPartIndices });
          }
          
          window.osmd = osmd;
          osmd.render();
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

  