import React from 'react';
import styles from './RocketLoader.module.css';

const RocketLoader: React.FC = () => {
  return (
    <div className={styles.loaderWrapper}>
      <div className={styles.loader}>
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className={styles.base}>
          <span></span>
          <div className={styles.face}></div>
        </div>
      </div>
      <div className={styles.longfazers}>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default RocketLoader;
