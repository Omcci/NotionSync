import React from "react";
import BreadcrumbNav from "./BreadcrumbNav";
import Footer from "./Footer";
import { Toaster } from "@/components/ui/toaster";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Toaster />
      <div className="layout">
        <nav className="bg-gray-800 p-4">
          <BreadcrumbNav />
        </nav>
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
