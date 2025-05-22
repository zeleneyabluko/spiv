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
//const { lightningChart, AxisTickStrategies, Themes, emptyFill } = lcjs

// Create a XY Chart.
const chart = lc.ChartXY({
    theme: Themes.darkGold,
})

chart.axisX.setTickStrategy(AxisTickStrategies.DateTime)

chart.setTitle('Voice Pitch')

const gasoline = [
    { x: new Date(2022, 0, 1).getTime(), y: 1.35 },
    { x: new Date(2022, 0, 2).getTime(), y: 1.35 },
    { x: new Date(2022, 0, 3).getTime(), y: 1.35 },
    { x: new Date(2022, 0, 4).getTime(), y: 1.35 },
    { x: new Date(2022, 0, 5).getTime(), y: 1.9 },
    { x: new Date(2022, 0, 6).getTime(), y: 1.9 },
    { x: new Date(2022, 0, 7).getTime(), y: 1.9 },
    { x: new Date(2022, 0, 8).getTime(), y: 1.92 },
    { x: new Date(2022, 0, 9).getTime(), y: 1.5 },
    { x: new Date(2022, 0, 10).getTime(), y: 1.5 },
    { x: new Date(2022, 0, 11).getTime(), y: 1.3 },
    { x: new Date(2022, 0, 12).getTime(), y: 1.3 },
    { x: new Date(2022, 0, 13).getTime(), y: 1.3 },
    { x: new Date(2022, 0, 14).getTime(), y: 1.3 },
    { x: new Date(2022, 0, 15).getTime(), y: 1.3 },
    { x: new Date(2022, 0, 16).getTime(), y: 1.32 },
    { x: new Date(2022, 0, 17).getTime(), y: 1.4 },
    { x: new Date(2022, 0, 18).getTime(), y: 1.44 },
    { x: new Date(2022, 0, 19).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 20).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 21).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 22).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 23).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 24).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 25).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 26).getTime(), y: 1.02 },
    { x: new Date(2022, 0, 27).getTime(), y: 1.3 },
    { x: new Date(2022, 0, 28).getTime(), y: 1.3 },
    { x: new Date(2022, 0, 29).getTime(), y: 1.3 },
]

// Add two line series.
const lineSeries2 = chart.addPointLineAreaSeries({ dataPattern: 'ProgressiveX' }).setAreaFillStyle(emptyFill).setName('Gasoline')

// Add the points to each Series
lineSeries2.add(gasoline)

// Setup view nicely.
chart.axisY.setTitle('Sound Frequency').setUnits('Hz').setInterval({ start: 0, end: 3, stopAxisAfter: true })


});