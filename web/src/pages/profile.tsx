import { useUser } from '@/context/UserContext'

export default function ProfilePage() {
  const { user } = useUser()

  if (!user) {
    return <p>You need to be logged in to view this page.</p>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="bg-white shadow-md rounded-lg p-4">
        <img
          src={user.user_metadata.avatar_url}
          alt="User Avatar"
          className="w-16 h-16 rounded-full mb-4"
        />
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>User ID:</strong> {user.id}
        </p>
      </div>
    </div>
  )
}
