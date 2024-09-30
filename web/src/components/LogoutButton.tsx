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
    <LogOutIcon className='h-5 cursor-pointer' onClick={handleSignOut} />
  )
}

export default LogoutButton
