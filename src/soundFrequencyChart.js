import Chart from "chart.js/auto";

(async function () {
  const data = [
    { x: 0, y: 220 },
    { x: 3, y: 250 }, 
    { x: 4, y: 250 }, // Step lasted 3 seconds
    { x: 4, y: null },  // Step lasted 1 second
    { x: 6, y: 240 },  // Step lasted 2 seconds
    { x: 7, y: 220 },
  ];

  new Chart(document.getElementById("soundFrequencyChart"), {
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
})();
