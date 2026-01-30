import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

interface PremiumTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  filename: string;
}

const PREMIUM_TOOLS: PremiumTool[] = [
  {
    id: 'cash-flow',
    name: 'Cash Flow Command Center',
    description: '12-month cash flow forecast to plan your financial future with confidence.',
    icon: '💰',
    filename: 'Cash-Flow-Command-Center.xlsx',
  },
  {
    id: 'tax-planning',
    name: 'Tax Planning Command Center',
    description: 'Estimate quarterly taxes and track deductions like a CFO.',
    icon: '📋',
    filename: 'Tax-Planning-Command-Center.xlsx',
  },
  {
    id: 'net-worth',
    name: 'Net Worth Dashboard',
    description: 'Track your assets, liabilities, and net worth month-by-month.',
    icon: '📈',
    filename: 'Net-Worth-Dashboard.xlsx',
  },
  {
    id: 'debt-payoff',
    name: 'Debt Destruction Planner',
    description: 'Compare avalanche vs snowball methods and create your payoff plan.',
    icon: '🎯',
    filename: 'Debt-Destruction-Planner.xlsx',
  },
  {
    id: 'fee-analyzer',
    name: 'Investment Fee Analyzer',
    description: 'See the shocking true cost of fees over 10, 20, and 30 years.',
    icon: '🔍',
    filename: 'Investment-Fee-Analyzer.xlsx',
  }
];

// Hook to check subscription status
function useSubscriptionAccess() {
  return useQuery({
    queryKey: ['blog-subscription-status'],
    queryFn: () => apiRequest('/api/blog/subscription-status'),
    retry: false,
    staleTime: 60000,
  });
}

interface ToolCardCompactProps {
  tool: PremiumTool;
  hasAccess: boolean;
  isDark: boolean;
}

