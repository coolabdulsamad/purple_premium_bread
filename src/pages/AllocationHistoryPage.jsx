import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Form, Button, Row, Col, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { FaSearch, FaFilter, FaCalendarAlt, FaUser, FaBoxOpen, FaSortAmountDown, FaEye, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CustomToast from '../components/CustomToast';
import useAuth from '../hooks/useAuth';
import '../assets/styles/allocationHistory.css';
import { RefreshCcw } from 'lucide-react';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const AllocationHistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State for Filters and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [issueTypeFilter, setIssueTypeFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // Lookup Data
    const [users, setUsers] = useState([]); 
    const [products, setProducts] = useState([]); 
    
    const ISSUE_TYPES = ['ISSUE', 'RETURN', 'TRANSFER', 'WASTE', 'MANUAL_ADJUSTMENT'];
    
    // Function to fetch the main history data
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                issue_type: issueTypeFilter,
                userId: userFilter,
                productId: productFilter,
                startDate: startDate,
                endDate: endDate,
                searchTerm: searchTerm,
            };
            
            const response = await axios.get(`${API_BASE_URL}/stock-issue-log/history`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            setHistory(response.data);
            
        } catch (error) {
            console.error('Error fetching allocation history:', error);
            toast(<CustomToast type="error" message="Failed to load history data." />);
        } finally {
            setLoading(false);
        }
    };
    
    // Effect to fetch lookup data
    useEffect(() => {
        const fetchLookups = async () => {
            const token = localStorage.getItem('token');
            try {
                const userRes = await axios.get(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
                const productRes = await axios.get(`${API_BASE_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
                
                setUsers(userRes.data);
                setProducts(productRes.data);
            } catch (error) {
                console.error('Error fetching lookup data:', error);
            }
        };
        fetchLookups();
    }, []);

    // Effect to fetch history whenever filters change
    useEffect(() => {
        fetchHistory();
    }, [issueTypeFilter, userFilter, productFilter, startDate, endDate]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchHistory();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setIssueTypeFilter('');
        setUserFilter('');
        setProductFilter('');
        setStartDate('');
        setEndDate('');
    };

    const getIssueTypeVariant = (type) => {
        switch (type) {
            case 'ISSUE': return 'ah-issue';
            case 'RETURN': return 'ah-return';
            case 'TRANSFER': return 'ah-transfer';
            case 'WASTE': return 'ah-waste';
            default: return 'ah-adjustment';
        }
    };

    const getIssueTypeIcon = (type) => {
        switch (type) {
            case 'ISSUE': return '📤';
            case 'RETURN': return '📥';
            case 'TRANSFER': return '🔄';
            case 'WASTE': return '🗑️';
            default: return '📝';
        }
    };

    if (loading) return (
        <div className="ah-loading">
            <div className="ah-spinner"></div>
            <div className="ah-loading-text">Loading allocation history...</div>
        </div>
    );

    return (
        <div className="ah-page">
            {/* Header Section */}
            <div className="ah-header">
                <div className="ah-header-content">
                    <h1 className="ah-title">Stock Allocation & Movement History</h1>
                    <p className="ah-subtitle">
                        Track all stock movements, allocations, returns, and adjustments across your inventory system.
                    </p>
                </div>
                <div className="ah-header-actions">
                    <button 
                        className="ah-btn ah-btn--secondary ah-btn--icon"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <button 
                        className="ah-btn ah-btn--primary ah-btn--icon"
                        onClick={fetchHistory}
                    >
                        <RefreshCcw />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Search and Filters Section */}
            <div className="ah-card">
                <div className="ah-card__body">
                    <form onSubmit={handleSearchSubmit} className="ah-search-form">
                        <div className="ah-search-bar">
                            <div className="ah-input ah-input--icon">
                                <FaSearch className="ah-input__icon" />
                                <input
                                    type="text"
                                    placeholder="Search by product name, user name, or transaction ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="ah-input__field"
                                />
                            </div>
                            <button type="submit" className="ah-btn ah-btn--primary">
                                <FaSearch />
                                Search
                            </button>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="ah-filters">
                                <div className="ah-filters-grid">
                                    <div className="ah-field">
                                        <label className="ah-label">
                                            <FaSortAmountDown />
                                            Issue Type
                                        </label>
                                        <div className="ah-input">
                                            <select
                                                value={issueTypeFilter}
                                                onChange={(e) => setIssueTypeFilter(e.target.value)}
                                                className="ah-input__field"
                                            >
                                                <option value="">All Types</option>
                                                {ISSUE_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="ah-field">
                                        <label className="ah-label">
                                            <FaUser />
                                            User
                                        </label>
                                        <div className="ah-input">
                                            <select
                                                value={userFilter}
                                                onChange={(e) => setUserFilter(e.target.value)}
                                                className="ah-input__field"
                                            >
                                                <option value="">All Users</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.fullname} ({u.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="ah-field">
                                        <label className="ah-label">
                                            <FaBoxOpen />
                                            Product
                                        </label>
                                        <div className="ah-input">
                                            <select
                                                value={productFilter}
                                                onChange={(e) => setProductFilter(e.target.value)}
                                                className="ah-input__field"
                                            >
                                                <option value="">All Products</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="ah-field">
                                        <label className="ah-label">
                                            <FaCalendarAlt />
                                            Start Date
                                        </label>
                                        <div className="ah-input">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="ah-input__field"
                                            />
                                        </div>
                                    </div>

                                    <div className="ah-field">
                                        <label className="ah-label">
                                            <FaCalendarAlt />
                                            End Date
                                        </label>
                                        <div className="ah-input">
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="ah-input__field"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="ah-filters-actions">
                                    <button 
                                        type="button" 
                                        className="ah-btn ah-btn--ghost"
                                        onClick={clearFilters}
                                    >
                                        Clear Filters
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="ah-btn ah-btn--primary"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Results Summary */}
            <div className="ah-summary">
                <div className="ah-summary-item">
                    <span className="ah-summary-label">Total Records</span>
                    <span className="ah-summary-value">{history.length}</span>
                </div>
                <div className="ah-summary-item">
                    <span className="ah-summary-label">Active Filters</span>
                    <span className="ah-summary-value">
                        {[issueTypeFilter, userFilter, productFilter, startDate, endDate].filter(Boolean).length}
                    </span>
                </div>
            </div>

            {/* History Table */}
            {history.length === 0 ? (
                <div className="ah-card">
                    <div className="ah-card__body ah-empty-state">
                        <FaBoxOpen className="ah-empty-icon" />
                        <h3>No Records Found</h3>
                        <p>No allocation history records match your current filters.</p>
                        <button 
                            className="ah-btn ah-btn--primary"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="ah-card">
                    <div className="ah-card__header">
                        <div className="ah-card__title">
                            <FaEye />
                            Allocation History
                        </div>
                        <button className="ah-btn ah-btn--secondary ah-btn--icon">
                            <FaDownload />
                            Export
                        </button>
                    </div>
                    <div className="ah-card__body">
                        <div className="ah-table-container">
                            <table className="ah-table">
                                <thead className="ah-table__head">
                                    <tr>
                                        <th className="ah-table__cell ah-table__cell--header">S/N</th>
                                        <th className="ah-table__cell ah-table__cell--header">Type</th>
                                        <th className="ah-table__cell ah-table__cell--header">Product</th>
                                        <th className="ah-table__cell ah-table__cell--header">Quantity</th>
                                        <th className="ah-table__cell ah-table__cell--header">From</th>
                                        <th className="ah-table__cell ah-table__cell--header">To</th>
                                        <th className="ah-table__cell ah-table__cell--header">Recorded By</th>
                                        <th className="ah-table__cell ah-table__cell--header">Date/Time</th>
                                    </tr>
                                </thead>
                                <tbody className="ah-table__body">
                                    {history.map((log, index) => (
                                        <tr key={log.id} className="ah-table__row">
                                            <td className="ah-table__cell ah-table__cell--number">{index + 1}</td>
                                            <td className="ah-table__cell">
                                                <span className={`ah-badge ${getIssueTypeVariant(log.issue_type)}`}>
                                                    {getIssueTypeIcon(log.issue_type)} {log.issue_type}
                                                </span>
                                            </td>
                                            <td className="ah-table__cell ah-table__cell--product">
                                                <div className="ah-product-info">
                                                    <strong>{log.product_name}</strong>
                                                    <small className="ah-product-id">ID: {log.id}</small>
                                                </div>
                                            </td>
                                            <td className="ah-table__cell ah-table__cell--quantity">
                                                <span className="ah-quantity">{log.quantity}</span>
                                            </td>
                                            <td className="ah-table__cell ah-table__cell--user">
                                                {log.from_user_name || (
                                                    <span className="ah-inventory">Main Inventory</span>
                                                )}
                                            </td>
                                            <td className="ah-table__cell ah-table__cell--user">
                                                {log.to_user_name || (
                                                    <span className="ah-inventory">Main Inventory</span>
                                                )}
                                            </td>
                                            <td className="ah-table__cell ah-table__cell--user">
                                                {log.recorded_by_name}
                                            </td>
                                            <td className="ah-table__cell ah-table__cell--date">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllocationHistoryPage;