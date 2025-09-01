import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuth from '../hooks/useAuth';
import '../assets/styles/layout.css';

const Layout = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarExpanded(false);
      } else {
        setSidebarExpanded(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div className={`app-container ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />
      <main className="main-content">
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;