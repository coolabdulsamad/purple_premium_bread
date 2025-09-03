import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaMoneyBillWave, FaCreditCard, FaUser, FaCalendarAlt, FaUpload, FaTimesCircle, FaSearch, FaTimes, FaChartLine, FaHandHoldingUsd, FaReceipt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomerCreditManagement from './CustomerCreditManagement';
import AllPayments from './AllPayments';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/credit-dashboard.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const CreditDashboard = () => {
    const [activeTab, setActiveTab] = useState('creditManagement');
    const { isAuthenticated, userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        // toast.info(`Switched to ${tabName === 'creditManagement' ? 'Credit Management' : 'All Payments'} tab`);
        // toast(<CustomToast id="123" type="info" message={`Switched to ${tabName === 'creditManagement' ? 'Credit Management' : 'All Payments'} tab`} />);
        toast(<CustomToast id={`info-switch-${Date.now()}`} type="info" message={`Switched to ${tabName === 'creditManagement' ? 'Credit Management' : 'All Payments'} tab`} />, {
            toastId: 'switch-info'
        });
    };

    if (!isAuthenticated) return null;

    return (
        <div className="credit-dashboard-container">
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

            <div className="dashboard-header">
                <div className="header-content">
                    <FaHandHoldingUsd className="header-icon" />
                    <h1>Credit & Payments Dashboard</h1>
                    <p>Manage customer credits and track payment transactions</p>
                </div>
            </div>

            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'creditManagement' ? 'active' : ''}`}
                    onClick={() => handleTabChange('creditManagement')}
                >
                    <FaUser className="tab-icon" />
                    Credit Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'allPayments' ? 'active' : ''}`}
                    onClick={() => handleTabChange('allPayments')}
                >
                    <FaReceipt className="tab-icon" />
                    All Payments
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'creditManagement' && <CustomerCreditManagement />}
                {activeTab === 'allPayments' && <AllPayments />}
            </div>
        </div>
    );
};

export default CreditDashboard;