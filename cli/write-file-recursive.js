const fs = require('fs'),
  path = require('path');

/**
 * @description Saves a file to a given path recursively, ie also creates the required directories.
 * @param {String} path Path to the file including the name of the file with the extension
 * @param {String} content Contents of the file
 */
function writeFileSyncRecursive(path, content) {
  const folders = path.split(path.sep).slice(0, -1);
  if (folders.length > 0) {
    
    // create folder path if it doesn't exist
    folders.reduce((last, folder) => {
      if (!fs.existsSync(last)) {
        fs.mkdirSync(last);
      }
      const folderPath = last + path.sep + folder;
      
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      
      return folderPath;
    })
  }
  fs.writeFileSync(path, content);
}

module.exports = writeFileSyncRecursive;