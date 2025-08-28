import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaMoneyBillWave, FaCreditCard, FaUser, FaCalendarAlt, FaUpload, FaTimesCircle, FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/forms.css'; // Reusing forms.css for general styling
import '../styles/pos.css'; // Assuming this file contains the custom tab styling
import CustomerCreditManagement from './CustomerCreditManagement';
import AllPayments from './AllPayments';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const CreditDashboard = () => {
    const [activeTab, setActiveTab] = useState('creditManagement');
        // const [activeTab, setActiveTab] = useState('reportPage');
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
            <h1 className="pos-dashboard-header">Credit & Payments Dashboard</h1>
            <div className="tab-container">
                <button
                    className={`tab-btn ${activeTab === 'creditManagement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('creditManagement')}
                >
                    Credit Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'allPayments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('allPayments')}
                >
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
