import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://pbnixrlwlrhqbdkcuagd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibml4cmx3bHJocWJka2N1YWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc0NDU0NCwiZXhwIjoyMDgzMzIwNTQ0fQ.HEqIMm41sW7VeX93Hb08SmJ7EBy392et0IePZqBK448');

// Fix date to Jan 29
const { data, error } = await supabase
  .from('blog_posts')
  .update({ published_at: '2026-01-29T17:00:00.000Z' })
  .eq('slug', 'finance-dailies-2026-01-29')
  .select('slug, published_at');

console.log('Updated:', data, error);
