import { supabase } from './src/lib/supabase';
import fs from 'fs';

const rawData = `
ARETES 
1. Conchita — S/59 
2. Esfera — S/49 
3. Corazón Liso — S/39 
4. Flor Rosa — S/39 
5. Corazón Rosa — S/49 
6. Corazón Circón — S/49 
7. Corazón Perla — S/49 
8. Flor Perla — S/49 
9. Estrella de Mar — S/59 
10. Pastilla — S/49 
11. Triqueta — S/59 
12. Brillantes — S/49 
13. Huella — S/59 
14. Búho — S/59 
15. Argolla Entrochada — S/69 
16. Argolla Lisa — S/69 
17. Rombos — S/59 — AGOTADO

CONJUNTOS 
18. Conjunto Aros — S/89 
19. Conjunto Perla Circón — S/89 
20. Conjunto Corazón Verde — S/99 
21. Conjunto Mandala — S/89

COLLARES 
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
32. Estrella de Mar — S/79 
33. Estrella Lisa — S/79 
34. Cruz Andina — S/79 
35. Hoja Arce — S/79 
36. Collar Satelital — S/65

PULSERAS 
37. Corazón Rojo — S/59 
38. Trebol Brillante — S/59 
39. Tres Lazos — S/55 
40. Corazones — S/55 
41. Eslabones Finos — S/49 
42. Eclipse — S/55

ANILLOS 
43. Margarita — S/49 
44. Eslabones — S/39 
45. Órbita — S/39 
46. Infinito — S/39 
47. Corazón Circón — S/39 Colores: Rojo, Blanco, Morado, Rosa
`;

async function run() {
  console.log("Parsing products...");
  
  const parsedProducts: { category: string; name: string; price: number; stock: number; skuPrefix: string, skuNumber: string, originalNumber: number, extraDesc?: string }[] = [];
  
  let currentCategory = "";
  let skuPrefix = "";
  
  const lines = rawData.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (["ARETES", "CONJUNTOS", "COLLARES", "PULSERAS", "ANILLOS"].includes(line.toUpperCase())) {
      currentCategory = line.toUpperCase();
      skuPrefix = line.substring(0, 3).toUpperCase();
      if (currentCategory === "CONJUNTOS") skuPrefix = "CON";
      continue;
    }
    
    // Parse line: 1. Conchita — S/59 
    const match = line.match(/^(\d+)\.\s+(.*?)\s*[—\-]\s*S\/?(\d+)(.*)$/i);
    if (match) {
      const originalNumber = parseInt(match[1]);
      const name = match[2].trim();
      const price = parseInt(match[3]);
      const remainder = match[4] || '';
      
      let stock = 10;
      if (remainder.toUpperCase().includes('AGOTADO')) {
        stock = 0;
      }
      
      const extraDesc = remainder.trim() !== '' && !remainder.toUpperCase().includes('AGOTADO') ? remainder.trim() : '';

      parsedProducts.push({
        category: currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1).toLowerCase(),
        name,
        price,
        stock,
        skuPrefix,
        skuNumber: originalNumber.toString().padStart(3, '0'),
        originalNumber,
        extraDesc
      });
    }
  }

  console.log(`Parsed ${parsedProducts.length} products.`);

  let sql = 'INSERT INTO productos (sku, nombre, categoria, material, precio, stock, stock_minimo, descripcion, activo) VALUES\n';
  
  const values = parsedProducts.map((p, index) => {
    const isLast = index === parsedProducts.length - 1;
    const material = p.name.toLowerCase().includes('950') ? 'Plata 950' : 'Plata 925';
    const desc = p.extraDesc ? p.extraDesc.replace(/^—\s*/, '').trim() : '';
    return `  ('OBS-${p.skuPrefix}-${p.skuNumber}', '${p.name}', '${p.category}', '${material}', ${p.price}.00, ${p.stock}, 5, '${desc}', true)${isLast ? ';' : ','}`;
  });

  sql += values.join('\n');
  sql += '\nON CONFLICT (sku) DO UPDATE SET\n';
  sql += '  nombre = EXCLUDED.nombre,\n';
  sql += '  categoria = EXCLUDED.categoria,\n';
  sql += '  precio = EXCLUDED.precio,\n';
  sql += '  stock = EXCLUDED.stock,\n';
  sql += '  activo = EXCLUDED.activo;\n';

  fs.writeFileSync('generated_products.sql', sql);
  console.log("SQL generated!");
}

run();
