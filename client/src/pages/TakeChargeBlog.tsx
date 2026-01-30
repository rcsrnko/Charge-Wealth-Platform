import React, { useState } from 'react';
import { Route, Switch, Link, useRoute } from 'wouter';
import { SEO } from '../components/SEO';

// Types
interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'tax' | 'investing' | 'planning' | 'tools';
  date: string;
  readTime: string;
  isPremium: boolean;
  image?: string;
}

// Sample blog posts (would come from CMS/API in production)
const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'the-real-cost-of-financial-advisor-fees',
    title: 'The Real Cost of Financial Advisor Fees (It\'s Worse Than You Think)',
    excerpt: 'A 1% fee sounds small. But over 30 years, it could cost you hundreds of thousands of dollars. Here\'s the math most advisors don\'t want you to see.',
    content: `
# The Real Cost of Financial Advisor Fees

A 1% AUM (Assets Under Management) fee sounds reasonable, right? It's just one percent. 

**Wrong.**

## The Math That Will Make You Sick

Let's say you have $500,000 invested. A 1% fee means you're paying $5,000 per year. But that's not the real cost.

The real cost is what that $5,000 **would have earned** if it stayed invested.

Over 30 years at 7% returns:
- **Without the 1% fee:** $3,806,128
- **With the 1% fee:** $2,806,794
- **Total cost of fees:** $999,334

That's right. A "small" 1% fee costs you **nearly a million dollars** over 30 years.

## Why Advisors Don't Talk About This

Financial advisors are incentivized to keep your money under management. The more you have, the more they earn. There's nothing inherently wrong with this, but it creates a conflict of interest.

They're not incentivized to:
- Help you pay off your mortgage faster
- Maximize your 401(k) match
- Find tax-loss harvesting opportunities

They're incentivized to keep your assets where they can charge you 1%.

## What To Do Instead

1. **Max out tax-advantaged accounts first** — 401(k), IRA, HSA
2. **Use low-cost index funds** — Vanguard, Fidelity, Schwab (0.03-0.10% expense ratios)
3. **Automate everything** — Set it and forget it
4. **Get advice when you need it** — Pay for a flat-fee financial plan, not ongoing AUM

## The Bottom Line

You don't need to pay 1% of your wealth every year for basic financial advice. The math simply doesn't work in your favor.

---

*Want to see exactly how much you're paying in fees? Try our [Advisor Fee Calculator](/tools/advisor-fee-calculator).*
    `,
    category: 'planning',
    date: '2026-01-27',
    readTime: '5 min',
    isPremium: false,
  },
  {
    slug: '5-tax-moves-before-april',
    title: '5 Tax Moves to Make Before April (Most People Miss #3)',
    excerpt: 'Tax season is coming. Here are 5 strategies that could save you thousands — and most people don\'t know about #3.',
    content: `
# 5 Tax Moves to Make Before April

Tax season is coming. Most people just file and hope for the best. But there are legitimate strategies that can save you thousands.

## 1. Max Out Your IRA ($7,000 limit)

You have until April 15th to contribute to your IRA for the previous tax year. If you're in the 24% bracket, a $7,000 Traditional IRA contribution saves you $1,680 in taxes.

## 2. Check Your Withholding

Are you getting a big refund? That means you gave the government an interest-free loan. Adjust your W-4 to keep more money in your pocket throughout the year.

## 3. Harvest Your Tax Losses (This One's Overlooked)

If you have investments that are down, you can sell them to "harvest" the loss. This loss offsets your gains and up to $3,000 of ordinary income.

**The key:** You can immediately buy a similar (but not identical) investment to maintain your market exposure.

Example: Sell your S&P 500 ETF at a loss, immediately buy a Total Market ETF. Same exposure, but you get the tax benefit.

## 4. Bunch Your Charitable Donations

If you're close to the standard deduction threshold, consider "bunching" multiple years of donations into one year to exceed it.

In 2026, the standard deduction is $15,000 (single) or $30,000 (married). If your itemized deductions are close, bunching can push you over.

## 5. Review Your HSA Contributions

If you have an HSA-eligible health plan, max it out. The HSA is the only triple-tax-advantaged account:
- Tax-deductible contributions
- Tax-free growth
- Tax-free withdrawals (for medical expenses)

2026 limits: $4,300 (individual) or $8,550 (family).

---

*Want a personalized tax analysis? [Get started with Charge Wealth](/dashboard) — we'll find every deduction you're missing.*
    `,
    category: 'tax',
    date: '2026-01-25',
    readTime: '4 min',
    isPremium: false,
  },
  {
    slug: 'roth-vs-traditional-definitive-guide',
    title: 'Roth vs. Traditional: The Definitive Guide',
    excerpt: 'Should you contribute to a Roth or Traditional account? The answer depends on one key factor most people get wrong.',
    content: `
# Roth vs. Traditional: The Definitive Guide

This is one of the most common financial questions. And most of the advice you'll find online is wrong — or at least incomplete.

## The Simple Version

- **Traditional:** Pay taxes later (in retirement)
- **Roth:** Pay taxes now

## The Actual Decision Framework

The question isn't "Roth or Traditional?" 

The question is: **"Will my tax rate be higher now, or in retirement?"**

### Choose Roth if:
- You're early in your career (lower tax bracket now)
- You expect your income to increase significantly
- You're already in a low tax bracket
- You want tax-free withdrawals in retirement

### Choose Traditional if:
- You're in your peak earning years
- You're in the 24%+ tax bracket
- You expect to be in a lower bracket in retirement
- You want to reduce your taxable income now

## The Nuance Most People Miss

Your **marginal tax rate** matters, not your average rate.

If you're at the top of the 22% bracket, a Traditional contribution saves you 22 cents per dollar. But if your first dollar in retirement is taxed at 10%, you win.

However, if you expect to have significant retirement income (Social Security, pensions, large 401k), your retirement tax rate might be higher than you think.

## The Hedge Strategy

If you're unsure, split the difference:
- Max out your Roth IRA
- Contribute to your Traditional 401(k)

This gives you tax diversification — you'll have both tax-free and tax-deferred buckets to draw from in retirement.

---

*Not sure which is right for you? Use our [Roth vs. Traditional Calculator](/tools/roth-vs-traditional) to see the math for your situation.*
    `,
    category: 'investing',
    date: '2026-01-23',
    readTime: '6 min',
    isPremium: false,
  },
  {
    slug: 'daily-tax-tip-backdoor-roth',
    title: 'Daily Tip: The Backdoor Roth Strategy Explained',
    excerpt: 'High earners can\'t contribute directly to a Roth IRA. But there\'s a legal loophole that lets you do it anyway.',
    content: 'Premium content - subscribe to access',
    category: 'tax',
    date: '2026-01-27',
    readTime: '3 min',
    isPremium: true,
  },
  {
    slug: 'weekly-market-outlook-jan-27',
    title: 'Weekly Market Outlook: What to Watch This Week',
    excerpt: 'Fed meeting, earnings season, and key economic data. Here\'s what smart investors are watching.',
    content: 'Premium content - subscribe to access',
    category: 'investing',
    date: '2026-01-27',
    readTime: '4 min',
    isPremium: true,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Posts' },
  { id: 'tax', label: 'Tax Strategies' },
  { id: 'investing', label: 'Investing' },
  { id: 'planning', label: 'Financial Planning' },
  { id: 'tools', label: 'Tools & Tips' },
];

