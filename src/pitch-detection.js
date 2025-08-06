// Pitch detection - Basic version for testing
// Button functionality test

let isRunning = false;
let audioContext = null;
let analyser = null;
let microphone = null;
let pitchInterval = null;

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
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      
      isRunning = true;
      console.log('Pitch detection started. Speak into your microphone!');
      
      // Start measuring pitch 10 times per second
      pitchInterval = setInterval(measurePitch, 100); // 1000ms / 10 = 100ms
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
  
  if (pitchInterval) {
    clearInterval(pitchInterval);
    pitchInterval = null;
  }
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  analyser = null;
  microphone = null;
}

function measurePitch() {
  if (!isRunning || !analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  
  // Get audio data from microphone
  analyser.getFloatTimeDomainData(dataArray);
  
  // Check if we're getting audio data
  let hasAudio = false;
  let maxAudio = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const absValue = Math.abs(dataArray[i]);
    if (absValue > maxAudio) maxAudio = absValue;
    if (absValue > 0.001) {
      hasAudio = true;
    }
  }
  
  if (hasAudio) {
    console.log('Audio detected, max amplitude:', maxAudio.toFixed(4));
  }
}

// Add a button to start/stop pitch detection
function addPitchDetectionButton() {
  console.log('Creating pitch detection button...');
  
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
    font-weight: bold;
  `;
  
  button.addEventListener('click', function() {
    console.log('Button clicked!');
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
  console.log('Pitch detection button created and added to page');
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, creating pitch detection button...');
  addPitchDetectionButton();
});

// Also try to create button if DOM is already loaded
if (document.readyState === 'loading') {
  console.log('DOM still loading, will create button when ready');
} else {
  console.log('DOM already loaded, creating button now');
  addPitchDetectionButton();
}

// Make functions globally available for testing
window.startPitchDetection = startPitchDetection;
window.stopPitchDetection = stopPitchDetection; 