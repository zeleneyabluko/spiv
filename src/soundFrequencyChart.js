import { lightningChart, AxisTickStrategies, Themes, emptyFill } from "@lightningchart/lcjs";
import { getDataForChart } from "./processingFile";

document.addEventListener('DOMContentLoaded', () => {
    console.log('started rendering the chart!');

const lc = lightningChart({
    license: "0002-n0i9AP8MN/ezP+gV3RZRzNiQvQvBKwBJvTnrFTHppybuCwWuickxBJV+q3qyoeEBGSE4hS0aeo3pySDywrb/iIsl-MEUCIAiJOU3BrUq71LqSlRAIFAI0dKK05qBRIJYHFmBoOoIHAiEA4Y55O1QpeuEkiuVktPGLauOHc1TzxNu85/vz/eNscz8=",
    licenseInformation: {
        appTitle: "LightningChart JS Trial",
        company: "LightningChart Ltd."
    },
})

// Create a XY Chart.
const chart = lc.ChartXY({
    theme: Themes.darkGold,
})

console.log(chart);



chart.setTitle('Voice Pitch');

// Add line series.
const lineSeries = chart.addPointLineAreaSeries({ dataPattern: 'ProgressiveX' }).setAreaFillStyle(emptyFill).setName('Pitch');
lineSeries.setStrokeStyle((stroke) => stroke.setThickness(7));

// Add the points to series
window.series = lineSeries;
// Setup view nicely.

chart.axisY.setTitle('Sound Frequency').setUnits('Hz').setInterval({ start: 0, end: 600, stopAxisAfter: true })
// Assuming you already have chart, xAxis, yAxis, and series setup:
const xAxis = chart.xAxis;
const yAxis = chart.yAxis;

// Song settings in milliseconds
//const songDurationMs = 60000; // 60 seconds
const viewDurationMs = 10000; // 10 seconds

// 1. Show first 10 seconds


// 2. Disable all built-in zoom/pan interactions
/*chart.setChartInteractions(false);
xAxis.setMouseInteractions(false); // disables zoom/pan/drag for xAxis
yAxis.setMouseInteractions(false); // disables zoom/pan/drag for yAxis
chart.setChartInteractionZoomByWheel(false);
chart.setChartInteractionZoomByDrag(false);
chart.setChartInteractionFitByDrag(false);
xAxis.setNibInteractionScaleByDragging(false);
xAxis.setNibInteractionScaleByWheeling(false);
yAxis.setNibInteractionScaleByDragging(false);
yAxis.setNibInteractionScaleByWheeling(false);*/

//chart.axisX.setTickStrategy(AxisTickStrategies.Time);
console.log(chart.getUserInteractions());
chart.setUserInteractions({
    rectangleZoom: {
        x: false,
        y: false
    },
    xAxis: {
        pan: {
            lmb: true,
            wheel: {},
        },
        zoom: {
            wheel: false
        }
    },
    zoom: {
        wheel: false,
        x: false,
        y: false
    }
});
//chart.setUserInteractions(undefined);
chart.axisX.setTickStrategy(AxisTickStrategies.Time).setInterval({ start: 0, end: 10000});






// 3. Manually handle horizontal scroll using mouse wheel
/*chart.onMouseWheel((_, event) => {
    event.preventDefault(); // 🔒 Prevent internal zoom handling

    const delta = event.deltaY > 0 ? 1 : -1;
    const { start, end } = xAxis.getInterval();
    const scrollAmount = viewDurationMs * 0.1; // scroll 10% of view

    let newStart = start + delta * scrollAmount;
    let newEnd = end + delta * scrollAmount;

    // Clamp to 0–60,000 ms
    if (newStart < 0) {
        newStart = 0;
        newEnd = viewDurationMs;
    } else if (newEnd > songDurationMs) {
        newEnd = songDurationMs;
        newStart = songDurationMs - viewDurationMs;
    }

    xAxis.setInterval(newStart, newEnd);
});*/


});