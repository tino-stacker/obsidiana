import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { INITIAL_PROVINCES, INITIAL_ZONES, INITIAL_DISTRICTS } from './src/data/mockData';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Verificando provincias...');
  const { data: provs } = await supabase.from('provincias').select('id');
  if (!provs || provs.length === 0) {
    console.log('Insertando provincias...');
    const provsToInsert = INITIAL_PROVINCES.map(p => ({
      id: p.id,
      nombre: p.name,
      codigo: p.code,
    }));
    await supabase.from('provincias').insert(provsToInsert);
  }

  console.log('Verificando zonas...');
  const { data: zones } = await supabase.from('zonas').select('id');
  if (!zones || zones.length === 0) {
    console.log('Insertando zonas...');
    const zonesToInsert = INITIAL_ZONES.map(z => ({
      id: z.id,
      nombre: z.name,
      provincia_id: z.provinceId,
      tarifa_envio: z.shippingFee,
      dias_estimados: z.estimatedDays,
      courier_asignado: z.courierAssigned,
      estado: z.status,
    }));
    await supabase.from('zonas').insert(zonesToInsert);
  }

  console.log('Verificando distritos...');
  const { data: dists } = await supabase.from('distritos').select('id');
  if (!dists || dists.length === 0) {
    console.log('Insertando distritos...');
    const distsToInsert = INITIAL_DISTRICTS.map(d => ({
      id: d.id,
      nombre: d.name,
      provincia_id: d.provinceId,
      zona_id: d.zoneId,
    }));
    await supabase.from('distritos').insert(distsToInsert);
  }

  console.log('Zonas seeded successfully!');
}

seed().catch(console.error);
