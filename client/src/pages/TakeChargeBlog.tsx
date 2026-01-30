import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SEO } from '../components/SEO';
import { PaywallGate, PaywallBadge } from '../components/PaywallGate';
import { PremiumToolsSection } from '../components/PremiumToolsSection';
import { apiRequest } from '../lib/queryClient';

// Types
interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  preview?: string;
  excerpt?: string;
  content_html?: string;
  content_markdown?: string;
  content?: string;
  category: 'financial-planning' | 'tax-strategy' | 'capital-markets' | 'finance-dailies' | 'free';
  published_at?: string;
  date?: string;
  readTime?: string;
  isPremium?: boolean;
  featured_image?: string;
  image?: string;
}

// Premium categories that require subscription
const PREMIUM_CATEGORIES = ['financial-planning', 'tax-strategy', 'capital-markets'];

const CATEGORIES = [
  { id: 'all', label: 'All Posts' },
  { id: 'finance-dailies', label: 'Finance Dailies', premium: false },
  { id: 'capital-markets', label: 'Capital Markets', premium: true },
  { id: 'tax-strategy', label: 'Tax Strategy', premium: true },
  { id: 'financial-planning', label: 'Financial Planning', premium: true },
];

// Theme hook for dark/light mode - defaults to light (vanilla bean)
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('blog-theme');
      if (saved) return saved === 'dark';
      // Default to light mode (vanilla bean) instead of system preference
      return false;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('blog-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark(!isDark) };
}

// Theme toggle component
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 14,
        color: isDark ? '#F5F5F5' : '#1F2937',
        transition: 'all 0.2s',
      }}
    >
      {isDark ? (
        <>
          <span style={{ fontSize: 16 }}>☀️</span>
          <span style={{ display: 'none' }} className="toggle-label">Light</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 16 }}>🌙</span>
          <span style={{ display: 'none' }} className="toggle-label">Dark</span>
        </>
      )}
    </button>
  );
}

// Hook to check subscription status
function useBlogSubscription() {
  return useQuery({
    queryKey: ['blog-subscription-status'],
    queryFn: () => apiRequest('/api/blog/subscription-status'),
    retry: false,
    staleTime: 60000, // Cache for 1 minute
  });
}

// Hook to fetch all blog posts
function useBlogPosts(category?: string) {
  return useQuery({
    queryKey: ['blog-posts', category],
    queryFn: () => apiRequest(`/api/blog/posts?limit=100${category && category !== 'all' ? `&category=${category}` : ''}`),
    staleTime: 300000, // Cache for 5 minutes
  });
}

// Hook to fetch single blog post
function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => apiRequest(`/api/blog/posts/${slug}`),
    enabled: !!slug,
    staleTime: 300000,
  });
}

// Color scheme helper
function getColors(isDark: boolean) {
  return isDark ? {
    bg: '#121212',
    bgSecondary: '#1E1E1E',
    bgTertiary: '#252525',
    textPrimary: '#F5F5F5',
    textSecondary: '#A3A3A3',
    textMuted: '#737373',
    accent: '#F6DBA6',
    accentHover: '#E8C88A',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.15)',
  } : {
    bg: '#F9F6F0',
    bgSecondary: '#F5F2ED',
    bgTertiary: '#EFEBE5',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    accent: '#F6DBA6',
    accentHover: '#E8C88A',
    border: 'rgba(0,0,0,0.12)',
    borderHover: 'rgba(0,0,0,0.18)',
    card: '#FFFDFB',
  };
}

