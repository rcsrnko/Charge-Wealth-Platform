import Parser from 'rss-parser';

interface BeehiivPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  contentSnippet: string;
  publishedAt: string;
  author: string;
  link: string;
  thumbnail?: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

let postsCache: { posts: BeehiivPost[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function generateSlug(title: string, guid: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  
  const shortId = guid.split('/').pop()?.substring(0, 8) || Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${shortId}`;
}

export async function getBeehiivPosts(limit: number = 20): Promise<BeehiivPost[]> {
  const rssUrl = process.env.BEEHIIV_RSS_URL;
  
  if (!rssUrl) {
    console.warn('BEEHIIV_RSS_URL not configured, returning empty posts');
    return [];
  }

  const now = Date.now();
  if (postsCache && (now - postsCache.timestamp) < CACHE_TTL) {
    return postsCache.posts.slice(0, limit);
  }

  try {
    const feed = await parser.parseURL(rssUrl);
    
    const posts: BeehiivPost[] = feed.items.map((item: any) => {
      const slug = generateSlug(item.title || 'untitled', item.guid || item.link || '');
      
      let thumbnail = '';
      if (item.mediaContent && item.mediaContent.$) {
        thumbnail = item.mediaContent.$.url;
      } else if (item.enclosure?.url) {
        thumbnail = item.enclosure.url;
      }

      const content = item.contentEncoded || item.content || item['content:encoded'] || '';
      const snippet = item.contentSnippet || 
        content.replace(/<[^>]*>/g, '').substring(0, 200).trim() + '...';

      return {
        id: item.guid || item.link || slug,
        slug,
        title: item.title || 'Untitled',
        subtitle: snippet.substring(0, 150),
        content,
        contentSnippet: snippet,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        author: item.creator || item.author || 'Charge Wealth Team',
        link: item.link || '',
        thumbnail,
      };
    });

    postsCache = { posts, timestamp: now };
    console.log(`Fetched ${posts.length} posts from Beehiiv RSS`);
    
    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error fetching Beehiiv RSS:', error);
    if (postsCache) {
      return postsCache.posts.slice(0, limit);
    }
    return [];
  }
}

export async function getBeehiivPost(slug: string): Promise<BeehiivPost | null> {
  const posts = await getBeehiivPosts(100);
  return posts.find(post => post.slug === slug) || null;
}

export function clearBeehiivCache(): void {
  postsCache = null;
}
