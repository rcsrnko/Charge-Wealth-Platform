import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://pbnixrlwlrhqbdkcuagd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibml4cmx3bHJocWJka2N1YWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc0NDU0NCwiZXhwIjoyMDgzMzIwNTQ0fQ.HEqIMm41sW7VeX93Hb08SmJ7EBy392et0IePZqBK448');
const { data } = await supabase.from('blog_posts').select('*').limit(5);
console.log('Posts:', JSON.stringify(data, null, 2));
