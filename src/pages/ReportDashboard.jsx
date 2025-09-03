// src/pages/ReportDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../assets/styles/pos.css';
import '../assets/styles/reports.css';
import ReportsPage from './ReportsPage';
import AnalysisPage from './AnalysisPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ASSETS } from '../assets';

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
        <div className="report-dashboard-container">
            <div className="dashboard-header">
                <h2 className="dashboard-title">
                    <span className="icon-wrapper">
                        {/* <i className="fas fa-chart-line"></i> */}
                        <img src={ASSETS['logo']} alt="" srcset="" />
                    </span>
                    Reports & Analytics Center
                </h2>
                <p className="dashboard-subtitle">Comprehensive financial insights and performance metrics</p>
            </div>
            
            <div className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 'reportPage' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reportPage')}
                >
                    <i className="fas fa-file-alt"></i>
                    Financial Reports
                </button>
                <button
                    className={`tab-button ${activeTab === 'analysisPage' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysisPage')}
                >
                    <i className="fas fa-chart-pie"></i>
                    Data Analysis
                </button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'reportPage' && <ReportsPage />}
                {activeTab === 'analysisPage' && <AnalysisPage />}
            </div>
            
            <ToastContainer
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
            />
        </div>
    );
};

export default ReportDashboard;