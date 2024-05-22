import Link from "next/link"

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold" >
          {/* <NotebookIcon className="w-6 h-6" />
           */}
           <img src="/logo.png" alt="NotionSync" className="w-20" />
          <span className="text-white">NotionSync</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:underline text-white" >
            Home
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:underline text-white" >
            Dashboard
          </Link>
          <Link href="/dashboardv0" className="text-sm font-medium hover:underline text-white" >
            DashboardV0
          </Link>
          <Link href="/testconfig" className="text-sm font-medium hover:underline text-white" >
            Testconfig
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4" />
    </header>
  )
}

