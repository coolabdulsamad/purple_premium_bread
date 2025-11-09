// SalesHistoryPage.jsx - Enhanced with Complete Details Dialog
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEye, FiPrinter, FiX, FiSearch, FiCalendar, FiDollarSign, FiList, FiUser, FiGift, FiPackage, FiFileText, FiCreditCard, FiShoppingCart } from 'react-icons/fi';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import '../assets/styles/SalesHistoryPage.css';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [transactionType, setTransactionType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [status, setStatus] = useState('');
    const [stockSource, setStockSource] = useState('');
    const [hasFreeStock, setHasFreeStock] = useState('');
    const [discountRange, setDiscountRange] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [saleDetails, setSaleDetails] = useState(null);
    const [companyDetails, setCompanyDetails] = useState({});
    const [users, setUsers] = useState([]);
    const [printLoading, setPrintLoading] = useState(false);

    const fetchSales = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { 
                search, 
                startDate, 
                endDate, 
                transactionType, 
                paymentMethod, 
                status,
                stockSource,
                hasFreeStock,
                discountRange
            };
            const response = await axios.get(`${API_BASE_URL}/sales`, { params });
            setSales(response.data);
        } catch (err) {
            setError('Failed to fetch sales history.');
            console.error('Sales fetch error:', err.response?.data || err.message);
            toast.error('Failed to fetch sales history.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users`);
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchSaleDetails = async (saleId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sales/details/${saleId}`);
            setSaleDetails(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            console.error('Sale details fetch error:', err.response?.data || err.message);
            toast.error('Failed to fetch sale details.');
        }
    };

    const fetchCompanyDetails = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/company`);
            setCompanyDetails(response.data);
        } catch (err) {
            console.error('Company details fetch error:', err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchCompanyDetails();
        fetchUsers();
        fetchSales();
    }, [search, startDate, endDate, transactionType, paymentMethod, status, stockSource, hasFreeStock, discountRange]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSales();
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.fullname || user.username : `User ${userId}`;
    };

    const getStockSourceBadge = (sale) => {
        if (sale.stock_source === 'user_stock' && sale.stock_source_user_id) {
            return <span className="sh-badge sh-badge--info" title={`Allocated to: ${getUserName(sale.stock_source_user_id)}`}>User Stock</span>;
        }
        return <span className="sh-badge sh-badge--secondary">Main Inventory</span>;
    };

    const handlePrintReceipt = async () => {
        if (!saleDetails) return;
        
        setPrintLoading(true);
        try {
            const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Receipt - Transaction #${saleDetails.id}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            font-size: 14px; 
                            margin: 20px; 
                            line-height: 1.4;
                        }
                        .receipt-header { 
                            text-align: center; 
                            border-bottom: 2px solid #5a2d82; 
                            padding-bottom: 15px; 
                            margin-bottom: 20px;
                        }
                        .receipt-header h1 { 
                            color: #5a2d82; 
                            margin: 0 0 10px 0;
                            font-size: 24px;
                        }
                        .receipt-section { 
                            margin-bottom: 20px; 
                            padding: 15px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                        }
                        .receipt-section h3 { 
                            color: #5a2d82; 
                            margin-bottom: 10px;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                        }
                        .detail-grid { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 10px; 
                        }
                        .detail-item { 
                            margin-bottom: 8px; 
                        }
                        .detail-label { 
                            font-weight: bold; 
                            color: #555;
                        }
                        .table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 15px 0;
                        }
                        .table th, .table td { 
                            border: 1px solid #ddd; 
                            padding: 10px; 
                            text-align: left;
                        }
                        .table th { 
                            background-color: #f8f9fa; 
                            font-weight: bold;
                        }
                        .totals { 
                            text-align: right; 
                            margin-top: 20px;
                            font-size: 16px;
                        }
                        .grand-total { 
                            font-size: 18px; 
                            font-weight: bold; 
                            color: #5a2d82;
                            border-top: 2px solid #5a2d82;
                            padding-top: 10px;
                        }
                        .free-stock { 
                            background-color: #f0fff0; 
                            border-left: 4px solid #66BB6A;
                            padding: 10px;
                            margin: 10px 0;
                        }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .mono { font-family: 'Courier New', monospace; }
                        @media print {
                            body { margin: 0; font-size: 12px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-header">
                        <h1>${companyDetails.name || 'Purple Premium Bread & Pastries'}</h1>
                        <p>${companyDetails.address || '123 Bakery Lane, Lekki, Lagos'}</p>
                        <p>${companyDetails.phone_number || '+234 801 234 5678'} | ${companyDetails.email || 'info@purplebread.com'}</p>
                        <p><strong>RECEIPT</strong></p>
                    </div>

                    <div class="receipt-section">
                        <h3>Transaction Details</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Receipt ID:</span> ${saleDetails.id}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Date:</span> ${format(new Date(saleDetails.created_at), 'MMM dd, yyyy hh:mm:ss a')}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Cashier:</span> ${saleDetails.cashier_name || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Transaction Type:</span> ${saleDetails.transaction_type}
                            </div>
                            ${saleDetails.transaction_type === 'Retail' && saleDetails.customer_name ? `
                            <div class="detail-item">
                                <span class="detail-label">Customer:</span> ${saleDetails.customer_name}
                            </div>
                            ` : ''}
                            ${saleDetails.transaction_type === 'B2B' && saleDetails.branch_name ? `
                            <div class="detail-item">
                                <span class="detail-label">Branch:</span> ${saleDetails.branch_name}
                            </div>
                            ` : ''}
                            <div class="detail-item">
                                <span class="detail-label">Payment Method:</span> ${saleDetails.payment_method}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Stock Source:</span> ${saleDetails.stock_source === 'user_stock' ? 'User Allocated Stock' : 'Main Inventory'}
                            </div>
                            ${saleDetails.stock_source_user_id ? `
                            <div class="detail-item">
                                <span class="detail-label">Stock Allocated To:</span> ${getUserName(saleDetails.stock_source_user_id)}
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="receipt-section">
                        <h3>Items Sold</h3>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Discount %</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${saleDetails.items.map(item => `
                                    <tr>
                                        <td>${item.product_name}</td>
                                        <td>${item.quantity}</td>
                                        <td>₦${parseFloat(item.price_at_sale).toFixed(2)}</td>
                                        <td>${item.discount_applied > 0 ? `${item.discount_applied}%` : '-'}</td>
                                        <td class="text-right">₦${(parseFloat(item.price_at_sale) * item.quantity * (1 - (item.discount_applied || 0) / 100)).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    ${saleDetails.free_stock_items && saleDetails.free_stock_items.length > 0 ? `
                    <div class="receipt-section">
                        <h3>Free Stock / Incentive Given</h3>
                        <div class="free-stock">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Free Quantity</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${saleDetails.free_stock_items.map(freeItem => `
                                        <tr>
                                            <td>${freeItem.product_name}</td>
                                            <td>${freeItem.quantity}</td>
                                            <td>${freeItem.reason || 'Incentive'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : ''}

                    <div class="receipt-section">
                        <h3>Payment Summary</h3>
                        <div class="totals">
                            <div class="detail-item">
                                <span class="detail-label">Subtotal:</span> ₦${parseFloat(saleDetails.subtotal || 0).toFixed(2)}
                            </div>
                            ${saleDetails.discount_amount > 0 ? `
                            <div class="detail-item">
                                <span class="detail-label">Discount:</span> -₦${parseFloat(saleDetails.discount_amount).toFixed(2)}
                            </div>
                            ` : ''}
                            <div class="detail-item">
                                <span class="detail-label">Tax:</span> ₦${parseFloat(saleDetails.tax_amount || 0).toFixed(2)}
                            </div>
                            <div class="detail-item grand-total">
                                <span class="detail-label">GRAND TOTAL:</span> ₦${parseFloat(saleDetails.total_amount).toFixed(2)}
                            </div>
                            
                            ${saleDetails.payment_method === 'Credit' ? `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                                <div class="detail-item">
                                    <span class="detail-label">Amount Paid:</span> ₦${parseFloat(saleDetails.amount_paid || 0).toFixed(2)}
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Balance Due:</span> ₦${parseFloat(saleDetails.balance_due || 0).toFixed(2)}
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Due Date:</span> ${saleDetails.due_date ? format(new Date(saleDetails.due_date), 'MMM dd, yyyy') : 'N/A'}
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Status:</span> ${saleDetails.status}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    ${saleDetails.note ? `
                    <div class="receipt-section">
                        <h3>Additional Notes</h3>
                        <p>${saleDetails.note}</p>
                    </div>
                    ` : ''}

                    <div class="text-center" style="margin-top: 30px; color: #666; font-size: 12px;">
                        <p>Thank you for your business!</p>
                        <p>Generated on ${format(new Date(), 'MMM dd, yyyy hh:mm a')}</p>
                    </div>

                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #5a2d82; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();
            toast.success('Receipt opened in new window for printing.');
            
        } catch (error) {
            console.error('Print error:', error);
            toast.error('Failed to generate receipt.');
        } finally {
            setPrintLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSaleDetails(null);
    };

    const clearFilters = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        setTransactionType('');
        setPaymentMethod('');
        setStatus('');
        setStockSource('');
        setHasFreeStock('');
        setDiscountRange('');
    };

    return (
        <div className="sh-page">
            <Toaster position="top-right" />
            
            {/* Header Section */}
            <div className="sh-header">
                <div className="sh-header-content">
                    <h1 className="sh-title">
                        <FiShoppingCart className="sh-title-icon" />
                        Sales History
                    </h1>
                    <p className="sh-subtitle">
                        Track and manage all sales transactions with complete details
                    </p>
                </div>
            </div>

            {error && <div className="sh-error">{error}</div>}

            {/* Filter Form */}
            <div className="sh-card">
                <div className="sh-card__header">
                    <div className="sh-card__title">
                        <FiSearch />
                        Search & Filters
                    </div>
                </div>
                <div className="sh-card__body">
                    <form onSubmit={handleSearch} className="sh-filters-form">
                        <div className="sh-filters-grid">
                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiSearch />
                                    Search
                                </label>
                                <div className="sh-input sh-input--icon">
                                    <FiSearch className="sh-input__icon" />
                                    <input
                                        type="text"
                                        placeholder="By customer, cashier, or note..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="sh-input__field"
                                    />
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiList />
                                    Transaction Type
                                </label>
                                <div className="sh-input">
                                    <select
                                        value={transactionType}
                                        onChange={(e) => setTransactionType(e.target.value)}
                                        className="sh-input__field"
                                    >
                                        <option value="">All Types</option>
                                        <option value="Retail">Retail</option>
                                        <option value="B2B">B2B</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiDollarSign />
                                    Payment Method
                                </label>
                                <div className="sh-input">
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="sh-input__field"
                                    >
                                        <option value="">All Methods</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="Credit">Credit</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Internal">Internal (B2B)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiList />
                                    Status
                                </label>
                                <div className="sh-input">
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="sh-input__field"
                                    >
                                        <option value="">All Status</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Partially Paid">Partially Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiPackage />
                                    Stock Source
                                </label>
                                <div className="sh-input">
                                    <select
                                        value={stockSource}
                                        onChange={(e) => setStockSource(e.target.value)}
                                        className="sh-input__field"
                                    >
                                        <option value="">All Sources</option>
                                        <option value="main_inventory">Main Inventory</option>
                                        <option value="user_stock">User Allocated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiGift />
                                    Free Stock
                                </label>
                                <div className="sh-input">
                                    <select
                                        value={hasFreeStock}
                                        onChange={(e) => setHasFreeStock(e.target.value)}
                                        className="sh-input__field"
                                    >
                                        <option value="">All Sales</option>
                                        <option value="true">With Free Stock</option>
                                        <option value="false">Without Free Stock</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiDollarSign />
                                    Discount Range
                                </label>
                                <div className="sh-input">
                                    <select
                                        value={discountRange}
                                        onChange={(e) => setDiscountRange(e.target.value)}
                                        className="sh-input__field"
                                    >
                                        <option value="">Any Discount</option>
                                        <option value="none">No Discount</option>
                                        <option value="small">Small (₦0 - ₦500)</option>
                                        <option value="medium">Medium (₦501 - ₦2000)</option>
                                        <option value="large">Large (₦2001+)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiCalendar />
                                    Start Date
                                </label>
                                <div className="sh-input">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="sh-input__field"
                                    />
                                </div>
                            </div>

                            <div className="sh-field">
                                <label className="sh-label">
                                    <FiCalendar />
                                    End Date
                                </label>
                                <div className="sh-input">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="sh-input__field"
                                    />
                                </div>
                            </div>

                            <div className="sh-field sh-field--actions">
                                <button 
                                    type="submit" 
                                    className="sh-btn sh-btn--primary"
                                >
                                    Apply Filters
                                </button>
                                <button 
                                    type="button"
                                    className="sh-btn sh-btn--ghost"
                                    onClick={clearFilters}
                                >
                                    <FiX />
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Sales Table */}
            {loading ? (
                <div className="sh-loading">
                    <div className="sh-spinner"></div>
                    <div className="sh-loading-text">Loading sales history...</div>
                </div>
            ) : sales.length === 0 ? (
                <div className="sh-empty-state">
                    <FiShoppingCart className="sh-empty-icon" />
                    <h3>No Sales Found</h3>
                    <p>No sales transactions found for the selected criteria.</p>
                </div>
            ) : (
                <div className="sh-card">
                    <div className="sh-card__header">
                        <div className="sh-card__title">
                            <FiFileText />
                            Sales Transactions
                        </div>
                        <span className="sh-badge sh-badge--primary">{sales.length} transactions</span>
                    </div>
                    <div className="sh-card__body">
                        <div className="sh-table-container">
                            <table className="sh-table">
                                <thead className="sh-table__head">
                                    <tr>
                                        <th className="sh-table__cell sh-table__cell--header">S/N</th>
                                        <th className="sh-table__cell sh-table__cell--header">Date</th>
                                        <th className="sh-table__cell sh-table__cell--header">Customer/Branch</th>
                                        <th className="sh-table__cell sh-table__cell--header">Type</th>
                                        <th className="sh-table__cell sh-table__cell--header">Payment</th>
                                        <th className="sh-table__cell sh-table__cell--header">Status</th>
                                        <th className="sh-table__cell sh-table__cell--header">Stock Source</th>
                                        <th className="sh-table__cell sh-table__cell--header sh-table__cell--amount">Total</th>
                                        <th className="sh-table__cell sh-table__cell--header sh-table__cell--amount">Discount</th>
                                        <th className="sh-table__cell sh-table__cell--header sh-table__cell--actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="sh-table__body">
                                    {sales.map((sale, index) => (
                                        <tr key={sale.id} className="sh-table__row">
                                            <td className="sh-table__cell sh-table__cell--number">{index + 1}</td>
                                            <td className="sh-table__cell sh-table__cell--date">
                                                {format(new Date(sale.created_at), 'MMM d, yyyy h:mm a')}
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--customer">
                                                {sale.customer_name || sale.branch_name || 'Walk-in Customer'}
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--type">
                                                {sale.transaction_type}
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--method">
                                                {sale.payment_method}
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--status">
                                                <span className={`sh-status sh-status--${sale.status?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--source">
                                                {getStockSourceBadge(sale)}
                                                {sale.has_free_stock && (
                                                    <span className="sh-free-stock-badge" title="Contains free stock/incentive">
                                                        <FiGift />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--amount">
                                                ₦{parseFloat(sale.total_amount).toFixed(2)}
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--amount">
                                                {sale.discount_amount > 0 ? `-₦${parseFloat(sale.discount_amount).toFixed(2)}` : '-'}
                                            </td>
                                            <td className="sh-table__cell sh-table__cell--actions">
                                                <button
                                                    className="sh-action-btn sh-action-btn--primary"
                                                    onClick={() => fetchSaleDetails(sale.id)}
                                                    title="View complete details"
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

            {/* Enhanced Details Modal */}
            {showDetailsModal && (
                <div className="sh-modal">
                    <div className="sh-modal__content sh-modal__content--xl">
                        <div className="sh-modal__header">
                            <h3 className="sh-modal__title">
                                <FiFileText className="sh-modal__icon" />
                                Sale Details - Transaction #{saleDetails?.id}
                            </h3>
                            <button className="sh-modal__close" onClick={closeDetailsModal}>
                                <FiX />
                            </button>
                        </div>
                        <div className="sh-modal__body">
                            {saleDetails && (
                                <div className="sh-details-grid">
{/* Transaction Overview - Updated with better spacing */}
<div className="sh-details-card">
    <div className="sh-details-card__header">
        <h5><FiShoppingCart /> Transaction Overview</h5>
    </div>
    <div className="sh-details-card__body">
        <div className="sh-details-grid--compact">
            <div className="sh-detail-item">
                <span className="sh-detail-label">Transaction ID:</span>
                <span className="sh-detail-value">#{saleDetails.id}</span>
            </div>
            <div className="sh-detail-item">
                <span className="sh-detail-label">Date & Time:</span>
                <span className="sh-detail-value">{format(new Date(saleDetails.created_at), 'MMMM dd, yyyy hh:mm:ss a')}</span>
            </div>
            <div className="sh-detail-item">
                <span className="sh-detail-label">Cashier:</span>
                <span className="sh-detail-value">{saleDetails.cashier_name || 'N/A'}</span>
            </div>
            <div className="sh-detail-item">
                <span className="sh-detail-label">Transaction Type:</span>
                <span className="sh-detail-value">{saleDetails.transaction_type}</span>
            </div>
            {saleDetails.transaction_type === 'Retail' && saleDetails.customer_name && (
                <div className="sh-detail-item">
                    <span className="sh-detail-label">Customer:</span>
                    <span className="sh-detail-value">{saleDetails.customer_name}</span>
                </div>
            )}
            {saleDetails.transaction_type === 'B2B' && saleDetails.branch_name && (
                <div className="sh-detail-item">
                    <span className="sh-detail-label">Branch:</span>
                    <span className="sh-detail-value">{saleDetails.branch_name}</span>
                </div>
            )}
            <div className="sh-detail-item">
                <span className="sh-detail-label">Payment Method:</span>
                <span className="sh-detail-value">{saleDetails.payment_method}</span>
            </div>
            <div className="sh-detail-item">
                <span className="sh-detail-label">Stock Source:</span>
                <span className="sh-detail-value">
                    <span className={`sh-badge ${saleDetails.stock_source === 'user_stock' ? 'sh-badge--info' : 'sh-badge--secondary'}`}>
                        {saleDetails.stock_source === 'user_stock' ? 'User Allocated Stock' : 'Main Inventory'}
                    </span>
                </span>
            </div>
            {saleDetails.stock_source_user_id && (
                <div className="sh-detail-item">
                    <span className="sh-detail-label">Stock Allocated To:</span>
                    <span className="sh-detail-value">{getUserName(saleDetails.stock_source_user_id)}</span>
                </div>
            )}
            {saleDetails.payment_reference && (
                <div className="sh-detail-item">
                    <span className="sh-detail-label">Payment Reference:</span>
                    <span className="sh-detail-value">{saleDetails.payment_reference}</span>
                </div>
            )}
            {saleDetails.note && (
                <div className="sh-detail-item">
                    <span className="sh-detail-label">Note:</span>
                    <span className="sh-detail-value">{saleDetails.note}</span>
                </div>
            )}
        </div>
    </div>
</div>

                                    {/* Items Sold */}
                                    <div className="sh-details-card">
                                        <div className="sh-details-card__header">
                                            <h5><FiShoppingCart /> Items Sold</h5>
                                        </div>
                                        <div className="sh-details-card__body">
                                            <div className="sh-table-container">
                                                <table className="sh-table sh-table--compact">
                                                    <thead className="sh-table__head">
                                                        <tr>
                                                            <th className="sh-table__cell sh-table__cell--header">Product Name</th>
                                                            <th className="sh-table__cell sh-table__cell--header">Quantity</th>
                                                            <th className="sh-table__cell sh-table__cell--header">Unit Price</th>
                                                            <th className="sh-table__cell sh-table__cell--header">Discount %</th>
                                                            <th className="sh-table__cell sh-table__cell--header sh-table__cell--amount">Line Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="sh-table__body">
                                                        {saleDetails.items.map((item, index) => (
                                                            <tr key={item.id} className="sh-table__row">
                                                                <td className="sh-table__cell">
                                                                    <div className="sh-product-info">
                                                                        <strong>{item.product_name}</strong>
                                                                        {item.category && (
                                                                            <div className="sh-product-category">Category: {item.category}</div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="sh-table__cell sh-table__cell--number">{item.quantity}</td>
                                                                <td className="sh-table__cell sh-table__cell--amount">₦{parseFloat(item.price_at_sale).toFixed(2)}</td>
                                                                <td className="sh-table__cell sh-table__cell--number">
                                                                    {item.discount_applied > 0 ? `${item.discount_applied}%` : '-'}
                                                                </td>
                                                                <td className="sh-table__cell sh-table__cell--amount">
                                                                    ₦{(parseFloat(item.price_at_sale) * item.quantity * (1 - (item.discount_applied || 0) / 100)).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Free Stock Section */}
                                    {saleDetails.free_stock_items && saleDetails.free_stock_items.length > 0 && (
                                        <div className="sh-details-card sh-details-card--success">
                                            <div className="sh-details-card__header">
                                                <h5><FiGift /> Free Stock / Incentive Given</h5>
                                            </div>
                                            <div className="sh-details-card__body">
                                                <div className="sh-table-container">
                                                    <table className="sh-table sh-table--compact">
                                                        <thead className="sh-table__head">
                                                            <tr>
                                                                <th className="sh-table__cell sh-table__cell--header">Product Name</th>
                                                                <th className="sh-table__cell sh-table__cell--header">Free Quantity</th>
                                                                <th className="sh-table__cell sh-table__cell--header">Reason</th>
                                                                <th className="sh-table__cell sh-table__cell--header">Recorded At</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="sh-table__body">
                                                            {saleDetails.free_stock_items.map((freeItem, index) => (
                                                                <tr key={freeItem.id} className="sh-table__row">
                                                                    <td className="sh-table__cell">
                                                                        <strong>{freeItem.product_name}</strong>
                                                                    </td>
                                                                    <td className="sh-table__cell sh-table__cell--number">{freeItem.quantity}</td>
                                                                    <td className="sh-table__cell">{freeItem.reason || 'Incentive'}</td>
                                                                    <td className="sh-table__cell sh-table__cell--date">
                                                                        {format(new Date(freeItem.recorded_at), 'MMM dd, yyyy hh:mm a')}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Summary */}
                                    <div className="sh-details-card">
                                        <div className="sh-details-card__header">
                                            <h5><FiCreditCard /> Payment Summary</h5>
                                        </div>
                                        <div className="sh-details-card__body">
                                            <div className="sh-payment-summary">
                                                <div className="sh-payment-breakdown">
                                                    <div className="sh-payment-item">
                                                        <span className="sh-payment-label">Subtotal:</span>
                                                        <span className="sh-payment-value">₦{parseFloat(saleDetails.subtotal || 0).toFixed(2)}</span>
                                                    </div>
                                                    {saleDetails.discount_amount > 0 && (
                                                        <div className="sh-payment-item sh-payment-item--discount">
                                                            <span className="sh-payment-label">Discount:</span>
                                                            <span className="sh-payment-value">-₦{parseFloat(saleDetails.discount_amount).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="sh-payment-item">
                                                        <span className="sh-payment-label">Tax Amount:</span>
                                                        <span className="sh-payment-value">₦{parseFloat(saleDetails.tax_amount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="sh-payment-item sh-payment-item--total">
                                                        <span className="sh-payment-label">GRAND TOTAL:</span>
                                                        <span className="sh-payment-value">₦{parseFloat(saleDetails.total_amount).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                {saleDetails.payment_method === 'Credit' && (
                                                    <div className="sh-credit-details">
                                                        <h6>Credit Details</h6>
                                                        <div className="sh-detail-item">
                                                            <span className="sh-detail-label">Status:</span>
                                                            <span className={`sh-status sh-status--${saleDetails.status?.toLowerCase().replace(' ', '-')}`}>
                                                                {saleDetails.status}
                                                            </span>
                                                        </div>
                                                        <div className="sh-payment-item">
                                                            <span className="sh-payment-label">Amount Paid:</span>
                                                            <span className="sh-payment-value">₦{parseFloat(saleDetails.amount_paid || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="sh-payment-item">
                                                            <span className="sh-payment-label">Balance Due:</span>
                                                            <span className="sh-payment-value">₦{parseFloat(saleDetails.balance_due || 0).toFixed(2)}</span>
                                                        </div>
                                                        {saleDetails.due_date && (
                                                            <div className="sh-detail-item">
                                                                <span className="sh-detail-label">Due Date:</span>
                                                                <span className="sh-detail-value">{format(new Date(saleDetails.due_date), 'MMMM dd, yyyy')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="sh-details-card">
                                        <div className="sh-details-card__header">
                                            <h5><FiFileText /> Additional Information</h5>
                                        </div>
                                        <div className="sh-details-card__body">
                                            <div className="sh-details-grid--compact">
                                                <div className="sh-detail-item">
                                                    <span className="sh-detail-label">Transaction Created:</span>
                                                    <span className="sh-detail-value">{format(new Date(saleDetails.created_at), 'MMMM dd, yyyy hh:mm:ss a')}</span>
                                                </div>
                                                {saleDetails.updated_at && (
                                                    <div className="sh-detail-item">
                                                        <span className="sh-detail-label">Last Updated:</span>
                                                        <span className="sh-detail-value">{format(new Date(saleDetails.updated_at), 'MMMM dd, yyyy hh:mm:ss a')}</span>
                                                    </div>
                                                )}
                                                {saleDetails.payment_image_url && (
                                                    <div className="sh-detail-item">
                                                        <span className="sh-detail-label">Payment Proof:</span>
                                                        <a 
                                                            href={saleDetails.payment_image_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="sh-btn sh-btn--outline sh-btn--small"
                                                        >
                                                            View Image
                                                        </a>
                                                    </div>
                                                )}
                                                {saleDetails.transaction_type === 'B2B' && saleDetails.driver_name && (
                                                    <div className="sh-detail-item">
                                                        <span className="sh-detail-label">Driver:</span>
                                                        <span className="sh-detail-value">{saleDetails.driver_name} ({saleDetails.driver_phone_number})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="sh-modal__footer">
                            <button className="sh-btn sh-btn--ghost" onClick={closeDetailsModal}>
                                Close
                            </button>
                            <button 
                                className="sh-btn sh-btn--primary" 
                                onClick={handlePrintReceipt}
                                disabled={printLoading}
                            >
                                {printLoading ? (
                                    <div className="sh-spinner sh-spinner--small"></div>
                                ) : (
                                    <FiPrinter />
                                )}
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesHistoryPage;