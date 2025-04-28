export function isVocalPart(part) {
    const partName = part.nameLabel.text.toLowerCase()  || '';

    if (partName.includes('voice') || partName.includes('vocal') || 
        partName.includes('soprano') || partName.includes('alto') || 
        partName.includes('tenor') || partName.includes('bass')) {
        return true;
    }
    return false;
};

export function isMonophonic(part){
    if (part.staves.length > 1) {
        return false;
    } 
    //TODO: Add more conditions to check if the part is monophonic
    return true;
}
