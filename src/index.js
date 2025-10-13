//document.getElementById('uploadButton').addEventListener('click', uploadFile);
import { uploadFile, deriveFileContent } from "./uploadFile";
import { getDataForChart } from "./processingFile";
import { trackPitch, stopPitchTracking, isPitchTrackingActive } from "./pitchTracking.js";

// Note: Auto-loading functionality has been removed for simplicity
// Files are only saved to localStorage when uploaded, not automatically loaded

// Function to reset the application to initial state
function resetApplication() {
    try {
        // Clear localStorage
        localStorage.removeItem('spiv_uploaded_file');
        localStorage.removeItem('spiv_uploaded_file_content');
        
        // Clear file input
        const musicxmlFile = document.getElementById('musicxmlFile');
        if (musicxmlFile) {
            musicxmlFile.value = '';
        }
        
        // Hide transpose input
        const transposeInput = document.getElementById('transposeInput');
        if (transposeInput) {
            transposeInput.classList.remove('show');
        }
        
        // Hide canvas wrapper
        const canvasWrapper = document.getElementById('canvasWrapper');
        if (canvasWrapper) {
            canvasWrapper.classList.remove('show');
        }
        
        // Hide notation container
        const notationContainer = document.querySelector('.notation-container');
        if (notationContainer) {
            notationContainer.classList.remove('show');
            notationContainer.classList.add('collapsed');
        }
        
        // Hide notation toggle button
        const toggleButton = document.getElementById('toggleNotation');
        if (toggleButton) {
            toggleButton.classList.remove('show');
            toggleButton.textContent = 'Hide Music Sheet';
            toggleButton.classList.remove('btn-success');
            toggleButton.classList.add('btn-secondary');
        }
        
        // Clear OSMD container
        const osmdContainer = document.getElementById('osmdContainer');
        if (osmdContainer) {
            osmdContainer.innerHTML = '';
        }
        
        // Hide control panel and clear its contents
        const controlPanelContainer = document.getElementById('controlPanelContainer');
        if (controlPanelContainer) {
            controlPanelContainer.style.display = 'none';
            controlPanelContainer.innerHTML = '';
        }

        // Hide any playback buttons that might have been created
        const playbackButtons = document.querySelector('.playback-buttons');
        if (playbackButtons) {
            playbackButtons.style.display = 'none';
        }

        // Hide any control panel elements
        const controlPanel = document.querySelector('.control-panel');
        if (controlPanel) {
            controlPanel.style.display = 'none';
        }
        
        // Clear main canvas completely
        const canvas = document.getElementById('chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            // Clear the entire canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Reset canvas size to clear any potential scaling issues
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            canvas.width = originalWidth;
            canvas.height = originalHeight;
            // Clear again after reset
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Remove the frequency axis canvas (Hz scale)
        const frequencyAxisCanvas = document.getElementById('frequency-axis-canvas');
        if (frequencyAxisCanvas) {
            frequencyAxisCanvas.remove();
        }
        
        // Reset transpose input value
        const transposeInputField = document.getElementById('transpose');
        if (transposeInputField) {
            transposeInputField.value = '0';
        }
        
        // Clear global variables
        if (window.osmd) {
            window.osmd = null;
        }
        if (window.currentChartData) {
            window.currentChartData = null;
        }
        if (window.updatePlaybackCursor) {
            window.updatePlaybackCursor = null;
        }
        
        console.log('Application reset to initial state');
        
    } catch (error) {
        console.error('Error resetting application:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("index.js - DOM loaded");
    const musicxmlFile = document.getElementById("musicxmlFile");
    console.log("File input element:", musicxmlFile); // Debug log
    
    if (!musicxmlFile) {
        console.error("Could not find musicxmlFile element!");
        return;
    }
    
    musicxmlFile.addEventListener("change", async(e) => {
        console.log("File input change event triggered");
        const { binaryString, fileName } = await deriveFileContent(e);
        await uploadFile(binaryString, fileName);

    });

    // Load selected sample: fetch -> ArrayBuffer -> binaryString -> uploadFile
    const sampleSelect = document.getElementById('sampleSelect');
    if (sampleSelect) {
        sampleSelect.addEventListener('change', async (e) => {
            const target = e.target;
            const relPath = target && target.value;
            console.log('Sample selected value:', relPath);
            if (!relPath) return;

            try {
                // Ensure absolute HTTP path under public/
                const url = relPath.startsWith('/') ? relPath : `/${relPath}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to fetch sample: ${url}`);
                const buf = await res.arrayBuffer();
                const bytes = new Uint8Array(buf);
                let binaryString = '';
                for (let i = 0; i < bytes.length; i++) binaryString += String.fromCharCode(bytes[i]);
                const fileName = relPath.split('/').pop() || 'sample.mxl';
                await uploadFile(binaryString, fileName);
            } catch (err) {
                console.error('Error loading sample:', err);
                alert('Failed to load sample. Ensure files are in public/ and server restarted.');
            }
        });
    }

    
    // Add reset button functionality
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetApplication);
    }

    // Reset playback control button
    const resetPlaybackButton = document.getElementById('resetPlaybackButton');
    if (resetPlaybackButton) {
        resetPlaybackButton.addEventListener('click', () => {
            try {
                if (typeof window.resetPlaybackAndPitch === 'function') {
                    window.resetPlaybackAndPitch();
                } else if (typeof resetPlaybackAndPitch === 'function') {
                    resetPlaybackAndPitch();
                } else {
                    console.warn('resetPlaybackAndPitch not available');
                }
            } catch (error) {
                console.error('Error triggering resetPlaybackAndPitch:', error);
            }
        });
    }
    
    // Note: Auto-loading from localStorage has been removed for simplicity
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
    chartModule.drawNotes(songLengthSec, newNotationData, 0);
    
    // Update the global chart data so playback cursor uses transposed data
    window.currentChartData = newDataForChart;
});
});
