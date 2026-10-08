const fs = require('fs');

const mockDataPath = 'src/data/mockData.ts';
let content = fs.readFileSync(mockDataPath, 'utf8');

const pulseras = ['Trebol Brillante', 'Tres Lazos', 'Corazones', 'Eslabones Finos'];

pulseras.forEach(pulsera => {
  const searchName = pulsera;
  const regex = new RegExp(`(\"name\":\\s*\"${searchName}\"[\\s\\S]*?)\"category\":\\s*\"Collares\"([\\s\\S]*?)\"location\":\\s*\"Vitrina Principal - Collares\"`, 'g');
  
  content = content.replace(regex, `$1"category": "Pulseras"$2"location": "Vitrina Principal - Pulseras"`);
});

fs.writeFileSync(mockDataPath, content);
console.log("Fixed pulseras");
