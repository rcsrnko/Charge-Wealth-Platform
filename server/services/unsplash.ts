/**
 * Unsplash Image Service
 * Auto-fetches relevant images for blog posts
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

// Category-specific search terms for better results
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  'finance-dailies': ['stock market', 'financial news', 'wall street', 'trading floor'],
  'tax-strategy': ['tax documents', 'calculator finance', 'accounting', 'financial planning'],
  'financial-planning': ['savings goals', 'retirement planning', 'wealth management', 'financial freedom'],
  'capital-markets': ['stock charts', 'trading', 'investment', 'market analysis'],
};

// Fallback images if Unsplash fails (same as frontend defaults)
const FALLBACK_IMAGES: Record<string, string> = {
  'finance-dailies': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
  'tax-strategy': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop',
  'financial-planning': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=500&fit=crop',
  'capital-markets': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop',
};

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
}

/**
 * Fetch a relevant image from Unsplash based on category and optional keywords
 */
export async function fetchUnsplashImage(
  category: string,
  keywords?: string[]
): Promise<string> {
  // If no API key, return fallback
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('No Unsplash API key, using fallback image');
    return FALLBACK_IMAGES[category] || FALLBACK_IMAGES['finance-dailies'];
  }

  try {
    // Build search query
    const categoryTerms = CATEGORY_SEARCH_TERMS[category] || CATEGORY_SEARCH_TERMS['finance-dailies'];
    const searchTerms = keywords?.length ? keywords : categoryTerms;
    const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const photo: UnsplashPhoto = await response.json();
    
    // Return optimized URL (800px wide)
    return `${photo.urls.raw}&w=800&h=500&fit=crop&q=80`;
  } catch (error) {
    console.error('Failed to fetch Unsplash image:', error);
    return FALLBACK_IMAGES[category] || FALLBACK_IMAGES['finance-dailies'];
  }
}

/**
 * Extract keywords from a blog post title for better image matching
 */
export function extractKeywords(title: string): string[] {
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
    'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because',
    'until', 'while', 'your', 'you', 'what', 'this', 'that', 'these', 'those'];
  
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 3);
}

export default {
  fetchUnsplashImage,
  extractKeywords,
};
