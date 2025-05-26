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

chart.axisX.setTickStrategy(AxisTickStrategies.Time)

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


// --- Initial settings ---

// 1. Set initial X-axis view to 0–10 seconds
xAxis.setInterval(0, 10000);

// 2. Disable zooming on X and Y axis
xAxis.setAxisInteractionZoomByWheeling(false);
xAxis.setAxisInteractionZoomByDragging(false);
yAxis.setAxisInteractionZoomByWheeling(false);
yAxis.setAxisInteractionZoomByDragging(false);

// 3. Disable chart-level zoom interactions
chart.setChartInteractionZoomByWheel(false);
chart.setChartInteractionZoomByDrag(false);

// 4. Optional: disable auto scroll/fit behaviors
xAxis.setScrollStrategy(undefined);

// 5. Enable horizontal panning with mouse wheel
xAxis.onAxisInteractionAreaMouseWheel((_, event) => {
    const delta = event.deltaY > 0 ? 1 : -1; // 1 = scroll right, -1 = scroll left
    const { start, end } = xAxis.getInterval();
    const viewDuration = end - start;
    const panStep = viewDuration * 0.1; // Scroll 10% of current view

    // Clamp panning to song duration (0 to 60s for example)
    const songStart = 0;
    const songEnd = 60000;

});
});