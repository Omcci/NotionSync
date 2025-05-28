import { useUser } from '@/context/UserContext'
import { LogOut, User, Settings, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function Header() {
  const { user, signOutUser } = useUser()
  const router = useRouter()
  const isLoginPage = router.pathname === '/login'

  const navLinks = [
    { href: '/dashboardv0', label: 'Dashboard', icon: BarChart3 },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const handleLogin = () => {
    router.push('/login')
  }

  const handleLogout = async () => {
    await signOutUser()
    router.push('/')
  }

  const userInfo = user?.user_metadata || {}

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Image
            src="/NotionSyncLogoWhite.png"
            alt="NotionSync"
            className="w-8"
            width={32}
            height={32}
          />
          <span className="text-white hidden md:flex">NotionSync</span>
        </Link>
        {user && (
          <nav className="hidden md:flex items-center gap-6 ml-8">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`text-white hover:text-blue-400 transition-colors flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 ${
                  router.pathname === href ? 'text-blue-400 bg-gray-800' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="md:w-8 md:h-8 rounded-full border-2 border-gray-600 hover:border-blue-400 transition-colors"
                  width={64}
                  height={64}
                />
                <span className="hidden lg:block text-white text-sm">
                  {userInfo.user_name || userInfo.preferred_username}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56"
              sideOffset={8}
              alignOffset={0}
              avoidCollisions={true}
              collisionPadding={16}
            >
              <div className="px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <Link href="/profile" className="flex items-center gap-3">
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full"
                      width={40}
                      height={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {userInfo.full_name || userInfo.name || 'GitHub User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{userInfo.user_name || userInfo.preferred_username}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="md:hidden py-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild className="px-4 py-2">
                    <Link
                      href={href}
                      className="flex items-center gap-3 w-full"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-1" />
              </div>

              <div className="py-1">
                <DropdownMenuItem asChild className="px-4 py-2 hidden md:flex">
                  <Link href="/profile" className="flex items-center gap-3 ">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 hidden md:flex" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-red-600 focus:text-red-600 px-4 py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          !isLoginPage && (
            <Button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Login with GitHub
            </Button>
          )
        )}
      </div>
    </header>
  )
}
