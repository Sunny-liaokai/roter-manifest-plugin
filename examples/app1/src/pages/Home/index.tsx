import React from 'react';
import PrefetchLink from '@/components/Link';
import styles from './index.module.scss';

const Home = () => {
  return (
    <>
      <div className={styles.container}>home 页面</div>
      <div className={styles.footer}>
        <PrefetchLink href="/about">about</PrefetchLink>
      </div>
    </>
  );
};

export default Home;
