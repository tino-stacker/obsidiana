import { createClient } from '@supabase/supabase-js';

const meta = import.meta as any;
const env = (typeof meta !== 'undefined' && meta.env) ? meta.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://odjofatvoxrpiebwgwqj.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kam9mYXR2b3hycGllYndnd3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0OTQ0OTcsImV4cCI6MjEwNzA3MDQ5N30.32WyxDPDXmtNFBlavrtmpZKxaDFTygjUjFNNj8CxtJM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
