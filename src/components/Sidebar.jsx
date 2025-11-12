import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaShoppingCart,
  FaChartBar,
  FaUserCog,
  FaSignOutAlt,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaUsers,
  FaBoxOpen,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaUtensils,
  FaStore,
  FaTools,
  FaTrashAlt,
  FaFileInvoiceDollar,
  FaClipboardList,
} from 'react-icons/fa';
import { MdInventory } from 'react-icons/md';
import { RiSecurePaymentFill, RiStockFill } from 'react-icons/ri';
import { HiMiniBellAlert } from 'react-icons/hi2';
import { FaBuilding } from 'react-icons/fa6';
import useAuth from '../hooks/useAuth';
import '../assets/styles/Sidebar.css';
import { ASSETS } from '../assets';

// Logout Confirmation Dialog Component
const LogoutConfirmationDialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="ppb-dialog__overlay" onClick={onClose}>
      <div className="ppb-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ppb-dialog__header">
          <h3 className="ppb-dialog__title">Confirm Logout</h3>
        </div>
        <div className="ppb-dialog__body">
          <p>Are you sure you want to logout from Purple Premium Bread?</p>
          <p className="ppb-dialog__warning">
            You will need to login again to access the system.
          </p>
        </div>
        <div className="ppb-dialog__footer">
          <button className="ppb-btn ppb-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="ppb-btn ppb-btn--danger" onClick={onConfirm}>
            <FaSignOutAlt className="me-1" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ sidebarExpanded, setSidebarExpanded }) => {
  const { userRole, logout } = useAuth();
  const isMobile = window.innerWidth <= 768;
  const [logoutDialog, setLogoutDialog] = useState(false);

  const navGroups = [
    // 1️⃣ Dashboard & Sales
    [
      { name: 'Dashboard', path: '/dashboard', icon: <FaHome />, roles: ['admin', 'manager', 'accountant'] },
      { name: 'POS', path: '/pos', icon: <FaShoppingCart />, roles: ['admin', 'sales', 'manager'] },
      { name: 'Sales Management', path: '/sales_management', icon: <FaClipboardList />, roles: ['admin', 'manager'] },
      { name: 'Sales History', path: '/sales-history', icon: <FaFileInvoiceDollar />, roles: ['admin', 'sales', 'manager'] },
      { name: 'Exchanges History', path: '/exchanges-history', icon: <FaExchangeAlt />, roles: ['admin', 'sales', 'manager'] },
    ],

    // 2️⃣ Production & Products
    [
      { name: 'Production', path: '/production', icon: <FaUtensils />, roles: ['admin', 'baker', 'manager'] },
      { name: 'Products', path: '/products', icon: <FaBoxOpen />, roles: ['admin', 'manager'] },
      { name: 'Recipes', path: '/recipes', icon: <FaTools />, roles: ['admin', 'manager'] },
    ],

    // 3️⃣ Inventory & Stock Management
    [
      { name: 'Raw Materials', path: '/raw_materials_inventory', icon: <MdInventory />, roles: ['admin', 'manager'] },
      { name: 'Waste Stock', path: '/wastestock', icon: <FaTrashAlt />, roles: ['admin', 'sales', 'manager'] },
      { name: 'Branches', path: '/branches', icon: <FaBuilding />, roles: ['admin', 'manager'] },
    ],

    // 4️⃣ Finance & Reports
    [
      { name: 'Reports', path: '/reports', icon: <FaChartBar />, roles: ['admin', 'manager', 'accountant'] },
      { name: 'Payments', path: '/payments', icon: <RiSecurePaymentFill />, roles: ['admin', 'manager', 'sales'] },
      { name: 'Operating Expenses', path: '/operating-expenses', icon: <FaMoneyBillWave />, roles: ['admin', 'manager', 'accountant'] },
      { name: 'Salary Management', path: '/salary-management', icon: <FaMoneyBillWave />, roles: ['admin', 'accountant'] },
    ],

    // 5️⃣ People & System
    [
      { name: 'Customers', path: '/customers', icon: <FaUsers />, roles: ['admin', 'sales', 'manager'] },
      { name: 'Staff Management', path: '/staff', icon: <FaUserCog />, roles: ['admin', 'accountant'] },
      { name: 'User Admin', path: '/admin', icon: <FaUserCog />, roles: ['admin'] },
      { name: 'Alerts', path: '/alerts', icon: <HiMiniBellAlert />, roles: ['admin', 'manager', 'sales'] },
      { name: 'Services', path: '/services', icon: <FaStore />, roles: ['admin', 'manager'] },
    ],
  ];

  return (
    <div className={`sidebar-container ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
      {/* HEADER */}
      <div className="sidebar-header">
        {isMobile && (
          <div className="app-branding-sidebar">
            <img src={ASSETS['logo']} alt="App Logo" className="app-logo-sidebar" />
            <span className="app-name-sidebar">Purple Premium Bread</span>
          </div>
        )}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="sidebar-toggle-button"
        >
          {isMobile ? <FaTimes /> : sidebarExpanded ? <FaArrowLeft /> : <FaArrowRight />}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {navGroups.map((group, index) => (
          <React.Fragment key={index}>
            <ul>
              {group.map(
                (link) =>
                  userRole &&
                  link.roles.includes(userRole) && (
                    <li key={link.name} title={!sidebarExpanded ? link.name : ''}>
                      <NavLink
                        to={link.path}
                        className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        onClick={() => {
                          if (isMobile) setSidebarExpanded(false);
                        }}
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

      {/* FOOTER */}
      <div className="sidebar-footer">
        <button onClick={() => setLogoutDialog(true)} className="logout-button">
          <span className="nav-icon">
            <FaSignOutAlt />
          </span>
          <span className="nav-name">Logout</span>
        </button>
      </div>

      {/* LOGOUT CONFIRMATION */}
      <LogoutConfirmationDialog
        isOpen={logoutDialog}
        onClose={() => setLogoutDialog(false)}
        onConfirm={() => {
          setLogoutDialog(false);
          logout();
        }}
      />
    </div>
  );
};

export default Sidebar;
