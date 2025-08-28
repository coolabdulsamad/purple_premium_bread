// src/pages/POSDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/pos.css';
import ReportsPage from './ReportsPage';
import AnalysisPage from './AnalysisPage';

const ReportDashboard = () => {
    const [activeTab, setActiveTab] = useState('reportPage');
    const { isAuthenticated, userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) return null;

        return (
        <div className="pos-dashboard-container">
            <h1 className="pos-dashboard-header">Reports & Analysis Dashboard</h1>
            <div className="tab-container">
                <button
                    className={`tab-btn ${activeTab === 'reportPage' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reportPage')}
                >
                    Reports
                </button>
                <button
                    className={`tab-btn ${activeTab === 'analysisPage' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysisPage')}
                >
                    Analysis
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'reportPage' && <ReportsPage />}
                {activeTab === 'analysisPage' && <AnalysisPage />}
            </div>
        </div>
    );
};

export default ReportDashboard;