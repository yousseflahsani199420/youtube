const fs = require('fs-extra');
const path = require('path');

function cleanupOldFiles(dir, olderThanMinutes=10){
  fs.readdir(dir)
    .then(files=>{
      const now = Date.now();
      files.forEach(file=>{
        const filePath = path.join(dir,file);
        fs.stat(filePath).then(stat=>{
          if(now-stat.mtimeMs > olderThanMinutes*10*1000){
            fs.remove(filePath).catch(console.error);
          }
        });
      });
    })
    .catch(console.error);
}

module.exports = { cleanupOldFiles };