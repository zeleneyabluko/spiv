import Chart from "chart.js/auto";

(async function () {
  const data = [
    { x: 0, y: 220 },
    { x: 3, y: 250 },  // Step lasted 3 seconds
    { x: 4, y: 230 },  // Step lasted 1 second
    { x: 6, y: 240 },  // Step lasted 2 seconds
  ];

  new Chart(document.getElementById("soundFrequencyChart"), {
    type: "line",
    data: {
      labels: data.map((row) => row.year),
      datasets: [
        {
          label: "Acquisitions by year",
          data: data.map((row) => row.count),
        },
      ],
    },
  });
})();
