export function isVocalPart(part) {
    console.log(partName);
    console.log(partName.includes('voice'));
    console.log('Monophonic: ', isMonophonic(part));
    console.log('voices count: ', part.voices.length);
    if (part.subInstruments.length > 1){
        return false;
    } else {
    const partName = part.subInstruments[0].name.toLowerCase()  || '';
    console.log(partName);
    console.log(partName.includes('voice'));
    console.log('Monophonic: ', isMonophonic(part));
    console.log('voices count: ', part.voices.length);

    if (partName.includes('voice')) {
        return true;
    } else {
        return false;
    }


   
}
};

export function isMonophonic(part){
    console.log('voices count: ', part.voices.length);
    if (part.staves.length > 1) {
        return false;
    } 
    //TODO: Add more conditions to check if the part is monophonic
    return true;
}
