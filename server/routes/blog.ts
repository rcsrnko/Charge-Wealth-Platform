import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function registerBlogRoutes(app: Express) {
  app.get('/api/blog/posts', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, preview, featured_image, published_at')
        .order('published_at', { ascending: false })
        .limit(Number(limit));
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ message: 'Failed to fetch posts' });
      }
      
      res.json({ posts: posts || [], source: 'supabase' });
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
      
      res.json({ post, source: 'supabase' });
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
            --midnight-blue: #0F1117;
            --deep-navy: #1A1D28;
            --gold-sand: #C9A962;
            --porcelain: #F4F5F7;
            --muted-gray: #6B7280;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--midnight-blue) !important;
            background-color: var(--midnight-blue) !important;
            color: var(--porcelain);
            line-height: 1.7;
            min-height: 100%;
        }
        main, article {
            background: var(--midnight-blue) !important;
        }
        header {
            background: rgba(15, 17, 23, 0.95);
            border-bottom: 1px solid rgba(201, 169, 98, 0.15);
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(10px);
        }
        .header-content {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            color: var(--gold-sand);
            font-size: 1.5rem;
            font-weight: 700;
            text-decoration: none;
        }
        .nav-links { display: flex; gap: 2rem; }
        .nav-links a {
            color: var(--porcelain);
            text-decoration: none;
            font-size: 0.9rem;
        }
        .nav-links a:hover { color: var(--gold-sand); }
        main { max-width: 800px; margin: 0 auto; padding: 3rem 2rem; }
        .breadcrumb {
            color: var(--muted-gray);
            font-size: 0.85rem;
            margin-bottom: 2rem;
        }
        .breadcrumb a { color: var(--gold-sand); text-decoration: none; }
        .featured-image {
            width: 100%;
            max-height: 400px;
            object-fit: cover;
            border-radius: 12px;
            margin-bottom: 2rem;
        }
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            line-height: 1.2;
        }
        .meta {
            color: var(--muted-gray);
            font-size: 0.9rem;
            margin-bottom: 2rem;
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
        }
        .content {
            font-size: 1.1rem;
            background: var(--midnight-blue) !important;
        }
        .content, .content *, .content div, .content table, .content td, .content tr, .content span, .content p {
            background: var(--midnight-blue) !important;
            background-color: var(--midnight-blue) !important;
            color: var(--porcelain) !important;
        }
        .content h1, .content h1 * {
            color: var(--porcelain) !important;
            background: var(--midnight-blue) !important;
        }
        .content h2, .content h2 * {
            font-size: 1.75rem;
            margin: 2.5rem 0 1rem;
            color: var(--gold-sand) !important;
            background: var(--midnight-blue) !important;
        }
        .content h3, .content h3 * {
            font-size: 1.35rem;
            margin: 2rem 0 0.75rem;
            color: var(--porcelain) !important;
            background: var(--midnight-blue) !important;
        }
        .content p { margin-bottom: 1.25rem; }
        .content a, .content a * { color: var(--gold-sand) !important; }
        .content strong, .content b { color: var(--gold-sand) !important; }
        .content ul, .content ol {
            margin: 1rem 0 1.5rem 1.5rem;
        }
        .content li { margin-bottom: 0.5rem; }
        .content strong { color: var(--gold-sand); }
        .content blockquote {
            border-left: 3px solid var(--gold-sand);
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            color: var(--muted-gray);
            font-style: italic;
        }
        .content pre {
            background: var(--deep-navy);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1rem 0;
        }
        .content code {
            background: var(--deep-navy);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .content a {
            color: var(--gold-sand);
            text-decoration: underline;
        }
        .content .tldr, .tldr {
            background: var(--deep-navy);
            border-left: 4px solid var(--gold-sand);
            padding: 1.25rem 1.5rem;
            margin: 1.5rem 0 2rem;
            border-radius: 0 8px 8px 0;
        }
        .tldr h3 {
            color: var(--gold-sand) !important;
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
        }
        .cta-box {
            background: var(--deep-navy);
            border: 1px solid var(--gold-sand);
            border-radius: 12px;
            padding: 2rem;
            margin: 3rem 0;
            text-align: center;
        }
        .cta-box h3 {
            color: var(--gold-sand);
            margin-bottom: 1rem;
        }
        .cta-box a {
            display: inline-block;
            background: var(--gold-sand);
            color: var(--midnight-blue);
            padding: 0.875rem 2rem;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
        }
        footer {
            background: var(--deep-navy);
            border-top: 1px solid rgba(201, 169, 98, 0.1);
            padding: 2rem;
            margin-top: 4rem;
            text-align: center;
        }
        footer a { color: var(--muted-gray); text-decoration: none; margin: 0 1rem; font-size: 0.85rem; }
        footer p { color: var(--muted-gray); font-size: 0.8rem; margin-top: 1rem; }
        @media (max-width: 768px) {
            h1 { font-size: 1.75rem; }
            .nav-links { display: none; }
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
