import Chart from "chart.js/auto";

(async function (data) {
  console.log('data: ', data);
  console.log('started rendering chart|!');

  console.log('canvas is found: ', document.getElementById("soundFrequencyChart"))
  const canvas = document.getElementById("soundFrequencyChart");
  canvas.style.display = 'block'; // Ensure it's visible

  const ctx = canvas.getContext('2d');
  console.log('context: ', ctx);

  const myChart = new Chart(ctx, {
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
  window.soundFrequencyChart = myChart;
})();
