import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { useUser } from '@/context/UserContext'
import { LogOutIcon } from 'lucide-react'

const LogoutButton = () => {
  const router = useRouter()
  const { signOutUser } = useUser()

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
    >
      <LogOutIcon className="h-5 mr-2" />
      Logout
    </button>)
}

export default LogoutButton
