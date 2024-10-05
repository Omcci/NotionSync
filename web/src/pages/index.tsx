'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import signInWithGitHub from '@/lib/login'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import EeDial from '@/components/EeDial'
import { motion } from 'framer-motion'
import SteamButton from '@/components/SteamButton'
import { GithubIcon } from '../../public/icon/GithubIcon'
import { ArrowRight } from 'lucide-react'
import LandingBackground from '@/components/LandingBackground'
import { useTheme } from 'next-themes'
import Faq from '@/components/Faq'
import { Separator } from '@/components/ui/separator'

const Home = () => {
  const [user, setUser] = useState<User | null>(null)
  const [triggerEe, setTriggerEe] = useState(false)
  const [iconSize, setIconSize] = useState(10)

  useEffect(() => {
    if (!triggerEe) {
      setIconSize(10)
    }
  }, [triggerEe])

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    getSession()
  }, [])

  const handleClickOpenEe = () => {
    if (iconSize < 100) {
      setIconSize(iconSize + 10)
    } else {
      setTriggerEe(true)
    }
  }

  const features = [
    {
      title: "Monitor your workflow",
      description: "Stay up-to-date and monitor your workflow directly through the calendar view where you can summarize your daily, weekly, and monthly tasks.",
      image: "/calendar.webp",
      link: "/calendar",
      button: "Calendar"
    },
    {
      title: "Automate Your Workflow",
      description: "Automatically sync GitHub commits to Notion. No more manual updates. Ensure your Notion workspace is always up-to-date with the latest changes from your repositories.",
      image: "/neural.jpg",
      link: "/dashboardV0",
      button: "Dashboard"
    },
    {
      title: "Enhance Collaboration",
      description: "Keep your team on the same page. Share real-time updates with your team and enhance collaboration by integrating commit messages and branch updates directly into your Notion pages.",
      image: "/collab1.jpg",
      button: "Learn More",
    },
  ]

  const { theme } = useTheme();

  const isDarkMode = theme === 'dark';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between ">
      <LandingBackground />
      <motion.header
        className="relative w-full max-w-5xl text-center py-16 px-6 sm:py-20 sm:px-8 md:py-24 md:px-10 lg:py-28 lg:px-12 xl:py-32 xl:px-16"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative w-full flex justify-center">
          <img
            src="/NotionSync.svg"
            alt="NotionSync Background"
            className="absolute w-32 md:w-36 h-auto z-[-1] opacity-10 dark:opacity-35 right-12"
          />
          <h1 className="mb-4 text-6xl font-black text-gray-800 dark:text-gray-100 md:text-5xl lg:text-6xl relative z-10">
            <span
              className={`bg-clip-text text-transparent from-blue-200 via-blue-300 to-blue-400 bg-gradient-to-r animate-steam drop-shadow-[1px__1px_1px_var(--tw-shadow-color)] ${isDarkMode ? "shadow-white" : 'shadow-black'}`}
            >
              {''} NotionSync
            </span>
          </h1>
        </div>
        <p className="mb-6 font-black text-gray-600 dark:text-gray-400 text-2xl lg:text-3xl">
          Take control of your workflow. <br />
          Track your tasks with ease. <br />
          Enhance team collaboration.
        </p>
        {user ? (
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <SteamButton onClick={() => (window.location.href = '/dashboardv0')}>
              Go to Dashboard
            </SteamButton>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <SteamButton onClick={signInWithGitHub}>
              <div className="flex items-center">
                <GithubIcon className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
                Sign in with GitHub
              </div>
            </SteamButton>
          </motion.div>
        )}
      </motion.header>

      <section className="w-full">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className={`flex flex-col md:flex-row items-center justify-between py-16 px-8 md:max-w-[76%] mx-auto backdrop-blur-sm`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8 md:order-2'}`}>
              <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">{feature.title}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">{feature.description}</p>
              <Button asChild>
                <Link href={feature?.link ? feature?.link : '/docs'}>
                  <p>{feature.button}</p>
                </Link>
              </Button>
            </div>
            <div className={`md:w-1/2 mt-8 md:mt-0 ${index % 2 === 0 ? '' : 'md:order-1'}`}>
              <Image
                src={feature.image}
                alt={feature.title}
                width={500}
                height={300}
                className="rounded-lg shadow-lg object-cover w-full h-64"
              />
            </div>
          </motion.div>
        ))}
      </section>

      <motion.section
        className="w-full max-w-3xl my-16 px-8 backdrop-blur-sm backdrop-filter dark:backdrop-filter-dark dark:bg-opacity-20 dark:bg-[#1c1c1e] rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Documentation & Guides</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Find in-depth information and guides to help you get started.
          </p>
          <div className="flex flex-col md:flex-row gap-4 items-center my-6">
            <Input
              type="text"
              placeholder="Search documentation..."
              className="flex-grow bg-gray-100 dark:bg-[#2c2c2e] dark:text-gray-200 border-none focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
            />
            <Button asChild>
              <Link href="/docs">
                View Documentation
              </Link>
            </Button>
          </div>
          <Separator className='my-6' />
          <Faq />
          <EeDial triggerEe={triggerEe} setTriggerEe={setTriggerEe} />
        </div>
      </motion.section>

      <motion.div
        className="fixed bottom-4 right-4"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <div
          onClick={handleClickOpenEe}
          className="transition-transform duration-500 ease-in-out cursor-pointer"
          style={{ width: iconSize, height: iconSize }}
        >
          <Image
            src="/what.png"
            alt="Easter egg trigger"
            width={iconSize}
            height={iconSize}
            className="rounded-full shadow-lg"
          />
        </div>
      </motion.div>
    </main>
  )
}

export default Home