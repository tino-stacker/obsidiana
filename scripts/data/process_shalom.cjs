const fs = require('fs');
const path = require('path');

const contentMdPath = path.resolve(
  'C:/Users/User/.gemini/antigravity/brain/5dfb5905-00f1-428b-9dd0-ef430cf35ea5/.system_generated/steps/315/content.md'
);
const outputDir = path.resolve(__dirname, 'src/data');
const outputFile = path.join(outputDir, 'shalomAgencias.ts');

console.log(`Reading Shalom agencies raw content from: ${contentMdPath}`);

if (!fs.existsSync(contentMdPath)) {
  console.error(`Error: File not found at ${contentMdPath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(contentMdPath, 'utf8');

// Skip the first 8 lines of header
const lines = fileContent.split('\n');
const jsonContent = lines.slice(8).join('\n').trim();

let rawAgencias = [];
try {
  rawAgencias = JSON.parse(jsonContent);
  console.log(`Successfully parsed ${rawAgencias.length} agencies from content.md.`);
} catch (err) {
  console.error('Error parsing JSON from content.md:', err.message);
  process.exit(1);
}

// Map each agency into standard format
const mappedAgencias = rawAgencias.map((item) => {
  let horario = '';
  if (item.horario_lv && item.horario_dom) {
    horario = `L-V: ${item.horario_lv.trim()} | Dom: ${item.horario_dom.trim()}`;
  } else if (item.horario_lv) {
    horario = `L-V: ${item.horario_lv.trim()}`;
  } else if (item.horario) {
    horario = item.horario.trim();
  }

  return {
    nombre: item.nombre ? item.nombre.trim() : '',
    departamento: item.departamento ? item.departamento.trim() : '',
    provincia: item.provincia ? item.provincia.trim() : '',
    distrito: item.distrito ? item.distrito.trim() : '',
    direccion: item.direccion ? item.direccion.trim() : '',
    referencia: item.referencia ? item.referencia.trim() : '',
    horario: horario,
    telefono: item.telefono ? item.telefono.trim() : undefined,
    lat: typeof item.lat === 'number' ? item.lat : null,
    lng: typeof item.lng === 'number' ? item.lng : null,
  };
});

// Extract unique sorted department names
const uniqueDepartamentos = [
  ...new Set(mappedAgencias.map((a) => a.departamento).filter(Boolean)),
].sort((a, b) => a.localeCompare(b, 'es'));

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate TypeScript code
const tsContent = `// Auto-generated file containing official Shalom Peru agency locations
// Generated on: ${new Date().toISOString()}

export interface AgenciaShalom {
  nombre: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia: string;
  horario: string;
  telefono?: string;
  lat?: number | null;
  lng?: number | null;
}

export const SHALOM_DEPARTAMENTOS: string[] = ${JSON.stringify(uniqueDepartamentos, null, 2)};

export const SHALOM_AGENCIAS: AgenciaShalom[] = ${JSON.stringify(mappedAgencias, null, 2)};
`;

fs.writeFileSync(outputFile, tsContent, 'utf8');

console.log(`\n========================================`);
console.log(`SUCCESS: Wrote ${mappedAgencias.length} agencies to ${outputFile}`);
console.log(`Total unique departamentos (${uniqueDepartamentos.length}):`);
uniqueDepartamentos.forEach((dep, index) => {
  const count = mappedAgencias.filter((a) => a.departamento === dep).length;
  console.log(`  ${index + 1}. ${dep} (${count} agencias)`);
});
console.log(`========================================\n`);
