import { lightningChart, AxisTickStrategies, Themes, emptyFill } from '@lightningchart/lcjs';
import { getDataForChart } from "./processingFile";

document.addEventListener('DOMContentLoaded', () => {
    console.log('started rendering the chart!');

    const lc = lightningChart({
        license: "0002-n6+6UavdvwEhy7etiSPXCSiHjl3AKwCuumi/xLgeNdKwslGbDwzBE6Yoqp218LXQkdeqcXKiLrhvDNDl8eD+b4x0-MEUCIQCIc7NEayDOy7DGtjbAheDBMD/jkq07GRFvs87PDI8UjgIgJvMFm6zRkCH3rmx6DUbWazsAC41iCtSIoAbJMRlAuWc=",
        licenseInformation: {
            appTitle: "LightningChart JS Trial",
            company: "LightningChart Ltd."
        },
    })

// Create a XY Chart.
const chart = lc.ChartXY({
    theme: Themes.darkGold,
    container: 'soundFrequencyChart',
    containerBackground: { fillStyle: { color: '#000000' } },
    height: 250,
    width: '100%'
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

window.soundFrequencyChart = chart;

});