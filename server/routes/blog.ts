import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Derive category from slug
function getCategoryFromSlug(slug: string): string {
  if (slug.startsWith('capital-markets-')) return 'capital-markets';
  if (slug.startsWith('tax-strategy-')) return 'tax-strategy';
  if (slug.startsWith('financial-planning-')) return 'financial-planning';
  if (slug.startsWith('finance-dailies-')) return 'finance-dailies';
  return 'free';
}

// Estimate read time from content
function getReadTime(contentHtml: string | null): string {
  if (!contentHtml) return '3 min';
  const wordCount = contentHtml.replace(/<[^>]+>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return `${minutes} min`;
}

export async function registerBlogRoutes(app: Express) {
  app.get('/api/blog/posts', async (req, res) => {
    try {
      const { limit = 50, category } = req.query;
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, preview, featured_image, published_at, content_html')
        .order('published_at', { ascending: false })
        .limit(Number(limit));
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ message: 'Failed to fetch posts' });
      }
      
      // Add category and readTime to each post
      const enrichedPosts = (posts || []).map(post => ({
        ...post,
        category: getCategoryFromSlug(post.slug),
        readTime: getReadTime(post.content_html),
        isPremium: !post.slug.startsWith('finance-dailies-') && getCategoryFromSlug(post.slug) !== 'free',
        // Remove content_html from list response (too large)
        content_html: undefined,
      }));
      
      // Filter by category if specified
      const filteredPosts = category && category !== 'all'
        ? enrichedPosts.filter(p => p.category === category)
        : enrichedPosts;
      
      res.json({ posts: filteredPosts, source: 'supabase' });
    } catch (error) {
      console.error('Get blog posts error:', error);
      res.status(500).json({ message: 'Failed to get blog posts' });
    }
  });

  app.get('/api/blog/posts/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Enrich with category and readTime
      const enrichedPost = {
        ...post,
        category: getCategoryFromSlug(post.slug),
        readTime: getReadTime(post.content_html),
        isPremium: !post.slug.startsWith('finance-dailies-') && getCategoryFromSlug(post.slug) !== 'free',
      };
      
      res.json({ post: enrichedPost, source: 'supabase' });
    } catch (error) {
      console.error('Get blog post error:', error);
      res.status(500).json({ message: 'Failed to get blog post' });
    }
  });

  app.get('/blog', async (_req, res) => {
    res.sendFile('blog.html', { root: './public' });
  });

  app.get('/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const baseUrl = 'https://chargewealth.co';
      
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !post) {
        return res.redirect('/blog');
      }
      
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | Charge Wealth</title>
    <meta name="description" content="${post.preview || ''}">
    <link rel="canonical" href="${baseUrl}/blog/${post.slug}">
    
    <meta property="og:type" content="article">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.preview || ''}">
    <meta property="og:url" content="${baseUrl}/blog/${post.slug}">
    ${post.featured_image ? `<meta property="og:image" content="${post.featured_image}">` : ''}
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.title}">
    <meta name="twitter:description" content="${post.preview || ''}">
    ${post.featured_image ? `<meta name="twitter:image" content="${post.featured_image}">` : ''}
    
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "${post.title}",
      "description": "${post.preview || ''}",
      "author": {
        "@type": "Organization",
        "name": "Charge Wealth"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Charge Wealth",
        "url": "${baseUrl}"
      },
      "datePublished": "${post.published_at ? new Date(post.published_at).toISOString() : ''}",
      "mainEntityOfPage": "${baseUrl}/blog/${post.slug}"
    }
    </script>
    
    <style>
        :root {
            --bg-vanilla: #F9F6F0;
            --card-cream: #FFFDFB;
            --text-primary: #1F2937;
            --text-secondary: #6B7280;
            --accent-honey: #F6DBA6;
            --accent-honey-dark: #D4A853;
            --border-light: rgba(31, 41, 55, 0.1);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg-vanilla);
            color: var(--text-primary);
            line-height: 1.7;
            min-height: 100%;
        }
        main, article {
            background: var(--bg-vanilla);
        }
        header {
            background: var(--card-cream);
            border-bottom: 1px solid var(--border-light);
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(10px);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .header-content {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            color: var(--text-primary);
            font-size: 1.5rem;
            font-weight: 700;
            text-decoration: none;
        }
        .logo:hover { color: var(--accent-honey-dark); }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .nav-links a {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--text-primary); }
        main { max-width: 800px; margin: 0 auto; padding: 3rem 2rem; }
        .breadcrumb {
            color: var(--text-secondary);
            font-size: 0.85rem;
            margin-bottom: 2rem;
        }
        .breadcrumb a { color: var(--accent-honey-dark); text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .featured-image {
            width: 100%;
            max-height: 400px;
            object-fit: cover;
            border-radius: 12px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            line-height: 1.2;
            color: var(--text-primary);
        }
        .meta {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 2rem;
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
        }
        .content {
            font-size: 1.1rem;
            background: var(--bg-vanilla);
        }
        .content, .content *, .content div, .content table, .content td, .content tr, .content span, .content p {
            background: transparent !important;
            background-color: transparent !important;
            color: var(--text-primary) !important;
        }
        .content h1, .content h1 * {
            color: var(--text-primary) !important;
            background: transparent !important;
        }
        .content h2, .content h2 * {
            font-size: 1.75rem;
            margin: 2.5rem 0 1rem;
            color: var(--text-primary) !important;
            background: transparent !important;
            border-bottom: 2px solid var(--accent-honey);
            padding-bottom: 0.5rem;
        }
        .content h3, .content h3 * {
            font-size: 1.35rem;
            margin: 2rem 0 0.75rem;
            color: var(--text-primary) !important;
            background: transparent !important;
        }
        .content p { margin-bottom: 1.25rem; }
        .content a, .content a * { color: var(--accent-honey-dark) !important; }
        .content strong, .content b { color: var(--text-primary) !important; font-weight: 600; }
        .content ul, .content ol {
            margin: 1rem 0 1.5rem 1.5rem;
        }
        .content li { margin-bottom: 0.5rem; }
        .content blockquote {
            border-left: 3px solid var(--accent-honey);
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            color: var(--text-secondary);
            font-style: italic;
            background: var(--card-cream) !important;
            padding: 1rem 1.5rem;
            border-radius: 0 8px 8px 0;
        }
        .content pre {
            background: var(--card-cream) !important;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1rem 0;
            border: 1px solid var(--border-light);
        }
        .content code {
            background: var(--card-cream) !important;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9em;
            color: var(--text-primary) !important;
        }
        .content a {
            color: var(--accent-honey-dark);
            text-decoration: underline;
        }
        .content .tldr, .tldr {
            background: var(--card-cream) !important;
            border-left: 4px solid var(--accent-honey);
            padding: 1.25rem 1.5rem;
            margin: 1.5rem 0 2rem;
            border-radius: 0 8px 8px 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .tldr h3 {
            color: var(--text-primary) !important;
            margin: 0 0 0.75rem 0 !important;
            font-size: 1.1rem;
        }
        .tldr ul {
            margin: 0 0 0 1.25rem;
        }
        .tldr li {
            margin-bottom: 0.4rem;
        }
        .content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1.5rem 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .cta-box {
            background: var(--card-cream);
            border: 2px solid var(--accent-honey);
            border-radius: 12px;
            padding: 2rem;
            margin: 3rem 0;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }
        .cta-box h3 {
            color: var(--text-primary);
            margin-bottom: 1rem;
        }
        .cta-box p {
            color: var(--text-secondary);
        }
        .cta-box a {
            display: inline-block;
            background: var(--accent-honey);
            color: var(--text-primary);
            padding: 0.875rem 2rem;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
            transition: background 0.2s, transform 0.2s;
        }
        .cta-box a:hover {
            background: var(--accent-honey-dark);
            transform: translateY(-1px);
        }
        footer {
            background: var(--card-cream);
            border-top: 1px solid var(--border-light);
            padding: 2rem;
            margin-top: 4rem;
            text-align: center;
        }
        footer a { color: var(--text-secondary); text-decoration: none; margin: 0 1rem; font-size: 0.85rem; transition: color 0.2s; }
        footer a:hover { color: var(--text-primary); }
        footer p { color: var(--text-secondary); font-size: 0.8rem; margin-top: 1rem; }
        @media (max-width: 768px) {
            h1 { font-size: 1.75rem; }
            main { padding: 2rem 1rem; }
            .nav-links { display: none; }
            .meta { flex-direction: column; gap: 0.5rem; }
            .cta-box { padding: 1.5rem; }
        }
        @media (max-width: 480px) {
            h1 { font-size: 1.5rem; }
            .content { font-size: 1rem; }
            .featured-image { border-radius: 8px; }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <a href="/" class="logo">Charge Wealth</a>
            <nav class="nav-links">
                <a href="/">Home</a>
                <a href="/blog">Blog</a>
                <a href="/dashboard">Dashboard</a>
            </nav>
        </div>
    </header>
    
    <main>
        <nav class="breadcrumb">
            <a href="/">Home</a> / <a href="/blog">Blog</a> / ${post.title.substring(0, 40)}${post.title.length > 40 ? '...' : ''}
        </nav>
        
        <article>
            ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="featured-image">` : ''}
            <h1>${post.title}</h1>
            <div class="meta">
                <span>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                <span>${Math.ceil((post.content_html?.length || 0) / 1000)} min read</span>
                <span>By CFOAnon</span>
            </div>
            
            <div class="content">
                ${post.content_html}
            </div>
            
            <div class="cta-box">
                <h3>Ready to optimize your finances?</h3>
                <p>Join thousands of high earners saving $3K-15K annually with AI-powered tax strategies.</p>
                <a href="/dashboard">Get Started - $279 Lifetime</a>
            </div>
        </article>
    </main>
    
    <footer>
        <div>
            <a href="/">Home</a>
            <a href="/blog">Blog</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/terms.html">Terms</a>
            <a href="/privacy.html">Privacy</a>
        </div>
        <p>No 1% AUM fees. No sales. No BS. &copy; 2026 Charge Wealth</p>
    </footer>
</body>
</html>`;
      
      res.header('Content-Type', 'text/html');
      res.header('Cache-Control', 'no-cache');
      res.send(htmlContent);
    } catch (error) {
      console.error('Blog post render error:', error);
      res.redirect('/blog');
    }
  });

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const baseUrl = 'https://chargewealth.co';
      
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, published_at');
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/disclaimers.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;
      
      for (const post of (posts || []) as any[]) {
        const lastmod = post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
      
      xml += `
</urlset>`;
      
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });
}
