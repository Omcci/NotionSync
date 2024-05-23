import Document, { Html, Head, Main, NextScript } from "next/document";
import React from "react";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="shortcut icon" href="/NotionSyncLogoDark.png" />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/NotionSyncLogoDark.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/NotionSyncLogoDark.png"
          />
          <link
            rel="icon"
            sizes="180x180"
            href="/NotionSyncLogoDark.png"
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
