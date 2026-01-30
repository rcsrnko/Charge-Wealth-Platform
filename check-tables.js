// Check which Supabase has the tables
import { createClient } from '@supabase/supabase-js';

// Project 1 - VITE (frontend)
const sb1 = createClient(
  'https://txoyxidyfqetbillypdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3l4aWR5ZnFldGJpbGx5cGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjY5MTMsImV4cCI6MjA4NDI0MjkxM30.Sy4QkVas9wcVYBMZIDbvz4pDT5SsFZiDi4w4SuMGcDM'
);

// Project 2 - Server
const sb2 = createClient(
  'https://pbnixrlwlrhqbdkcuagd.supabase.co',
  'sb_publishable_8yjYuebQ0M4ws8DkEpev2w_DpMCwYwF'
);

async function checkTables() {
  console.log('Checking Project 1 (txoyxidyfqetbillypdt)...');
  const { data: d1, error: e1 } = await sb1.from('blog_posts').select('*').limit(1);
  console.log('Result:', e1 ? `Error: ${e1.message}` : `Found ${d1?.length || 0} posts`);
  
  console.log('\nChecking Project 2 (pbnixrlwlrhqbdkcuagd)...');
  const { data: d2, error: e2 } = await sb2.from('blog_posts').select('*').limit(1);
  console.log('Result:', e2 ? `Error: ${e2.message}` : `Found ${d2?.length || 0} posts`);
}

checkTables().catch(console.error);
