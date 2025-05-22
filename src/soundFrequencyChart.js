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

chart.axisX.setTickStrategy(AxisTickStrategies.Time)

chart.setTitle('Voice Pitch')

const notationData = [
    {x: 0, y: 3},
    {x: 1, y: 3},
    {x: 1, y: NaN},
    {x: 1, y: 2},
    {x: 3, y: 2}
]


// Add two line series.
const lineSeries = chart.addPointLineAreaSeries({ dataPattern: 'ProgressiveX' }).setAreaFillStyle(emptyFill).setName('Pitch');

// Add the points to each Series
lineSeries.add(notationData);

// Setup view nicely.
chart.axisY.setTitle('Sound Frequency').setUnits('Hz').setInterval({ start: 0, end: 3, stopAxisAfter: true })


});