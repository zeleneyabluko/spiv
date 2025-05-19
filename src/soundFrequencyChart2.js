import Chart from "chart.js/auto";

(async function (data) {
  console.log('data: ', data);
  console.log('started rendering chart|!');
  
  const canvas = document.getElementById("soundFrequencyChart");
  if(canvas){
    console.log('Canvas found!');
  }

  const ctx = canvas.getContext('2d');
  console.log('context: ', ctx);

  const soundFrequencyChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Vocal Frequency (Hz)',
        data: data,
        borderColor: 'blue',
        fill: false,
        stepped: 'before'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: 'Time (seconds)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Frequency (Hz)'
          }
        }
      }
    }
  });
  window.soundFrequencyChart = soundFrequencyChart;
})();
