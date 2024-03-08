//document.getElementById('uploadButton').addEventListener('click', uploadFile);
import { uploadFile } from "./uploadFile";
console.log('index.js');
const musicxmlFile = document.getElementById("musicxmlFile");
//musicxmlFile.addEventListener('click', console.log('wow!'));
musicxmlFile.addEventListener("change", uploadFile);
