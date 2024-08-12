import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import React, { useEffect, useState } from 'react'
import '../../styles/globals.css'

import { Inter } from 'next/font/google'
import Head from 'next/head'
import { AppProvider } from '@/context/AppContext'
import { ConfigProvider } from '@/context/ConfigContext'

import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/router'


const interFont = Inter({
  subsets: ['latin'],
  weight: ['400', '700'],
})

function MyApp({ Component, pageProps }: AppProps) {

  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AppProvider>
      <ConfigProvider>
        <Layout user={user}>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <style dangerouslySetInnerHTML={{ __html: interFont.style }} />
          </Head>
          <div className={interFont.className}>
            <Component {...pageProps} user={user} />
          </div>
        </Layout>
      </ConfigProvider>
    </AppProvider>
  )
}

export default MyApp
