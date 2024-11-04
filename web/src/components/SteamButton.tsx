import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

type GlowingButtonProps = {
  children: React.ReactNode
  onClick: () => void
}

const SteamButton = ({ children, onClick }: GlowingButtonProps) => {
  const { theme } = useTheme()

  const isDarkMode = theme === 'dark'

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`relative inline-flex items-center justify-center px-6 py-3 font-semibold rounded-[calc(0.375rem+4px)] shadow-lg overflow-hidden 
        ${isDarkMode ? 'text-white bg-blue-200' : 'text-gray-800 bg-white'}
      `}
      onClick={onClick}
    >
      <span
        className={`absolute inset-0 w-full h-full rounded-[calc(0.375rem+4px)] bg-[length:400%] animate-steam 
          ${isDarkMode ? 'bg-gradient-to-r from-white via-gray-200 to-gray-500' : 'bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400'}
        `}
      ></span>
      <span
        className={`absolute inset-0 w-full h-full rounded-[calc(0.375rem+4px)] bg-[length:400%] animate-steam blur-lg
          ${isDarkMode ? 'bg-gradient-to-r from-white via-gray-200 to-gray-500' : 'bg-gradient-to-r from-gray-950 via-gray-800 to-gray-600'}
        `}
      ></span>
      <span
        className={`absolute inset-0.5 rounded-lg 
        dark:bg-blue-300 bg-white
        `}
      ></span>
      <span
        className={`relative z-10 ${isDarkMode ? 'drop-shadow-[1px__1px_1px_var(--tw-shadow-color)] shadow-black' : ''}`}
      >
        {children}
      </span>
    </motion.button>
  )
}

export default SteamButton
