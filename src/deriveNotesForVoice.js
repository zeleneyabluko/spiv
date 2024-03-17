export function deriveNotesForVoice(musicxml, trackId) {
    console.log ("now let's derive notes!");

   
    const measureList = musicxml.graphic.measureList;
    let voiceMeasureList = [];
    let notesWithFrequencyAndDuration = [];

    
    measureList.forEach((element) => {
        voiceMeasureList.push(element[trackId]);
    });

   //console.log('voicemeasurelist created! ');
  // console.log(voiceMeasureList);

    

    voiceMeasureList.forEach((element) => {
        const tempo = element.parentSourceMeasure.tempoInBPM;
        const measureLength = element.parentSourceMeasure.activeTimeSignature.realValue;
        
       const measureLengthInSec = element.parentSourceMeasure.activeTimeSignature.numerator*tempo/60;
       const staffEntries = element.staffEntries;

       staffEntries.forEach((staffEntry) => {
            const graphicalVoiceEntries = staffEntry.graphicalVoiceEntries;
            
            graphicalVoiceEntries.forEach((entry) => {
                const notes = entry.notes;

                notes.forEach((note) => {
                    const sourceNote = note.sourceNote;
                    
                    let frequency = 0;
                    
                    if (sourceNote.pitch == undefined) {
                        frequency = Number.NaN;
                    } else {
                        frequency = sourceNote.pitch.frequency;
                    }
                    
                    
                    //console.log('pitch: '+sourceNote.pitch);
                    //console.log('frequency: ' +frequency);
                    const duration = sourceNote.length.realValue;
                    
                   // console.log('length in sec: ' + measureLengthInSec);
                    const durationInSec = (duration/measureLength)*measureLengthInSec;
                   // console.log('durationInSec '+durationInSec);
                    const noteFD = {};
                    noteFD.frequency = frequency;
                    noteFD.duration = durationInSec;
                    //console.log(noteFD.frequency);
                    notesWithFrequencyAndDuration.push(noteFD);
                    
                    //console.log('notes ' +notesWithFrequencyAndDuration);
                })
            })      
        })
    });
    console.log('done!')

   // return notesWithFrequencyAndDuration;

   let rawData = [];
   let timestamp = 0;

   for (let i = 0; i < notesWithFrequencyAndDuration.length; i++) {
    const note = notesWithFrequencyAndDuration[i];
    const newNote = {time: timestamp, frequency: note.frequency, duration: note.duration};
    rawData.push(newNote);
    timestamp += note.duration;
   };
   console.log('rawdata');
   console.log(rawData); 
   sessionStorage.setItem('rawData', rawData);        
    return rawData;

}

//TODO:
//The issue is that some 'notes' are not actually notes but rest symbols https://en.wikipedia.org/wiki/Rest_(music)
//for such symbols, pitch is undefined, so I should replace 'frequency' with 'null' in deriveNotesForVoice.js function
//then, I should update rawData file and maybe chat config to handle rest intervals correctly
//the way to handle it is here