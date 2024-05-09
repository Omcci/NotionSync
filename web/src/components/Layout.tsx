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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout">
      <nav className="bg-gray-800 p-4 text-white">
        {/* <Link href="/" className="">
          Home
        </Link>
        <Link href="/dashboard">Dashboard</Link> */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>{" "}
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>{" "}
            <BreadcrumbItem>
              <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
