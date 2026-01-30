import React, { useState, useEffect } from 'react';
import { Route, Switch, Link, useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SEO } from '../components/SEO';
import { PaywallGate, PaywallBadge } from '../components/PaywallGate';
import { apiRequest } from '../lib/queryClient';

// Types
interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'financial-planning' | 'tax-strategy' | 'capital-markets' | 'free';
  date: string;
  readTime: string;
  isPremium: boolean;
  image?: string;
}

// Premium categories that require subscription
const PREMIUM_CATEGORIES = ['financial-planning', 'tax-strategy', 'capital-markets'];

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

1. **Max out tax-advantaged accounts first** - 401(k), IRA, HSA
2. **Use low-cost index funds** - Vanguard, Fidelity, Schwab (0.03-0.10% expense ratios)
3. **Automate everything** - Set it and forget it
4. **Get advice when you need it** - Pay for a flat-fee financial plan, not ongoing AUM

## The Bottom Line

You don't need to pay 1% of your wealth every year for basic financial advice. The math simply doesn't work in your favor.

---

*Want to see exactly how much you're paying in fees? Try our [Advisor Fee Calculator](/tools/advisor-fee-calculator).*
    `,
    category: 'free',
    date: '2026-01-27',
    readTime: '5 min',
    isPremium: false,
  },
  {
    slug: '5-tax-moves-before-april',
    title: '5 Tax Moves to Make Before April (Most People Miss #3)',
    excerpt: 'Tax season is coming. Here are 5 strategies that could save you thousands, and most people don\'t know about #3.',
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

*Want a personalized tax analysis? [Get started with Charge Wealth](/dashboard) - we'll find every deduction you're missing.*
    `,
    category: 'tax-strategy',
    date: '2026-01-25',
    readTime: '4 min',
    isPremium: true,
  },
  {
    slug: 'roth-vs-traditional-definitive-guide',
    title: 'Roth vs. Traditional: The Definitive Guide',
    excerpt: 'Should you contribute to a Roth or Traditional account? The answer depends on one key factor most people get wrong.',
    content: `
# Roth vs. Traditional: The Definitive Guide

This is one of the most common financial questions. And most of the advice you'll find online is wrong, or at least incomplete.

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

This gives you tax diversification, you'll have both tax-free and tax-deferred buckets to draw from in retirement.

---

*Not sure which is right for you? Use our [Roth vs. Traditional Calculator](/tools/roth-vs-traditional) to see the math for your situation.*
    `,
    category: 'financial-planning',
    date: '2026-01-23',
    readTime: '6 min',
    isPremium: true,
  },
  {
    slug: 'daily-tax-tip-backdoor-roth',
    title: 'Daily Tip: The Backdoor Roth Strategy Explained',
    excerpt: 'High earners can\'t contribute directly to a Roth IRA. But there\'s a legal loophole that lets you do it anyway.',
    content: `
# The Backdoor Roth Strategy Explained

If you earn too much to contribute directly to a Roth IRA, don't worry. There's a completely legal way around it.

## The Income Limits

In 2026, you can't contribute directly to a Roth IRA if your income exceeds:
- $161,000 (single)
- $240,000 (married filing jointly)

## The Backdoor Strategy

Here's how it works:

1. **Contribute to a Traditional IRA** - There are no income limits for non-deductible contributions
2. **Convert to a Roth IRA** - You can convert any Traditional IRA funds to Roth
3. **Pay taxes on any gains** - If you convert immediately, there's essentially no gain to tax

## The Pro-Rata Rule Warning

If you have existing Traditional IRA funds (from rollovers, etc.), the conversion is taxed proportionally. This can make the backdoor strategy less attractive.

**Solution:** Roll your Traditional IRA into your 401(k) before doing the backdoor Roth.

## Step-by-Step

1. Open a Traditional IRA (if you don't have one)
2. Contribute $7,000 (the 2026 limit)
3. Wait a few days for the funds to settle
4. Convert the entire balance to your Roth IRA
5. Report the conversion on Form 8606

---

*Need help executing this strategy? Our AI advisor can walk you through it step by step.*
    `,
    category: 'tax-strategy',
    date: '2026-01-27',
    readTime: '3 min',
    isPremium: true,
  },
  {
    slug: 'weekly-market-outlook-jan-27',
    title: 'Weekly Market Outlook: What to Watch This Week',
    excerpt: 'Fed meeting, earnings season, and key economic data. Here\'s what smart investors are watching.',
    content: `
# Weekly Market Outlook: What to Watch This Week

Another packed week in the markets. Here's what's moving and what matters.

## Fed Meeting

The Federal Reserve meets this week. Markets are pricing in a pause on rate cuts, but the language in Powell's statement will be scrutinized.

**Watch for:** Any hints about the pace of future cuts.

## Earnings Season Continues

Big tech reports this week:
- **Microsoft** (Tuesday after close)
- **Meta** (Wednesday after close)
- **Apple** (Thursday after close)
- **Amazon** (Thursday after close)

These four companies represent a massive portion of the S&P 500. Their guidance will set the tone for Q1.

## Economic Data

- **Tuesday:** Consumer Confidence
- **Wednesday:** GDP (advance estimate)
- **Friday:** PCE Inflation (the Fed's preferred measure)

## Our Take

The market is pricing in a soft landing. If we get hot inflation data or weak guidance from big tech, expect volatility.

For long-term investors: stay the course. This is noise.

---

*Want real-time market insights? Upgrade to Take Charge Pro for daily analysis.*
    `,
    category: 'capital-markets',
    date: '2026-01-27',
    readTime: '4 min',
    isPremium: true,
  },
  {
    slug: 'emergency-fund-calculator-guide',
    title: 'How Much Emergency Fund Do You Really Need?',
    excerpt: 'The standard advice is 3-6 months. But that one-size-fits-all approach might be wrong for you.',
    content: `
# How Much Emergency Fund Do You Really Need?

Everyone says save 3-6 months of expenses. But that number might be too low, or too high, depending on your situation.

## The Variables That Matter

**Job Security**
- Stable government job? 3 months might be fine.
- Freelancer or startup employee? 6-12 months is safer.

**Income Sources**
- Single income household? More buffer needed.
- Dual income? You have built-in redundancy.

**Fixed vs. Variable Expenses**
- High mortgage payment? You need more liquid cash.
- Renting with flexibility? You can adjust faster.

## A Better Framework

Instead of "months of expenses," think about **recovery time**.

How long would it take you to find a new job at similar pay if you lost your current one?

- Easy to replace income: 3 months
- Moderate difficulty: 6 months
- Specialized/senior role: 9-12 months

## Where to Keep It

Your emergency fund should be:
- Liquid (accessible within days)
- Safe (not in the stock market)
- Earning something (high-yield savings)

Current high-yield savings rates: 4.5%+ APY

---

*Calculate your personalized emergency fund target with our [Emergency Fund Calculator](/tools/emergency-fund-calculator).*
    `,
    category: 'free',
    date: '2026-01-22',
    readTime: '4 min',
    isPremium: false,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Posts' },
  { id: 'tax-strategy', label: 'Tax Strategy', premium: true },
  { id: 'financial-planning', label: 'Financial Planning', premium: true },
  { id: 'capital-markets', label: 'Capital Markets', premium: true },
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
                borderRadius: 6,
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

  const filteredPosts = BLOG_POSTS.filter(
    post => selectedCategory === 'all' || post.category === selectedCategory
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 32,
        }}>
          {filteredPosts.map(post => (
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
                      background: post.category === 'financial-planning' || post.category === 'free' ? '#DBEAFE' : 'rgba(201, 169, 98, 0.1)',
                      color: post.category === 'financial-planning' || post.category === 'free' ? '#3B82F6' : '#C9A962',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 20,
                      textTransform: 'capitalize',
                    }}>
                      {post.category.replace('-', ' ')}
                    </span>
                    {post.isPremium && <PaywallBadge />}
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
  const post = BLOG_POSTS.find(p => p.slug === params?.slug);
  const { data: subStatus, isLoading } = useBlogSubscription();
  
  const hasAccess = subStatus?.hasAccess || false;
  const isPremiumContent = post?.isPremium || false;
  const needsPaywall = isPremiumContent && !hasAccess;

  if (!post) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0F1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F4F5F7',
      }}>
        Post not found
      </div>
    );
  }

  // Extract first paragraph for preview
  const contentLines = post.content.trim().split('\n').filter(line => line.trim());
  const firstParagraph = contentLines.find(line => !line.startsWith('#') && line.trim().length > 50) || post.excerpt;

  if (isLoading) {
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1117',
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
            background: post.category === 'financial-planning' || post.category === 'free' ? '#DBEAFE' : 'rgba(201, 169, 98, 0.1)',
            color: post.category === 'financial-planning' || post.category === 'free' ? '#3B82F6' : '#C9A962',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 20,
            textTransform: 'capitalize',
          }}>
            {post.category.replace('-', ' ')}
          </span>
          {post.isPremium && <PaywallBadge />}
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

        {/* Content with paywall */}
        {needsPaywall ? (
          <PaywallGate
            contentPreview={firstParagraph}
            title={post.title}
            hasAccess={false}
          >
            <div />
          </PaywallGate>
        ) : (
          <>
            {/* Full Content */}
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
                  return <hr key={i} style={{ border: 'none', borderTop: '2px solid #DBEAFE', margin: '40px 0' }} />;
                }
                // Handle links
                const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (linkMatch) {
                  const parts = line.split(/\[([^\]]+)\]\(([^)]+)\)/);
                  return (
                    <p key={i} style={{ marginBottom: 16 }}>
                      {parts[0]}
                      <a href={linkMatch[2]} style={{ color: '#3B82F6', textDecoration: 'underline' }}>{linkMatch[1]}</a>
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
