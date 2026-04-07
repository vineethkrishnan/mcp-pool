import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1">
          {siteConfig.title}
        </Heading>
        <p>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className={styles.heroButton} to="/docs/intro">
            Get Started
          </Link>
          <Link
            className={styles.heroButtonOutline}
            href="https://github.com/vineethkrishnan/mcp-pool">
            GitHub
          </Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>11</span>
            <span className={styles.statLabel}>MCP Servers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>130+</span>
            <span className={styles.statLabel}>Tools</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>6+</span>
            <span className={styles.statLabel}>IDEs Supported</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="MCP Pool — a curated collection of MCP servers for AI assistants.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
