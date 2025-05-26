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

chart.axisY.setTitle('Sound Frequency').setUnits('Hz').setInterval({ start: 0, end: 800, stopAxisAfter: true })
const xAxis = chart.xAxis;
const yAxis = chart.yAxis;

console.log(chart.getUserInteractions());
chart.setUserInteractions({
    rectangleZoom: {
        x: false,
        y: false
    },
    xAxis: {
        pan: {
            lmb: false,
            rmb: false,
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

chart.axisX.setTickStrategy(AxisTickStrategies.Time).setInterval({ start: 0, end: 10000});


});