import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
}

export function SEO({
  title = 'Charge Wealth - Your AI-Powered Financial Dashboard',
  description = 'AI-powered tax optimization, portfolio analysis, and financial planning for high earners. Stop leaving $8,400/year on the table.',
  url = 'https://chargewealth.co',
  image = 'https://chargewealth.co/og-image.png',
  type = 'website',
  publishedTime,
  author = 'Charge Wealth',
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta
    setMeta('description', description);

    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:url', url, true);
    setMeta('og:image', image, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', 'Charge Wealth', true);

    // Twitter
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:url', url);
    setMeta('twitter:image', image);

    // Article-specific
    if (type === 'article' && publishedTime) {
      setMeta('article:published_time', publishedTime, true);
      setMeta('article:author', author, true);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Cleanup: reset to defaults when component unmounts
    return () => {
      document.title = 'Charge Wealth - Your AI-Powered Financial Dashboard';
    };
  }, [title, description, url, image, type, publishedTime, author]);

  return null;
}
