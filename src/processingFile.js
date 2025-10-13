export function isVocalPart(part) {
  const partName = part.nameLabel.text.toLowerCase() || "";
  if (part.subInstruments.length > 1) {
    console.log(`part ${partName} has more than 1 subinstrument`)
    return false;
  } else {
    if (["voice","vocal","vocals", "voz"].some(k => partName.includes(k)) || (part.partAbbreviation == "Vo.")){
      return true;
    } else {
      console.log("part: ", part)
      console.log("partName: ", partName);
      console.log(`part ${partName} doesn't seem to be labeled as voice part`)
      return false;
    }
  }
}

export function isMonophonic(part) {
  console.log("voices count: ", part.voices.length);

  if (part.staves.length > 1) {
    return false;
  }

  if (part.voices.length > 1) {
    return false;
  }

  // Check if any voiceEntry has more than one note
  for (const voiceEntry of part.voices[0].voiceEntries) {
    if (voiceEntry.notes.length > 1) {
      return false;
    }
  }

  return true;
}
export function numberOfVocalParts(musicSheet) {
  const vocalPartIndices = [];
  musicSheet.Instruments.forEach((part, index) => {
    const partName = part.subInstruments[0].name.toLowerCase() || "";
    if (isVocalPart(part)) {
      vocalPartIndices.push(index);
    }
  });
  console.log("Found vocal parts:", vocalPartIndices.length);
  return vocalPartIndices.length;
}

export function getVocalParts(musicSheet) {
  const vocalParts = [];
  musicSheet.Instruments.forEach((part, index) => {
    if (isVocalPart(part)) {
      const partName = part.nameLabel?.text || part.name || part.subInstruments?.[0]?.name || `Part ${index + 1}`;
      vocalParts.push({
        index: index,
        id: part.id,
        name: partName,
        part: part
      });
    }
  });
  return vocalParts;
}

export function showVocalPartSelectionModal(vocalParts) {
  const modal = document.getElementById('vocalPartModal');
  const vocalPartsList = document.getElementById('vocalPartsList');
  
  if (!modal || !vocalPartsList) {
    console.error('Modal elements not found');
    return;
  }
  
  // Clear previous content
  vocalPartsList.innerHTML = '';
  
  // Create radio buttons for each vocal part
  vocalParts.forEach((vocalPart, index) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'vocal-part-option';
    
    const radioInput = document.createElement('input');
    radioInput.type = 'radio';
    radioInput.name = 'vocalPart';
    radioInput.value = vocalPart.id;
    radioInput.id = `part-${vocalPart.index}`;
    if (index === 0) radioInput.checked = true; // Select first part by default
    
    const label = document.createElement('label');
    label.htmlFor = `part-${vocalPart.index}`;
    label.textContent = vocalPart.name;
    
    optionDiv.appendChild(radioInput);
    optionDiv.appendChild(label);
    vocalPartsList.appendChild(optionDiv);
  });
  
  // Show modal
  modal.style.display = 'flex';
  
  // Add event listeners
  const modalClose = document.getElementById('modalClose');
  const modalOk = document.getElementById('modalOk');
  
  const closeModal = () => {
    modal.style.display = 'none';
  };
  
  modalClose.addEventListener('click', closeModal);
  modalOk.addEventListener('click', closeModal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Return a promise that resolves when user selects a part
  return new Promise((resolve) => {
    modalOk.addEventListener('click', () => {
      const selectedRadio = document.querySelector('input[name="vocalPart"]:checked');
      const selectedPartId = selectedRadio ? selectedRadio.value : vocalParts[0].id;
      const selectedPart = vocalParts.find(part => part.id === selectedPartId);
      closeModal();
      resolve(selectedPart);
    });
  });
}
/**
 * Generate chart data using OSMD's expanded measures (with repetitions)
 * @param {Object} musicSheet - Original music sheet
 * @param {Array} expandedMeasures - Expanded measures from OSMD timing source
 * @param {Object} osmdInstance - OSMD instance
 * @returns {Object} Chart data with expanded measures
 */
