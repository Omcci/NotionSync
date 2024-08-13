import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { Button } from './ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from './ui/navigation-menu';

export function Header({ user }: { user: any }) {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboardv0', label: 'DashboardV0' },
    { href: '/testconfig', label: 'Testconfig' },
    { href: '/calendar', label: 'Calendar' },
  ]

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });

    if (error) console.error('Error during sign-in:', error.message);
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <img
            src="/NotionSyncLogoWhite.png"
            alt="NotionSync"
            className="w-8"
          />
          <span className="text-white hidden md:flex">NotionSync</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          {links.map(({ href, label }) => (
            <Link key={`${href}${label}`} href={href} className="text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="md:hidden">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="p-2">
                  {links.map(({ href, label }) => (
                    <li key={`${href}${label}`}>
                      <Link href={href} legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
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
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-white">Welcome, {user.email}</span>
            <LogoutButton />
          </>
        ) : (
          <Button onClick={handleLogin}>Login with GitHub</Button>
        )}
      </div>
    </header>
  )
}
