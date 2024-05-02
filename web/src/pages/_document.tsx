import Document, { Html, Head, Main, NextScript } from "next/document";
import React from "react";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head></Head>
        <Main />
        <NextScript />
      </Html>
    );
  }
}

export default MyDocument;