function generateExpandedChartData(musicSheet, expandedMeasures, osmdInstance) {
  console.log('=== Generating Expanded Chart Data ===');
  
  function getNoteDurationInSeconds(note) {
    const rhythmDenominator = note.sourceMeasure.activeTimeSignature.denominator;
    const tempoInBPM = note.sourceMeasure.tempoInBPM;
    const length = note.length.realValue;
    const beatDurationInSec = 60/tempoInBPM;
    const fullNoteDurationInSec = beatDurationInSec*rhythmDenominator;
    return fullNoteDurationInSec*length;
  }
  
  function isRest(note){
    if (note.pitch == undefined){
      return true;
    } else return false;
  }

  function calculateSongLengthInSec(data){
    let songLength = 0;
    data.forEach (note => {
      songLength+=note.length
    });
    return songLength;
  }

  // Get main part id
  const mainPartId = isFileSupported(musicSheet).mainPartId;
  const voicePart = musicSheet.Instruments.find(part => part.id === mainPartId);
  const vocalVoice = voicePart.voices[0];
  
  console.log('Original voice entries:', vocalVoice.voiceEntries.length);
  console.log('Expanded measures:', expandedMeasures.length);
  
  // Group voice entries by measure number
  const entriesByMeasure = {};
  vocalVoice.voiceEntries.forEach((entry, index) => {
    if (entry.notes && entry.notes[0] && entry.notes[0].sourceMeasure) {
      const measureNumber = entry.notes[0].sourceMeasure.measureNumber;
      if (!entriesByMeasure[measureNumber]) {
        entriesByMeasure[measureNumber] = [];
      }
      entriesByMeasure[measureNumber].push(entry);
    }
  });
  
  console.log('Entries grouped by measure:', Object.keys(entriesByMeasure).map(Number).sort((a, b) => a - b));
  
  // Generate expanded data using OSMD's expanded measure sequence
  let data = [];
  let currentTime = 0;
  
  expandedMeasures.forEach((expandedMeasure, index) => {
    // Find the original measure number this expanded measure corresponds to
    const originalMeasureNumber = expandedMeasure.measureNumber || (index % Object.keys(entriesByMeasure).length) + 1;
    
    console.log(`Expanded measure ${index} -> Original measure ${originalMeasureNumber}`);
    
    const originalEntries = entriesByMeasure[originalMeasureNumber];
    if (originalEntries) {
      originalEntries.forEach((voiceEntry, entryIndex) => {
        let freq = NaN;
        if (!isRest(voiceEntry.notes[0])){
          if (musicSheet.Transpose == 0){
            freq = voiceEntry.notes[0].Pitch.frequency;
          } else {
            freq = voiceEntry.notes[0].TransposedPitch.frequency;
          }
        }
        
        const noteLengthSec = getNoteDurationInSeconds(voiceEntry.notes[0]);
        
        data.push({
          start: currentTime,
          freq: freq,
          length: noteLengthSec
        });
        
        currentTime += noteLengthSec;
      });
    }
  });
  
  console.log('Expanded data points:', data.length);
  
  const songLength = calculateSongLengthInSec(data);
  console.log('Expanded song length:', songLength, 'seconds');
  
  return {data: data, songLength: songLength};
}

export function isFileSupported(musicSheet) {
  //find vocal parts
  const vocalPartsCount = numberOfVocalParts(musicSheet);

  //define if the file is supported
  if (
    musicSheet.Instruments.length == 1 &&
    !isVocalPart(musicSheet.Instruments[0]) &&
    isMonophonic(musicSheet.Instruments[0])
  ) {
    return {
      supported: true,
      mainPartId: musicSheet.Instruments[0].id
    };
  } else if (musicSheet.Instruments.length > 1 && vocalPartsCount == 1) {
    const voicePart = musicSheet.Instruments.filter((part) => isVocalPart(part))[0];
    return {
      supported: true,
      mainPartId: voicePart.id
    }
  } else if (musicSheet.Instruments.length > 1 && vocalPartsCount > 1) {
    // Multiple vocal parts - user needs to select one
    return {
      supported: true,
      mainPartId: null, // Will be determined by user selection
      multipleVocalParts: true
    }
  } else {
    return {
      supported: false,
      mainPartId: undefined
    }
  }
}

