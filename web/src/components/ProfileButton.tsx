import { useRouter } from 'next/router'
import { UserIcon } from '../../public/icon/UserIcon'
import React from 'react'

const ProfileButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  const router = useRouter()
  const handleShowProfile = () => {
    console.log('Profile button clicked')

    router.push('/profile')
  }

  return (
    <button
      onClick={handleShowProfile}
      ref={ref}
      className={`flex items-center w-full text-left ${props.className}`}
      {...props}
    >
      <UserIcon className="h-5 mr-2" />
      Profile
    </button>
  )
})

ProfileButton.displayName = 'ProfileButton'

export default ProfileButton
