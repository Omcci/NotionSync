import { useRouter } from 'next/router'
import { UserIcon } from '../../public/icon/UserIcon'
import React from 'react'

const ProfileButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => {
  const router = useRouter()
  const handleShowProfile = () => {
    router.push('/profile')
  }

  return (
    <button
      onClick={handleShowProfile}
      ref={ref}
      className={`flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 ${props.className}`}
      {...props}
    >
      <UserIcon className="h-5 mr-2" />
      Profile
    </button>
  )
})

ProfileButton.displayName = 'ProfileButton'

export default ProfileButton
