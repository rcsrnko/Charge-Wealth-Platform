import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  keywords?: string[];
  noindex?: boolean;
}

export function SEO({
  title = 'Charge Wealth - Your AI-Powered Financial Dashboard',
  description = 'AI-powered tax optimization, portfolio analysis, and financial planning for high earners. Stop leaving $8,400/year on the table.',
  url = 'https://chargewealth.co',
  image = 'https://chargewealth.co/og-image.png',
  type = 'website',
  publishedTime,
  author = 'Charge Wealth',
  keywords = [],
  noindex = false,
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
    
    // Keywords
    if (keywords.length > 0) {
      setMeta('keywords', keywords.join(', '));
    }
    
    // Robots
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      setMeta('robots', 'index, follow');
    }

    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:url', url, true);
    setMeta('og:image', image, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', 'Charge Wealth', true);

    // Twitter
    setMeta('twitter:card', 'summary_large_image');
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

    // JSON-LD Structured Data
    let jsonLd = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      document.head.appendChild(jsonLd);
    }

    if (type === 'article') {
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description,
        image: image,
        url: url,
        datePublished: publishedTime,
        author: {
          '@type': 'Organization',
          name: author,
          url: 'https://chargewealth.co',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Charge Wealth',
          url: 'https://chargewealth.co',
          logo: {
            '@type': 'ImageObject',
            url: 'https://chargewealth.co/logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
      });
    } else {
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Charge Wealth',
        url: 'https://chargewealth.co',
        description: 'AI-powered tax optimization and financial planning for high earners.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://chargewealth.co/take-charge?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      });
    }

    // Cleanup: reset to defaults when component unmounts
    return () => {
      document.title = 'Charge Wealth - Your AI-Powered Financial Dashboard';
    };
  }, [title, description, url, image, type, publishedTime, author, keywords, noindex]);

  return null;
}

// Blog-specific SEO helper
export function BlogSEO({ 
  title, 
  description, 
  slug, 
  publishedTime,
  category,
  image,
}: { 
  title: string;
  description: string;
  slug: string;
  publishedTime?: string;
  category?: string;
  image?: string;
}) {
  const categoryKeywords: Record<string, string[]> = {
    'finance-dailies': ['market news', 'financial news', 'daily finance', 'stock market update'],
    'tax-strategy': ['tax optimization', 'tax savings', 'tax deductions', 'tax planning', 'high earner taxes'],
    'financial-planning': ['financial planning', 'wealth building', 'retirement planning', 'financial independence'],
    'capital-markets': ['investing', 'stock market', 'portfolio management', 'market analysis'],
  };

  const baseKeywords = ['Charge Wealth', 'financial advice', 'high earners', 'personal finance'];
  const catKeywords = category ? (categoryKeywords[category] || []) : [];

  return (
    <SEO
      title={`${title} | Charge Wealth`}
      description={description}
      url={`https://chargewealth.co/take-charge/${slug}`}
      image={image || 'https://chargewealth.co/og-image.png'}
      type="article"
      publishedTime={publishedTime}
      keywords={[...baseKeywords, ...catKeywords]}
    />
  );
}
