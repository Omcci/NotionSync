import { useRouter } from 'next/router'
import { useUser } from '@/context/UserContext'
import { LogOutIcon } from 'lucide-react'
import React from 'react';

const LogoutButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => {
  const router = useRouter()
  const { signOutUser } = useUser()

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/login')
  }

  return (
    <button
      ref={ref}
      onClick={handleSignOut}
      className={`flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 ${props.className}`}
      {...props}
    >
      <LogOutIcon className="h-5 mr-2" />
      Logout
    </button>
  );
});

LogoutButton.displayName = 'LogoutButton';

export default LogoutButton;