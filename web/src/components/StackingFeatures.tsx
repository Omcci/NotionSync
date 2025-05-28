import { forwardRef, ForwardedRef, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, Zap, Users } from 'lucide-react'

interface FeatureItemProps {
  title: string
  description: string
  number: string
  index: number
  imageSource: string
  link: string
  button: string
  gradient: string
  icon: React.ReactNode
}

const FeatureItem = ({
  title,
  description,
  number,
  index,
  imageSource,
  link,
  button,
  gradient,
  icon,
}: FeatureItemProps) => {
  return (
    <div
      className="w-full h-screen flex flex-col bg-gray-50 dark:bg-gray-900 border border-white/10 dark:border-gray-700/30 rounded-3xl overflow-hidden"
      style={{
        position: 'sticky',
        top: `${index * 80}px`,
        zIndex: 100 + index,
      }}
    >
      {/* Content */}
      <div className="px-6 sm:px-12 md:px-16 py-12 relative z-20 flex flex-col lg:flex-row h-full">
        <div className="flex-1 flex flex-col justify-center pr-0 lg:pr-8">
          <div>
            <div className="flex items-center mb-6">
              <div
                className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${gradient} text-white mr-4`}
              >
                {icon}
              </div>
              <div className="font-mono text-sm text-gray-600 dark:text-gray-400 opacity-80">
                {number}/03
              </div>
            </div>
            <h3 className="text-[8vw] sm:text-[6vw] md:text-[4vw] lg:text-[3vw] font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              {title}
            </h3>
          </div>

          <div className="max-w-3xl mb-12">
            <p className="text-xl md:text-2xl leading-relaxed text-gray-700 dark:text-gray-300 mb-12">
              {description}
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                className={`bg-gradient-to-r ${gradient} hover:opacity-90 text-white px-10 py-5 text-xl font-semibold rounded-xl shadow-lg`}
              >
                <Link href={link}>
                  {button}
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Image on the right side */}
        <div className="w-full lg:w-1/2 h-80 lg:h-full relative lg:ml-8">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/40 mix-blend-multiply z-10 rounded-2xl" />
          <div className="relative w-full h-full">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={imageSource}
                alt={title}
                fill
                className="relative rounded-2xl shadow-2xl object-cover z-20"
                style={{
                  filter: 'contrast(1.1) brightness(0.95)',
                  padding: '1rem 0',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StackingFeatures = forwardRef(
  (_props, ref: ForwardedRef<HTMLElement>) => {
    const internalRef = useRef<HTMLElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Features data
    const features = [
      {
        number: '01',
        title: 'Seamless Integration',
        description:
          'Automatically sync your GitHub activity to Notion. Every commit, branch, and collaboration update flows seamlessly into your workspace without any manual intervention.',
        imageSource: '/neural.jpg',
        link: '/dashboardV0',
        button: 'Try Dashboard',
        gradient: 'from-blue-500 to-cyan-500',
        icon: <Zap className="w-8 h-8" />,
      },
      {
        number: '02',
        title: 'Intelligent Tracking',
        description:
          'Track your development progress with intelligent calendar views that automatically organize your commits, pull requests, and project milestones for maximum visibility.',
        imageSource: '/calendar.webp',
        link: '/calendar',
        button: 'View Calendar',
        gradient: 'from-purple-500 to-pink-500',
        icon: <Calendar className="w-8 h-8" />,
      },
      {
        number: '03',
        title: 'Team Collaboration',
        description:
          'Keep your entire team synchronized with real-time updates, shared insights, and collaborative project management tools that enhance productivity.',
        imageSource: '/collab1.jpg',
        link: '/docs',
        button: 'Learn More',
        gradient: 'from-green-500 to-emerald-500',
        icon: <Users className="w-8 h-8" />,
      },
    ]

    return (
      <section
        ref={internalRef}
        className="relative w-full bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
      >
        {/* Header */}
        <div className="px-6 sm:px-12 md:px-16 py-24 relative z-20">
          <div className="font-mono text-sm text-gray-600 dark:text-gray-400 opacity-80 mb-4 uppercase tracking-wider">
            Core Features
          </div>
          <h2 className="text-[12vw] sm:text-[10vw] md:text-[8vw] font-bold mb-8 text-gray-900 dark:text-white leading-tight">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Modern Teams
            </span>
          </h2>
          <p className="max-w-3xl text-xl md:text-2xl mb-16 text-gray-600 dark:text-gray-300 leading-relaxed">
            Everything you need to streamline your development workflow and
            enhance team collaboration
          </p>
        </div>

        {/* Stacking container */}
        <div
          ref={containerRef}
          className="relative"
          style={{
            height: `${features.length * 100}vh`,
          }}
        >
          {features.map((feature, index) => (
            <FeatureItem key={index} {...feature} index={index} />
          ))}
        </div>
      </section>
    )
  },
)

StackingFeatures.displayName = 'StackingFeatures'

export default StackingFeatures
