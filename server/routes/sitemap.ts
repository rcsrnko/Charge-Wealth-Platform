import type { Express } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export function registerSitemapRoutes(app: Express) {
  // XML Sitemap
  app.get('/sitemap.xml', async (req, res) => {
    try {
      // Fetch all blog posts
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, published_at')
        .order('published_at', { ascending: false });

      const baseUrl = 'https://chargewealth.co';
      
      // Static pages
      const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/take-charge', priority: '0.9', changefreq: 'daily' },
        { loc: '/tools', priority: '0.8', changefreq: 'monthly' },
        { loc: '/premium-tools', priority: '0.7', changefreq: 'monthly' },
        { loc: '/take-charge/subscribe', priority: '0.7', changefreq: 'monthly' },
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

      // Add static pages
      for (const page of staticPages) {
        xml += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
      }

      // Add blog posts
      if (posts) {
        for (const post of posts) {
          const lastmod = post.published_at 
            ? new Date(post.published_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
          
          xml += `  <url>
    <loc>${baseUrl}/take-charge/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      }

      xml += '</urlset>';

      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt
  app.get('/robots.txt', (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/

Sitemap: https://chargewealth.co/sitemap.xml
`;
    res.set('Content-Type', 'text/plain');
    res.send(robots);
  });
}
