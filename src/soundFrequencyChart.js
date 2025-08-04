
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

export function defineCanvasSize(dataForChart){
    canvas.height = chartHeight + axisHeight;    
    const songLengthSec = dataForChart.songLength;     
    canvas.width = songLengthSec * pxPerSec+marginLeft+marginRight;
    console.log(`canvas width in px: `, canvas.width);
    //paint canvas pale yellow
    ctx.fillStyle = '#f5f5dc'; // pale yellow color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawTimeAxis(songLengthSec) {
    console.log('drawTimeAxis called with:', songLengthSec);
    console.log('canvas width:', canvas.width);
    console.log('marginLeft:', marginLeft, 'marginRight:', marginRight);
    
    const effectiveWidth = canvas.width - marginLeft - marginRight;
    console.log('effectiveWidth:', effectiveWidth);
    
    // Draw vertical field boundaries
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    
    // Draw vertical lines every 5 seconds
    const tickEverySec = 1; // one small tick every second
    const bigTickEverySec = 5; // one big tick every 5 seconds
    
    for (let t = 0; t <= songLengthSec; t += tickEverySec) {
        const x = marginLeft + (t * pxPerSec * effectiveWidth / (songLengthSec * pxPerSec));
        console.log('tick at time', t, 'x position:', x);
        
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
    ctx.font = "12px sans-serif";
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
            console.log('drawing label:', label, 'at x:', x);
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

export function updatePlaybackCursor(currentTimeMs, songLengthMs) {
    const currentTimeSec = currentTimeMs / 1000;
    const songLengthSec = songLengthMs / 1000;
    
    // Calculate cursor position
    const cursorX = marginLeft + (currentTimeSec * pxPerSec);
    
    // Clear the cursor area by redrawing the background
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(marginLeft, 0, songLengthSec * pxPerSec, chartHeight);
    
    // Redraw the time axis
    drawTimeAxis(songLengthSec);
    
    // Redraw the notes
    const dataForChart = window.currentChartData;
    if (dataForChart) {
        drawNotes(songLengthSec, dataForChart.data);
    }
    
    // Draw red cursor line
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
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(timestamp, cursorX, 15);
}

