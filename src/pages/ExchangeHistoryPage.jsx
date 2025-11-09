import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Card, 
    Spinner, 
    Table, 
    Form, 
    InputGroup, 
    FormControl, 
    Button, 
    Badge, 
    Alert,
    Dropdown,
} from 'react-bootstrap';
import { 
    FaHistory, 
    FaSearch, 
    FaFilter, 
    FaRedo,
    FaArrowUp, 
    FaArrowDown,
    FaUser,
    FaBox,
    FaCalendar,
    FaFileAlt,
    FaEye,
    FaSort
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import CustomToast from '../components/CustomToast';
import useAuth from '../hooks/useAuth';
import '../assets/styles/exchangeHistory.css';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const getStatusVariant = (status) => {
    switch (status) {
        case 'PENDING': return 'eh-pending';
        case 'APPROVED': return 'eh-approved';
        case 'RECORDED': return 'eh-recorded';
        case 'REJECTED': return 'eh-rejected';
        default: return 'eh-default';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'PENDING': return '⏳';
        case 'APPROVED': return '✅';
        case 'RECORDED': return '📦';
        case 'REJECTED': return '❌';
        default: return '📄';
    }
};

const ExchangeHistoryPage = () => {
    const { user } = useAuth();
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    const fetchExchanges = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/exchange/history`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, 
                }
            });
            setExchanges(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching exchange history:', error);
            toast(<CustomToast type="error" message="Failed to load exchange history." />);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExchanges();
    }, []);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredExchanges = useMemo(() => {
        let filtered = exchanges;

        // Filter by Status
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(exchange => exchange.status === filterStatus);
        }

        // Filter by Search Term
        if (searchTerm.trim()) {
            const lowerCaseSearch = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(exchange => (
                exchange.customer_name?.toLowerCase().includes(lowerCaseSearch) ||
                exchange.requested_by_user_name?.toLowerCase().includes(lowerCaseSearch) ||
                exchange.reason?.toLowerCase().includes(lowerCaseSearch) ||
                String(exchange.id).includes(lowerCaseSearch) ||
                String(exchange.original_sale_id || '').includes(lowerCaseSearch)
            ));
        }

        // Sort exchanges
        return filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortField) {
                case 'id':
                    aValue = a.id;
                    bValue = b.id;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'customer_name':
                    aValue = a.customer_name?.toLowerCase();
                    bValue = b.customer_name?.toLowerCase();
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at);
                    bValue = new Date(b.created_at);
                    break;
                default:
                    aValue = a[sortField];
                    bValue = b[sortField];
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

    }, [exchanges, filterStatus, searchTerm, sortField, sortDirection]);

    const handleStatusFilterChange = (status) => {
        setFilterStatus(status);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('ALL');
    };

    const isAdminOrManager = ['admin', 'manager'].includes(user?.role);

    if (loading) return (
        <div className="eh-loading">
            <div className="eh-spinner"></div>
            <div className="eh-loading-text">Loading exchange history...</div>
        </div>
    );

    return (
        <div className="eh-page">
            <ToastContainer position="top-right" autoClose={3000} icon={false} />
            
            {/* Header Section */}
            <div className="eh-header">
                <div className="eh-header-content">
                    <h1 className="eh-title">
                        <FaHistory className="eh-title-icon" />
                        Exchange Request History
                    </h1>
                    <p className="eh-subtitle">
                        Track all exchange requests, their status, and processing history.
                    </p>
                </div>
                <button 
                    className="eh-btn eh-btn--primary eh-btn--icon"
                    onClick={fetchExchanges}
                >
                    <FaRedo className="eh-btn-icon" />
                    Refresh
                </button>
            </div>

            {/* Filters Section */}
            <div className="eh-card">
                <div className="eh-card__body">
                    <div className="eh-filters">
                        <div className="eh-search-bar">
                            <div className="eh-input eh-input--icon">
                                <FaSearch className="eh-input__icon" />
                                <input
                                    type="text"
                                    placeholder="Search by customer, user, reason, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="eh-input__field"
                                />
                            </div>
                            
                            <div className="eh-filter-controls">
                                <div className="eh-filter-group">
                                    <label className="eh-filter-label">
                                        <FaFilter />
                                        Status Filter
                                    </label>
                                    <div className="eh-status-filters">
                                        {['ALL', 'PENDING', 'APPROVED', 'RECORDED', 'REJECTED'].map(status => (
                                            <button
                                                key={status}
                                                className={`eh-status-filter ${filterStatus === status ? 'eh-status-filter--active' : ''}`}
                                                onClick={() => handleStatusFilterChange(status)}
                                            >
                                                <span className={`eh-status-badge eh-status-badge--${getStatusVariant(status)}`}>
                                                    {getStatusIcon(status)} {status}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <button 
                                    className="eh-btn eh-btn--ghost"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="eh-summary">
                <div className="eh-summary-item">
                    <span className="eh-summary-label">Total Exchanges</span>
                    <span className="eh-summary-value">{exchanges.length}</span>
                </div>
                <div className="eh-summary-item">
                    <span className="eh-summary-label">Pending</span>
                    <span className="eh-summary-value eh-summary-value--pending">
                        {exchanges.filter(e => e.status === 'PENDING').length}
                    </span>
                </div>
                <div className="eh-summary-item">
                    <span className="eh-summary-label">Approved</span>
                    <span className="eh-summary-value eh-summary-value--approved">
                        {exchanges.filter(e => e.status === 'APPROVED').length}
                    </span>
                </div>
                <div className="eh-summary-item">
                    <span className="eh-summary-label">Recorded</span>
                    <span className="eh-summary-value eh-summary-value--recorded">
                        {exchanges.filter(e => e.status === 'RECORDED').length}
                    </span>
                </div>
            </div>

            {/* Exchange Table */}
            {filteredExchanges.length === 0 ? (
                <div className="eh-card">
                    <div className="eh-card__body eh-empty-state">
                        <FaFileAlt className="eh-empty-icon" />
                        <h3>No Exchange Requests Found</h3>
                        <p>No exchange requests match your current filters.</p>
                        <button 
                            className="eh-btn eh-btn--primary"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="eh-card">
                    <div className="eh-card__header">
                        <div className="eh-card__title">
                            <FaEye />
                            Exchange Requests ({filteredExchanges.length})
                        </div>
                        <div className="eh-sort-info">
                            Sorted by: {sortField} ({sortDirection === 'asc' ? 'Ascending' : 'Descending'})
                        </div>
                    </div>
                    <div className="eh-card__body">
                        <div className="eh-table-container">
                            <table className="eh-table">
                                <thead className="eh-table__head">
                                    <tr>
                                        <th className="eh-table__cell eh-table__cell--header">S/N</th>
                                        <th className="eh-table__cell eh-table__cell--header">
                                            <button 
                                                className="eh-sort-btn"
                                                onClick={() => handleSort('id')}
                                            >
                                                ID
                                                <FaSort className={`eh-sort-icon ${sortField === 'id' ? 'eh-sort-icon--active' : ''} ${sortField === 'id' && sortDirection === 'desc' ? 'eh-sort-icon--desc' : ''}`} />
                                            </button>
                                        </th>
                                        <th className="eh-table__cell eh-table__cell--header">
                                            <button 
                                                className="eh-sort-btn"
                                                onClick={() => handleSort('created_at')}
                                            >
                                                Date
                                                <FaSort className={`eh-sort-icon ${sortField === 'created_at' ? 'eh-sort-icon--active' : ''} ${sortField === 'created_at' && sortDirection === 'desc' ? 'eh-sort-icon--desc' : ''}`} />
                                            </button>
                                        </th>
                                        <th className="eh-table__cell eh-table__cell--header">
                                            Status
                                        </th>
                                        <th className="eh-table__cell eh-table__cell--header">
                                            <button 
                                                className="eh-sort-btn"
                                                onClick={() => handleSort('customer_name')}
                                            >
                                                Customer
                                                <FaSort className={`eh-sort-icon ${sortField === 'customer_name' ? 'eh-sort-icon--active' : ''} ${sortField === 'customer_name' && sortDirection === 'desc' ? 'eh-sort-icon--desc' : ''}`} />
                                            </button>
                                        </th>
                                        <th className="eh-table__cell eh-table__cell--header">
                                            Items
                                        </th>
                                        <th className="eh-table__cell eh-table__cell--header">
                                            Reason
                                        </th>
                                        {isAdminOrManager && (
                                            <th className="eh-table__cell eh-table__cell--header">
                                                Requested By
                                            </th>
                                        )}
                                        <th className="eh-table__cell eh-table__cell--header">
                                            Approved By
                                        </th>
                                        <th className="eh-table__cell eh-table__cell--header">
                                            Original Sale
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="eh-table__body">
                                    {filteredExchanges.map((ex, index) => (
                                        <tr key={ex.id} className="eh-table__row">
                                            <td className="eh-table__cell eh-table__cell--sn">
                                                {index + 1}
                                            </td>
                                            <td className="eh-table__cell eh-table__cell--id">
                                                #{ex.id}
                                            </td>
                                            <td className="eh-table__cell eh-table__cell--date">
                                                <div className="eh-date-info">
                                                    <FaCalendar className="eh-date-icon" />
                                                    {new Date(ex.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="eh-table__cell eh-table__cell--status">
                                                <span className={`eh-status ${getStatusVariant(ex.status)}`}>
                                                    {getStatusIcon(ex.status)} {ex.status}
                                                </span>
                                            </td>
                                            <td className="eh-table__cell eh-table__cell--customer">
                                                <div className="eh-customer-info">
                                                    <FaUser className="eh-customer-icon" />
                                                    {ex.customer_name}
                                                </div>
                                            </td>
                                            <td className="eh-table__cell eh-table__cell--items">
                                                {ex.items_requested_jsonb?.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="eh-item">
                                                        <FaBox className="eh-item-icon" />
                                                        <span className="eh-item-name">
                                                            {item.name || 'Error Loading Name'}
                                                        </span>
                                                        <span className="eh-item-quantity">
                                                            ({item.quantity})
                                                        </span>
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="eh-table__cell eh-table__cell--reason">
                                                <div className="eh-reason" title={ex.reason}>
                                                    {ex.reason.substring(0, 60)}...
                                                </div>
                                            </td>
                                            {isAdminOrManager && (
                                                <td className="eh-table__cell eh-table__cell--user">
                                                    {ex.requested_by_user_name}
                                                </td>
                                            )}
                                            <td className="eh-table__cell eh-table__cell--user">
                                                {ex.approved_by_user_name || (
                                                    <span className="eh-not-available">-</span>
                                                )}
                                            </td>
                                            <td className="eh-table__cell eh-table__cell--sale">
                                                {ex.original_sale_id || (
                                                    <span className="eh-not-available">-</span>
                                                )}
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

export default ExchangeHistoryPage;