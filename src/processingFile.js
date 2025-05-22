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

  function getNoteDurationInSeconds(noteFraction, bpm) {
    const beats = 1 / noteFraction; // 1/2 → 2 beats
    const secondsPerBeat = 60 / bpm;
    return beats * secondsPerBeat;
}

  //get main part id
  const mainPartId = isFileSupported(musicSheet).mainPartId;
  //get the vocal part
  const voicePart = musicSheet.Instruments.find(part => part.id === mainPartId);
  const vocalVoice = voicePart.voices[0];
  console.log(vocalVoice.voiceEntries);
  let data = [];
  vocalVoice.voiceEntries.forEach((voiceEntry, index) => {
   let startX = 0;
   if (index !== 0){
  startX = data[index-1].endX;
   }
   const startY = voiceEntry.notes[0].pitch.frequency;
   const endY = startY;
   const endX = startX+getNoteDurationInSeconds(voiceEntry.notes[0].length.realValue, voiceEntry.notes[0].sourceMeasure.tempoInBPM);
   data.push({startX: startX, startY: startY, endX: endX, endY: endY});   
  })
  console.log(data);
  const songLength = data[data.length-1].endX;
  console.log('songLength in sec: ', songLength);
  return {data: data, songLength: songLength};
}
