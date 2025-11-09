// src/pages/SalesManagementDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Components
import SalesUserStockManagement from './SalesUserStockManagement'; // Existing component
import ManagerExchangeApprovalQueue from './ManagerExchangeApprovalQueue'; // NEW Component
import AllocationHistoryPage from './AllocationHistoryPage'; // ✨ NEW LINE

// Import Icons
import {
    FaUserShield,
    FaBoxes,
    FaRedo, // Icon for Exchange
    FaArrowLeft, // Icon for Stock Management (similar to return/receive)
    FaHistory
} from 'react-icons/fa';
import CustomToast from '../components/CustomToast';

const SalesManagementDashboard = () => {
    // We start with the existing stock management tab
    const [activeTab, setActiveTab] = useState('stockManagement');
    const { isAuthenticated, userRole } = useAuth();
    const navigate = useNavigate();

    // Only Managers and Admins should access this dashboard
    const isManagerOrAdmin = ['admin', 'manager'].includes(userRole);

    useEffect(() => {
        if (!isAuthenticated || !isManagerOrAdmin) {
            toast(<CustomToast type="error" message="Unauthorized access. Redirecting." />);
            navigate('/');
        }
    }, [isAuthenticated, isManagerOrAdmin, navigate]);

    if (!isAuthenticated || !isManagerOrAdmin) return null;

    return (
        <div className="pos-dashboard"> {/* Reusing POS dashboard styles/layout */}
            <ToastContainer />
            <header className="pos-header">
                <FaUserShield className="me-2" size={30} />
                <h1>Sales & Stock Management Dashboard</h1>
                <p>Hello, {userRole.toUpperCase()}. Manage exchanges and sales user stock accounts.</p>
            </header>

            <nav className="pos-tabs">
                {/* Tab 1: Sales User Stock Management (Existing) */}
                <button
                    className={`tab-btns ${activeTab === 'stockManagement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stockManagement')}
                >
                    <FaArrowLeft className="tab-icon" /> Sales Stock Accounts
                </button>

                {/* Tab 2: Exchange Approval Queue (New Feature) */}
                <button
                    className={`tab-btns ${activeTab === 'exchangeQueue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('exchangeQueue')}
                >
                    <FaRedo className="tab-icon" /> Exchange Approval Queue
                </button>

                {/* Tab 3: Allocation History (NEW) */}
                <button
                    className={`tab-btns ${activeTab === 'allocationHistory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('allocationHistory')}
                >
                    <FaHistory className="tab-icon" /> Allocation History
                </button>
            </nav>

            <main className="tab-content">
                {/* Content Rendering */}
                {activeTab === 'stockManagement' && <SalesUserStockManagement />}
                {activeTab === 'exchangeQueue' && <ManagerExchangeApprovalQueue />}
                {activeTab === 'allocationHistory' && <AllocationHistoryPage />} {/* ✨ NEW LINE */}
            </main>
        </div>
    );
};

export default SalesManagementDashboard;