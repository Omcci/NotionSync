import Link from "next/link";
import React from "react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout">
      <nav className="bg-gray-800 p-4">
        <Link href="/" className="">
          Home
        </Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
      {/* <header>Header Content</header> */}
      <main>{children}</main>
      {/* <footer>Footer Content</footer> */}
    </div>
  );
};

export default Layout;
