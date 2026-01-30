import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

/**
 * Empty state component for when there's no data to display
 * 
 * Usage:
 *   <EmptyState 
 *     title="No transactions yet"
 *     description="Connect your accounts to see your transactions"
 *     action={{ label: "Connect Account", onClick: () => {} }}
 *   />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}) => {
  const sizeStyles = {
    compact: { padding: 'var(--space-6) var(--space-4)' },
    default: { padding: 'var(--space-12) var(--space-6)' },
    large: { padding: 'var(--space-16) var(--space-8)' },
  };

  const defaultIcon = (
    <svg 
      className="empty-state-icon" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div 
      className={`empty-state ${className}`}
      style={sizeStyles[variant]}
    >
      {icon || defaultIcon}
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <button 
          className="btn btn-primary animate-bounce-subtle"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Pre-built empty states for common scenarios
 */
export const EmptyStateNoData: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    icon={
      <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    }
    title="No data yet"
    description="Upload your financial documents to get started with personalized insights."
    action={onAction ? { label: "Upload Documents", onClick: onAction } : undefined}
  />
);

export const EmptyStateNoAccounts: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState
    icon={
      <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    }
    title="No accounts connected"
    description="Link your bank and brokerage accounts to see your complete financial picture."
    action={onAction ? { label: "Connect Account", onClick: onAction } : undefined}
  />
);

export const EmptyStateNoTransactions: React.FC = () => (
  <EmptyState
    icon={
      <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    }
    title="No transactions"
    description="Transactions will appear here once your accounts are synced."
  />
);

export const EmptyStateSearch: React.FC<{ query?: string }> = ({ query }) => (
  <EmptyState
    variant="compact"
    icon={
      <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    }
    title="No results found"
    description={query ? `No matches for "${query}". Try a different search term.` : "Try adjusting your search or filters."}
  />
);

export const EmptyStateError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon={
      <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--error)' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    }
    title="Something went wrong"
    description="We couldn't load this data. Please try again."
    action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
  />
);

export default EmptyState;
