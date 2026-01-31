# Supabase Project Consolidation

## Overview
Migrating from two Supabase projects to one consolidated "Auth" project.

**Old Blog Project (DEPRECATED):** `pbnixrlwlrhqbdkcuagd`
**New Auth Project (USE THIS):** `txoyxidyfqetbillypdt`

## Migration Steps

### 1. Create blog_posts table in Auth project
Go to Supabase Dashboard → SQL Editor → Run the contents of `supabase-migration.sql`

### 2. Migrate blog data
After creating the table, run:
```bash
cd /root/clawd/Charge-Wealth-Platform
node migrate-blog-posts.js
```

### 3. Update Replit Secrets
Ryan needs to update these in Replit:

| Secret Name | New Value |
|-------------|-----------|
| `SUPABASE_URL` | `https://txoyxidyfqetbillypdt.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3l4aWR5ZnFldGJpbGx5cGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY2NjkxMywiZXhwIjoyMDg0MjQyOTEzfQ.W2jzeurwhk9By2QrV-acVnqH0393-0fJVuJ73knIpQ4` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3l4aWR5ZnFldGJpbGx5cGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjY5MTMsImV4cCI6MjA4NDI0MjkxM30.Sy4QkVas9wcVYBMZIDbvz4pDT5SsFZiDi4w4SuMGcDM` |
| `VITE_SUPABASE_URL` | `https://txoyxidyfqetbillypdt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4b3l4aWR5ZnFldGJpbGx5cGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjY5MTMsImV4cCI6MjA4NDI0MjkxM30.Sy4QkVas9wcVYBMZIDbvz4pDT5SsFZiDi4w4SuMGcDM` |

## Files Changed
- `.env` - Updated with new credentials
- `supabase-migration.sql` - SQL to create blog_posts table
- `migrate-blog-posts.js` - Script to migrate blog data
- `blog_posts_export.json` - Exported blog data (38 posts)

## Note About articles Table
The Auth project already has an `articles` table with a DIFFERENT schema (for news scraping). The Blog project's articles table had newsletter-related fields. These are separate use cases - no migration needed for articles.

## After Migration
The old Blog project (`pbnixrlwlrhqbdkcuagd`) can be archived/deleted once migration is verified.
