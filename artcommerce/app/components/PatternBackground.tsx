import React from 'react';
import styles from './PatternBackground.module.css';

interface PatternBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

const PatternBackground: React.FC<PatternBackgroundProps> = ({ className, children }) => {
  return (
    <div className={`${styles.patternContainer} ${className || ''}`}>
      <div className={styles.pattern} />
      {children && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default PatternBackground;
