import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  iconStyle: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Ready to Use',
    icon: '\u26A1',
    iconStyle: styles.featureIconPurple,
    description: (
      <>
        Install via <code>npx</code>, set one environment variable, and your AI
        assistant can query and act on live data. No complex setup required.
      </>
    ),
  },
  {
    title: 'Read & Write Support',
    icon: '\u2194',
    iconStyle: styles.featureIconGreen,
    description: (
      <>
        140+ tools across 12 servers. Read data, create records, update
        statuses, and manage resources — all through natural language.
      </>
    ),
  },
  {
    title: 'Multi-IDE Support',
    icon: '\u{1F4BB}',
    iconStyle: styles.featureIconBlue,
    description: (
      <>
        Works with Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, and
        Claude Code CLI. One server, every IDE.
      </>
    ),
  },
];

function Feature({title, icon, iconStyle, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={clsx(styles.featureIcon, iconStyle)}>
          {icon}
        </div>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
