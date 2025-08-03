export function defineCanvasSize(dataForChart, canvas){
    const ctx = canvas.getContext('2d');
    
    const songLengthSec = dataForChart.songLength/1000; // e.g. 2 minutes
    const pxPerSec = 80;       // e.g. 800px = 10 seconds visible
    
    canvas.width = songLengthSec * pxPerSec;
    console.log(`canvas width in px: `, canvas.width);
    //paint canvas blue
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}