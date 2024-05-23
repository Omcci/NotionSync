import Link from "next/link";

export function Header() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboardv0", label: "DashboardV0" },
    { href: "/testconfig", label: "Testconfig" },
  ];
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
          <span className="text-white">NotionSync</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          {links.map(({ href, label }) => (
            <Link key={`${href}${label}`} href={href} className="text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4" />
    </header>
  );
}
