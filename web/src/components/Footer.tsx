// components/Footer.tsx
import React from "react";
import Link from "next/link";
import Icon from "./Icon";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50 text-white text-center p-4">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-sm flex flex-col md:flex-row">
            <Link href="/about" className="text-white hover:text-gray-300 mr-4">
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-gray-300 mr-4"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="text-white hover:text-gray-300 mr-4"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="py-2">
            <a href="https://github.com/Omcci" aria-label="GitHub">
              <Icon name="github" size={24} color="white" />
            </a>
            <a
              href="https://twitter.com/YourTwitter"
              aria-label="Twitter"
              className="ml-4"
            >
              <Icon name="twitter" size={24} color="#1DA1F2" />
            </a>
          </div>
        </div>
        <div className="text-center text-sm mt-5">
          © {new Date().getFullYear()} NotionSync. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
