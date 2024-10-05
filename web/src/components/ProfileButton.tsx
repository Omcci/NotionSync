import { useRouter } from 'next/router'
import { UserIcon } from '../../public/icon/UserIcon'

// query parameter to add

const ProfileButton = () => {
  const router = useRouter()
  const handleShowProfile = () => {
    router.push('/profile')
  }

  return (
    <button
      onClick={handleShowProfile}
      className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
    >
      <UserIcon className="h-5 mr-2" />
      Profile
    </button>
  )
}

export default ProfileButton
