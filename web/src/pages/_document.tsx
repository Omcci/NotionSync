import Document, { Html, Head, Main, NextScript } from "next/document";
import React from "react";

const links = [
  {
    rel: "shortcut icon",
    href: "/NotionSyncLogoDark.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/NotionSyncLogoDark.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/NotionSyncLogoDark.png",
  },
  {
    rel: "icon",
    sizes: "180x180",
    href: "/NotionSyncLogoDark.png",
  },
];

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {links.map((link, idx) => (
            <link key={idx} {...link} />
          ))}
          <meta
            name="description"
            content="Notion Sync is a tool that allows you to sync your local markdown files with your Notion workspace."
          />
          <meta
            name="keywords"
            content="Notion, Sync, Markdown, Notion API, Notion Sync, Notion Markdown"
          />
          <meta name="author" content="Notion Sync" />
          <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
          <meta
            name="google-site-verification"
            content="jQ5lY5JXf1P7y1w6s2J3wv7wG8o9l6Qz0YU4j5Vx5sM"
          />
          <meta
            name="msvalidate.01"
            content="D3C4E7F2C1B1C7F0F3F8E7C2E4F8F1E7F4E7F4E1C6E3F8F7F4E7D7F8E4E7F8"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
