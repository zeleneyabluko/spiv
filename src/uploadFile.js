
export function  uploadFile(e) {
  const inputField = e.target;
  console.log(e.target.files);
  console.log('file uploading');
  const file = inputField.files[0];
  console.log(file);
  
  localStorage.setItem('name', file.toString());
   }

  