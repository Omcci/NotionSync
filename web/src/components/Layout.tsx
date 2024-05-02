import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout">
      {/* <header>Header Content</header> */}
      <main>{children}</main>
      {/* <footer>Footer Content</footer> */}
    </div>
  );
}

export default Layout;