function ToolCardCompact({ tool, hasAccess, isDark }: ToolCardCompactProps) {
  const [downloading, setDownloading] = useState(false);

  const colors = isDark ? {
    card: '#1E1E1E',
    cardHover: '#252525',
    text: '#F5F5F5',
    textSecondary: '#A3A3A3',
    accent: '#F6DBA6',
    accentText: '#F6DBA6',
    border: 'rgba(255,255,255,0.08)',
    accentBg: 'rgba(246,219,166,0.1)',
  } : {
    card: '#FFFDFB',
    cardHover: '#FFF9F0',
    text: '#1F2937',
    textSecondary: '#6B7280',
    accent: '#F6DBA6',
    accentText: '#8B6914',
    border: 'rgba(0,0,0,0.08)',
    accentBg: 'rgba(246,219,166,0.3)',
  };

  const handleDownload = async () => {
    if (!hasAccess) return;
    
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = `/downloads/${tool.filename}`;
      link.download = tool.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div 
      style={{
        background: colors.card,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'all 0.2s',
        boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.accent;
        e.currentTarget.style.background = colors.cardHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.background = colors.card;
      }}
    >
      <div style={{ 
        fontSize: 32, 
        width: 56, 
        height: 56, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: colors.accentBg,
        borderRadius: 12,
        flexShrink: 0,
      }}>
        {tool.icon}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: 16,
          fontWeight: 600,
          color: colors.text,
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {tool.name}
          <span style={{
            background: colors.accentBg,
            color: colors.accentText,
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            Premium
          </span>
        </h4>
        <p style={{
          fontSize: 13,
          color: colors.textSecondary,
          margin: 0,
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {tool.description}
        </p>
      </div>

      {hasAccess ? (
        <button
          onClick={handleDownload}
          disabled={downloading}
          aria-label={`Download ${tool.name}`}
          style={{
            background: colors.accent,
            color: '#4A3F2F',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: downloading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            opacity: downloading ? 0.7 : 1,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {downloading ? '...' : 'Download'}
        </button>
      ) : (
        <Link href="/take-charge/subscribe">
          <a style={{
            background: 'transparent',
            color: colors.accentText,
            border: `1px solid ${colors.accent}`,
            padding: '10px 16px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            Unlock
          </a>
        </Link>
      )}
    </div>
  );
}

interface PremiumToolsSectionProps {
  isDark: boolean;
  variant?: 'sidebar' | 'full';
}

export function PremiumToolsSection({ isDark, variant = 'sidebar' }: PremiumToolsSectionProps) {
  const { data: subStatus, isLoading } = useSubscriptionAccess();
  const hasAccess = subStatus?.hasAccess || false;

  const colors = isDark ? {
    bg: '#1E1E1E',
    text: '#F5F5F5',
    textSecondary: '#A3A3A3',
    accent: '#F6DBA6',
    accentText: '#F6DBA6',
    border: 'rgba(255,255,255,0.08)',
    accentBg: 'rgba(246,219,166,0.1)',
  } : {
    bg: '#F5F2ED',
    text: '#1F2937',
    textSecondary: '#6B7280',
    accent: '#F6DBA6',
    accentText: '#8B6914',
    border: 'rgba(0,0,0,0.08)',
    accentBg: 'rgba(246,219,166,0.3)',
  };

  if (isLoading) {
    return (
      <section style={{
        padding: variant === 'sidebar' ? '24px' : '48px 32px',
        background: colors.bg,
        borderRadius: variant === 'sidebar' ? 16 : 0,
        border: variant === 'sidebar' ? `1px solid ${colors.border}` : 'none',
      }}>
        <div style={{ textAlign: 'center', color: colors.textSecondary, padding: 40 }}>
          Loading tools...
        </div>
      </section>
    );
  }

  const isSidebar = variant === 'sidebar';
  const displayTools = isSidebar ? PREMIUM_TOOLS.slice(0, 3) : PREMIUM_TOOLS;

  return (
    <section style={{
      padding: isSidebar ? '24px' : '48px 32px',
      background: colors.bg,
      borderRadius: isSidebar ? 16 : 0,
      border: isSidebar ? `1px solid ${colors.border}` : 'none',
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: colors.accentBg,
            color: colors.accentText,
            padding: '6px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 12,
          }}>
            <span>⚡</span>
            PREMIUM CFO TOOLS
          </div>
          <h3 style={{
            fontSize: isSidebar ? 20 : 28,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}>
            Excel Spreadsheets for High Earners
          </h3>
          <p style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 8,
            marginBottom: 0,
          }}>
            Download CFO-grade templates. Offline-ready, fully customizable.
          </p>
        </div>
        
        {!hasAccess && (
          <Link href="/take-charge/subscribe">
            <a style={{
              background: colors.accent,
              color: '#4A3F2F',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              Unlock All Tools
            </a>
          </Link>
        )}
      </div>

      {/* Tools List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {displayTools.map((tool) => (
          <ToolCardCompact 
            key={tool.id} 
            tool={tool} 
            hasAccess={hasAccess} 
            isDark={isDark} 
          />
        ))}
      </div>

      {/* See All / CTA */}
      {isSidebar && PREMIUM_TOOLS.length > 3 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/premium-tools">
            <a style={{
              color: colors.accentText,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              View All {PREMIUM_TOOLS.length} Tools
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </Link>
        </div>
      )}

      {/* Full variant CTA for non-subscribers */}
      {!isSidebar && !hasAccess && (
        <div style={{
          marginTop: 40,
          padding: 32,
          background: isDark ? 'rgba(246,219,166,0.05)' : 'rgba(246,219,166,0.15)',
          borderRadius: 16,
          textAlign: 'center',
          border: `1px solid ${isDark ? 'rgba(246,219,166,0.2)' : 'rgba(246,219,166,0.4)'}`,
        }}>
          <h4 style={{ color: colors.text, fontSize: 22, marginBottom: 12 }}>
            Get Instant Access to All Premium Tools
          </h4>
          <p style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            Subscribe to Take Charge Pro for $9/month or get lifetime access with Charge Wealth at $279.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/take-charge/subscribe">
              <a style={{
                background: colors.accent,
                color: '#4A3F2F',
                padding: '14px 28px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
              }}>
                Subscribe Now
              </a>
            </Link>
            <Link href="/">
              <a style={{
                background: 'transparent',
                color: colors.accentText,
                border: `2px solid ${colors.accent}`,
                padding: '14px 28px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
              }}>
                Get Lifetime Access
              </a>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default PremiumToolsSection;
