import { lightningChart } from "@lightningchart/lcjs";
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
    const chart = lc
        .ChartXY({
            container: "soundFrequencyChart",
        })
        .setTitle("My first chart");
    
    window.chart = chart;

    console.log('sheet processed: ', window.osmd.sheet);    

    const data = getDataForChart(window.osmd.sheet).data;
    console.log('data: ', data);

    // Add a line series.
    const lineSeries = chart.addSegmentSeries().setName("My data").add(data);
    
});