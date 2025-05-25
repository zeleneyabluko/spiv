export function isVocalPart(part) {
  const partName = part.subInstruments[0].name.toLowerCase() || "";
  if (part.subInstruments.length > 1) {
    return false;
  } else {
    if (partName.includes("voice")) {
      return true;
    } else {
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
  } else {
    return {
      supported: false,
      mainPartId: undefined
    }

  }
}

export function getDataForChart(musicSheet) {

  function getNoteDurationInSeconds(note) {
    const rhythmDenominator = note.sourceMeasure.activeTimeSignature.denominator;
    const tempoInBPM = note.sourceMeasure.tempoInBPM;
    const length = note.length.realValue;
    const beatDurationInSec = 60/tempoInBPM;
    const fullNoteDurationInSec = beatDurationInSec*rhythmDenominator;
    return fullNoteDurationInSec*length;
}

  //get main part id
  const mainPartId = isFileSupported(musicSheet).mainPartId;
  //get the vocal part
  const voicePart = musicSheet.Instruments.find(part => part.id === mainPartId);
  const vocalVoice = voicePart.voices[0];
  console.log(vocalVoice.voiceEntries);
  let data = [];
  vocalVoice.voiceEntries.forEach((voiceEntry, index) => {
    console.log('sourceMeasure: ', voiceEntry.notes[0].sourceMeasure)
    let startx = 0;
    if (index !== 0){
      startx = data[data.length-1].x*1000;
    };
    
    const endx = startx+getNoteDurationInSeconds(voiceEntry.notes[0])*1000;
    const y = voiceEntry.notes[0].pitch.frequency;
    data.push({x: startx, y: y});
    data.push({x: endx, y: y});
    data.push({x: endx, y: NaN});
  })
  console.log(data);
  const songLength = data[data.length-1].x;
  console.log('songLength in sec: ', songLength);
  return {data: data, songLength: songLength};
}
