import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://pbnixrlwlrhqbdkcuagd.supabase.co', 'sb_publishable_8yjYuebQ0M4ws8DkEpev2w_DpMCwYwF');
const { data, error } = await supabase.from('blog_posts').select('*').limit(1);
console.log('Existing post:', JSON.stringify(data, null, 2));
console.log('Error:', error);
