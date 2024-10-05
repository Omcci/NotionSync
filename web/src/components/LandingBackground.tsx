import { useTheme } from 'next-themes'

const LandingBackground: React.FC = () => {
  const { theme } = useTheme()

  const isDarkMode = theme === 'dark'

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden z-[-10] ${isDarkMode ? 'bg-black' : 'bg-white'}`}
    >
      <svg
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
                  style={{ stopColor: '#000000', stopOpacity: 1 }}
                />
                <stop
                  offset="50%"
                  style={{ stopColor: '#333333', stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: '#504f4f', stopOpacity: 1 }}
                />
              </>
            ) : (
              <>
                <stop
                  offset="0%"
                  style={{ stopColor: '#FFFFFF', stopOpacity: 1 }}
                />
                <stop
                  offset="50%"
                  style={{ stopColor: '#E0E0E0', stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: '#C0C0C0', stopOpacity: 1 }}
                />
              </>
            )}
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#grad1)" />

        <g filter="url(#glow)">
          <path
            d="M0 600 Q 480 750 960 600 Q 1440 450 1920 600"
            fill="none"
            stroke={isDarkMode ? '#4a5568' : '#dedede'}
            strokeWidth="2"
            opacity="0.3"
          >
            <animate
              attributeName="d"
              values="M0 600 Q 480 750 960 600 Q 1440 450 1920 600;
                      M0 600 Q 480 450 960 600 Q 1440 750 1920 600;
                      M0 600 Q 480 750 960 600 Q 1440 450 1920 600"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0 700 Q 480 550 960 700 Q 1440 850 1920 700"
            fill="none"
            stroke={isDarkMode ? '#718096' : '#648fd4'}
            strokeWidth="2"
            opacity="0.5"
          >
            <animate
              attributeName="d"
              values="M0 700 Q 480 550 960 700 Q 1440 850 1920 700;
                      M0 700 Q 480 850 960 700 Q 1440 550 1920 700;
                      M0 700 Q 480 550 960 700 Q 1440 850 1920 700"
              dur="15s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0 800 Q 480 950 960 800 Q 1440 650 1920 800"
            fill="none"
            stroke={isDarkMode ? '#a0aec0' : '#8babbc'}
            strokeWidth="2"
            opacity="0.7"
          >
            <animate
              attributeName="d"
              values="M0 800 Q 480 950 960 800 Q 1440 650 1920 800;
                      M0 800 Q 480 650 960 800 Q 1440 950 1920 800;
                      M0 800 Q 480 950 960 800 Q 1440 650 1920 800"
              dur="20s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
    </div>
  )
}

export default LandingBackground