export function getDataForChart(musicSheet, osmdInstance = null) {

  function getNoteDurationInSeconds(note) {
    const rhythmDenominator = note.sourceMeasure.activeTimeSignature.denominator;
    const tempoInBPM = note.sourceMeasure.tempoInBPM;
    const length = note.length.realValue;
    const beatDurationInSec = 60/tempoInBPM;
    const fullNoteDurationInSec = beatDurationInSec*rhythmDenominator;
    return fullNoteDurationInSec*length;
}
  
  function isRest(note){
    if (note.pitch == undefined){
      return true;
    } else return false;
  }

  function calculateSongLengthInSec(data){
    let songLength = 0;
    data.forEach (note => {
      songLength+=note.length
    });
    return songLength;
  }

  // Debug: Analyze OSMD timing source for repetition handling
  if (osmdInstance && osmdInstance.PlaybackManager) {
    console.log('=== OSMD Timing Analysis ===');
    console.log('OSMD PlaybackManager:', osmdInstance.PlaybackManager);
    console.log('TimingSource:', osmdInstance.PlaybackManager.timingSource);
    console.log('Sheet duration (with repetitions):', osmdInstance.PlaybackManager.getSheetDurationInMs());
    
    // Check if timing source has expanded measures
    if (osmdInstance.PlaybackManager.timingSource.measures) {
      console.log('TimingSource measures:', osmdInstance.PlaybackManager.timingSource.measures);
      console.log('Number of measures in timing source:', osmdInstance.PlaybackManager.timingSource.measures.length);
    }
    
    // Check iterator for expanded timing
    if (osmdInstance.cursor && osmdInstance.cursor.Iterator) {
      console.log('Cursor Iterator:', osmdInstance.cursor.Iterator);
      console.log('Iterator measures:', osmdInstance.cursor.Iterator.measures);
      if (osmdInstance.cursor.Iterator.measures) {
        console.log('Number of measures in iterator:', osmdInstance.cursor.Iterator.measures.length);
        osmdInstance.cursor.Iterator.measures.forEach((measure, index) => {
          console.log(`Iterator measure ${index}:`, measure);
        });
      }
    }
    
    // Check Sheet structure for expanded measures
    if (osmdInstance.Sheet) {
      console.log('Sheet:', osmdInstance.Sheet);
      console.log('Sheet keys:', Object.keys(osmdInstance.Sheet));
      
      if (osmdInstance.Sheet.musicPartManager) {
        console.log('MusicPartManager:', osmdInstance.Sheet.musicPartManager);
        console.log('MusicPartManager keys:', Object.keys(osmdInstance.Sheet.musicPartManager));
        
        if (osmdInstance.Sheet.musicPartManager.instruments) {
          console.log('Instruments in MusicPartManager:', osmdInstance.Sheet.musicPartManager.instruments);
          osmdInstance.Sheet.musicPartManager.instruments.forEach((instrument, index) => {
            console.log(`Instrument ${index}:`, instrument);
            if (instrument.measures) {
              console.log(`Instrument ${index} measures:`, instrument.measures);
              console.log(`Number of measures in instrument ${index}:`, instrument.measures.length);
            }
          });
        }
      }
    }
    
    // Check if we can access the expanded measure sequence through the timing source
    if (osmdInstance.PlaybackManager.timingSource.measures) {
      console.log('=== Expanded Measures Found ===');
      console.log('TimingSource measures:', osmdInstance.PlaybackManager.timingSource.measures);
      console.log('Number of expanded measures:', osmdInstance.PlaybackManager.timingSource.measures.length);
      
      // This is what we need - the expanded measure sequence
      const expandedMeasures = osmdInstance.PlaybackManager.timingSource.measures;
      console.log('Expanded measures sequence:', expandedMeasures);
      
      // Calculate the ratio of expanded vs original measures
      const originalMeasures = musicSheet.Instruments[0].measures.length;
      const expandedRatio = expandedMeasures.length / originalMeasures;
      console.log(`Expansion ratio: ${expandedRatio.toFixed(2)}x (${expandedMeasures.length} expanded / ${originalMeasures} original)`);
      
      return generateExpandedChartData(musicSheet, expandedMeasures, osmdInstance);
    }
  }

  //get main part id
  const mainPartId = isFileSupported(musicSheet).mainPartId;
  //get the vocal part
  const voicePart = musicSheet.Instruments.find(part => part.id === mainPartId);
  const vocalVoice = voicePart.voices[0];
  console.log(vocalVoice.voiceEntries);
  let data = [];
  vocalVoice.voiceEntries.forEach((voiceEntry, index) => {
    let freq = NaN;
      if (!isRest(voiceEntry.notes[0])){
      if (musicSheet.Transpose == 0){
      freq = voiceEntry.notes[0].Pitch.frequency;
      } else {
      freq = voiceEntry.notes[0].TransposedPitch.frequency;
      }
      };
    const noteLengthSec = getNoteDurationInSeconds(voiceEntry.notes[0]);
    let start = 0;
    if (index == 0){
      start = 0;
    } else {
      start = data[index-1].start+data[index-1].length;
    }
    data.push({start:start, freq: freq, length: noteLengthSec});
    /*
    console.log(`note #${index} `, voiceEntry.notes[0]);
 

    let startx = 0;
    if (index !== 0){
      startx = data[data.length-1].x;
    };
    
    const endx = startx+getNoteDurationInSeconds(voiceEntry.notes[0])*1000;
    let y = NaN;
    if (!isRest(voiceEntry.notes[0])){
    if (musicSheet.Transpose == 0){
    y = voiceEntry.notes[0].Pitch.frequency;
    } else {
      y = voiceEntry.notes[0].TransposedPitch.frequency;
    }
    };
    data.push({x: startx, y: y});
    data.push({x: endx, y: y});
    data.push({x: endx, y: NaN});
    */
  })
  console.log('data: ', data);

  const songLength = calculateSongLengthInSec(data);
  console.log('songLength in sec: ', songLength);
  return {data: data, songLength: songLength};
}
