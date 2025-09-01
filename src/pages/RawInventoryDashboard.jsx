import React, { useState } from 'react';
import RawMaterialManagement from './RawMaterialManagement';
import MaterialTransactions from './MaterialTransactions';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaBoxes, FaExchangeAlt, FaWarehouse } from 'react-icons/fa';
import '../assets/styles/raw-inventory.css';
import CustomToast from '../components/CustomToast';

const RawInventoryDashboard = () => {
    const [activeTab, setActiveTab] = useState('rawMaterials');

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        // toast.info(`Switched to ${tabName === 'rawMaterials' ? 'Raw Materials' : 'Transactions'} tab`);
        toast(<CustomToast id="tab-switched" type="info" message={`Switched to ${tabName === 'rawMaterials' ? 'Raw Materials' : 'Transactions'} tab`} />);
    };

    return (
        <div className="raw-inventory-dashboard">
            {/* <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            /> */}
            
            <div className="dashboard-header">
                <div className="header-content">
                    <FaWarehouse className="header-icon" />
                    <h1>Raw Inventory Dashboard</h1>
                    <p>Manage raw materials and track transactions</p>
                </div>
            </div>

            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'rawMaterials' ? 'active' : ''}`}
                    onClick={() => handleTabChange('rawMaterials')}
                >
                    <FaBoxes className="tab-icon" />
                    Raw Material Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => handleTabChange('transactions')}
                >
                    <FaExchangeAlt className="tab-icon" />
                    Material Transactions
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'rawMaterials' && <RawMaterialManagement />}
                {activeTab === 'transactions' && <MaterialTransactions />}
            </div>
        </div>
    );
};

export default RawInventoryDashboard;