// Components
function BlogHeader() {
  return (
    <header style={{
      padding: '16px 32px',
      borderBottom: '1px solid rgba(201, 169, 98, 0.1)',
      background: '#121212',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/take-charge">
            <a style={{ color: '#F6DBA6', fontSize: 20, fontWeight: 700, textDecoration: 'none' }}>
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
          <Link href="/take-charge/subscribe">
            <a style={{
              background: '#F6DBA6',
              color: '#121212',
              padding: '8px 16px',
              borderRadius: 6,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 14,
            }}>
              Subscribe
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
}

function BlogIndex() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [email, setEmail] = useState('');

  const filteredPosts = BLOG_POSTS.filter(
    post => selectedCategory === 'all' || post.category === selectedCategory
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <BlogHeader />

      {/* Hero */}
      <section style={{
        padding: '60px 32px',
        background: 'linear-gradient(180deg, #121212 0%, #1E1E1E 100%)',
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
              background: '#1E1E1E',
              border: '1px solid rgba(201, 169, 98, 0.2)',
              borderRadius: 8,
              color: '#F4F5F7',
            }}
          />
          <button style={{
            padding: '14px 28px',
            fontSize: 16,
            fontWeight: 600,
            background: '#F6DBA6',
            color: '#121212',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}>
            Subscribe Free
          </button>
        </div>
        <p style={{ color: '#6B7280', fontSize: 14, marginTop: 12 }}>
          Free weekly insights. Upgrade anytime for daily tips.
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
                background: selectedCategory === cat.id ? '#F6DBA6' : 'transparent',
                color: selectedCategory === cat.id ? '#121212' : '#A8B0C5',
                border: selectedCategory === cat.id ? 'none' : '1px solid rgba(201, 169, 98, 0.2)',
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              {cat.label}
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 32,
        }}>
          {filteredPosts.map(post => (
            <Link key={post.slug} href={`/take-charge/${post.slug}`}>
              <a style={{
                display: 'block',
                background: '#1E1E1E',
                borderRadius: 16,
                overflow: 'hidden',
                textDecoration: 'none',
                border: '1px solid rgba(201, 169, 98, 0.1)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F6DBA6';
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
                  background: 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 64 }}>
                    {post.category === 'tax' ? '📋' : 
                     post.category === 'investing' ? '📈' : 
                     post.category === 'planning' ? '🎯' : '🛠️'}
                  </span>
                </div>

                <div style={{ padding: 24 }}>
                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <span style={{
                      padding: '4px 12px',
                      background: 'rgba(201, 169, 98, 0.1)',
                      color: '#F6DBA6',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 20,
                      textTransform: 'capitalize',
                    }}>
                      {post.category}
                    </span>
                    {post.isPremium && (
                      <span style={{
                        padding: '4px 12px',
                        background: 'rgba(147, 51, 234, 0.1)',
                        color: '#A855F7',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 20,
                      }}>
                        Premium
                      </span>
                    )}
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
                    {post.excerpt}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: '#6B7280',
                  }}>
                    <span>{post.date}</span>
                    <span>{post.readTime} read</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
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
            background: '#F6DBA6',
            color: '#121212',
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
  const post = BLOG_POSTS.find(p => p.slug === params?.slug);

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F4F5F7',
      }}>
        Post not found
      </div>
    );
  }

  if (post.isPremium) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#121212',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <BlogHeader />
        <div style={{
          maxWidth: 700,
          margin: '0 auto',
          padding: '60px 32px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 64, marginBottom: 24, display: 'block' }}>🔒</span>
          <h1 style={{ fontSize: 32, color: '#F4F5F7', marginBottom: 16 }}>{post.title}</h1>
          <p style={{ color: '#A8B0C5', marginBottom: 32, fontSize: 18 }}>
            This is premium content. Subscribe to Take Charge Pro to unlock daily insights.
          </p>
          <Link href="/take-charge/subscribe">
            <a style={{
              display: 'inline-block',
              background: '#F6DBA6',
              color: '#121212',
              padding: '16px 32px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 18,
              textDecoration: 'none',
            }}>
              Subscribe for $9/month
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <SEO 
        title={`${post.title} | Charge Wealth`}
        description={post.excerpt}
        url={`https://chargewealth.co/take-charge/${post.slug}`}
        type="article"
        publishedTime={post.date}
      />
      <BlogHeader />

      <article style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: '60px 32px',
      }}>
        {/* Meta */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <span style={{
            padding: '6px 16px',
            background: 'rgba(201, 169, 98, 0.1)',
            color: '#F6DBA6',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 20,
            textTransform: 'capitalize',
          }}>
            {post.category}
          </span>
          <span style={{ color: '#6B7280', fontSize: 14, lineHeight: '28px' }}>
            {post.date} · {post.readTime} read
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

        {/* Content */}
        <div style={{
          color: '#D1D5DB',
          fontSize: 18,
          lineHeight: 1.8,
        }}>
          {post.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) {
              return <h1 key={i} style={{ fontSize: 32, fontWeight: 700, color: '#F4F5F7', marginTop: 48, marginBottom: 24 }}>{line.slice(2)}</h1>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={i} style={{ fontSize: 24, fontWeight: 600, color: '#F4F5F7', marginTop: 40, marginBottom: 16 }}>{line.slice(3)}</h2>;
            }
            if (line.startsWith('### ')) {
              return <h3 key={i} style={{ fontSize: 20, fontWeight: 600, color: '#F4F5F7', marginTop: 32, marginBottom: 12 }}>{line.slice(4)}</h3>;
            }
            if (line.startsWith('- ')) {
              return <li key={i} style={{ marginLeft: 24, marginBottom: 8 }}>{line.slice(2)}</li>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} style={{ fontWeight: 600, color: '#F4F5F7', marginBottom: 16 }}>{line.slice(2, -2)}</p>;
            }
            if (line.trim() === '') {
              return <br key={i} />;
            }
            if (line.startsWith('---')) {
              return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(201, 169, 98, 0.2)', margin: '40px 0' }} />;
            }
            // Handle links
            const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
              const parts = line.split(/\[([^\]]+)\]\(([^)]+)\)/);
              return (
                <p key={i} style={{ marginBottom: 16 }}>
                  {parts[0]}
                  <a href={linkMatch[2]} style={{ color: '#F6DBA6', textDecoration: 'underline' }}>{linkMatch[1]}</a>
                  {parts[3]}
                </p>
              );
            }
            return <p key={i} style={{ marginBottom: 16 }}>{line}</p>;
          })}
        </div>

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
              background: '#F6DBA6',
              color: '#121212',
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
      </article>
    </div>
  );
}

