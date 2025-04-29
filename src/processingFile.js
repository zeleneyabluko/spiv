export function isVocalPart(part) {
    if (part.subInstruments.length > 1){
        return false;
    } else {
    const partName = part.subInstruments[0].name.toLowerCase()  || '';

    if (partName.includes('voice') || partName.includes('vocal') || 
        partName.includes('soprano') || partName.includes('alto') || 
        partName.includes('tenor') || partName.includes('bass')) {
        return true;
    }
    return false;
}
};

export function isMonophonic(part){
    if (part.staves.length > 1) {
        return false;
    } 
    //TODO: Add more conditions to check if the part is monophonic
    return true;
}
