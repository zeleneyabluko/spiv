import { lightningChart } from "@lightningchart/lcjs";

document.addEventListener('DOMContentLoaded', () => {
    console.log('started rendering the chart!');
    const lc = lightningChart({
        license: "0002-n0i9AP8MN/ezP+gV3RZRzNiQvQvBKwBJvTnrFTHppybuCwWuickxBJV+q3qyoeEBGSE4hS0aeo3pySDywrb/iIsl-MEUCIAiJOU3BrUq71LqSlRAIFAI0dKK05qBRIJYHFmBoOoIHAiEA4Y55O1QpeuEkiuVktPGLauOHc1TzxNu85/vz/eNscz8=",
        licenseInformation: {
            appTitle: "LightningChart JS Trial",
            company: "LightningChart Ltd."
        },
    })
    const chart = lc
        .ChartXY({
            container: "soundFrequencyChart",
        })
        .setTitle("My first chart");

    const data = [
        { x: 0, y: 1.52 },
        { x: 1, y: 1.56 },
        { x: 2, y: 1.42 },
        { x: 3, y: 1.85 },
        { x: 4, y: 1.62 },
    ];

    // Add a line series.
    const lineSeries = chart.addLineSeries().setName("My data").add(data);
});