import { useState } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  helpText?: string;
  onAddToPlaybook?: () => void;
}

export default function PageHeader({ title, breadcrumbs, helpText, onAddToPlaybook }: PageHeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={styles.pageHeader}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className={styles.breadcrumbItem}>
              {crumb.path ? (
                <a href={crumb.path} className={styles.breadcrumbLink}>{crumb.label}</a>
              ) : (
                <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <svg className={`icon icon-sm ${styles.breadcrumbSeparator}`} aria-hidden="true">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        
        <div className={styles.actions}>
          {helpText && (
            <div className={styles.helpContainer}>
              <button
                className={styles.helpButton}
                onMouseEnter={() => setShowHelp(true)}
                onMouseLeave={() => setShowHelp(false)}
                onClick={() => setShowHelp(!showHelp)}
                aria-label="Contextual help"
              >
                <svg className="icon icon-sm" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" fill="none"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </button>
              {showHelp && (
                <div className={styles.helpTooltip}>
                  {helpText}
                </div>
              )}
            </div>
          )}

          {onAddToPlaybook && (
            <button onClick={onAddToPlaybook} className={`${styles.playbookButton} btn btn-secondary`}>
              <svg className="icon icon-sm" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              Add to My Playbook
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
