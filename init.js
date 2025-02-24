const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'assets');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

module.exports = { uploadDir }; 
