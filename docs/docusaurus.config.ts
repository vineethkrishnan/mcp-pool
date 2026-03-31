import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "MCP Pool Documentation",
  tagline: "A comprehensive collection of Model Context Protocol (MCP) servers.",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://mcp-pool.vineethnk.in",
  baseUrl: "/",

  // GitHub pages deployment config.
  organizationName: "vineethkrishnan",
  projectName: "mcp-pool",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/vineethkrishnan/mcp-pool/tree/main/docs/",
        },
        blog: false, // Disable blog for a documentation-only site
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "MCP Pool",
      logo: {
        alt: "MCP Pool Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/vineethkrishnan/mcp-pool",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Developer Tools",
          items: [
            { label: "Stripe", to: "/docs/stripe/overview" },
            { label: "Sentry", to: "/docs/sentry/overview" },
            { label: "Datadog", to: "/docs/datadog/overview" },
            { label: "Vercel", to: "/docs/vercel/overview" },
            { label: "PagerDuty", to: "/docs/pagerduty/overview" },
          ],
        },
        {
          title: "Productivity & Business",
          items: [
            { label: "Notion", to: "/docs/notion/overview" },
            { label: "Linear", to: "/docs/linear/overview" },
            { label: "Google Workspace", to: "/docs/google-workspace/overview" },
            { label: "HubSpot", to: "/docs/hubspot/overview" },
            { label: "Intercom", to: "/docs/intercom/overview" },
            { label: "Shopify", to: "/docs/shopify/overview" },
          ],
        },
        {
          title: "Links",
          items: [
            { label: "GitHub", href: "https://github.com/vineethkrishnan/mcp-pool" },
            { label: "npm", href: "https://www.npmjs.com/~vineethnkrishnan" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Vineeth Krishnan. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
