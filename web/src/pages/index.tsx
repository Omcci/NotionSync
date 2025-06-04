'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import EeDial from '@/components/EeDial'
import { motion, useScroll, useTransform } from 'framer-motion'
import SteamButton from '@/components/SteamButton'
import { GithubIcon } from '../../public/icon/GithubIcon'
import {
  ArrowRight,
  CheckCircle,
  Users,
  Zap,
  Calendar,
  GitBranch,
  Bell,
  Star,
  TrendingUp,
  Shield,
  Clock,
} from 'lucide-react'
import LandingBackground from '@/components/LandingBackground'
import StackingFeatures from '@/components/StackingFeatures'
import { useTheme } from 'next-themes'
import Faq from '@/components/Faq'
import { Separator } from '@/components/ui/separator'
import { stats, benefits, testimonials } from '@/data/landingData'
import { useUser } from '@/context/UserContext'

const Home = () => {
  const { user } = useUser()
  const [triggerEe, setTriggerEe] = useState(false)
  const [iconSize, setIconSize] = useState(10)
  const { scrollY } = useScroll()
  const [isClient, setIsClient] = useState(false)

  const heroY = useTransform(scrollY, [0, 500], [0, -150])
  const logoY = useTransform(scrollY, [0, 500], [0, -100])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!triggerEe) {
      setIconSize(10)
    }
  }, [triggerEe])

    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
    return session
    }

  const handleClickOpenEe = () => {
    window.open('https://github.com/omci-dev/NotionSync', '_blank')
  }

  const handleLogin = () => {
    window.location.href = '/login'
  }

  const { theme } = useTheme()

  return (
    <main className="relative min-h-screen">
      <LandingBackground />

      <motion.section
        style={{ y: heroY }}
        className="relative min-h-screen flex items-center justify-center px-6"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            style={{ y: logoY }}
            className="relative mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Image
            src="/NotionSync.svg"
              alt="NotionSync Logo"
              width={128}
              height={128}
              className="absolute w-24 md:w-32 h-auto z-[-1] opacity-20 dark:opacity-40 -top-8 -right-8 animate-pulse"
            />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent leading-tight">
              NotionSync
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6 leading-tight">
              Bridge Your Development
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Workflow Seamlessly
            </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Transform how your team collaborates by automatically syncing
              GitHub activity with Notion workspaces. Track progress, enhance
              visibility, and boost productivity.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
        {user ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
              onClick={() => (window.location.href = '/dashboardv0')}
            >
              Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
          </motion.div>
        ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg"
                    onClick={handleLogin}
                  >
                    <GithubIcon className="w-5 h-5 mr-2" />
                    Start Free with GitHub
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 dark:border-gray-600 px-8 py-4 text-lg font-semibold rounded-xl"
                    asChild
                  >
                    <Link href="/docs">
                      View Demo
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="text-center p-6 rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/50"
              >
                <div className="flex justify-center mb-2 text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <StackingFeatures />

      <motion.section
        className="py-24 px-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
                Why Choose
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}
                  NotionSync?
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Join thousands of teams who have transformed their workflow with
                our powerful integration platform.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {benefit}
                    </span>
                  </motion.div>
                ))}
            </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center mb-6">
                  <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Productivity Boost
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Team Efficiency
                    </span>
                    <span className="text-2xl font-bold text-green-500">
                      +40%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Project Visibility
                    </span>
                    <span className="text-2xl font-bold text-blue-500">
                      +60%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      Time Saved
                    </span>
                    <span className="text-2xl font-bold text-purple-500">
                      8hrs/week
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-24 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Loved by
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}
                Developers
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See what teams around the world are saying about NotionSync
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center">
              <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="py-24 px-6 bg-gradient-to-r from-blue-600 to-purple-600"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of teams already using NotionSync to streamline
              their development process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl"
                    onClick={handleLogin}
                  >
                    <GithubIcon className="w-5 h-5 mr-2" />
                    Get Started Free
                  </Button>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/80 text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl backdrop-blur-sm bg-white/10"
                  asChild
                >
                  <Link href="/docs">
                    Learn More
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Documentation Section */}
      <motion.section
        className="py-24 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-12 border border-white/20 dark:border-gray-700/50">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Documentation & Resources
          </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Everything you need to get started and make the most of
                NotionSync
          </p>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
            <Input
              type="text"
              placeholder="Search documentation..."
                className="flex-grow bg-white/20 dark:bg-black/20 border-white/30 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl"
              />
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl"
              >
                <Link href="/docs">
                  View Documentation
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
            </Button>
          </div>

            <Separator className="my-8 bg-white/20 dark:bg-gray-700/50" />
          <Faq />
          <EeDial triggerEe={triggerEe} setTriggerEe={setTriggerEe} />
          </div>
        </div>
      </motion.section>

      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      >
        <motion.div
          onClick={handleClickOpenEe}
          className="transition-transform duration-500 ease-in-out cursor-pointer hover:scale-110"
          style={{ width: iconSize, height: iconSize }}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/what.png"
            alt="Easter egg trigger"
            width={iconSize}
            height={iconSize}
            className="rounded-full shadow-lg"
          />
        </motion.div>
      </motion.div>
    </main>
  )
}

export default Home
