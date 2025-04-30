export function isVocalPart(part) {
    const partName = part.subInstruments[0].name.toLowerCase()  || '';
    if (part.subInstruments.length > 1){
        return false;
    } else {
    if (partName.includes('voice')) {
        return true;
    } else {
        return false;
    }   
}
};

export function isMonophonic(part) {
    console.log('voices count: ', part.voices.length);

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

    
