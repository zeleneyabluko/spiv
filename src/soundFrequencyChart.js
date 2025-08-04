
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const chartHeight = 370;  // notes area
const axisHeight = 30;    // time axis area

export function defineCanvasSize(dataForChart){
    canvas.height = chartHeight + axisHeight;    
    const songLengthSec = dataForChart.songLength/1000; // e.g. 2 minutes
    const pxPerSec = 80;       // e.g. 800px = 10 seconds visible
    
    canvas.width = songLengthSec * pxPerSec;
    console.log(`canvas width in px: `, canvas.width);
    //paint canvas pale yellow
    ctx.fillStyle = '#f5f5dc'; // pale yellow color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawTimeAxis(songLengthSec, pxPerSec) {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, chartHeight);
    ctx.lineTo(canvas.width, chartHeight);
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";

    const tickEverySec = 1; // one small tick every second
    for (let t = 0; t <= songLengthSec; t += tickEverySec) {
        const x = t * pxPerSec;

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
            ctx.fillText(label, x, chartHeight + 20);
        }
    }
}
