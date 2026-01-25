import type { Express } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";

function formatMarkdown(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => c.trim().match(/^-+$/))) return '';
      const isHeader = cells.some(c => c.includes('---'));
      if (isHeader) return '';
      const tag = 'td';
      return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<')) return line;
      return line;
    });
}

export async function registerBlogRoutes(app: Express) {
  const { getBeehiivPosts, getBeehiivPost } = await import('../beehiivService');

  app.get('/api/blog/posts', async (req, res) => {
    try {
      const { limit = 20, source } = req.query;
      
      const beehiivPosts = await getBeehiivPosts(Number(limit));
      
      if (beehiivPosts.length > 0 && source !== 'db') {
        const posts = beehiivPosts.map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.subtitle,
          meta_description: p.contentSnippet,
          author: p.author,
          published_at: p.publishedAt,
          featured_image: p.thumbnail,
          source: 'beehiiv',
          link: p.link,
        }));
        return res.json({ posts, source: 'beehiiv' });
      }
      
      const result = await db.execute(sql`
        SELECT id, slug, title, meta_description, excerpt, category, tags, author,
               featured_image, published_at, read_time_minutes
        FROM blog_posts
        WHERE is_published = true
        ORDER BY published_at DESC
        LIMIT ${Number(limit)}
      `);
      
      const rows = Array.isArray(result) ? result : ((result as any).rows || []);
      res.json({ posts: rows, source: 'database' });
    } catch (error) {
      console.error('Get blog posts error:', error);
      res.status(500).json({ message: 'Failed to get blog posts' });
    }
  });

  app.get('/api/blog/posts/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      const beehiivPost = await getBeehiivPost(slug);
      if (beehiivPost) {
        return res.json({
          post: {
            id: beehiivPost.id,
            slug: beehiivPost.slug,
            title: beehiivPost.title,
            content: beehiivPost.content,
            excerpt: beehiivPost.subtitle,
            meta_description: beehiivPost.contentSnippet,
            author: beehiivPost.author,
            published_at: beehiivPost.publishedAt,
            featured_image: beehiivPost.thumbnail,
            link: beehiivPost.link,
            source: 'beehiiv',
          },
          source: 'beehiiv',
        });
      }
      
      const result = await db.execute(sql`
        SELECT * FROM blog_posts WHERE slug = ${slug} AND is_published = true
      `);
      
      const rows = Array.isArray(result) ? result : ((result as any).rows || []);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json({ post: rows[0], source: 'database' });
    } catch (error) {
      console.error('Get blog post error:', error);
      res.status(500).json({ message: 'Failed to get blog post' });
    }
  });

  app.get('/api/blog/categories', async (_req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT category, COUNT(*) as count
        FROM blog_posts
        WHERE is_published = true AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `);
      
      const rows = Array.isArray(result) ? result : ((result as any).rows || []);
      res.json({ categories: rows });
    } catch (error) {
      console.error('Get blog categories error:', error);
      res.status(500).json({ message: 'Failed to get categories' });
    }
  });

  app.get('/blog', async (_req, res) => {
    res.sendFile('blog.html', { root: './public' });
  });

  app.get('/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const baseUrl = 'https://chargewealth.com';
      
      const beehiivPost = await getBeehiivPost(slug);
      let post: any = null;
      
      if (beehiivPost) {
        post = {
          title: beehiivPost.title,
          content: beehiivPost.content,
          meta_description: beehiivPost.contentSnippet,
          excerpt: beehiivPost.subtitle,
          author: beehiivPost.author,
          published_at: beehiivPost.publishedAt,
          slug: beehiivPost.slug,
          featured_image: beehiivPost.thumbnail,
          link: beehiivPost.link,
        };
      } else {
        const result = await db.execute(sql`
          SELECT * FROM blog_posts WHERE slug = ${slug} AND is_published = true
        `);
        
        const rows = Array.isArray(result) ? result : ((result as any).rows || []);
        if (rows.length === 0) {
          return res.redirect('/blog');
        }
        post = rows[0];
      }
      
      if (!post) {
        return res.redirect('/blog');
      }
      
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | Charge Wealth</title>
    <meta name="description" content="${post.meta_description || post.excerpt || ''}">
    <meta name="author" content="${post.author || 'Charge Wealth Team'}">
    <link rel="canonical" href="${baseUrl}/blog/${post.slug}">
    
    <meta property="og:type" content="article">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.meta_description || post.excerpt || ''}">
    <meta property="og:url" content="${baseUrl}/blog/${post.slug}">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${post.title}">
    <meta name="twitter:description" content="${post.meta_description || post.excerpt || ''}">
    
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
    
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "${post.title}",
      "description": "${post.meta_description || ''}",
      "author": {
        "@type": "Organization",
        "name": "${post.author || 'Charge Wealth'}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Charge Wealth",
        "url": "${baseUrl}"
      },
      "datePublished": "${post.published_at ? new Date(post.published_at).toISOString() : ''}",
      "dateModified": "${post.updated_at ? new Date(post.updated_at).toISOString() : ''}",
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
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--midnight-blue);
            color: var(--porcelain);
            line-height: 1.7;
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
        .category {
            color: var(--gold-sand);
            text-transform: uppercase;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.05em;
        }
        .content {
            font-size: 1.1rem;
        }
        .content h2 {
            font-size: 1.75rem;
            margin: 2.5rem 0 1rem;
            color: var(--gold-sand);
        }
        .content h3 {
            font-size: 1.35rem;
            margin: 2rem 0 0.75rem;
        }
        .content p { margin-bottom: 1.25rem; }
        .content ul, .content ol {
            margin: 1rem 0 1.5rem 1.5rem;
        }
        .content li { margin-bottom: 0.5rem; }
        .content strong { color: var(--gold-sand); }
        .content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
        }
        .content th, .content td {
            border: 1px solid rgba(201, 169, 98, 0.2);
            padding: 0.75rem;
            text-align: left;
        }
        .content th {
            background: var(--deep-navy);
            color: var(--gold-sand);
        }
        .content a {
            color: var(--gold-sand);
            text-decoration: underline;
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
            <a href="/">Home</a> / <a href="/blog">Blog</a> / ${post.title.substring(0, 40)}...
        </nav>
        
        <article>
            <span class="category">${post.category ? post.category.replace(/-/g, ' ') : 'Financial Planning'}</span>
            <h1>${post.title}</h1>
            <div class="meta">
                <span>${post.read_time_minutes || 5} min read</span>
                <span>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                <span>By ${post.author || 'Charge Wealth Team'}</span>
            </div>
            
            <div class="content">
                ${formatMarkdown(post.content)}
            </div>
            
            <div class="cta-box">
                <h3>Ready to optimize your finances?</h3>
                <p>Join thousands of high earners saving $3K-15K annually with AI-powered tax strategies.</p>
                <a href="/dashboard">Get Started — $279 Lifetime</a>
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
      res.send(htmlContent);
    } catch (error) {
      console.error('Blog post render error:', error);
      res.redirect('/blog');
    }
  });

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const baseUrl = 'https://chargewealth.com';
      
      const blogResult = await db.execute(sql`
        SELECT slug, updated_at FROM blog_posts WHERE is_published = true
      `);
      
      const posts = Array.isArray(blogResult) ? blogResult : (blogResult.rows || []);
      
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
      
      for (const post of posts as any[]) {
        const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
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
