function uploadFile() {
    var input = document.getElementById('musicxmlFile');
    var file = input.files[0];

    if (file) {
        // Use FileReader to read the file content
        var reader = new FileReader();

        reader.onload = function (e) {
            var musicXmlContent = e.target.result;

            // Save the content to local storage (this is a simplified example)
            localStorage.setItem('musicXmlContent', musicXmlContent);

            alert('File uploaded and saved to local storage.');
        };

        reader.readAsText(file);
    } else {
        alert('Please select a valid *.musicxml file.');
    }
}