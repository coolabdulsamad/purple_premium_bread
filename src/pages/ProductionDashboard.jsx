// src/pages/ProductionDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ProductionLogForm from './ProductionLogForm';
import ProductionHistory from './ProductionHistory';
import ProductionAnalytics from './ProductionAnalytics';

// Icons for the tabs
import { ClipboardList, History, BarChart3 } from 'lucide-react';

// Styles + Toast container here so child forms can show toasts
import '../assets/styles/production.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const ProductionDashboard = () => {
  const [activeTab, setActiveTab] = useState('log');
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const canViewAnalytics = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="production-dashboard-container">
      {/* Toast container (theme + position) */}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        newestOnTop
        pauseOnHover
        draggable
        closeOnClick
      />

      {/* Header (styled like POS header) */}
      <div className="production-dashboard-header">
        <h1 className="production-title">Production Management</h1>
        <p className="production-subtitle">Log, review, and analyze daily production</p>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button
          className={`tab-btns ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
          aria-current={activeTab === 'log' ? 'page' : undefined}
        >
          <ClipboardList size={18} />
          <span>Log Production</span>
        </button>

        <button
          className={`tab-btns ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          aria-current={activeTab === 'history' ? 'page' : undefined}
        >
          <History size={18} />
          <span>Production History</span>
        </button>

        {canViewAnalytics && (
          <button
            className={`tab-btns ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'log' && <ProductionLogForm />}
        {activeTab === 'history' && <ProductionHistory />}
        {activeTab === 'analytics' && canViewAnalytics && <ProductionAnalytics />}
      </div>
    </div>
  );
};

export default ProductionDashboard;
