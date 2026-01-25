import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'chart' | 'stat' | 'table-row';
  count?: number;
  width?: string;
  height?: string;
}

export default function SkeletonLoader({ 
  variant = 'text', 
  count = 1,
  width,
  height 
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div className={styles.cardSkeleton} style={{ width, height }}>
        <div className={styles.cardHeader}>
          <div className={`${styles.skeleton} ${styles.cardIcon}`}></div>
          <div className={styles.cardHeaderText}>
            <div className={`${styles.skeleton} ${styles.textLine}`} style={{ width: '60%' }}></div>
            <div className={`${styles.skeleton} ${styles.textLineSmall}`} style={{ width: '40%' }}></div>
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={`${styles.skeleton} ${styles.textLine}`}></div>
          <div className={`${styles.skeleton} ${styles.textLine}`} style={{ width: '80%' }}></div>
          <div className={`${styles.skeleton} ${styles.textLine}`} style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={styles.chartSkeleton} style={{ width, height }}>
        <div className={`${styles.skeleton} ${styles.chartCircle}`}></div>
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className={styles.statGrid}>
        {items.map((i) => (
          <div key={i} className={styles.statSkeleton}>
            <div className={`${styles.skeleton} ${styles.statLabel}`}></div>
            <div className={`${styles.skeleton} ${styles.statValue}`}></div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={styles.tableRows}>
        {items.map((i) => (
          <div key={i} className={styles.tableRowSkeleton}>
            <div className={`${styles.skeleton} ${styles.tableCell}`} style={{ width: '15%' }}></div>
            <div className={`${styles.skeleton} ${styles.tableCell}`} style={{ width: '20%' }}></div>
            <div className={`${styles.skeleton} ${styles.tableCell}`} style={{ width: '15%' }}></div>
            <div className={`${styles.skeleton} ${styles.tableCell}`} style={{ width: '20%' }}></div>
            <div className={`${styles.skeleton} ${styles.tableCell}`} style={{ width: '15%' }}></div>
            <div className={`${styles.skeleton} ${styles.tableCell}`} style={{ width: '10%' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.textLines} style={{ width }}>
      {items.map((i) => (
        <div 
          key={i} 
          className={`${styles.skeleton} ${styles.textLine}`}
          style={{ 
            width: i === items.length - 1 && count > 1 ? '70%' : '100%',
            height 
          }}
        ></div>
      ))}
    </div>
  );
}