// Components
function BlogHeader({ isDark, onToggleTheme }: { isDark: boolean; onToggleTheme: () => void }) {
  const { data: subStatus } = useBlogSubscription();
  const hasAccess = subStatus?.hasAccess || false;
  const colors = getColors(isDark);

  return (
    <header style={{
      padding: '16px 32px',
      borderBottom: `1px solid ${colors.border}`,
      background: isDark ? '#121212' : '#FFFDFB',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/take-charge">
            <a style={{ color: colors.accent, fontSize: 20, fontWeight: 700, textDecoration: 'none' }}>
              Charge Wealth
            </a>
          </Link>
          <Link href="/take-charge">
            <a style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Take Charge
            </a>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <Link href="/tools">
            <a style={{ color: colors.textSecondary, fontSize: 14, textDecoration: 'none' }}>
              Free Tools
            </a>
          </Link>
          {hasAccess ? (
            <Link href="/dashboard">
              <a style={{
                background: isDark ? 'rgba(246,219,166,0.1)' : 'rgba(246,219,166,0.3)',
                color: colors.accent,
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
                border: `1px solid ${isDark ? 'rgba(246,219,166,0.3)' : 'rgba(246,219,166,0.5)'}`,
              }}>
                Dashboard
              </a>
            </Link>
          ) : (
            <Link href="/take-charge/subscribe">
              <a style={{
                background: colors.accent,
                color: '#4A3F2F',
                padding: '8px 16px',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
              }}>
                Subscribe
              </a>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function BlogIndex() {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [email, setEmail] = useState('');
  const [, setLocation] = useLocation();
  
  // Fetch posts from API
  const { data: postsData, isLoading, error } = useBlogPosts(selectedCategory);
  const posts: BlogPost[] = postsData?.posts || [];

  // Filter to show all main categories
  const filteredPosts = posts.filter(post => 
    post.category === 'finance-dailies' ||
    post.category === 'capital-markets' || 
    post.category === 'tax-strategy' || 
    post.category === 'financial-planning'
  );

  const handleSubscribe = async () => {
    if (!email) return;
    try {
      await apiRequest('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, source: 'blog' }),
      });
      alert('Thanks for subscribing!');
      setEmail('');
    } catch (error) {
      console.error('Subscribe error:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <BlogHeader isDark={isDark} onToggleTheme={toggleTheme} />

      {/* Hero */}
      <section style={{
        padding: '60px 32px',
        background: isDark 
          ? 'linear-gradient(180deg, #121212 0%, #1E1E1E 100%)'
          : 'linear-gradient(180deg, #F9F6F0 0%, #F5F2ED 100%)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 56px)',
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: 16,
        }}>
          Take Charge
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          color: colors.textSecondary,
          maxWidth: 600,
          margin: '0 auto 32px',
          padding: '0 16px',
        }}>
          Actionable financial insights for high earners. No fluff. No sales pitches. Just strategies that work.
        </p>

        {/* Email signup */}
        <div style={{
          maxWidth: 500,
          margin: '0 auto',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '0 16px',
        }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              flex: '1 1 250px',
              minWidth: 200,
              padding: '14px 20px',
              fontSize: 16,
              background: isDark ? '#1E1E1E' : '#FFFDFB',
              border: `1px solid ${isDark ? 'rgba(246,219,166,0.2)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 8,
              color: colors.textPrimary,
            }}
          />
          <button 
            onClick={handleSubscribe}
            style={{
              padding: '14px 28px',
              fontSize: 16,
              fontWeight: 600,
              background: colors.accent,
              color: '#4A3F2F',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Subscribe Free
          </button>
        </div>
        <p style={{ color: colors.textMuted, fontSize: 14, marginTop: 12 }}>
          Free weekly insights. Upgrade for daily premium content.
        </p>
      </section>

      {/* Categories */}
      <section style={{
        padding: '24px 32px',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                background: selectedCategory === cat.id ? colors.accent : 'transparent',
                color: selectedCategory === cat.id ? '#4A3F2F' : colors.textSecondary,
                border: selectedCategory === cat.id ? 'none' : `1px solid ${colors.border}`,
                borderRadius: 20,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
              {cat.premium && <span style={{ fontSize: 10 }}>🔒</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Premium Tools CTA Banner */}
      <section style={{
        padding: '24px 32px',
        background: isDark ? 'linear-gradient(135deg, rgba(246,219,166,0.1) 0%, rgba(246,219,166,0.05) 100%)' : 'linear-gradient(135deg, rgba(246,219,166,0.25) 0%, rgba(246,219,166,0.1) 100%)',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>📊</span>
            <div>
              <div style={{ fontWeight: 700, color: colors.textPrimary, fontSize: 16 }}>
                Premium CFO Tools
              </div>
              <div style={{ color: colors.textSecondary, fontSize: 14 }}>
                5 Excel spreadsheets used by professional CFOs
              </div>
            </div>
          </div>
          <Link href="/premium-tools">
            <a style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: colors.accent,
              color: '#4A3F2F',
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              View Tools
              <span>→</span>
            </a>
          </Link>
        </div>
      </section>

      {/* Posts Grid */}
      <section style={{
        padding: '48px 32px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: colors.textSecondary, padding: 60 }}>
            Loading posts...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#EF4444', padding: 60 }}>
            Failed to load posts. Please try again.
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.textSecondary, padding: 60 }}>
            No posts found in this category.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32,
          }}>
            {filteredPosts.map(post => {
              const excerpt = post.preview || post.excerpt || '';
              const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
              }) : post.date || '';
              const readTime = post.readTime || '5 min';
              const isPremium = post.isPremium ?? PREMIUM_CATEGORIES.includes(post.category);
              
              return (
                <Link key={post.slug} href={`/take-charge/${post.slug}`}>
                  <a style={{
                    display: 'block',
                    background: isDark ? '#1E1E1E' : '#FFFDFB',
                    borderRadius: 16,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    border: isDark ? `1px solid ${colors.border}` : '1px solid rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.accent;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isDark ? colors.border : 'rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)';
                  }}
                  >
                    {/* Post image placeholder */}
                    <div style={{
                      height: 200,
                      background: isDark 
                        ? 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)'
                        : 'linear-gradient(135deg, #F5F2ED 0%, #EFEBE5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 64 }}>
                        {post.category === 'tax-strategy' ? '📋' : 
                         post.category === 'capital-markets' ? '📈' : 
                         post.category === 'financial-planning' ? '🎯' : '🛠️'}
                      </span>
                    </div>

                    <div style={{ padding: 24 }}>
                      {/* Meta */}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: isDark ? 'rgba(246,219,166,0.15)' : 'rgba(139,105,20,0.12)',
                          color: isDark ? colors.accent : '#6B4E0F',
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 20,
                          textTransform: 'capitalize',
                        }}>
                          {post.category.replace(/-/g, ' ')}
                        </span>
                        {isPremium && <PaywallBadge />}
                      </div>

                      <h2 style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: isDark ? colors.textPrimary : '#111827',
                        marginBottom: 8,
                        lineHeight: 1.3,
                      }}>
                        {post.title}
                      </h2>

                      <p style={{
                        fontSize: 14,
                        color: isDark ? colors.textSecondary : '#4B5563',
                        lineHeight: 1.6,
                        marginBottom: 16,
                      }}>
                        {excerpt.length > 150 ? excerpt.substring(0, 150) + '...' : excerpt}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: isDark ? colors.textMuted : '#6B7280',
                      }}>
                        <span>{date}</span>
                        <span>{readTime} read</span>
                      </div>
                    </div>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Premium CFO Tools Section */}
      <section style={{
        padding: '48px 32px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <PremiumToolsSection isDark={isDark} variant="full" />
      </section>

      {/* CTA */}
      <section style={{
        padding: '60px 32px',
        background: isDark ? 'rgba(246,219,166,0.05)' : 'rgba(246,219,166,0.15)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 700, color: colors.textPrimary, marginBottom: 16 }}>
          Want daily insights?
        </h2>
        <p style={{ fontSize: 18, color: colors.textSecondary, marginBottom: 32, padding: '0 16px' }}>
          Upgrade to Take Charge Pro for daily tips, market alerts, and premium analysis.
        </p>
        <Link href="/take-charge/subscribe">
          <a style={{
            display: 'inline-block',
            background: colors.accent,
            color: '#4A3F2F',
            padding: '16px 32px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 18,
            textDecoration: 'none',
          }}>
            View Plans
          </a>
        </Link>
      </section>
    </div>
  );
}

function BlogPost() {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);
  const [, params] = useRoute('/take-charge/:slug');
  const slug = params?.slug || '';
  
  // Fetch post from API
  const { data: postData, isLoading: postLoading } = useBlogPost(slug);
  const post = postData?.post as BlogPost | undefined;
  
  const { data: subStatus, isLoading: subLoading } = useBlogSubscription();
  
  const hasAccess = subStatus?.hasAccess || false;
  const isPremiumContent = post?.isPremium ?? (post?.category ? PREMIUM_CATEGORIES.includes(post.category) : false);
  const needsPaywall = isPremiumContent && !hasAccess;

  if (postLoading || subLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textPrimary,
      }}>
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textPrimary,
        gap: 24,
      }}>
        <div style={{ fontSize: 64 }}>📝</div>
        <h1>Post not found</h1>
        <Link href="/take-charge">
          <a style={{ color: colors.accent }}>Back to Blog</a>
        </Link>
      </div>
    );
  }

  // Get content (prefer markdown for rendering, fall back to html)
  const content = post.content_html || post.content_markdown || post.content || '';
  const excerpt = post.preview || post.excerpt || '';
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  }) : post.date || '';
  const readTime = post.readTime || '5 min';

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <SEO 
        title={`${post.title} | Charge Wealth`}
        description={excerpt}
        url={`https://chargewealth.co/take-charge/${post.slug}`}
        type="article"
        publishedTime={post.published_at || post.date}
      />
      <BlogHeader isDark={isDark} onToggleTheme={toggleTheme} />

      <article style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: '60px 24px',
      }}>
        {/* Meta */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            padding: '6px 16px',
            background: isDark ? 'rgba(246,219,166,0.15)' : 'rgba(139,105,20,0.12)',
            color: isDark ? colors.accent : '#6B4E0F',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 20,
            textTransform: 'capitalize',
          }}>
            {post.category.replace(/-/g, ' ')}
          </span>
          {isPremiumContent && <PaywallBadge />}
          <span style={{ color: colors.textMuted, fontSize: 14, lineHeight: '28px' }}>
            {date} · {readTime} read
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 40px)',
          fontWeight: 700,
          color: colors.textPrimary,
          lineHeight: 1.2,
          marginBottom: 24,
        }}>
          {post.title}
        </h1>

        {/* Content with paywall */}
        {needsPaywall ? (
          <PaywallGate
            contentPreview={excerpt}
            title={post.title}
            hasAccess={false}
          >
            <div />
          </PaywallGate>
        ) : (
          <>
            {/* Full Content - render HTML */}
            <div 
              style={{
                color: colors.textSecondary,
                fontSize: 18,
                lineHeight: 1.8,
              }}
              className={`blog-content ${isDark ? 'blog-content-dark' : 'blog-content-light'}`}
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* CTA */}
            <div style={{
              marginTop: 60,
              padding: 32,
              background: isDark ? 'rgba(246,219,166,0.05)' : 'rgba(246,219,166,0.15)',
              borderRadius: 16,
              border: `1px solid ${isDark ? 'rgba(246,219,166,0.2)' : 'rgba(246,219,166,0.4)'}`,
            }}>
              <h3 style={{ color: colors.textPrimary, fontSize: 24, marginBottom: 12 }}>
                Want more insights like this?
              </h3>
              <p style={{ color: colors.textSecondary, marginBottom: 24 }}>
                Take Charge Pro delivers daily actionable tips straight to your inbox.
              </p>
              <Link href="/take-charge/subscribe">
                <a style={{
                  display: 'inline-block',
                  background: colors.accent,
                  color: '#4A3F2F',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  textDecoration: 'none',
                }}>
                  Subscribe to Take Charge Pro
                </a>
              </Link>
            </div>
          </>
        )}
      </article>
      
      {/* Add styles for blog content - both light and dark modes */}
      <style>{`
        /* Light mode blog content */
        .blog-content-light h1 { font-size: 32px; font-weight: 700; color: #1F2937; margin-top: 48px; margin-bottom: 24px; }
        .blog-content-light h2 { font-size: 24px; font-weight: 600; color: #8B6914; margin-top: 40px; margin-bottom: 16px; }
        .blog-content-light h3 { font-size: 20px; font-weight: 600; color: #1F2937; margin-top: 32px; margin-bottom: 12px; }
        .blog-content-light p { margin-bottom: 16px; color: #4B5563; }
        .blog-content-light ul, .blog-content-light ol { margin: 16px 0 16px 24px; color: #4B5563; }
        .blog-content-light li { margin-bottom: 8px; }
        .blog-content-light strong { color: #1F2937; }
        .blog-content-light a { color: #8B6914; text-decoration: underline; }
        .blog-content-light blockquote { border-left: 3px solid #F6DBA6; padding-left: 16px; margin: 16px 0; color: #6B7280; font-style: italic; }
        .blog-content-light hr { border: none; border-top: 1px solid rgba(0,0,0,0.1); margin: 40px 0; }
        .blog-content-light .tldr { background: #FFFDFB; border-left: 4px solid #F6DBA6; padding: 20px 24px; margin: 24px 0; border-radius: 0 8px 8px 0; }
        .blog-content-light .tldr h3 { color: #8B6914; margin: 0 0 12px 0; font-size: 18px; }
        .blog-content-light .tldr ul { margin: 0 0 0 20px; }
        
        /* Dark mode blog content */
        .blog-content-dark h1 { font-size: 32px; font-weight: 700; color: #F5F5F5; margin-top: 48px; margin-bottom: 24px; }
        .blog-content-dark h2 { font-size: 24px; font-weight: 600; color: #F6DBA6; margin-top: 40px; margin-bottom: 16px; }
        .blog-content-dark h3 { font-size: 20px; font-weight: 600; color: #F5F5F5; margin-top: 32px; margin-bottom: 12px; }
        .blog-content-dark p { margin-bottom: 16px; color: #D1D5DB; }
        .blog-content-dark ul, .blog-content-dark ol { margin: 16px 0 16px 24px; color: #D1D5DB; }
        .blog-content-dark li { margin-bottom: 8px; }
        .blog-content-dark strong { color: #F6DBA6; }
        .blog-content-dark a { color: #F6DBA6; text-decoration: underline; }
        .blog-content-dark blockquote { border-left: 3px solid #F6DBA6; padding-left: 16px; margin: 16px 0; color: #A3A3A3; font-style: italic; }
        .blog-content-dark hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 40px 0; }
        .blog-content-dark .tldr { background: #1E1E1E; border-left: 4px solid #F6DBA6; padding: 20px 24px; margin: 24px 0; border-radius: 0 8px 8px 0; }
        .blog-content-dark .tldr h3 { color: #F6DBA6; margin: 0 0 12px 0; font-size: 18px; }
        .blog-content-dark .tldr ul { margin: 0 0 0 20px; }
        
        /* Mobile responsive */
        @media (max-width: 640px) {
          .blog-content-light h1, .blog-content-dark h1 { font-size: 26px; }
          .blog-content-light h2, .blog-content-dark h2 { font-size: 20px; }
          .blog-content-light h3, .blog-content-dark h3 { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}

function SubscribePage() {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: subStatus } = useBlogSubscription();
  const [, setLocation] = useLocation();

  // Check for success/error params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      // Could show a success message
    }
    if (params.get('cancelled') === 'true') {
      // Could show a cancelled message
    }
  }, []);

  const handleCheckout = async (planType: 'blog_monthly' | 'blog_yearly') => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/blog/checkout', {
        method: 'POST',
        body: JSON.stringify({ planType, email: email || undefined }),
      });
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMainCheckout = () => {
    setLocation('/');
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/forever',
      description: 'Weekly insights to get started',
      features: [
        'Weekly email digest',
        'Access to free blog posts',
        'Free financial tools',
      ],
      cta: 'Start Free',
      action: () => setLocation('/take-charge'),
    },
    {
      id: 'blog_monthly',
      name: 'Take Charge Pro',
      price: '$9',
      period: '/month',
      description: 'Daily actionable insights',
      features: [
        'Daily email tips',
        'All premium blog posts',
        'Tax strategy articles',
        'Market insights',
        'Financial planning guides',
      ],
      cta: 'Subscribe Monthly',
      highlighted: false,
      action: () => handleCheckout('blog_monthly'),
    },
    {
      id: 'blog_yearly',
      name: 'Take Charge Pro (Yearly)',
      price: '$87',
      period: '/year',
      description: 'Save $21 with annual billing',
      features: [
        'Everything in Monthly',
        'Save $21/year',
        'Just $7.25/month',
        'Best value for readers',
      ],
      cta: 'Subscribe Yearly',
      highlighted: true,
      savings: '$21',
      action: () => handleCheckout('blog_yearly'),
    },
  ];

  // If user already has access, show different UI
  if (subStatus?.hasAccess) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bg,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <BlogHeader isDark={isDark} onToggleTheme={toggleTheme} />
        <section style={{
          padding: '60px 32px',
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: colors.textPrimary, marginBottom: 16 }}>
            You're a Pro Member!
          </h1>
          <p style={{ fontSize: 18, color: colors.textSecondary, marginBottom: 32 }}>
            You have full access to all premium content via your {subStatus.accessType === 'main_subscription' ? 'Charge Wealth' : 'blog'} subscription.
          </p>
          <Link href="/take-charge">
            <a style={{
              display: 'inline-block',
              background: colors.accent,
              color: '#4A3F2F',
              padding: '16px 32px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              textDecoration: 'none',
            }}>
              Browse Premium Content
            </a>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <BlogHeader isDark={isDark} onToggleTheme={toggleTheme} />

      <section style={{
        padding: '60px 32px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 700, color: colors.textPrimary, marginBottom: 16 }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', color: colors.textSecondary, maxWidth: 600, margin: '0 auto' }}>
          From free weekly insights to full premium content access.
        </p>
      </section>

      <section style={{
        padding: '0 32px 40px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                background: plan.highlighted 
                  ? (isDark ? 'linear-gradient(135deg, rgba(246,219,166,0.1) 0%, rgba(246,219,166,0.05) 100%)' : 'linear-gradient(135deg, rgba(246,219,166,0.3) 0%, rgba(246,219,166,0.15) 100%)')
                  : (isDark ? '#1E1E1E' : '#FFFDFB'),
                borderRadius: 16,
                padding: 32,
                border: plan.highlighted 
                  ? `2px solid ${colors.accent}` 
                  : `1px solid ${colors.border}`,
                position: 'relative',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {plan.savings && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#10B981',
                  color: '#fff',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  SAVE {plan.savings}
                </div>
              )}

              <h2 style={{ color: colors.textPrimary, fontSize: 24, marginBottom: 8 }}>{plan.name}</h2>
              <p style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24 }}>{plan.description}</p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ color: colors.accent, fontSize: 48, fontWeight: 700 }}>{plan.price}</span>
                <span style={{ color: colors.textMuted, fontSize: 16 }}>{plan.period}</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                    color: isDark ? '#D1D5DB' : '#4B5563',
                    fontSize: 15,
                  }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.action}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: 16,
                  fontWeight: 600,
                  background: plan.highlighted ? colors.accent : 'transparent',
                  color: plan.highlighted ? '#4A3F2F' : colors.accent,
                  border: plan.highlighted ? 'none' : `1px solid ${colors.accent}`,
                  borderRadius: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Loading...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Charge Wealth Upsell */}
      <section style={{
        padding: '40px 32px',
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{
          background: isDark 
            ? 'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(246,219,166,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(147,51,234,0.08) 0%, rgba(246,219,166,0.15) 100%)',
          borderRadius: 16,
          padding: 40,
          border: `1px solid ${isDark ? 'rgba(147,51,234,0.3)' : 'rgba(147,51,234,0.2)'}`,
          textAlign: 'center',
        }}>
          <h3 style={{ color: '#A855F7', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            WANT MORE?
          </h3>
          <h2 style={{ color: colors.textPrimary, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, marginBottom: 16 }}>
            Charge Wealth - Full AI CFO Platform
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            Get everything in Take Charge Pro, plus AI-powered tax optimization, portfolio analysis, personalized recommendations, and more.
          </p>
          <div style={{ marginBottom: 24 }}>
            <span style={{ color: colors.accent, fontSize: 36, fontWeight: 700 }}>$279</span>
            <span style={{ color: colors.textMuted, fontSize: 16 }}> one-time (lifetime access)</span>
          </div>
          <button
            onClick={handleMainCheckout}
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #F6DBA6 100%)',
              color: '#fff',
              padding: '16px 32px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Get Lifetime Access →
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        padding: '60px 32px',
        background: isDark ? '#1E1E1E' : '#F5F2ED',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: colors.textPrimary, marginBottom: 32, textAlign: 'center' }}>
            Questions?
          </h2>
          
          {[
            {
              q: 'What\'s included in Take Charge Pro?',
              a: 'Access to all premium blog posts including tax strategy, financial planning, and capital markets content. New articles published weekly.',
            },
            {
              q: 'Can I upgrade from Pro to Charge Wealth?',
              a: 'Yes! If you upgrade to Charge Wealth lifetime within 30 days, we\'ll credit your Pro payments toward the $279 price.',
            },
            {
              q: 'Is there a money-back guarantee?',
              a: 'Yes. All plans come with a 30-day money-back guarantee. If you\'re not satisfied, email us for a full refund.',
            },
            {
              q: 'Do Charge Wealth members get blog access?',
              a: 'Yes! All Charge Wealth members (monthly, quarterly, lifetime) automatically get full access to all Take Charge Pro content.',
            },
          ].map((faq, i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <h3 style={{ color: colors.textPrimary, fontSize: 18, marginBottom: 8 }}>{faq.q}</h3>
              <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Main Router
export function TakeChargeBlog() {
  return (
    <Switch>
      <Route path="/take-charge" component={BlogIndex} />
      <Route path="/take-charge/subscribe" component={SubscribePage} />
      <Route path="/take-charge/:slug" component={BlogPost} />
    </Switch>
  );
}

export default TakeChargeBlog;
