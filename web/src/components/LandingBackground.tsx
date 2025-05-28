import { useTheme } from 'next-themes'
import { motion, useScroll, useTransform } from 'framer-motion'

const LandingBackground: React.FC = () => {
  const { theme } = useTheme()
  const { scrollY } = useScroll()

  const isDarkMode = theme === 'dark'

  // Parallax transforms for different layers
  const y1 = useTransform(scrollY, [0, 1000], [0, -200])
  const y2 = useTransform(scrollY, [0, 1000], [0, -150])
  const y3 = useTransform(scrollY, [0, 1000], [0, -100])
  const opacity = useTransform(scrollY, [0, 500], [1, 0.3])

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden z-[-10] ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' : 'bg-gradient-to-br from-white via-gray-50 to-blue-50'}`}
    >
      {/* Animated gradient orbs */}
      <motion.div
        style={{ y: y1, opacity }}
        className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20"
      >
        <div
          className={`w-full h-full rounded-full ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-200 to-purple-200'} blur-3xl animate-pulse`}
        ></div>
      </motion.div>

      <motion.div
        style={{ y: y2, opacity }}
        className="absolute top-40 right-20 w-80 h-80 rounded-full opacity-15"
      >
        <div
          className={`w-full h-full rounded-full ${isDarkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-200 to-pink-200'} blur-3xl animate-pulse`}
          style={{ animationDelay: '2s' }}
        ></div>
      </motion.div>

      <motion.div
        style={{ y: y3, opacity }}
        className="absolute bottom-40 left-1/3 w-72 h-72 rounded-full opacity-10"
      >
        <div
          className={`w-full h-full rounded-full ${isDarkMode ? 'bg-gradient-to-r from-cyan-600 to-blue-600' : 'bg-gradient-to-r from-cyan-200 to-blue-200'} blur-3xl animate-pulse`}
          style={{ animationDelay: '4s' }}
        ></div>
      </motion.div>

      {/* Enhanced SVG with parallax layers */}
      <motion.svg
        style={{ y: y1 }}
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            {isDarkMode ? (
              <>
                <stop
                  offset="0%"
                  style={{ stopColor: '#000000', stopOpacity: 0.8 }}
                />
                <stop
                  offset="50%"
                  style={{ stopColor: '#1a1a1a', stopOpacity: 0.6 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: '#2d2d2d', stopOpacity: 0.4 }}
                />
              </>
            ) : (
              <>
                <stop
                  offset="0%"
                  style={{ stopColor: '#ffffff', stopOpacity: 0.8 }}
                />
                <stop
                  offset="50%"
                  style={{ stopColor: '#f8fafc', stopOpacity: 0.6 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: '#e2e8f0', stopOpacity: 0.4 }}
                />
              </>
            )}
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#grad1)" />

        {/* Multiple animated wave layers for depth */}
        <g filter="url(#glow)">
          <path
            d="M0 600 Q 480 750 960 600 Q 1440 450 1920 600"
            fill="none"
            stroke={isDarkMode ? '#3b82f6' : '#60a5fa'}
            strokeWidth="3"
            opacity="0.4"
          >
            <animate
              attributeName="d"
              values="M0 600 Q 480 750 960 600 Q 1440 450 1920 600;
                      M0 600 Q 480 450 960 600 Q 1440 750 1920 600;
                      M0 600 Q 480 750 960 600 Q 1440 450 1920 600"
              dur="12s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0 700 Q 480 550 960 700 Q 1440 850 1920 700"
            fill="none"
            stroke={isDarkMode ? '#8b5cf6' : '#a78bfa'}
            strokeWidth="2"
            opacity="0.3"
          >
            <animate
              attributeName="d"
              values="M0 700 Q 480 550 960 700 Q 1440 850 1920 700;
                      M0 700 Q 480 850 960 700 Q 1440 550 1920 700;
                      M0 700 Q 480 550 960 700 Q 1440 850 1920 700"
              dur="18s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0 800 Q 480 950 960 800 Q 1440 650 1920 800"
            fill="none"
            stroke={isDarkMode ? '#06b6d4' : '#67e8f9'}
            strokeWidth="2"
            opacity="0.2"
          >
            <animate
              attributeName="d"
              values="M0 800 Q 480 950 960 800 Q 1440 650 1920 800;
                      M0 800 Q 480 650 960 800 Q 1440 950 1920 800;
                      M0 800 Q 480 950 960 800 Q 1440 650 1920 800"
              dur="25s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Additional decorative elements */}
        <g filter="url(#softGlow)" opacity="0.1">
          <circle
            cx="200"
            cy="200"
            r="3"
            fill={isDarkMode ? '#3b82f6' : '#60a5fa'}
          >
            <animate
              attributeName="opacity"
              values="0.1;0.3;0.1"
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="800"
            cy="150"
            r="2"
            fill={isDarkMode ? '#8b5cf6' : '#a78bfa'}
          >
            <animate
              attributeName="opacity"
              values="0.1;0.4;0.1"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="1400"
            cy="300"
            r="4"
            fill={isDarkMode ? '#06b6d4' : '#67e8f9'}
          >
            <animate
              attributeName="opacity"
              values="0.1;0.2;0.1"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="1600"
            cy="500"
            r="2"
            fill={isDarkMode ? '#f59e0b' : '#fbbf24'}
          >
            <animate
              attributeName="opacity"
              values="0.1;0.3;0.1"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </motion.svg>

      {/* Floating geometric shapes */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-1/4 left-1/4 opacity-5"
      >
        <div
          className={`w-16 h-16 ${isDarkMode ? 'border-blue-400' : 'border-blue-300'} border-2 rotate-45 animate-spin`}
          style={{ animationDuration: '20s' }}
        ></div>
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute top-3/4 right-1/4 opacity-5"
      >
        <div
          className={`w-12 h-12 rounded-full ${isDarkMode ? 'border-purple-400' : 'border-purple-300'} border-2 animate-bounce`}
          style={{ animationDuration: '3s' }}
        ></div>
      </motion.div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDarkMode ? '#ffffff' : '#000000'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}

export default LandingBackground
