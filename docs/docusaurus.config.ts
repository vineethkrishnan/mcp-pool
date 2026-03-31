import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "MCP Pool Documentation",
  tagline: "A comprehensive collection of Model Context Protocol (MCP) servers.",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://vineethkrishnan.github.io",
  // Set the /<baseUrl>/ for GitHub pages deployment
  baseUrl: "/mcp-pool/",

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
          title: "Docs",
          items: [
            {
              label: "Stripe MCP",
              to: "/docs/stripe",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/vineethkrishnan",
            },
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
