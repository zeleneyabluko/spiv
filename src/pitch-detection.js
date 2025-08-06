// Pitch detection using pitch.js
// Following the example from https://github.com/audiocogs/pitch.js?tab=readme-ov-file

let pitchAnalyzer = null;
let audioContext = null;
let analyser = null;
let microphone = null;
let isRunning = false;

function startPitchDetection() {
  if (isRunning) return;
  
  console.log('Starting pitch detection...');
  
  // Create audio context and analyser
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  
  // Get microphone access
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      // Set up analyser
      analyser.fftSize = 4096;
      const bufferLength = analyser.frequencyBinCount;
      
      // Create pitch analyzer with the audio context sample rate
      pitchAnalyzer = new PitchAnalyzer(audioContext.sampleRate);
      
      isRunning = true;
      console.log('Pitch detection started. Speak into your microphone!');
      
      // Start measuring pitch 3 times per second
      setInterval(measurePitch, 333); // 1000ms / 3 = 333ms
    })
    .catch(function(err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access denied. Please allow microphone access to use pitch detection.');
    });
}

function stopPitchDetection() {
  if (!isRunning) return;
  
  isRunning = false;
  console.log('Stopping pitch detection...');
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  pitchAnalyzer = null;
  analyser = null;
  microphone = null;
}

function measurePitch() {
  if (!isRunning || !pitchAnalyzer || !analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  
  // Get audio data from microphone
  analyser.getFloatTimeDomainData(dataArray);
  
  // Input the audio data to the pitch analyzer
  pitchAnalyzer.input(dataArray);
  pitchAnalyzer.process();
  
  // Find the tone
  const tone = pitchAnalyzer.findTone();
  
  if (tone && tone.freq > 0) {
    console.log('Found a tone, frequency:', tone.freq.toFixed(2), 'Hz, volume:', tone.db.toFixed(2), 'dB, age:', tone.age);
  } else {
    console.log('No tone found');
  }
}

// Add a button to start/stop pitch detection
function addPitchDetectionButton() {
  const button = document.createElement('button');
  button.textContent = 'Start Pitch Detection';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  
  button.addEventListener('click', function() {
    if (isRunning) {
      stopPitchDetection();
      button.textContent = 'Start Pitch Detection';
      button.style.backgroundColor = '#007bff';
    } else {
      startPitchDetection();
      button.textContent = 'Stop Pitch Detection';
      button.style.backgroundColor = '#dc3545';
    }
  });
  
  document.body.appendChild(button);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
  addPitchDetectionButton();
});

// Make functions globally available for testing
window.startPitchDetection = startPitchDetection;
window.stopPitchDetection = stopPitchDetection;
window.measurePitch = measurePitch; 