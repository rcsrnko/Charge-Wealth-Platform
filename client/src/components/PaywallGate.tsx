import React from 'react';
import { Link } from 'wouter';

interface PaywallGateProps {
  children: React.ReactNode;
  contentPreview?: string;
  title?: string;
  hasAccess?: boolean;
}

export function PaywallGate({ children, contentPreview, title, hasAccess = false }: PaywallGateProps) {
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div style={{
      position: 'relative',
    }}>
      {/* Content Preview */}
      {contentPreview && (
        <div style={{
          marginBottom: 24,
          padding: 24,
          background: '#1A1D28',
          borderRadius: 12,
          border: '1px solid rgba(201, 169, 98, 0.1)',
        }}>
          <p style={{
            color: '#D1D5DB',
            fontSize: 18,
            lineHeight: 1.7,
          }}>
            {contentPreview}
          </p>
          <div style={{
            height: 80,
            background: 'linear-gradient(to bottom, transparent, #1A1D28)',
            marginTop: -40,
            position: 'relative',
          }} />
        </div>
      )}

      {/* Paywall Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201, 169, 98, 0.15) 0%, rgba(201, 169, 98, 0.05) 100%)',
        borderRadius: 16,
        padding: 40,
        border: '2px solid #C9A962',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#F4F5F7',
          marginBottom: 12,
        }}>
          {title ? `Unlock: ${title}` : 'Premium Content'}
        </h2>
        
        <p style={{
          color: '#A8B0C5',
          fontSize: 16,
          marginBottom: 32,
          maxWidth: 500,
          margin: '0 auto 32px',
        }}>
          Get access to this article and all premium content with a Take Charge subscription.
        </p>

        {/* Subscription Options */}
        <div style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 32,
        }}>
          {/* Monthly Plan */}
          <div style={{
            background: '#1A1D28',
            borderRadius: 12,
            padding: 24,
            minWidth: 180,
            border: '1px solid rgba(201, 169, 98, 0.2)',
          }}>
            <div style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 8 }}>Monthly</div>
            <div style={{ color: '#C9A962', fontSize: 32, fontWeight: 700 }}>$9</div>
            <div style={{ color: '#6B7280', fontSize: 14 }}>/month</div>
          </div>

          {/* Yearly Plan - Highlighted */}
          <div style={{
            background: 'rgba(201, 169, 98, 0.1)',
            borderRadius: 12,
            padding: 24,
            minWidth: 180,
            border: '2px solid #C9A962',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10B981',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
            }}>
              SAVE $21
            </div>
            <div style={{ color: '#C9A962', fontSize: 14, marginBottom: 8 }}>Yearly</div>
            <div style={{ color: '#C9A962', fontSize: 32, fontWeight: 700 }}>$87</div>
            <div style={{ color: '#6B7280', fontSize: 14 }}>/year</div>
            <div style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>
              Just $7.25/mo
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/take-charge/subscribe">
            <a style={{
              display: 'inline-block',
              background: '#C9A962',
              color: '#0F1117',
              padding: '14px 32px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
            }}>
              Subscribe Now
            </a>
          </Link>
        </div>

        {/* Already a member link */}
        <p style={{
          color: '#6B7280',
          fontSize: 14,
          marginTop: 24,
        }}>
          Already a Charge Wealth member?{' '}
          <Link href="/dashboard">
            <a style={{ color: '#C9A962', textDecoration: 'underline' }}>
              Sign in
            </a>
          </Link>
        </p>

        {/* Upsell to full platform */}
        <div style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid rgba(201, 169, 98, 0.2)',
        }}>
          <p style={{ color: '#A8B0C5', fontSize: 14, marginBottom: 12 }}>
            Want the full AI CFO experience?
          </p>
          <Link href="/">
            <a style={{
              color: '#C9A962',
              fontSize: 14,
              textDecoration: 'underline',
            }}>
              Get Charge Wealth Lifetime Access ($279) →
            </a>
          </Link>
          <p style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>
            Includes all premium blog content + AI-powered tax optimization, portfolio analysis, and more
          </p>
        </div>
      </div>
    </div>
  );
}

// Simplified inline paywall for article lists
export function PaywallBadge() {
  return (
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
  );
}

export default PaywallGate;
