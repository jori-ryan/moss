const fs = require('fs');

module.exports = {
  add(text, shouldLogToConsole = false) {
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    fs.appendFile('./log.txt', text + '\n', (err) => {
      if (err) throw err;
    });

    if (shouldLogToConsole) {
      console.log(text);
    }
  }
}