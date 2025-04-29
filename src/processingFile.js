export function isVocalPart(part) {
    if (part.subInstruments.length > 1){
        return false;
    } else {
        part.subInstruments.forEach((subInstrument, index) => {
                const partName = subInstrument.name.toLowerCase()  || '';
    console.log(partName);
    console.log(partName.includes('voice'));

    if (partName.includes('voice')) {
        return true;
    } else {
        continue;
    }

});
   
}
};

export function isMonophonic(part){
    if (part.staves.length > 1) {
        return false;
    } 
    //TODO: Add more conditions to check if the part is monophonic
    return true;
}
