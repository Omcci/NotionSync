import { motion } from 'framer-motion';

type GlowingButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
};

const SteamButton = ({ children, onClick }: GlowingButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-500 rounded-[calc(0.375rem+4px)] shadow-lg overflow-hidden"
      onClick={onClick}
    >
      <span className="absolute inset-0 w-full h-full rounded-[calc(0.375rem+4px)] bg-[length:400%] bg-gradient-to-r from-white via-gray-200 to-gray-500 animate-steam"></span>
      <span className="absolute inset-0 w-full h-full rounded-[calc(0.375rem+4px)] bg-[length:400%] bg-gradient-to-r from-white via-gray-200 to-gray-500 animate-steam blur-lg"></span>
      <span className="absolute inset-0.5 bg-indigo-700 rounded-lg"></span>
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default SteamButton;


