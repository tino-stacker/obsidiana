const fs = require('fs');
const filePath = 'D:\\obs-store\\src\\components\\PosModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Check if export already exists
if (content.includes('export { PosModule }') || content.includes('export default PosModule')) {
  console.log('Export already exists.');
} else {
  // Add export at the very end
  content = content.trimEnd() + '\n\nexport { PosModule };\n';
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Added export { PosModule } at end of file.');
}
