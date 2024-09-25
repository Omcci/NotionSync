import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { useUser } from '@/context/UserContext'

const LogoutButton = () => {
  const router = useRouter()
  const { signOutUser } = useUser()

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/login')
  }

  return (
    <Button onClick={handleSignOut} variant="destructive">
      Log out
    </Button>
  )
}

export default LogoutButton
