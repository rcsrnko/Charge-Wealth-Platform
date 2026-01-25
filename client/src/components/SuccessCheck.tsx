import styles from './SuccessCheck.module.css';

interface SuccessCheckProps {
  size?: number;
  color?: string;
}

export default function SuccessCheck({ size = 48, color = '#C9A962' }: SuccessCheckProps) {
  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg viewBox="0 0 52 52" className={styles.checkmark}>
        <circle 
          className={styles.circle} 
          cx="26" 
          cy="26" 
          r="24" 
          fill="none"
          stroke={color}
        />
        <path 
          className={styles.check} 
          fill="none"
          stroke={color}
          d="M14 27l7 7 16-16"
        />
      </svg>
    </div>
  );
}
