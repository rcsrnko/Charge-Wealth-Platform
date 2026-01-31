// Migration script: Run AFTER creating the blog_posts table in Supabase Dashboard
// Usage: node migrate-blog-posts.js

const fs = require('fs');

const DEST_URL = 'https://txoyxidyfqetbillypdt.supabase.co';
const DEST_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3l4aWR5ZnFldGJpbGx5cGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY2NjkxMywiZXhwIjoyMDg0MjQyOTEzfQ.W2jzeurwhk9By2QrV-acVnqH0393-0fJVuJ73knIpQ4';

async function migrate() {
    // Read exported data
    const data = JSON.parse(fs.readFileSync('./blog_posts_export.json', 'utf8'));
    console.log(`Migrating ${data.length} blog posts...`);
    
    // Insert in batches of 10 to avoid timeouts
    const batchSize = 10;
    let migrated = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const response = await fetch(`${DEST_URL}/rest/v1/blog_posts`, {
            method: 'POST',
            headers: {
                'apikey': DEST_KEY,
                'Authorization': `Bearer ${DEST_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(batch)
        });
        
        if (!response.ok) {
            const error = await response.text();
            console.error(`Error inserting batch ${i/batchSize + 1}:`, error);
        } else {
            migrated += batch.length;
            console.log(`Migrated ${migrated}/${data.length} posts`);
        }
    }
    
    console.log('Migration complete!');
}

migrate().catch(console.error);
