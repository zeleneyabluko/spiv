
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const chartHeight = 360;  // notes area
const axisHeight = 30;    // time axis area
const marginLeft = 10;  // pixels from left edge (reduced to bring X axis closer to Y axis)
const marginRight = 40; //pixels from the right edge
const pxPerSec = 72;
const marginTop = 10;
const minHz = 80
const maxHz = 1000;

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
    axisCanvas.style.height = (chartHeight + axisHeight) + 'px'; // Include axis height to match full canvas
    axisCanvas.style.backgroundColor = '#f5f5dc'; // Match main canvas background
    axisCanvas.style.borderRight = 'none'; // Remove right border to blend with canvas
    axisCanvas.style.borderLeft = 'none'; // Remove left border
    axisCanvas.style.zIndex = '1000'; // Higher z-index
    axisCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    axisCanvas.style.display = 'block'; // Ensure it's visible
    axisCanvas.style.boxShadow = 'none'; // Remove any shadows
    
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
    const fullCanvasHeight = chartHeight + axisHeight;
    
    // Clear the canvas
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, 50, fullCanvasHeight);
    
    // Draw vertical axis line that extends to the edge (blends with main canvas)
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 0); // Extend to the very edge
    ctx.lineTo(50, fullCanvasHeight);
    ctx.stroke();
    
    // Set up text styling
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    // Define frequency labels (every 50Hz from 100Hz to 850Hz)
    const frequencyLabels = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
    
    // Draw frequency labels (only in the chart area, not in the axis area)
    frequencyLabels.forEach(freq => {
        // Calculate Y position for this frequency (only in chart area)
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
    const frequencyLabels = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
    
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
    
    // Draw vertical field boundaries
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    
    // Draw vertical lines every 5 seconds
    const tickEverySec = 1; // one small tick every second
    const bigTickEverySec = 5; // one big tick every 5 seconds
    
    for (let t = 0; t <= songLengthSec; t += tickEverySec) {
        const x = marginLeft + (t * pxPerSec);
        
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
        const x = marginLeft + (t * pxPerSec);

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
    export function drawNotes(songLengthSec, notationData, currentTimeSec = 0){
        function pitchToY(freq) {
            const range = maxHz - minHz;
            return chartHeight - ((freq - minHz) / range) * chartHeight;
        }

        const chartWidth = songLengthSec * pxPerSec;
        // Clear the chart area properly (from marginLeft to chartWidth, from 0 to chartHeight)
        ctx.clearRect(marginLeft, 0, chartWidth, chartHeight);

        notationData.forEach(note => {
            const x = marginLeft+note.start * pxPerSec;
            const w = note.length * pxPerSec;
            const y = pitchToY(note.freq);

            // Check if this note is currently being played
            const isCurrentlyPlaying = currentTimeSec >= note.start && currentTimeSec <= (note.start + note.length);
            
            if (isCurrentlyPlaying) {
                // Enhanced highlighting for currently playing notes
                
                // 1. Draw a glowing background effect
                ctx.shadowColor = '#0066ff';
                ctx.shadowBlur = 8;
                ctx.strokeStyle = '#ffffff'; // White core
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.stroke();
                
                // 2. Draw the main bright blue line
                ctx.shadowBlur = 0; // Reset shadow
                ctx.strokeStyle = '#0066ff'; // Bright blue
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.stroke();
                
                // 3. Add animated pulsing effect (subtle)
                const pulseIntensity = 0.3 + 0.2 * Math.sin(Date.now() * 0.01); // Slow pulse
                ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity})`; // Pulsing white overlay
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.stroke();
                
            } else {
                // Regular notes with normal blue
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.stroke();
            }
        });
    }

export function updatePlaybackCursor(currentTimeMs, songLengthMs, isPaused = false) {
    const currentTimeSec = currentTimeMs / 1000;
    const songLengthSec = songLengthMs / 1000;
    
    // Get the actual music playback time (excluding metronome count-in)
    let musicTimeSec = currentTimeSec;
    if (window.playbackProgressTracker) {
        const musicOnlyTime = window.playbackProgressTracker.getCurrentPlaybackProgressSeconds();
        if (musicOnlyTime > 0) {
            musicTimeSec = musicOnlyTime;
        }
    }
    
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
        
        // Redraw the notes with current playback time for highlighting
        const dataForChart = window.currentChartData;
        if (dataForChart) {
            drawNotes(songLengthSec, dataForChart.data, musicTimeSec);
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
    
    // Red cursor line removed - keeping scrolling and other functionality
    
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

