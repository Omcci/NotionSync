import React from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/logout'

const LogoutButton = () => {
  const router = useRouter()

  const handleSignOut = async () => {
    const error = await signOut()

    if (!error) {
      router.push('/login')
    }
  }

  return (
    <Button onClick={handleSignOut} variant="destructive">
      Log out
    </Button>
  )
}

export default LogoutButton
