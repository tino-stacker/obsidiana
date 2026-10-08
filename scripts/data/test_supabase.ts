import { supabase } from './src/lib/supabase';

async function test() {
  const { data, error } = await supabase.from('productos').select('*');
  console.log('Error:', error);
  console.log('Count:', data?.length);
  if (data && data.length > 0) {
    console.log('First product keys:', Object.keys(data[0]));
    console.log('First product name:', data[0].nombre);
    console.log('First product category:', data[0].categoria);
  }
}
test();
