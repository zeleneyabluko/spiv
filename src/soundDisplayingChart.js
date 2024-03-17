import Chart from 'chart.js/auto'
//import { deriveNotesForVoice } from './deriveNotesForVoice.js';

(async function soundDisplayingChart() {
  console.log('building the chart')
  let rawdataFromStorage = sessionStorage.getItem('rawData');
  let rawdata = JSON.parse(rawdataFromStorage);
 
 console.log('rawdata');
 console.log(rawdata);

let data = [];
 rawdata.forEach(point => {
  data.push({ x: point.time, y: point.frequency });
  data.push({x: (point.time+point.duration), y: point.frequency});
})
console.log(data);

// Convert data to Chart.js format
var chartData = {
  labels: data.map(point => point.time),
  datasets: [{
     label: 'Sound Frequency',
     data: data,
     borderColor: 'rgba(75, 192, 192, 1)',
     borderWidth: 2,
     pointRadius: 5,
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
  options: options
});
})();


// display notes and time
// make it working with static values in the beginning

// first save 'notes' recording with zeros before uploading the file. Then update the chart on a regular basis until the data show up