const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, 'src', 'data', 'mockData.ts');
const photoDir = path.join(__dirname, 'FOTOS DE LOS MODELOS');
const publicProdDir = path.join(__dirname, 'public', 'productos');

let content = fs.readFileSync(mockDataPath, 'utf8');

// Parse the products out of mockData.ts using regex or eval
// Since it's a TS file, we can do a regex replace
const allPhotos = fs.readdirSync(photoDir);

content = content.replace(/("imageUrl": "(.*?)")/g, (match, p1, imgUrl) => {
  if (imgUrl && imgUrl.trim() !== '') {
    // imgUrl looks like /productos/prod-are-002.jpeg
    const filename = path.basename(imgUrl);
    
    // We need to find the original -1 photo in FOTOS DE LOS MODELOS that this came from.
    // Wait, it's easier to just find the -2 file using the same logic or just copy ALL -2 files that match
    
    // Let's do it simpler: if it has an imageUrl, we look at what product it is
    // But we don't have the product name here easily.
    return match;
  }
  return match;
});

// A better way: eval the mockData.ts partially to get the array
let productsText = content.match(/export const INITIAL_PRODUCTS: Product\[\] = (\[[\s\S]*?\]);\n/)[1];
let products = [];
try {
  // eval can read it since it's just JSON-like
  eval('products = ' + productsText);
} catch(e) {
  console.error("Eval failed", e);
}

const customMap = {
  'corazón liso': 'corazon lizo',
  'eslabones': 'eslabones finos',
  'trebol': 'trebol brillante',
  'corazón circón (anillo)': 'corazon circon'
};

function normalizeName(n) {
  return n.toLowerCase()
    .replace(/[á]/g, 'a')
    .replace(/[é]/g, 'e')
    .replace(/[í]/g, 'i')
    .replace(/[ó]/g, 'o')
    .replace(/[ú]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]/g, '');
}

products.forEach(p => {
  const displayName = p.name.replace(/\(aretes\)|\(collar\)|\(anillo\)/i, '').trim();
  let searchName = customMap[displayName.toLowerCase()] || displayName;
  let normSearchName = normalizeName(searchName);
  
  let bestMatch2 = null;
  for (const photo of allPhotos) {
    if (photo.includes('-2.jpeg') || photo.includes('-2.jpg')) {
       const normPhoto = normalizeName(photo.replace('-2.jpeg','').replace('-2.jpg',''));
       if (normPhoto === normSearchName || normPhoto.includes(normSearchName) || normSearchName.includes(normPhoto)) {
         bestMatch2 = photo;
         break;
       }
    }
  }

  if (bestMatch2) {
    const ext = path.extname(bestMatch2);
    const newFilename = `${p.id}-hover${ext}`;
    const srcPath = path.join(photoDir, bestMatch2);
    const destPath = path.join(publicProdDir, newFilename);
    fs.copyFileSync(srcPath, destPath);
    p.hoverImageUrl = `/productos/${newFilename}`;
    console.log(`[OK] Hover Matched ${p.name} -> ${bestMatch2}`);
  }
});

// Re-serialize
const productsCode = `export const INITIAL_PRODUCTS: Product[] = [\n` + 
  products.map(p => `  ${JSON.stringify(p, null, 2).replace(/\n/g, '\n  ')}`).join(',\n') +
  `\n];\n`;

content = content.replace(/export const INITIAL_PRODUCTS: Product\[\] = \[[\s\S]*?\];\n/, productsCode);
fs.writeFileSync(mockDataPath, content);
console.log("MockData updated with hover URLs.");
