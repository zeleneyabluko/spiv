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
