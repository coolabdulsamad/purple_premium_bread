// src/pages/RiderSalesPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FiEye,
    FiPrinter,
    FiX,
    FiSearch,
    FiCalendar,
    FiDollarSign,
    FiList,
    FiUser,
    FiGift,
    FiPackage,
    FiFileText,
    FiCreditCard,
    FiShoppingCart,
    FiImage,
    FiExternalLink,
    FiTrendingUp,
    FiFilter,
    FiHash,
    FiArrowLeft,
    FiDownload,
    FiMonitor
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosInstance';
import '../assets/styles/RiderSalesPage.css';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const RiderSalesPage = () => {
    const { riderId } = useParams();
    const navigate = useNavigate();
    const { user, userRole, token } = useAuth();
    
    const [rider, setRider] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [status, setStatus] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [saleDetails, setSaleDetails] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptImageUrl, setReceiptImageUrl] = useState('');

    useEffect(() => {
        if (riderId) {
            fetchRiderDetails();
            fetchRiderSales();
        }
    }, [riderId, search, startDate, endDate, paymentMethod, status]);

    const fetchRiderDetails = async () => {
        try {
            // Use the authenticated api instance
            const response = await api.get(`/riders/${riderId}`);
            setRider(response.data);
        } catch (err) {
            console.error('Error fetching rider details:', err);
            toast.error('Failed to load rider details');
            setError('Failed to load rider details');
        }
    };

    const fetchRiderSales = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (paymentMethod) params.append('paymentMethod', paymentMethod);
            if (status) params.append('status', status);
            
            // Use the authenticated api instance
            const response = await api.get(`/sales/rider/${riderId}?${params.toString()}`);
            setSales(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching rider sales:', err);
            setError('Failed to fetch rider sales');
            toast.error('Failed to load sales history');
        } finally {
            setLoading(false);
        }
    };

    const fetchSaleDetails = async (saleId) => {
        try {
            // Use the authenticated api instance
            const response = await api.get(`/sales/details/${saleId}`);
            setSaleDetails(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            console.error('Error fetching sale details:', err);
            toast.error('Failed to fetch sale details');
        }
    };

    const handleViewReceipt = (imageUrl) => {
        if (imageUrl) {
            setReceiptImageUrl(imageUrl);
            setShowReceiptModal(true);
        } else {
            toast.error('No receipt image available');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        setPaymentMethod('');
        setStatus('');
    };

    const getActiveFilterCount = () => {
        const filters = [search, startDate, endDate, paymentMethod, status];
        return filters.filter(filter => filter !== '').length;
    };

    const formatCurrency = (amount) => {
        return `₦${parseFloat(amount || 0).toFixed(2)}`;
    };

    const handleExportCSV = () => {
        if (sales.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Date', 'Sale ID', 'Total Amount', 'Payment Method', 'Status', 'Balance Due', 'Items Count'];
        const csvData = sales.map(sale => [
            format(new Date(sale.created_at), 'yyyy-MM-dd HH:mm'),
            sale.id,
            sale.total_amount,
            sale.payment_method,
            sale.status,
            sale.balance_due || 0,
            sale.items?.length || 0
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rider_${rider?.fullname || riderId}_sales_${format(new Date(), 'yyyyMMdd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Export started');
    };

    if (loading && !rider) {
        return (
            <div className="rs-loading">
                <div className="rs-spinner"></div>
                <div>Loading rider sales...</div>
            </div>
        );
    }

    return (
        <div className="rs-page">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="rs-header">
                <button className="rs-back-btn" onClick={() => navigate('/riders')}>
                    <FiArrowLeft />
                    Back to Riders
                </button>
                <div className="rs-header-content">
                    <div className="rs-title-wrapper">
                        <FiMonitor className="rs-title-icon" />
                        <div>
                            <h1 className="rs-title">Rider Sales History</h1>
                            {rider && (
                                <p className="rs-subtitle">
                                    Viewing sales for <strong>{rider.fullname}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rs-header-actions">
                        <button 
                            className={`rs-btn rs-btn--outline ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiFilter />
                            Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                        </button>
                        <button 
                            className="rs-btn rs-btn--primary"
                            onClick={handleExportCSV}
                            disabled={sales.length === 0}
                        >
                            <FiDownload />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Rider Summary Cards */}
            {rider && (
                <div className="rs-summary-cards">
                    <div className="rs-summary-card">
                        <div className="rs-summary-icon" style={{ background: '#f3e5f5', color: '#7B1FA2' }}>
                            <FiUser />
                        </div>
                        <div className="rs-summary-content">
                            <span className="rs-summary-label">Rider Name</span>
                            <span className="rs-summary-value">{rider.fullname}</span>
                        </div>
                    </div>
                    <div className="rs-summary-card">
                        <div className="rs-summary-icon" style={{ background: '#fff3e0', color: '#e65100' }}>
                            <FiDollarSign />
                        </div>
                        <div className="rs-summary-content">
                            <span className="rs-summary-label">Credit Limit</span>
                            <span className="rs-summary-value">{formatCurrency(rider.credit_limit)}</span>
                        </div>
                    </div>
                    <div className="rs-summary-card">
                        <div className="rs-summary-icon" style={{ background: '#ffebee', color: '#c62828' }}>
                            <FiCreditCard />
                        </div>
                        <div className="rs-summary-content">
                            <span className="rs-summary-label">Current Balance</span>
                            <span className="rs-summary-value">{formatCurrency(rider.current_balance)}</span>
                        </div>
                    </div>
                    <div className="rs-summary-card">
                        <div className="rs-summary-icon" style={{ background: '#e8f5e8', color: '#2e7d32' }}>
                            <FiShoppingCart />
                        </div>
                        <div className="rs-summary-content">
                            <span className="rs-summary-label">Total Sales</span>
                            <span className="rs-summary-value">{sales.length}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="rs-error">
                    <FiX />
                    <p>{error}</p>
                    <button className="rs-btn rs-btn--primary" onClick={fetchRiderSales}>
                        Try Again
                    </button>
                </div>
            )}

            {/* Filters */}
            {showFilters && (
                <div className="rs-card">
                    <div className="rs-card__header">
                        <div className="rs-card__title">
                            <FiSearch />
                            Filter Sales
                        </div>
                        <button className="rs-btn rs-btn--ghost rs-btn--small" onClick={clearFilters}>
                            <FiX /> Clear All
                        </button>
                    </div>
                    <div className="rs-card__body">
                        <div className="rs-filters-grid">
                            <div className="rs-field">
                                <label className="rs-label">Search</label>
                                <input
                                    type="text"
                                    placeholder="Search by items or notes..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="rs-input"
                                />
                            </div>
                            <div className="rs-field">
                                <label className="rs-label">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rs-input"
                                />
                            </div>
                            <div className="rs-field">
                                <label className="rs-label">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rs-input"
                                />
                            </div>
                            <div className="rs-field">
                                <label className="rs-label">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="rs-input"
                                >
                                    <option value="">All Methods</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Credit">Credit</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="rs-field">
                                <label className="rs-label">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="rs-input"
                                >
                                    <option value="">All Status</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Partially Paid">Partially Paid</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales Table */}
            {loading ? (
                <div className="rs-loading">
                    <div className="rs-spinner"></div>
                    <div>Loading sales...</div>
                </div>
            ) : sales.length === 0 ? (
                <div className="rs-empty">
                    <FiShoppingCart className="rs-empty-icon" />
                    <h3>No Sales Found</h3>
                    <p>No sales transactions found for this rider.</p>
                    {rider && (
                        <button 
                            className="rs-btn rs-btn--primary"
                            onClick={() => navigate('/sales/new')}
                        >
                            Create New Sale for {rider.fullname}
                        </button>
                    )}
                </div>
            ) : (
                <div className="rs-card">
                    <div className="rs-card__header">
                        <div className="rs-card__title">
                            <FiList />
                            Sales Transactions
                            <span className="rs-badge rs-badge--primary">{sales.length} transactions</span>
                        </div>
                    </div>
                    <div className="rs-card__body">
                        <div className="rs-table-container">
                            <table className="rs-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Sale ID</th>
                                        <th>Items</th>
                                        <th>Payment Method</th>
                                        <th>Status</th>
                                        <th className="rs-text-right">Total</th>
                                        <th className="rs-text-right">Balance Due</th>
                                        <th>Receipt</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => (
                                        <tr key={sale.id}>
                                            <td className="rs-date">
                                                {format(new Date(sale.created_at), 'MMM d, yyyy h:mm a')}
                                            </td>
                                            <td className="rs-mono">#{sale.id}</td>
                                            <td>
                                                <div className="rs-items-preview">
                                                    {sale.items && sale.items.length > 0 ? (
                                                        <>
                                                            <span className="rs-items-count">
                                                                {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                                                            </span>
                                                            <div className="rs-items-tooltip">
                                                                {sale.items.map((item, idx) => (
                                                                    <div key={idx} className="rs-tooltip-item">
                                                                        {item.product_name} x{item.quantity}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="rs-badge rs-badge--secondary">
                                                    {sale.payment_method}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`rs-status rs-status--${sale.status?.toLowerCase().replace(' ', '-')}`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                            <td className="rs-text-right rs-amount">
                                                {formatCurrency(sale.total_amount)}
                                            </td>
                                            <td className={`rs-text-right rs-amount ${sale.balance_due > 0 ? 'rs-text-danger' : 'rs-text-success'}`}>
                                                {formatCurrency(sale.balance_due || 0)}
                                            </td>
                                            <td>
                                                {sale.payment_image_url ? (
                                                    <button
                                                        className="rs-action-btn rs-action-btn--info"
                                                        onClick={() => handleViewReceipt(sale.payment_image_url)}
                                                        title="View Receipt"
                                                    >
                                                        <FiImage />
                                                    </button>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <button
                                                    className="rs-action-btn rs-action-btn--primary"
                                                    onClick={() => fetchSaleDetails(sale.id)}
                                                    title="View Details"
                                                >
                                                    <FiEye />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Sale Details Modal */}
            {showDetailsModal && saleDetails && (
                <div className="rs-modal">
                    <div className="rs-modal__content">
                        <div className="rs-modal__header">
                            <h3>Sale Details - #{saleDetails.id}</h3>
                            <button className="rs-modal__close" onClick={() => setShowDetailsModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="rs-modal__body">
                            {/* Sale Overview */}
                            <div className="rs-details-section">
                                <h4>Transaction Overview</h4>
                                <div className="rs-details-grid">
                                    <div className="rs-detail-item">
                                        <span className="rs-detail-label">Date:</span>
                                        <span>{format(new Date(saleDetails.created_at), 'MMMM dd, yyyy hh:mm a')}</span>
                                    </div>
                                    <div className="rs-detail-item">
                                        <span className="rs-detail-label">Cashier:</span>
                                        <span>{saleDetails.cashier_name || 'N/A'}</span>
                                    </div>
                                    <div className="rs-detail-item">
                                        <span className="rs-detail-label">Payment Method:</span>
                                        <span>{saleDetails.payment_method}</span>
                                    </div>
                                    <div className="rs-detail-item">
                                        <span className="rs-detail-label">Status:</span>
                                        <span className={`rs-status rs-status--${saleDetails.status?.toLowerCase().replace(' ', '-')}`}>
                                            {saleDetails.status}
                                        </span>
                                    </div>
                                    {saleDetails.payment_reference && (
                                        <div className="rs-detail-item">
                                            <span className="rs-detail-label">Reference:</span>
                                            <span className="rs-mono">{saleDetails.payment_reference}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items Sold */}
                            <div className="rs-details-section">
                                <h4>Items Sold</h4>
                                <table className="rs-details-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th className="rs-text-right">Unit Price</th>
                                            {saleDetails.is_advantage_sale && <th className="rs-text-right">Advantage</th>}
                                            <th className="rs-text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleDetails.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product_name}</td>
                                                <td>{item.quantity}</td>
                                                <td className="rs-text-right">{formatCurrency(item.price_at_sale)}</td>
                                                {saleDetails.is_advantage_sale && (
                                                    <td className="rs-text-right">
                                                        {item.advantage_amount > 0 ? formatCurrency(item.advantage_amount) : '-'}
                                                    </td>
                                                )}
                                                <td className="rs-text-right">
                                                    {formatCurrency(item.price_at_sale * item.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Payment Summary */}
                            <div className="rs-details-section">
                                <h4>Payment Summary</h4>
                                <div className="rs-payment-summary">
                                    <div className="rs-payment-row">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(saleDetails.subtotal)}</span>
                                    </div>
                                    {saleDetails.discount_amount > 0 && (
                                        <div className="rs-payment-row rs-payment-discount">
                                            <span>Discount:</span>
                                            <span>-{formatCurrency(saleDetails.discount_amount)}</span>
                                        </div>
                                    )}
                                    <div className="rs-payment-row">
                                        <span>Tax:</span>
                                        <span>{formatCurrency(saleDetails.tax_amount)}</span>
                                    </div>
                                    <div className="rs-payment-row rs-payment-total">
                                        <span>Grand Total:</span>
                                        <span>{formatCurrency(saleDetails.total_amount)}</span>
                                    </div>
                                    {saleDetails.payment_method === 'Credit' && (
                                        <>
                                            <div className="rs-payment-row">
                                                <span>Amount Paid:</span>
                                                <span>{formatCurrency(saleDetails.amount_paid)}</span>
                                            </div>
                                            <div className="rs-payment-row rs-payment-balance">
                                                <span>Balance Due:</span>
                                                <span className="rs-text-danger">{formatCurrency(saleDetails.balance_due)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Free Stock if any */}
                            {saleDetails.free_stock_items?.length > 0 && (
                                <div className="rs-details-section">
                                    <h4>Free Stock Given</h4>
                                    <table className="rs-details-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {saleDetails.free_stock_items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.product_name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{item.reason || 'Incentive'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Receipt Image if any */}
                            {saleDetails.payment_image_url && (
                                <div className="rs-details-section">
                                    <h4>Receipt Proof</h4>
                                    <button
                                        className="rs-btn rs-btn--outline"
                                        onClick={() => handleViewReceipt(saleDetails.payment_image_url)}
                                    >
                                        <FiImage /> View Receipt
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="rs-modal__footer">
                            <button className="rs-btn rs-btn--ghost" onClick={() => setShowDetailsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Image Modal */}
            {showReceiptModal && (
                <div className="rs-modal">
                    <div className="rs-modal__content rs-modal__content--lg">
                        <div className="rs-modal__header">
                            <h3>Receipt Image</h3>
                            <button className="rs-modal__close" onClick={() => setShowReceiptModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="rs-modal__body">
                            <img src={receiptImageUrl} alt="Receipt" className="rs-receipt-image" />
                        </div>
                        <div className="rs-modal__footer">
                            <a 
                                href={receiptImageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="rs-btn rs-btn--primary"
                            >
                                <FiExternalLink /> Open in New Tab
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiderSalesPage;