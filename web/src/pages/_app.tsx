import type { AppProps } from "next/app";
import Layout from "../components/Layout";
import React from "react";
import "../../styles/globals.css";

import { Inter } from "next/font/google";

const interFont = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <style dangerouslySetInnerHTML={{ __html: interFont.style }} />
      <div className={interFont.className}>
        <Component {...pageProps} />
      </div>
    </Layout>
  );
}

export default MyApp;
