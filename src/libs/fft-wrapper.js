// Simple FFT implementation for pitch.js
// This works in browsers without requiring npm packages

(function() {
  'use strict';
  
  // Simple FFT implementation using Cooley-Tukey algorithm
  function simpleFFT(real, imag) {
    const n = real.length;
    if (n <= 1) return;
    
    // Bit reversal
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }
    
    // FFT computation
    for (let step = 1; step < n; step <<= 1) {
      const halfstep = step;
      step <<= 1;
      const wReal = 1;
      const wImag = 0;
      const wStepReal = Math.cos(Math.PI / halfstep);
      const wStepImag = Math.sin(Math.PI / halfstep);
      
      for (let group = 0; group < n; group += step) {
        let wReal2 = wReal;
        let wImag2 = wImag;
        
        for (let pair = group; pair < group + halfstep; pair++) {
          const match = pair + halfstep;
          const productReal = wReal2 * real[match] - wImag2 * imag[match];
          const productImag = wReal2 * imag[match] + wImag2 * real[match];
          
          real[match] = real[pair] - productReal;
          imag[match] = imag[pair] - productImag;
          real[pair] += productReal;
          imag[pair] += productImag;
        }
        
        const nextWReal = wReal * wStepReal - wImag * wStepImag;
        const nextWImag = wReal * wStepImag + wImag * wStepReal;
        wReal2 = nextWReal;
        wImag2 = nextWImag;
      }
    }
  }

  // Create a wrapper that matches the interface expected by pitch.js
  const FFTWrapper = {
    complex: class {
      constructor(size, inverse = false) {
        this.size = size;
        this.inverse = inverse;
      }
      
      simple(output, input, type) {
        if (type === 'real') {
          console.log('FFT wrapper called with input length:', input.length);
          
          // Convert real input to complex format
          const real = new Float32Array(input.length);
          const imag = new Float32Array(input.length);
          
          for (let i = 0; i < input.length; i++) {
            real[i] = input[i];
            imag[i] = 0;
          }
          
          // Perform FFT
          simpleFFT(real, imag);
          console.log('FFT completed');
          
          // Convert back to the format expected by pitch.js
          for (let i = 0; i < real.length; i++) {
            output[i * 2] = real[i];     // Real part
            output[i * 2 + 1] = imag[i]; // Imaginary part
          }
          
          console.log('FFT output length:', output.length);
        }
      }
    }
  };

  // Make it globally available for pitch.js
  window.FFT = FFTWrapper;
  console.log('FFT wrapper loaded and available as window.FFT');
})(); 