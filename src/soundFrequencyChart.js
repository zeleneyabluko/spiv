
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const chartHeight = 360;  // notes area
const axisHeight = 30;    // time axis area
const marginLeft = 40;  // pixels from left edge
const marginRight = 40; //pixels from the right edge
const pxPerSec = 72;
const marginTop = 10;
const minHz = 80
const maxHz = 700;

// Make chart variables available globally for pitch tracking
window.chartHeight = chartHeight;
window.marginLeft = marginLeft;
window.pxPerSec = pxPerSec;
window.minHz = minHz;
window.maxHz = maxHz;

export function defineCanvasSize(dataForChart){
    canvas.height = chartHeight + axisHeight;    
    const songLengthSec = dataForChart.songLength;     
    canvas.width = songLengthSec * pxPerSec+marginLeft+marginRight;
    console.log(`canvas width in px: `, canvas.width);
    //paint canvas pale yellow
    ctx.fillStyle = '#f5f5dc'; // pale yellow color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Wait a bit for the canvas wrapper to be properly sized, then create the axis
    setTimeout(() => {
        createFixedFrequencyAxis();
    }, 100);
}

/**
 * Create a fixed frequency axis canvas that stays in place during scrolling
 */
function createFixedFrequencyAxis() {
    // Remove any existing frequency axis canvas
    const existingCanvas = document.getElementById('frequency-axis-canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // Create the fixed canvas
    const axisCanvas = document.createElement('canvas');
    axisCanvas.id = 'frequency-axis-canvas';
    axisCanvas.width = 50;
    axisCanvas.height = chartHeight;
    
    // Get the canvas wrapper and its container
    const canvasWrapper = document.getElementById('canvasWrapper');
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    
    // Check if wrapper has valid dimensions
    if (wrapperRect.width === 0 || wrapperRect.height === 0) {
        // Use a fallback position - assume it's at the top-left of the viewport
        axisCanvas.style.position = 'fixed';
        axisCanvas.style.left = '0px';
        axisCanvas.style.top = '0px';
    } else {
        // Style the canvas to be fixed and positioned next to the scrolling container
        axisCanvas.style.position = 'fixed';
        axisCanvas.style.left = (wrapperRect.left - 50) + 'px'; // Position to the left of the container
        axisCanvas.style.top = wrapperRect.top + 'px';
    }
    
    axisCanvas.style.width = '50px';
    axisCanvas.style.height = chartHeight + 'px';
    axisCanvas.style.backgroundColor = '#f5f5dc';
    axisCanvas.style.borderRight = '2px solid #000';
    axisCanvas.style.borderLeft = '2px solid #000'; // Add left border for visibility
    axisCanvas.style.zIndex = '1000'; // Higher z-index
    axisCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    axisCanvas.style.display = 'block'; // Ensure it's visible
    
    // Get the canvas context
    const axisCtx = axisCanvas.getContext('2d');
    
    // Draw the frequency axis on the fixed canvas
    drawFrequencyAxisOnCanvas(axisCtx);
    
    // Add the canvas to the document body (completely separate from scrolling container)
    document.body.appendChild(axisCanvas);
    
    // Update position when window is resized or scrolled
    const updatePosition = () => {
        const newRect = canvasWrapper.getBoundingClientRect();
        axisCanvas.style.left = (newRect.left - 50) + 'px';
        axisCanvas.style.top = newRect.top + 'px';
    };
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
}

/**
 * Draw the frequency axis on a specific canvas context
 */
function drawFrequencyAxisOnCanvas(ctx) {
    // Clear the canvas
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, 50, chartHeight);
    
    // Draw vertical axis line
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(48, chartHeight);
    ctx.stroke();
    
    // Set up text styling
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    // Define frequency labels (every 50Hz from 100Hz to 650Hz)
    const frequencyLabels = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650];
    
    // Draw frequency labels
    frequencyLabels.forEach(freq => {
        // Calculate Y position for this frequency
        const y = chartHeight - ((freq - minHz) / (maxHz - minHz)) * chartHeight;
        
        // Draw frequency label
        ctx.fillText(freq + " Hz", 45, y);
    });
}

/**
 * Draw horizontal grid lines on the canvas (these will scroll with the chart)
 */
function drawHorizontalGridLines() {
    // Define frequency labels for grid lines
    const frequencyLabels = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650];
    
    // Draw horizontal grid lines
    frequencyLabels.forEach(freq => {
        // Calculate Y position for this frequency
        const y = chartHeight - ((freq - minHz) / (maxHz - minHz)) * chartHeight;
        
        // Draw horizontal grid line
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(marginLeft, y);
        ctx.lineTo(canvas.width - marginRight, y);
        ctx.stroke();
    });
}

