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

    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = document.getElementById('play-pause-icon');

    let isPlaying = false;

    if (playPauseBtn && playPauseIcon) {
        playPauseBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            if (isPlaying) {
                playPauseIcon.textContent = 'pause';
                playPauseBtn.setAttribute('aria-label', 'Pause');
                // TODO: Start playback here
            } else {
                playPauseIcon.textContent = 'play_arrow';
                playPauseBtn.setAttribute('aria-label', 'Play');
                // TODO: Pause playback here
            }
        });
    }
});
