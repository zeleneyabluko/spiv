//document.getElementById('uploadButton').addEventListener('click', uploadFile);
import { uploadFile } from "./uploadFile";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

document.addEventListener('DOMContentLoaded', () => {
    console.log("index.js - DOM loaded");
    const musicxmlFile = document.getElementById("musicxmlFile");
    console.log("File input element:", musicxmlFile); // Debug log
    
    if (!musicxmlFile) {
        console.error("Could not find musicxmlFile element!");
        return;
    }
    
    musicxmlFile.addEventListener("change", (e) => {
        console.log("File input change event triggered");
        uploadFile(e);
    });
    //load osmd lib

    const loadOSMD = () => {
		return new Promise((resolve) => {
			const check = () => {
				const OSMD =
					window.OpenSheetMusicDisplay ||
					window.opensheetmusicdisplay?.OpenSheetMusicDisplay;
				if (OSMD) resolve(OSMD);
				else setTimeout(check, 50);
			};
			check();
		});
	};
/*
	onMounted(async () => {
		const OSMDClass = await loadOSMD();
		const osmd = new OSMDClass("osmdContainer");
});*/
(async () => {
    const OSMDClass = await loadOSMD();
    const osmd = new OSMDClass("osmdContainer");
})();

const transposeButton = document.getElementById('transpose-btn');
const transposeInput = document.getElementById('transpose');

transposeButton.addEventListener('click',function() {
    const semitones = Number(transposeInput.value);
    window.osmd.sheet.Transpose = semitones;
    window.osmd.updateGraphic();
    window.osmd.render();
  } );
});
