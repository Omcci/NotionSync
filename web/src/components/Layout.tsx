import Link from "next/link";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Slash } from "lucide-react";
import BreadcrumbNav from "./BreadcrumbNav";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout">
      <nav className="bg-gray-800 p-4">
        {/* <Link href="/" className="">
          Home
        </Link>
        <Link href="/dashboard">Dashboard</Link> */}
        <BreadcrumbNav />
      </nav>
      {/* <header>Header Content</header> */}
      <main>{children}</main>
      {/* <footer>Footer Content</footer> */}
      <footer className="bg-gray-800 p-4 text-center text-white">
        Footer Content
      </footer>
    </div>
  );
};

export default Layout;
