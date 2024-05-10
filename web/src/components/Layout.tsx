import React from "react";
import BreadcrumbNav from "./BreadcrumbNav";
import Footer from "./Footer";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout">
      <nav className="bg-gray-800 p-4">
        <BreadcrumbNav />
      </nav>
      <main className="flex-grow">{children}</main>
      {/* <footer className="bg-gray-800 p-4 text-center text-white">
        Footer Content
      </footer> */}
      <Footer />
    </div>
  );
};

export default Layout;
