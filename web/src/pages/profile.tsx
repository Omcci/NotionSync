import { useUser } from '@/context/UserContext'
import Image from 'next/image'

export default function ProfilePage() {
  const { user } = useUser()

  if (!user) {
    return (
      <p className="text-gray-700 dark:text-gray-300">
        You need to be logged in to view this page.
      </p>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        User Profile
      </h1>
      <div className="bg-white dark:bg-[#1c1c1e] shadow-md dark:shadow-lg rounded-lg p-4">
        <Image
          src={user.user_metadata.avatar_url}
          alt="User Avatar"
          className="w-16 h-16 rounded-full mb-4"
          width={64}
          height={64}
        />
        <p className="text-gray-700 dark:text-gray-300">
          <strong>Email:</strong> {user.email}
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          <strong>User ID:</strong> {user.id}
        </p>
      </div>
    </div>
  )
}
