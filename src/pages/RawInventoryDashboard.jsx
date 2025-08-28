import React, { useState } from 'react';
import RawMaterialManagement from './RawMaterialManagement'; // Make sure the path is correct
import MaterialTransactions from './MaterialTransactions'; // Make sure the path is correct
import '../styles/forms.css'; // Re-using existing CSS for general styling
import '../styles/pos.css'; // Assuming you have shared styles for tabs

const RawInventoryDashboard = () => {
    const [activeTab, setActiveTab] = useState('rawMaterials');

    // This component will be used as the main page for inventory.
    // We don't need auth checks here if they are handled by a parent route.
    // If not, you might add them back in, similar to your POSDashboard.

    return (
        <div className="pos-dashboard-container">
            <h1 className="pos-dashboard-header">Inventory Dashboard</h1>
            <div className="tab-container">
                <button
                    className={`tab-btn ${activeTab === 'rawMaterials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rawMaterials')}
                >
                    Raw Material Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
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