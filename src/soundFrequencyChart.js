import Chart from "chart.js/auto";

(async function () {
  const data = [
    { timestampStart: 0, timestampEnd: 1, frequency: 300},
    { timestampStart: 1, timestampEnd: 2.5, frequency: 250},
    { timestampStart: 2.5, timestampEnd: 3, frequency: 200},
    { timestampStart: 3, timestampEnd: 3.5, frequency: 300},
    { timestampStart: 3.5, timestampEnd: 4.2, frequency: 150},
    { timestampStart: 4.2, timestampEnd: 5, frequency:250},
  ];

  new Chart(document.getElementById("soundFrequencyChart"), {
    type: "bar",
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
