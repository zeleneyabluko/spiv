import { NoteState, OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { returnTracksVisibility } from "./returnTracksVisibility";
import { deriveNotesForVoice } from "./deriveNotesForVoice";



export  function  uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log('file uploading');
  const file = inputField.files[0];
  let reader = new FileReader();

  if (file.name.match('.*\.mxl')) {
    // have to read as binary, otherwise JSZip will throw ("corrupted zip: missing 37 bytes" or similar)
    reader.readAsBinaryString(file);
  } else {
    reader.readAsText(file);
  }

  

  reader.onload = function(e) {
    sessionStorage.setItem('fileName', file.name);
    sessionStorage.setItem('fileContent', e.target.result);

    let osmd = new OpenSheetMusicDisplay("osmdContainer", {
      // set options here
      backend: "svg",
      drawFromMeasureNumber: 1,
      drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER // draw all measures, up to the end of the sample
    });
       
    osmd
      .load(e.target.result)
      .then(
        function() {
          window.osmd = osmd; // give access to osmd object in Browser console, e.g. for osmd.setOptions()
          
          const tracksVisibility = returnTracksVisibility(osmd);
          console.log(tracksVisibility);
          
          const arr = Object.keys(tracksVisibility);
          let voiceTrackId = null;
          
          
          //hiding the tracks which don't contain the voice:

          for (let i = 0; i < arr.length; i++) {
            
            
            if (tracksVisibility[arr[i]] == 'Hidden') {
              
              console.log ('track ' + arr[i] + ' is hidden');
              osmd.sheet.Instruments[arr[i]].Visible = false;
            
          } else {
            console.log('Voice track found!');
            console.log(osmd.sheet.Instruments[arr[i]]);
            sessionStorage.setItem('voiceTrackId', arr[i]);
            
            
            

          }}  

         osmd.render();    
                 
         osmd.cursor.show(); // this would show the cursor on the first note
        
         

         //osmd.cursor.next(); 
         //console.log(osmd.cursor.VoicesUnderCursor());
        
        
        })
        .then(
          //const voiceTrackId = sessionStorage.get('voiceTrackId');
          function() {deriveNotesForVoice(osmd, sessionStorage.getItem('voiceTrackId'));}
        );
               
}};


  
  
 
  




  
  
   

  