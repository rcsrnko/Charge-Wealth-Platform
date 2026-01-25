import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export default function LoadingSpinner({ size = 'medium', text }: LoadingSpinnerProps) {
  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.spinner}>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
        <div className={styles.dot}></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
