//document.getElementById('uploadButton').addEventListener('click', uploadFile);
import { uploadFile } from "./uploadFile";
import { getDataForChart } from "./processingFile";
import { trackPitch, stopPitchTracking, isPitchTrackingActive } from "./pitchTracking.js";

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

(async () => {
    const OSMDClass = await loadOSMD();
    const osmd = new OSMDClass("osmdContainer");
})();

const transposeButton = document.getElementById('transpose-btn');
const transposeInput = document.getElementById('transpose');

// Pitch tracking button functionality
const pitchTrackingBtn = document.getElementById('pitchTrackingBtn');
let isPitchTrackingActive = false;

if (pitchTrackingBtn) {
    pitchTrackingBtn.addEventListener('click', async function() {
        if (!isPitchTrackingActive) {
            // Start pitch tracking
            console.log('Started pitch tracking!');
            // Check if microphone access is available
            if (window.microphoneManager) {
                // Try to refresh the microphone stream if needed
                if (window.microphoneManager.micAccessGranted && !window.microphoneManager.micStream) {
                    console.log('Permission granted but no stream, attempting to refresh...');
                    const refreshed = await window.microphoneManager.refreshMicrophoneStream();
                    if (!refreshed) {
                        alert('Failed to refresh microphone stream. Please try granting microphone access again.');
                        return;
                    }
                }
                
                if (window.microphoneManager.hasMicrophoneAccess()) {
                    // Use async/await for pitch tracking
                    try {
                        // Get the LinearTimingSource audio context (not BasicPlayer)
                        const audioContext = window.linearTimingSourceAudioContext;
                        if (!audioContext) {
                            throw new Error('LinearTimingSource audio context not available');
                        }
                        console.log('Using LinearTimingSource audio context:', audioContext);
                        await trackPitch(audioContext);
                        isPitchTrackingActive = true;
                        pitchTrackingBtn.textContent = 'Stop pitch tracking';
                        pitchTrackingBtn.classList.remove('btn-primary');
                        pitchTrackingBtn.classList.add('btn-danger');
                    } catch (error) {
                        console.error('Failed to start pitch tracking:', error);
                        alert('Failed to start pitch tracking: ' + error.message);
                    }
                } else {
                    alert('Please enable microphone access first by clicking on the red overlay that appears when you upload a file.');
                }
            } else {
                alert('Microphone manager not available. Please upload a music file first to initialize the system.');
            }
        } else {
            // Stop pitch tracking
            console.log('Stopped pitch tracking!');
            stopPitchTracking();
            isPitchTrackingActive = false;
            pitchTrackingBtn.textContent = 'Start pitch tracking';
            pitchTrackingBtn.classList.remove('btn-danger');
            pitchTrackingBtn.classList.add('btn-primary');
        }
    });
}

transposeButton.addEventListener('click', async function() {
    const semitones = parseInt(transposeInput.value, 10);
    window.osmd.sheet.Transpose = semitones;
    window.osmd.updateGraphic();
    window.osmd.render();
    
    // Update the chart with new transposed data
    const newDataForChart = getDataForChart(window.osmd.sheet);
    const newNotationData = newDataForChart.data;
    const songLengthSec = newDataForChart.songLength;
    
    console.log('new notation data: ', newNotationData);
    
    // Re-render the chart with transposed data
    const chartModule = await import('./soundFrequencyChart.js');
    const canvas = document.getElementById('chart');
    
    // Clear and redraw the canvas
    chartModule.defineCanvasSize(newDataForChart);
    chartModule.drawTimeAxis(songLengthSec);
    chartModule.drawNotes(songLengthSec, newNotationData);
});
});
