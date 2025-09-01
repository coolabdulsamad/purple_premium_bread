// src/pages/POSDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import InventoryPage from './InventoryPage';
import NewSalePage from './NewSalePage';
import SalesOutPage from './SalesOutPage';
import CustomersPage from './CustomersPage';
import { FaCashRegister, FaTruck, FaBoxes, FaUsers } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/pos.css';

const POSDashboard = () => {
    const [activeTab, setActiveTab] = useState('newSale');
    const { isAuthenticated, userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error("You must be logged in to access POS");
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) return null;

    const canViewInventory = ['admin', 'manager', 'baker'].includes(userRole);
    const canManageSales = ['admin', 'manager', 'sales'].includes(userRole);
    const canViewCustomers = ['admin', 'manager'].includes(userRole);

    return (
        <div className="pos-dashboard">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

            <header className="pos-header">
                <h1>🍞 Purple Premium Bread POS</h1>
            </header>

            <nav className="pos-tabs">
                {canManageSales && (
                    <button
                        className={`tab-btn ${activeTab === 'newSale' ? 'active' : ''}`}
                        onClick={() => setActiveTab('newSale')}
                    >
                        <FaCashRegister className="tab-icon" /> New Sale
                    </button>
                )}
                {canManageSales && (
                    <button
                        className={`tab-btn ${activeTab === 'salesOut' ? 'active' : ''}`}
                        onClick={() => setActiveTab('salesOut')}
                    >
                        <FaTruck className="tab-icon" /> Sales Out
                    </button>
                )}
                {canViewInventory && (
                    <button
                        className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        <FaBoxes className="tab-icon" /> Inventory
                    </button>
                )}
                {canViewCustomers && (
                    <button
                        className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        <FaUsers className="tab-icon" /> Customers
                    </button>
                )}
            </nav>

            <main className="tab-content">
                {activeTab === 'newSale' && <NewSalePage />}
                {activeTab === 'salesOut' && <SalesOutPage />}
                {activeTab === 'inventory' && canViewInventory && <InventoryPage />}
                {activeTab === 'customers' && canViewCustomers && <CustomersPage />}
            </main>
        </div>
    );
};

export default POSDashboard;
