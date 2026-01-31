-- Supabase Migration: Create blog_posts table
-- Run this in the Supabase Dashboard SQL Editor for project: txoyxidyfqetbillypdt

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    preview TEXT,
    content_html TEXT,
    content_markdown TEXT,
    featured_image TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.blog_posts
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert" ON public.blog_posts
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON public.blog_posts
    FOR UPDATE
    USING (true);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts(slug);

-- Create index on published_at for sorting
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts(published_at DESC);

-- Grant access to anon and authenticated roles
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
