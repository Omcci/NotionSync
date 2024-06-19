import type { AppProps } from "next/app";
import Layout from "../components/Layout";
import React from "react";
import "../../styles/globals.css";

import { Inter } from "next/font/google";
import Head from "next/head";
import { AppProvider } from "@/context/AppContext";

const interFont = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <Layout>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <style dangerouslySetInnerHTML={{ __html: interFont.style }} />
        </Head>
        <div className={interFont.className}>
          <Component {...pageProps} />
        </div>
      </Layout>
    </AppProvider>
  );
}

export default MyApp;
