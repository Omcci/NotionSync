import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@/context/UserContext'
import signInWithGitHub from '@/lib/login' // Import the method from login.ts
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loadingspinner'

const LoginPage = () => {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (router.isReady && user !== null) {
      setLoading(true)
      router.push('/')
    }
  }, [user, router])

  const handleLogin = async () => {
    setLoading(true)
    await signInWithGitHub()
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Sign in to Your Account</h1>
      <Button
        onClick={handleLogin}
        className="text-white bg-black hover:bg-gray-800 px-4 py-2 rounded-md"
      >
        Sign in with GitHub
      </Button>
    </div>
  )
}

export default LoginPage
