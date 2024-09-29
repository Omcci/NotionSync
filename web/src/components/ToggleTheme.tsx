import { MoonIcon, SunIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ToggleTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(initialTheme);
      document.documentElement.classList.add(initialTheme);
    }
  }, []); 

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.remove(theme!);
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (theme === null) {
    return null; 
  }

  return (
    <button
      onClick={toggleTheme}
      className="bg-gray-200 dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
