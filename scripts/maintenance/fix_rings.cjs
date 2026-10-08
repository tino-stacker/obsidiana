const fs = require('fs');

const mockDataPath = 'src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf8');

const rings = ['Margarita', 'Eslabones', 'Órbita', 'Infinito', 'Corazón Circón (Anillo)'];

rings.forEach(ring => {
  // We want to replace "category": "Collares" and "location": "Vitrina Principal - Collares"
  // just for these specific rings.
  // It's easier to just match the block where "name": "Margarita" is and replace inside it
  
  // Real name in mockData might not have (Anillo)
  let searchName = ring.replace(' (Anillo)', '');
  
  const regex = new RegExp(`(\"name\":\\s*\"${searchName}\"[\\s\\S]*?)\"category\":\\s*\"Collares\"([\\s\\S]*?)\"location\":\\s*\"Vitrina Principal - Collares\"`, 'g');
  
  content = content.replace(regex, `$1"category": "Anillos"$2"location": "Vitrina Principal - Anillos"`);
});

fs.writeFileSync(mockDataPath, content);
console.log("Fixed rings");
