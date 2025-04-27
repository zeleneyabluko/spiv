import { Instrument, OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export function uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log('file uploading');
  const file = inputField.files[0];
  let reader = new FileReader();

  reader.onload = function(e) {
    // First create a temporary instance to find vocal parts
    let tempOsmd = new OpenSheetMusicDisplay("osmdContainer", {
      backend: "svg",
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER
    });
    
    tempOsmd
      .load(e.target.result)
      .then(
        function() {
          // Find vocal/voice parts
          const vocalPartIndices = [];
          tempOsmd.sheet.Instruments.forEach((part, index) => {
            console.log(part.nameLabel.text);
            const partName = part.nameLabel.text.toLowerCase() || '';
            if (partName.includes('voice') || partName.includes('vocal') || 
                partName.includes('soprano') || partName.includes('alto') || 
                partName.includes('tenor') || partName.includes('bass')) {
              vocalPartIndices.push(index);
            }
          });
          
          console.log('Found vocal parts:', vocalPartIndices.length);
          
          // Clear the container
          document.getElementById("osmdContainer").innerHTML = '';
          
          // Create new instance with only vocal parts
          let osmd = new OpenSheetMusicDisplay("osmdContainer", {
            backend: "svg",
            drawFromMeasureNumber: 1,
            drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER,
          });
          
          sessionStorage.setItem('fileName', file.name);
          
          // Load and render with the new instance
          osmd
            .load(e.target.result)
            .then(function() {
              window.osmd = osmd;
              osmd.render();
              osmd.cursor.show();
            });
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

  