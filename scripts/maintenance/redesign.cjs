const fs = require('fs');

function redesign(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Colors
  content = content.replace(/slate/g, 'zinc');
  content = content.replace(/#181716/g, 'zinc-900');
  content = content.replace(/#61564A/g, 'zinc-800');
  content = content.replace(/#E4DFD7/g, 'white');
  content = content.replace(/#A59B8F/g, 'zinc-400');
  
  // Shapes
  content = content.replace(/rounded-2xl/g, 'rounded-sm');
  content = content.replace(/rounded-xl/g, 'rounded-sm');
  content = content.replace(/rounded-lg/g, 'rounded-sm');
  
  // Shadows
  content = content.replace(/shadow-xs/g, 'shadow-sm');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

redesign('src/components/InventoryModule.tsx');
redesign('src/components/EmailNotificationsModule.tsx');
