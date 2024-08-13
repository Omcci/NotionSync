import React from 'react'
import Footer from './Footer'
import { Toaster } from '@/components/ui/toaster'
import { Header } from './header'

const Layout: React.FC<{ children: React.ReactNode; user: any }> = ({
  children,
  user,
}) => {
  return (
    <>
      <Toaster />
      <div className="layout">
        <Header user={user} />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </>
  )
}

export default Layout
