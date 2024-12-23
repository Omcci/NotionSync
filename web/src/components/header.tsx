import { useUser } from '@/context/UserContext'
import signInWithGitHub from '@/lib/login'
import { supabase } from '@/lib/supabaseClient'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { Button } from './ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu'
import Image from 'next/image'
import { useRouter } from 'next/router'
import ModeToggle from './ModeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import ProfileButton from './ProfileButton'

export function Header() {
  const links = [
    { href: '/dashboardv0', label: 'Dashboard' },
    { href: '/calendar', label: 'Calendar' },
  ]

  const handleLogin = async () => {
    await signInWithGitHub()
  }

  const { user } = useUser()
  const router = useRouter()
  const isLoginPage = router.pathname === '/login'

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center p-2 rounded-md bg-gray-900  transition-colors">
                  <MenuIcon className="text-white" aria-hidden="true" />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="">
                  <ul className="p-4 space-y-2">
                    {links.map(({ href, label }) => (
                      <li key={`${href}${label}`}>
                        <Link href={href} legacyBehavior passHref>
                          <NavigationMenuLink
                            className={`${navigationMenuTriggerStyle()} block`}
                          >
                            {label}
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
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
        <ModeToggle />
        <nav className="hidden md:flex items-center gap-4">
          {links.map(({ href, label }) => (
            <Link key={`${href}${label}`} href={href} className="text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Image
                src={user.user_metadata.avatar_url}
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
                width={32}
                height={32}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <ProfileButton />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogoutButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          !isLoginPage && (
            <Button onClick={handleLogin}>Login with GitHub</Button>
          )
        )}
      </div>
    </header>
  )
}
