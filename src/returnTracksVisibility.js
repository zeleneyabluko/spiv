export function returnTracksVisibility(musicxml) {
    
    const instruments = musicxml.sheet.Instruments;

    //checking if the Voice track is available in the file
    const instrumentsVisibility = {};
    console.log('The instrumental groups available in the file:');
    for (let i = 0; i < instruments.length; i++) {
        console.log(instruments[i].nameLabel.text);
        if (instruments[i].nameLabel.text!='Voice'){
            instrumentsVisibility[i] = 'Hidden';
        } else {
            instrumentsVisibility[i] = 'Visible';
        }
            
    }

    return instrumentsVisibility;

    

    

    

   

    


}