import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaBreadSlice, FaChartBar, FaUserCog, FaSignOutAlt, FaTimes, FaSalesforce, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import { FaBuilding } from 'react-icons/fa6';
import { MdInventory } from 'react-icons/md';
import { RiSecurePaymentFill } from 'react-icons/ri';
import '../assets/styles/sidebar.css';
import { ASSETS } from '../assets';
import { Alert } from 'react-bootstrap';
import { HiMiniBellAlert } from 'react-icons/hi2';

const Sidebar = ({ sidebarExpanded, setSidebarExpanded }) => {
  const { userRole, logout } = useAuth();
  const isMobile = window.innerWidth <= 768;

  const navGroups = [
    [
      { name: 'Dashboard', path: '/dashboard', icon: <FaHome />, roles: ['admin', 'manager'] },
      { name: 'POS', path: '/pos', icon: <FaShoppingCart />, roles: ['admin', 'sales'] },
      { name: 'Production', path: '/production', icon: <FaBreadSlice />, roles: ['admin', 'baker'] },
    ],
    [
      { name: 'Reports', path: '/reports', icon: <FaChartBar />, roles: ['admin', 'manager'] },
      { name: 'Sales History', path: '/sales-history', icon: <FaSalesforce />, roles: ['admin', 'sales'] },
    ],
    [
      { name: 'User Admin', path: '/admin', icon: <FaUserCog />, roles: ['admin'] },
      { name: 'Staff Management', path: '/staff', icon: <FaUserCog />, roles: ['admin'] },
      { name: 'Products', path: '/products', icon: <FaBreadSlice />, roles: ['admin', 'manager'] },
      { name: 'Branches', path: '/branches', icon: <FaBuilding />, roles: ['admin', 'manager'] },
      { name: 'Recipes', path: '/recipes', icon: <FaBuilding />, roles: ['admin', 'manager'] },
      { name: 'Raw Materials', path: '/raw_materials_inventory', icon: <MdInventory />, roles: ['admin', 'manager'] },
      { name: 'Payments', path: '/payments', icon: <RiSecurePaymentFill />, roles: ['admin', 'manager', 'sales'] },
      { name: 'Alerts', path: '/alerts', icon: <HiMiniBellAlert />, roles: ['admin','manager','sales']}
    ]
  ];

  return (
    <div className={`sidebar-container ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        {isMobile && (
          <div className="app-branding-sidebar">
            <img src={ASSETS['logo']} alt="App Logo" className="app-logo-sidebar" />
            <span className="app-name-sidebar">Purple Premium Bread</span>
          </div>
        )}
        <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="sidebar-toggle-button">
          {isMobile ? <FaTimes /> : (sidebarExpanded ? <FaArrowLeft /> : <FaArrowRight />)}
        </button>
      </div>
      <nav className="sidebar-nav">
        {navGroups.map((group, index) => (
          <React.Fragment key={index}>
            <ul>
              {group.map((link) =>
                (userRole && link.roles.includes(userRole)) && (
                  <li key={link.name} title={!sidebarExpanded ? link.name : ''}>
                    <NavLink
                      to={link.path}
                      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                      onClick={() => { if (isMobile) setSidebarExpanded(false); }}
                    >
                      <span className="nav-icon">{link.icon}</span>
                      <span className="nav-name">{link.name}</span>
                    </NavLink>
                  </li>
                )
              )}
            </ul>
            {index < navGroups.length - 1 && <hr className="nav-divider" />}
          </React.Fragment>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={logout} className="logout-button">
          <span className="nav-icon"><FaSignOutAlt /></span>
          <span className="nav-name">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;