function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'lifetime'>('pro');
  const [email, setEmail] = useState('');

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
    },
    {
      id: 'pro',
      name: 'Take Charge Pro',
      price: '$9',
      period: '/month',
      description: 'Daily actionable insights',
      features: [
        'Daily email tips',
        'All premium blog posts',
        'Tax alerts & deadlines',
        'Market insights',
        'Priority support',
      ],
      cta: 'Subscribe',
      highlighted: true,
    },
    {
      id: 'lifetime',
      name: 'Charge Wealth',
      price: '$279',
      period: ' one-time',
      description: 'Full AI CFO platform',
      features: [
        'Everything in Pro',
        'AI-powered tax optimization',
        'Portfolio analysis',
        'Personalized recommendations',
        'Unlimited AI advisor questions',
        'Founding member perks',
      ],
      cta: 'Get Lifetime Access',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
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
          From free weekly insights to full AI-powered financial guidance.
        </p>
      </section>

      <section style={{
        padding: '0 32px 80px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                background: plan.highlighted ? 'linear-gradient(135deg, rgba(201, 169, 98, 0.1) 0%, rgba(201, 169, 98, 0.05) 100%)' : '#1E1E1E',
                borderRadius: 16,
                padding: 32,
                border: plan.highlighted ? '2px solid #F6DBA6' : '1px solid rgba(201, 169, 98, 0.1)',
                position: 'relative',
              }}
            >
              {plan.highlighted && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#F6DBA6',
                  color: '#121212',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  MOST POPULAR
                </div>
              )}

              <h2 style={{ color: '#F4F5F7', fontSize: 24, marginBottom: 8 }}>{plan.name}</h2>
              <p style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 24 }}>{plan.description}</p>

              <div style={{ marginBottom: 24 }}>
                <span style={{ color: '#F6DBA6', fontSize: 48, fontWeight: 700 }}>{plan.price}</span>
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
                onClick={() => setSelectedPlan(plan.id as any)}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: 16,
                  fontWeight: 600,
                  background: plan.highlighted ? '#F6DBA6' : 'transparent',
                  color: plan.highlighted ? '#121212' : '#F6DBA6',
                  border: plan.highlighted ? 'none' : '1px solid #F6DBA6',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{
        padding: '60px 32px',
        background: '#1E1E1E',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#F4F5F7', marginBottom: 32, textAlign: 'center' }}>
            Questions?
          </h2>
          
          {[
            {
              q: 'What\'s included in Take Charge Pro?',
              a: 'Daily actionable financial tips delivered to your inbox, access to all premium blog posts, tax deadline alerts, and market insights.',
            },
            {
              q: 'Can I upgrade from Pro to Lifetime?',
              a: 'Yes! If you upgrade to Charge Wealth within 30 days, we\'ll credit your Pro payments toward the $279 lifetime price.',
            },
            {
              q: 'Is there a money-back guarantee?',
              a: 'Yes. All plans come with a 30-day money-back guarantee. If you\'re not satisfied, email us for a full refund.',
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
