import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import React from 'react'
import '../../styles/globals.css'

import { Inter } from 'next/font/google'
import Head from 'next/head'
import { AppProvider } from '@/context/AppContext'
import { ConfigProvider } from '@/context/ConfigContext'

const interFont = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
})

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <ConfigProvider>
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
      </ConfigProvider>
    </AppProvider>
  )
}

export default MyApp
