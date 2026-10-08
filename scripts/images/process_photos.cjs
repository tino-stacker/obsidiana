const fs = require('fs');
const path = require('path');

const inputList = `
1. Conchita — S/59
2. Esfera — S/49
3. Corazón Liso — S/39
4. Flor Rosa — S/39
5. Corazón Rosa — S/49
6. Corazón Circón — S/49
7. Corazón Perla — S/49
8. Flor Perla — S/49
9. Estrella de Mar (Aretes) — S/59
10. Pastilla — S/49
11. Triqueta — S/59
12. Brillantes — S/49
13. Huella — S/59
14. Búho — S/59
15. Argolla Entrochada — S/69
16. Argolla Lisa — S/69
17. Rombos — S/59 — AGOTADO
18. Conjunto Aros — S/89
19. Conjunto Perla Circón — S/89
20. Conjunto Corazón Verde — S/99
21. Conjunto Mandala — S/89
22. Nudo de Bruja — S/89
23. Flor de Loto — S/89
24. Girasol — S/89
25. Flor Andina — S/89
26. Corazón Amazonita — S/89
27. Obsidiana — S/89
28. Amatista — S/89
29. Flor Cosmos — S/89
30. Trebol — S/89
31. Corazón Diamantado — S/79
32. Estrella de Mar (Collar) — S/79
33. Estrella Lisa — S/79
34. Cruz Andina — S/79
35. Hoja Arce — S/79
36. Collar Satelital — S/65
37. Corazón Rojo — S/59
38. Trebol Brillante — S/59
39. Tres Lazos — S/55
40. Corazones — S/55
41. Eslabones Finos — S/49
42. Eclipse — S/55
43. Margarita — S/49
44. Eslabones — S/39
45. Órbita — S/39
46. Infinito — S/39
47. Corazón Circón (Anillo) — S/39
`;

// Helper to determine category
function getCategory(name) {
  const lower = name.toLowerCase();
  if (lower.includes('conjunto')) return 'Conjuntos';
  if (lower.includes('collar') || lower.includes('(collar)')) return 'Collares';
  if (lower.includes('pulsera')) return 'Pulseras';
  if (lower.includes('anillo')) return 'Anillos';
  // Default most of the first items are Aretes
  if (parseInt(name.split('.')[0]) <= 17 || lower.includes('aretes') || lower.includes('argolla') || lower.includes('(aretes)')) {
    return 'Aretes';
  }
  return 'Collares'; // Default guess for the rest if not specified
}

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

const photoDir = path.join(__dirname, 'FOTOS DE LOS MODELOS');
const publicProdDir = path.join(__dirname, 'public', 'productos');

if (!fs.existsSync(publicProdDir)) {
  fs.mkdirSync(publicProdDir, { recursive: true });
}

const allPhotos = fs.readdirSync(photoDir).filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg'));

const lines = inputList.trim().split('\n').filter(l => l.trim().length > 0);

const products = [];

lines.forEach((line, index) => {
  // Parse line: "1. Conchita — S/59" or "17. Rombos — S/59 — AGOTADO"
  const match = line.match(/^\d+\.\s+(.*?)\s*[—\-]\s*S\/?(\d+)(.*)$/);
  if (!match) {
    console.log("Failed to parse line: " + line);
    return;
  }
  
  let name = match[1].trim();
  const price = parseInt(match[2], 10);
  const rest = match[3].toLowerCase();
  
  const isAgotado = rest.includes('agotado');
  let category = getCategory(`${index+1}. ${name}`);
  
  // Clean up name a bit for display
  const displayName = name.replace(/\(aretes\)|\(collar\)|\(anillo\)/i, '').trim();
  
  // Generate a SKU
  const catCode = category.substring(0,3).toUpperCase();
  const numCode = (index+1).toString().padStart(3, '0');
  const sku = `OBS-${catCode}-${numCode}`;

  const product = {
    id: `prod-${catCode.toLowerCase()}-${numCode}`,
    sku: sku,
    name: displayName,
    category: category,
    price: price,
    stock: isAgotado ? 0 : 10,
    minStock: 2,
    location: `Vitrina Principal - ${category}`,
    updatedAt: new Date().toISOString(),
    imageUrl: ''
  };

  // Find matching image
  // Let's try to find an exact word match from the photos
  const normName = normalizeName(displayName);
  let bestMatch = null;
  
  // Custom manual mappings for tricky names
  const customMap = {
    'corazon liso': 'corazon lizo',
  };
  
  let searchName = customMap[displayName.toLowerCase()] || displayName;
  let normSearchName = normalizeName(searchName);

  for (const photo of allPhotos) {
    // Only prefer -1.jpeg if it exists
    if (!photo.includes('-1.jpeg')) {
      if (allPhotos.includes(photo.replace('-2.jpeg', '-1.jpeg'))) {
         continue; // skip -2 if -1 exists
      }
    }
    
    const normPhoto = normalizeName(photo.replace('-1.jpeg','').replace('-2.jpeg','').replace('.jpeg',''));
    
    // Exact match or substring match
    if (normPhoto === normSearchName || normPhoto.includes(normSearchName) || normSearchName.includes(normPhoto)) {
      bestMatch = photo;
      break;
    }
  }

  if (bestMatch) {
    const ext = path.extname(bestMatch);
    const newFilename = `${product.id}${ext}`;
    const srcPath = path.join(photoDir, bestMatch);
    const destPath = path.join(publicProdDir, newFilename);
    fs.copyFileSync(srcPath, destPath);
    product.imageUrl = `/productos/${newFilename}`;
    console.log(`[OK] Matched ${name} -> ${bestMatch}`);
  } else {
    console.log(`[WARN] No match found for ${name}`);
  }

  products.push(product);
});

// Now replace in mockData.ts
const mockDataPath = path.join(__dirname, 'src', 'data', 'mockData.ts');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

const productsCode = `export const INITIAL_PRODUCTS: Product[] = [\n` + 
  products.map(p => `  ${JSON.stringify(p, null, 2).replace(/\n/g, '\n  ')}`).join(',\n') +
  `\n];\n`;

mockDataContent = mockDataContent.replace(/export const INITIAL_PRODUCTS: Product\[\] = \[[\s\S]*?\];\n/, productsCode);
fs.writeFileSync(mockDataPath, mockDataContent);
console.log("Successfully updated mockData.ts");
