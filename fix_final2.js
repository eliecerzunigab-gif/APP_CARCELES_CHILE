const fs = require('fs');
const path = 'c:/Ezuniga_RES/APLICACIONES_FUNCIONALES/APP_CARCELES/frontend/index.html';
let content = fs.readFileSync(path, 'utf8');

// Find the JSON end
const jsonEnd = '}]};';
const lastJsonPos = content.lastIndexOf(jsonEnd);
if (lastJsonPos === -1) {
  console.log('JSON end not found');
  process.exit(1);
}

// Keep everything up to and including the JSON
const goodPart = content.substring(0, lastJsonPos + 4);

// Read the complete JS from a separate file
const jsPath = 'c:/Ezuniga_RES/APLICACIONES_FUNCIONALES/APP_CARCELES/fix_final.js';
let jsContent = fs.readFileSync(jsPath, 'utf8');

// Extract the completeJS variable content
const startMarker = "const completeJS = `";
const startIdx = jsContent.indexOf(startMarker);
if (startIdx === -1) {
  console.log('start marker not found');
  process.exit(1);
}

// Find the closing backtick
const endIdx = jsContent.lastIndexOf('`');
if (endIdx === -1 || endIdx <= startIdx) {
  console.log('end backtick not found');
  process.exit(1);
}

const completeJS = jsContent.substring(startIdx + startMarker.length, endIdx);

// Write the fixed file
const result = goodPart + completeJS + '\n</script>\n</body>\n</html>';
fs.writeFileSync(path, result, 'utf8');
console.log('File fixed successfully!');
console.log('New file size:', result.length, 'bytes');
