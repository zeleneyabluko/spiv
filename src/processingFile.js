export function isVocalPart(part) {
    const partName = part.nameLabel.text.toLowerCase()  || '';

    if (partName.includes('voice') || partName.includes('vocal') || 
        partName.includes('soprano') || partName.includes('alto') || 
        partName.includes('tenor') || partName.includes('bass')) {
        return true;
    }
    return false;
};
