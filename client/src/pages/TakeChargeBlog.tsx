import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SEO } from '../components/SEO';
import { PaywallGate, PaywallBadge } from '../components/PaywallGate';
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
  { id: 'capital-markets', label: 'Capital Markets', premium: true },
  { id: 'tax-strategy', label: 'Tax Strategy', premium: true },
  { id: 'financial-planning', label: 'Financial Planning', premium: true },
  { id: 'free', label: 'Free Articles', premium: false },
];

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

// Components
function BlogHeader() {
  const { data: subStatus } = useBlogSubscription();
  const hasAccess = subStatus?.hasAccess || false;

  return (
    <header style={{
      padding: '16px 32px',
      borderBottom: '1px solid rgba(201, 169, 98, 0.1)',
      background: '#0F1117',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/take-charge">
            <a style={{ color: '#C9A962', fontSize: 20, fontWeight: 700, textDecoration: 'none' }}>
              Charge Wealth
            </a>
          </Link>
          <Link href="/take-charge">
            <a style={{ color: '#F4F5F7', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              Take Charge
            </a>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/tools">
            <a style={{ color: '#A8B0C5', fontSize: 14, textDecoration: 'none' }}>
              Free Tools
            </a>
          </Link>
          {hasAccess ? (
            <Link href="/dashboard">
              <a style={{
                background: 'rgba(201, 169, 98, 0.1)',
                color: '#C9A962',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
                border: '1px solid rgba(201, 169, 98, 0.3)',
              }}>
                Dashboard
              </a>
            </Link>
          ) : (
            <Link href="/take-charge/subscribe">
              <a style={{
                background: '#C9A962',
                color: '#0F1117',
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [email, setEmail] = useState('');
  const [, setLocation] = useLocation();
  
  // Fetch posts from API
  const { data: postsData, isLoading, error } = useBlogPosts(selectedCategory);
  const posts: BlogPost[] = postsData?.posts || [];

  // Filter to only show the 3 main categories (not finance-dailies)
  const filteredPosts = posts.filter(post => 
    post.category === 'capital-markets' || 
    post.category === 'tax-strategy' || 
    post.category === 'financial-planning' ||
    post.category === 'free'
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
      background: '#0F1117',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <BlogHeader />

      {/* Hero */}
      <section style={{
        padding: '60px 32px',
        background: 'linear-gradient(180deg, #0F1117 0%, #1A1D28 100%)',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 56,
          fontWeight: 700,
          color: '#F4F5F7',
          marginBottom: 16,
        }}>
          Take Charge
        </h1>
        <p style={{
          fontSize: 20,
          color: '#A8B0C5',
          maxWidth: 600,
          margin: '0 auto 32px',
        }}>
          Actionable financial insights for high earners. No fluff. No sales pitches. Just strategies that work.
        </p>

        {/* Email signup */}
        <div style={{
          maxWidth: 500,
          margin: '0 auto',
          display: 'flex',
          gap: 12,
        }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: 16,
              background: '#1A1D28',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
          <button 
            onClick={handleSubscribe}
            style={{
              padding: '14px 28px',
              fontSize: 16,
              fontWeight: 600,
              background: '#C9A962',
              color: '#0F1117',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Subscribe Free
          </button>
        </div>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 12 }}>
          Free weekly insights. Upgrade for daily premium content.
        </p>
      </section>

      {/* Categories */}
      <section style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(201, 169, 98, 0.1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 500,
                background: selectedCategory === cat.id ? '#C9A962' : 'transparent',
                color: selectedCategory === cat.id ? '#0F1117' : '#A8B0C5',
                border: selectedCategory === cat.id ? 'none' : '1px solid rgba(201, 169, 98, 0.2)',
                borderRadius: 20,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {cat.label}
              {cat.premium && <span style={{ fontSize: 10 }}>🔒</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Posts Grid */}
      <section style={{
        padding: '48px 32px',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#A8B0C5', padding: 60 }}>
            Loading posts...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: '#EF4444', padding: 60 }}>
            Failed to load posts. Please try again.
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#A8B0C5', padding: 60 }}>
            No posts found in this category.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
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
                    background: '#1A1D28',
                    borderRadius: 16,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    border: '1px solid rgba(201, 169, 98, 0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C9A962';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(201, 169, 98, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    {/* Post image placeholder */}
                    <div style={{
                      height: 200,
                      background: 'linear-gradient(135deg, #1A1D28 0%, #242838 100%)',
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
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(201, 169, 98, 0.1)',
                          color: '#C9A962',
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
                        color: '#F4F5F7',
                        marginBottom: 8,
                        lineHeight: 1.3,
                      }}>
                        {post.title}
                      </h2>

                      <p style={{
                        fontSize: 14,
                        color: '#A8B0C5',
                        lineHeight: 1.5,
                        marginBottom: 16,
                      }}>
                        {excerpt.length > 150 ? excerpt.substring(0, 150) + '...' : excerpt}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: '#6B7280',
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

      {/* CTA */}
      <section style={{
        padding: '60px 32px',
        background: 'rgba(201, 169, 98, 0.05)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: '#F4F5F7', marginBottom: 16 }}>
          Want daily insights?
        </h2>
        <p style={{ fontSize: 18, color: '#A8B0C5', marginBottom: 32 }}>
          Upgrade to Take Charge Pro for daily tips, market alerts, and premium analysis.
        </p>
        <Link href="/take-charge/subscribe">
          <a style={{
            display: 'inline-block',
            background: '#C9A962',
            color: '#0F1117',
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
        background: '#0F1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F4F5F7',
      }}>
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F1117',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F4F5F7',
        gap: 24,
      }}>
        <div style={{ fontSize: 64 }}>📝</div>
        <h1>Post not found</h1>
        <Link href="/take-charge">
          <a style={{ color: '#C9A962' }}>Back to Blog</a>
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
      background: '#0F1117',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <SEO 
        title={`${post.title} | Charge Wealth`}
        description={excerpt}
        url={`https://chargewealth.co/take-charge/${post.slug}`}
        type="article"
        publishedTime={post.published_at || post.date}
      />
      <BlogHeader />

      <article style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: '60px 32px',
      }}>
        {/* Meta */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 16px',
            background: 'rgba(201, 169, 98, 0.1)',
            color: '#C9A962',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 20,
            textTransform: 'capitalize',
          }}>
            {post.category.replace(/-/g, ' ')}
          </span>
          {isPremiumContent && <PaywallBadge />}
          <span style={{ color: '#6B7280', fontSize: 14, lineHeight: '28px' }}>
            {date} · {readTime} read
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 40,
          fontWeight: 700,
          color: '#F4F5F7',
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
                color: '#D1D5DB',
                fontSize: 18,
                lineHeight: 1.8,
              }}
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* CTA */}
            <div style={{
              marginTop: 60,
              padding: 32,
              background: 'rgba(201, 169, 98, 0.05)',
              borderRadius: 16,
              border: '1px solid rgba(201, 169, 98, 0.2)',
            }}>
              <h3 style={{ color: '#F4F5F7', fontSize: 24, marginBottom: 12 }}>
                Want more insights like this?
              </h3>
              <p style={{ color: '#A8B0C5', marginBottom: 24 }}>
                Take Charge Pro delivers daily actionable tips straight to your inbox.
              </p>
              <Link href="/take-charge/subscribe">
                <a style={{
                  display: 'inline-block',
                  background: '#C9A962',
                  color: '#0F1117',
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
      
      {/* Add styles for blog content */}
      <style>{`
        .blog-content h1 { font-size: 32px; font-weight: 700; color: #F4F5F7; margin-top: 48px; margin-bottom: 24px; }
        .blog-content h2 { font-size: 24px; font-weight: 600; color: #C9A962; margin-top: 40px; margin-bottom: 16px; }
        .blog-content h3 { font-size: 20px; font-weight: 600; color: #F4F5F7; margin-top: 32px; margin-bottom: 12px; }
        .blog-content p { margin-bottom: 16px; }
        .blog-content ul, .blog-content ol { margin: 16px 0 16px 24px; }
        .blog-content li { margin-bottom: 8px; }
        .blog-content strong { color: #C9A962; }
        .blog-content a { color: #C9A962; text-decoration: underline; }
        .blog-content blockquote { border-left: 3px solid #C9A962; padding-left: 16px; margin: 16px 0; color: #A8B0C5; font-style: italic; }
        .blog-content hr { border: none; border-top: 1px solid rgba(201, 169, 98, 0.2); margin: 40px 0; }
        .blog-content .tldr { background: #1A1D28; border-left: 4px solid #C9A962; padding: 20px 24px; margin: 24px 0; border-radius: 0 8px 8px 0; }
        .blog-content .tldr h3 { color: #C9A962; margin: 0 0 12px 0; font-size: 18px; }
        .blog-content .tldr ul { margin: 0 0 0 20px; }
      `}</style>
    </div>
  );
}

function SubscribePage() {
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
        background: '#0F1117',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <BlogHeader />
        <section style={{
          padding: '60px 32px',
          textAlign: 'center',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#F4F5F7', marginBottom: 16 }}>
            You're a Pro Member!
          </h1>
          <p style={{ fontSize: 18, color: '#A8B0C5', marginBottom: 32 }}>
            You have full access to all premium content via your {subStatus.accessType === 'main_subscription' ? 'Charge Wealth' : 'blog'} subscription.
          </p>
          <Link href="/take-charge">
            <a style={{
              display: 'inline-block',
              background: '#C9A962',
              color: '#0F1117',
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
      background: '#0F1117',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <BlogHeader />

      <section style={{
        padding: '60px 32px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: '#F4F5F7', marginBottom: 16 }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: 20, color: '#A8B0C5', maxWidth: 600, margin: '0 auto' }}>
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
                background: plan.highlighted ? 'linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, rgba(201, 169, 98, 0.05) 100%)' : '#1A1D28',
                borderRadius: 16,
                padding: 32,
                border: plan.highlighted ? '2px solid #C9A962' : '1px solid rgba(201, 169, 98, 0.1)',
                position: 'relative',
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

              <h2 style={{ color: '#F4F5F7', fontSize: 24, marginBottom: 8 }}>{plan.name}</h2>
              <p style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 24 }}>{plan.description}</p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ color: '#C9A962', fontSize: 48, fontWeight: 700 }}>{plan.price}</span>
                <span style={{ color: '#6B7280', fontSize: 16 }}>{plan.period}</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                    color: '#D1D5DB',
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
                  background: plan.highlighted ? '#C9A962' : 'transparent',
                  color: plan.highlighted ? '#0F1117' : '#C9A962',
                  border: plan.highlighted ? 'none' : '1px solid #C9A962',
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
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(201, 169, 98, 0.1) 100%)',
          borderRadius: 16,
          padding: 40,
          border: '1px solid rgba(147, 51, 234, 0.3)',
          textAlign: 'center',
        }}>
          <h3 style={{ color: '#A855F7', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            WANT MORE?
          </h3>
          <h2 style={{ color: '#F4F5F7', fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
            Charge Wealth - Full AI CFO Platform
          </h2>
          <p style={{ color: '#A8B0C5', fontSize: 16, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            Get everything in Take Charge Pro, plus AI-powered tax optimization, portfolio analysis, personalized recommendations, and more.
          </p>
          <div style={{ marginBottom: 24 }}>
            <span style={{ color: '#C9A962', fontSize: 36, fontWeight: 700 }}>$279</span>
            <span style={{ color: '#6B7280', fontSize: 16 }}> one-time (lifetime access)</span>
          </div>
          <button
            onClick={handleMainCheckout}
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #C9A962 100%)',
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
        background: '#1A1D28',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#F4F5F7', marginBottom: 32, textAlign: 'center' }}>
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
              <h3 style={{ color: '#F4F5F7', fontSize: 18, marginBottom: 8 }}>{faq.q}</h3>
              <p style={{ color: '#A8B0C5', lineHeight: 1.6 }}>{faq.a}</p>
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
