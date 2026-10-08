const fs = require('fs');

function redesign(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/slate/g, 'zinc');
  content = content.replace(/blue-600/g, 'zinc-900');
  content = content.replace(/blue-50/g, 'zinc-100');
  content = content.replace(/blue-100/g, 'zinc-200');
  content = content.replace(/blue-500/g, 'zinc-700');
  
  content = content.replace(/#181716/g, 'zinc-900');
  content = content.replace(/#61564A/g, 'zinc-800');
  content = content.replace(/#E4DFD7/g, 'white');
  content = content.replace(/#A59B8F/g, 'zinc-400');
  
  content = content.replace(/rounded-2xl/g, 'rounded-sm');
  content = content.replace(/rounded-xl/g, 'rounded-sm');
  content = content.replace(/rounded-lg/g, 'rounded-sm');
  
  content = content.replace(/shadow-xs/g, 'shadow-sm');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

redesign('src/components/OrdersList.tsx');
redesign('src/components/OrderDetailModal.tsx');