export function drawTimeAxis(songLengthSec) {
   
    const effectiveWidth = canvas.width - marginLeft - marginRight;
    
    // Draw vertical field boundaries
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    
    // Draw vertical lines every 5 seconds
    const tickEverySec = 1; // one small tick every second
    const bigTickEverySec = 5; // one big tick every 5 seconds
    
    for (let t = 0; t <= songLengthSec; t += tickEverySec) {
        const x = marginLeft + (t * pxPerSec * effectiveWidth / (songLengthSec * pxPerSec));
        
        if (t % bigTickEverySec === 0) {
            // Draw vertical field line
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, chartHeight);
            ctx.stroke();
        }
    }
    
    // Draw horizontal time axis
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginLeft, chartHeight);
    ctx.lineTo(canvas.width - marginRight, chartHeight);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.textAlign = "center";

    for (let t = 0; t <= songLengthSec; t += tickEverySec) {
        const x = marginLeft + (t * pxPerSec * effectiveWidth / (songLengthSec * pxPerSec));

        // Tick marks
        ctx.beginPath();
        ctx.moveTo(x, chartHeight);
        ctx.lineTo(x, chartHeight + 5);
        ctx.stroke();

        // Bigger label every 5 seconds
        if (t % 5 === 0) {
            const minutes = Math.floor(t / 60);
            const seconds = Math.floor(t % 60).toString().padStart(2, "0");
            const label = `${minutes}:${seconds}`;
            
            // Add a subtle text shadow for better readability
            ctx.fillStyle = "#333";
            ctx.fillText(label, x, chartHeight + 20);
            
            // Optional: Add a subtle background for better contrast
            const textMetrics = ctx.measureText(label);
            const textWidth = textMetrics.width;
            const padding = 4;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(x - textWidth/2 - padding, chartHeight + 8, textWidth + padding*2, 16);
            
            // Draw the text again on top
            ctx.fillStyle = "#333";
            ctx.fillText(label, x, chartHeight + 20);
        }
    }

    function pitchToY(freq) {
        const range = maxHz - minHz;
        return chartHeight - ((freq - minHz) / range) * chartHeight;
    }
}
    export function drawNotes(songLengthSec, notationData){
        function pitchToY(freq) {
            const range = maxHz - minHz;
            return chartHeight - ((freq - minHz) / range) * chartHeight;
        }

        const chartWidth = songLengthSec * pxPerSec;
        // Clear the chart area properly (from marginLeft to chartWidth, from 0 to chartHeight)
        ctx.clearRect(marginLeft, 0, chartWidth, chartHeight);
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;

        notationData.forEach(note => {

            const x = marginLeft+note.start * pxPerSec;
            const w = note.length * pxPerSec;
            const y = pitchToY(note.freq);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y);
            ctx.stroke();
        });


    }

export function updatePlaybackCursor(currentTimeMs, songLengthMs, isPaused = false) {
    const currentTimeSec = currentTimeMs / 1000;
    const songLengthSec = songLengthMs / 1000;
    
    console.log('updatePlaybackCursor called with isPaused:', isPaused);
    
    // Calculate cursor position
    const cursorX = marginLeft + (currentTimeSec * pxPerSec);
    
    // Only clear and redraw everything if not paused
    if (!isPaused) {
        console.log('Not paused - clearing and redrawing canvas');
        // Clear the cursor area by redrawing the background
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(marginLeft, 0, songLengthSec * pxPerSec, chartHeight);
        
        // Redraw the horizontal grid lines
        drawHorizontalGridLines();
        
        // Redraw the time axis
        drawTimeAxis(songLengthSec);
        
        // Redraw the notes
        const dataForChart = window.currentChartData;
        if (dataForChart) {
            drawNotes(songLengthSec, dataForChart.data);
        }
        
        // Always redraw the complete pitch line when not paused
        if (window.drawPitchLine) {
            console.log('Redrawing complete pitch line during playback');
            window.drawPitchLine();
        }
    } else {
        console.log('Paused - only drawing cursor line, preserving canvas content');
        // Don't clear anything when paused - just draw the cursor
    }
    
    // Always draw red cursor line (even when paused)
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, chartHeight);
    ctx.stroke();
    
    // Draw cursor timestamp
    const minutes = Math.floor(currentTimeSec / 60);
    const seconds = Math.floor(currentTimeSec % 60).toString().padStart(2, "0");
    const timestamp = `${minutes}:${seconds}`;
    
    ctx.fillStyle = "#ff0000";
    
    // Always redraw the pitch line (even when paused)
    if (window.drawPitchLine) {
        console.log('Drawing pitch line during updatePlaybackCursor');
        window.drawPitchLine();
    } else {
        console.log('drawPitchLine function not available');
    }
}

