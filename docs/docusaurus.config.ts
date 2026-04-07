import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "MCP Pool",
  tagline: "A comprehensive collection of Model Context Protocol (MCP) servers for AI assistants.",
  favicon: "img/favicon.ico",

  url: "https://mcp-pool.vineethnk.in",
  baseUrl: "/",

  organizationName: "vineethkrishnan",
  projectName: "mcp-pool",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: "/docs",
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchBarShortcutHint: true,
        searchBarPosition: "left",
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/vineethkrishnan/mcp-pool/tree/main/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
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
          label: "Docs",
        },
        {
          type: "search",
          position: "left",
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
      copyright: `Copyright \u00A9 ${new Date().getFullYear()} Vineeth Krishnan. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
