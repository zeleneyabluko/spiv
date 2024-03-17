import Chart from 'chart.js/auto'
//import { deriveNotesForVoice } from './deriveNotesForVoice.js';

(async function soundDisplayingChart() {
  console.log('building the chart')
  let rawdataFromStorage = sessionStorage.getItem('rawData');
  let rawdata = JSON.parse(rawdataFromStorage);
 
 console.log('rawdata');
 console.log(rawdata);

let songNotation = [];
 rawdata.forEach(point => {
  songNotation.push({ x: point.time, y: point.frequency });
  songNotation.push({x: (point.time+point.duration), y: point.frequency});
})

// Convert data to Chart.js format
var chartData = {
  labels: songNotation.map(point => point.time),
  datasets: [{
     label: 'Song notation',
     data: songNotation,
     borderColor: 'rgba(75, 192, 192, 1)',
     borderWidth: 2,
     pointRadius: 0.5,
     pointBackgroundColor: 'rgba(75, 192, 192, 1)',
     fill: false,
  }]
};

var options = {
  scales: {
     x: {
        type: 'linear',
        position: 'bottom',
        title: {
           display: true,
           text: 'Time (seconds)'
        }
     },
     y: {
        type: 'linear',
        position: 'left',
        title: {
           display: true,
           text: 'Sound Frequency'
        }
     }
  }
};

var ctx = document.getElementById('chart').getContext('2d');
var myChart = new Chart(ctx, {
  type: 'line',
  data: chartData,
  options: options,
});
})();



//TODO:
//find out how chart.update works, and where should be called. So that the chart is updated upon uploading the file, now I have to do this manually. probably should export var from the class file, then use it in uploadFile function
//adjust X axis to display only a part of the song (this is tbd later)