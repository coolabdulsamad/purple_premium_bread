// src/pages/RidersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    FaMotorcycle,
    FaUserPlus,
    FaSearch,
    FaFilter,
    FaSync,
    FaEye,
    FaEdit,
    FaToggleOn,
    FaToggleOff,
    FaDollarSign,
    FaCalendarAlt,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaIdCard,
    FaCreditCard,
    FaDownload,
    FaPrint,
    FaTrash,
    FaCheckCircle,
    FaTimesCircle,
    FaExclamationTriangle,
    FaImage
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/riders.css';
import CustomToast from '../components/CustomToast';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosInstance';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const RidersPage = () => {
    const { user, userRole } = useAuth();
    const navigate = useNavigate();

    // State for riders list
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: 'all', // all, active, inactive
        minCredit: '',
        maxCredit: '',
        minBalance: '',
        maxBalance: '',
        sortBy: 'fullname', // fullname, credit_limit, current_balance, created_at
        sortOrder: 'asc',
        dateFrom: '',
        dateTo: '',
        hasOutstanding: 'all' // all, yes, no
    });

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Selected rider for details modal
    const [selectedRider, setSelectedRider] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [riderToDelete, setRiderToDelete] = useState(null);

    // Statistics
    const [stats, setStats] = useState({
        totalRiders: 0,
        activeRiders: 0,
        totalCreditLimit: 0,
        totalOutstanding: 0,
        avgCreditLimit: 0
    });

    // Export state
    const [exportLoading, setExportLoading] = useState(false);

    // Fetch riders with filters
    const fetchRiders = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();

            // Add filters to params
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== 'all' && value !== null && value !== undefined) {
                    params.append(key, value);
                }
            });

            // Add pagination
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);

            const response = await api.get(`/riders?${params.toString()}`);

            setRiders(response.data.riders || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.total || 0,
                totalPages: response.data.totalPages || 0
            }));
            setStats(response.data.stats || {});

        } catch (err) {
            console.error('Error fetching riders:', err);
            setError('Failed to load riders. ' + (err.response?.data?.details || err.message));
            toast(<CustomToast id={`error-riders-${Date.now()}`} type="error" message="Failed to load riders" />);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchRiders();
    }, [fetchRiders]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            status: 'all',
            minCredit: '',
            maxCredit: '',
            minBalance: '',
            maxBalance: '',
            sortBy: 'fullname',
            sortOrder: 'asc',
            dateFrom: '',
            dateTo: '',
            hasOutstanding: 'all'
        });
        setPagination(prev => ({ ...prev, page: 1 }));
        toast(<CustomToast id={`info-clear-${Date.now()}`} type="info" message="Filters cleared" />);
    };

    // Handle rider actions
    const handleViewDetails = (rider) => {
        setSelectedRider(rider);
        setShowDetailsModal(true);
    };

    const handleEditRider = (riderId) => {
        navigate(`/riders/edit/${riderId}`);
    };

    const handleToggleStatus = async (riderId, currentStatus) => {
        try {
            await api.patch(`/riders/${riderId}/toggle-status`, {
                is_active: !currentStatus
            });

            toast(<CustomToast id={`success-toggle-${Date.now()}`} type="success" message={`Rider ${currentStatus ? 'deactivated' : 'activated'} successfully`} />);
            fetchRiders();
        } catch (err) {
            toast(<CustomToast id={`error-toggle-${Date.now()}`} type="error" message="Failed to update rider status" />);
        }
    };

    const handleDeleteClick = (rider) => {
        setRiderToDelete(rider);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!riderToDelete) return;

        try {
            await api.delete(`/riders/${riderToDelete.id}`);
            toast(<CustomToast id={`success-delete-${Date.now()}`} type="success" message="Rider deleted successfully" />);
            fetchRiders();
        } catch (err) {
            toast(<CustomToast id={`error-delete-${Date.now()}`} type="error" message="Failed to delete rider" />);
        } finally {
            setShowDeleteConfirm(false);
            setRiderToDelete(null);
        }
    };

    // Export functions
    const exportToCSV = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== 'all' && value !== null && value !== undefined) {
                    params.append(key, value);
                }
            });
            params.append('export', 'true');

            const response = await api.get(`/riders/export?${params.toString()}`);

            // Create CSV content
            const csvContent = convertToCSV(response.data);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `riders_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            toast(<CustomToast id={`success-export-${Date.now()}`} type="success" message="Export completed successfully" />);
        } catch (err) {
            toast(<CustomToast id={`error-export-${Date.now()}`} type="error" message="Failed to export riders" />);
        } finally {
            setExportLoading(false);
        }
    };

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).map(value =>
            typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(','));

        return [headers, ...rows].join('\n');
    };

    // Handle sort
    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Get sort icon
    const getSortIcon = (field) => {
        if (filters.sortBy !== field) return null;
        return filters.sortOrder === 'asc' ? '↑' : '↓';
    };

    // Format currency
    const formatCurrency = (amount) => {
        return `₦${Number(amount || 0).toFixed(2)}`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="riders-page">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Header */}
            <div className="riders-header">
                <div className="header-left">
                    <FaMotorcycle className="header-icon" />
                    <div>
                        <h1>Rider Management</h1>
                        <p className="header-subtitle">Manage delivery riders and their credit accounts</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="riders-btn riders-btn--primary"
                        onClick={() => navigate('/riders/register')}
                    >
                        <FaUserPlus />
                        Register New Rider
                    </button>
                    <button
                        className="riders-btn riders-btn--secondary"
                        onClick={exportToCSV}
                        disabled={exportLoading}
                    >
                        {exportLoading ? 'Exporting...' : (
                            <>
                                <FaDownload />
                                Export
                            </>
                        )}
                    </button>
                    <button
                        className="riders-btn riders-btn--ghost"
                        onClick={fetchRiders}
                        disabled={loading}
                    >
                        <FaSync className={loading ? 'fa-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="riders-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f3e5f5', color: '#7B1FA2' }}>
                        <FaMotorcycle />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Riders</span>
                        <span className="stat-value">{stats.totalRiders || 0}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e8f5e8', color: '#2E7D32' }}>
                        <FaCheckCircle />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Active Riders</span>
                        <span className="stat-value">{stats.activeRiders || 0}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1565C0' }}>
                        <FaCreditCard />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Credit Limit</span>
                        <span className="stat-value">{formatCurrency(stats.totalCreditLimit)}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fff3e0', color: '#E65100' }}>
                        <FaExclamationTriangle />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Outstanding Balance</span>
                        <span className="stat-value">{formatCurrency(stats.totalOutstanding)}</span>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="riders-filters-card">
                <div className="filters-header">
                    <h3>
                        <FaFilter />
                        Filter Riders
                    </h3>
                    <button
                        className="clear-filters-btn"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>
                </div>
                <div className="filters-grid">
                    <div className="filter-group">
                        <label>Search</label>
                        <div className="search-input">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                name="searchTerm"
                                placeholder="Search by name, phone, email..."
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="all">All Riders</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Outstanding Balance</label>
                        <select
                            name="hasOutstanding"
                            value={filters.hasOutstanding}
                            onChange={handleFilterChange}
                        >
                            <option value="all">All</option>
                            <option value="yes">Has Outstanding</option>
                            <option value="no">No Outstanding</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Sort By</label>
                        <select
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                        >
                            <option value="fullname">Name</option>
                            <option value="credit_limit">Credit Limit</option>
                            <option value="current_balance">Balance</option>
                            <option value="created_at">Registration Date</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Credit Limit Range</label>
                        <div className="range-inputs">
                            <input
                                type="number"
                                name="minCredit"
                                placeholder="Min"
                                value={filters.minCredit}
                                onChange={handleFilterChange}
                            />
                            <span>to</span>
                            <input
                                type="number"
                                name="maxCredit"
                                placeholder="Max"
                                value={filters.maxCredit}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Balance Range</label>
                        <div className="range-inputs">
                            <input
                                type="number"
                                name="minBalance"
                                placeholder="Min"
                                value={filters.minBalance}
                                onChange={handleFilterChange}
                            />
                            <span>to</span>
                            <input
                                type="number"
                                name="maxBalance"
                                placeholder="Max"
                                value={filters.maxBalance}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>From Date</label>
                        <input
                            type="date"
                            name="dateFrom"
                            value={filters.dateFrom}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label>To Date</label>
                        <input
                            type="date"
                            name="dateTo"
                            value={filters.dateTo}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </div>

            {/* Riders Table */}
            <div className="riders-table-card">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading riders...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <FaExclamationTriangle />
                        <p>{error}</p>
                        <button onClick={fetchRiders}>Try Again</button>
                    </div>
                ) : (
                    <>
                        <div className="table-header">
                            <h3>
                                Riders List
                                <span className="total-count">({pagination.total} total)</span>
                            </h3>
                            <div className="items-per-page">
                                <label>Show:</label>
                                <select
                                    value={pagination.limit}
                                    onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="riders-table">
                                <thead>
                                    <tr>
                                        <th className="sortable" onClick={() => handleSort('fullname')}>
                                            Rider Details {getSortIcon('fullname')}
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('phone_number')}>
                                            Contact {getSortIcon('phone_number')}
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('credit_limit')}>
                                            Credit Limit {getSortIcon('credit_limit')}
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('current_balance')}>
                                            Current Balance {getSortIcon('current_balance')}
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('created_at')}>
                                            Registered {getSortIcon('created_at')}
                                        </th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riders.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="empty-table">
                                                <FaMotorcycle />
                                                <p>No riders found</p>
                                                <button
                                                    className="riders-btn riders-btn--primary"
                                                    onClick={() => navigate('/riders/register')}
                                                >
                                                    Register Your First Rider
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        riders.map((rider) => (
                                            <tr key={rider.id}>
                                                <td>
                                                    <div className="rider-info">
                                                        {rider.profile_image_url ? (
                                                            <img
                                                                src={rider.profile_image_url}
                                                                alt={rider.fullname}
                                                                className="rider-avatar"
                                                            />
                                                        ) : (
                                                            <div className="rider-avatar-placeholder">
                                                                {rider.fullname?.charAt(0) || 'R'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="rider-name">{rider.fullname}</div>
                                                            <div className="rider-email">{rider.email || 'No email'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="contact-info">
                                                        <div><FaPhone /> {rider.phone_number || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td className="amount-cell">
                                                    {formatCurrency(rider.credit_limit)}
                                                </td>
                                                <td className="amount-cell">
                                                    <span className={rider.current_balance > 0 ? 'text-danger' : 'text-success'}>
                                                        {formatCurrency(rider.current_balance)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatDate(rider.created_at)}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${rider.is_active ? 'status-active' : 'status-inactive'}`}>
                                                        {rider.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn view"
                                                            onClick={() => handleViewDetails(rider)}
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => handleEditRider(rider.id)}
                                                            title="Edit Rider"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className={`action-btn toggle ${rider.is_active ? 'active' : 'inactive'}`}
                                                            onClick={() => handleToggleStatus(rider.id, rider.is_active)}
                                                            title={rider.is_active ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {rider.is_active ? <FaToggleOn /> : <FaToggleOff />}
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDeleteClick(rider)}
                                                            title="Delete Rider"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={pagination.page === page ? 'active' : ''}
                                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Rider Details Modal - ENHANCED */}
            {showDetailsModal && selectedRider && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content rider-details-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Rider Details</h2>
                            <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="rider-profile-header">
                                {selectedRider.profile_image_url ? (
                                    <img
                                        src={selectedRider.profile_image_url}
                                        alt={selectedRider.fullname}
                                        className="profile-image-large"
                                    />
                                ) : (
                                    <div className="profile-placeholder-large">
                                        {selectedRider.fullname?.charAt(0)}
                                    </div>
                                )}
                                <div className="profile-header-info">
                                    <h3>{selectedRider.fullname}</h3>
                                    <p className="rider-status">
                                        <span className={`status-badge ${selectedRider.is_active ? 'status-active' : 'status-inactive'}`}>
                                            {selectedRider.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                    <p className="rider-id">ID: {selectedRider.id}</p>
                                </div>
                            </div>

                            <div className="details-tabs">
                                <div className="tab-buttons">
                                    <button className="tab-btn active" onClick={(e) => {
                                        document.querySelectorAll('.details-tab-pane').forEach(pane => pane.classList.remove('active'));
                                        document.getElementById('tab-personal').classList.add('active');
                                        e.target.classList.add('active');
                                    }}>Personal Info</button>
                                    <button className="tab-btn" onClick={(e) => {
                                        document.querySelectorAll('.details-tab-pane').forEach(pane => pane.classList.remove('active'));
                                        document.getElementById('tab-guarantors').classList.add('active');
                                        e.target.classList.add('active');
                                    }}>Guarantors</button>
                                    <button className="tab-btn" onClick={(e) => {
                                        document.querySelectorAll('.details-tab-pane').forEach(pane => pane.classList.remove('active'));
                                        document.getElementById('tab-credit').classList.add('active');
                                        e.target.classList.add('active');
                                    }}>Credit & Sales</button>
                                    <button className="tab-btn" onClick={(e) => {
                                        document.querySelectorAll('.details-tab-pane').forEach(pane => pane.classList.remove('active'));
                                        document.getElementById('tab-documents').classList.add('active');
                                        e.target.classList.add('active');
                                    }}>Documents</button>
                                </div>

                                {/* Personal Info Tab */}
                                <div id="tab-personal" className="details-tab-pane active">
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <FaPhone />
                                            <div>
                                                <label>Phone Number:</label>
                                                <span>{selectedRider.phone_number || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="detail-item">
                                            <FaEnvelope />
                                            <div>
                                                <label>Email:</label>
                                                <span>{selectedRider.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="detail-item">
                                            <FaMapMarkerAlt />
                                            <div>
                                                <label>Address:</label>
                                                <span>{selectedRider.address || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="detail-item">
                                            <FaCalendarAlt />
                                            <div>
                                                <label>Date of Birth:</label>
                                                <span>{selectedRider.date_of_birth ? formatDate(selectedRider.date_of_birth) : 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="detail-item">
                                            <FaIdCard />
                                            <div>
                                                <label>ID Type:</label>
                                                <span>{selectedRider.id_type || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="detail-item">
                                            <FaIdCard />
                                            <div>
                                                <label>ID Number:</label>
                                                <span>{selectedRider.id_number || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Guarantors Tab */}
                                <div id="tab-guarantors" className="details-tab-pane">
                                    <div className="guarantors-container">
                                        {/* Guarantor 1 */}
                                        <div className="guarantor-card">
                                            <h4>Primary Guarantor</h4>
                                            {selectedRider.guarantor1_name ? (
                                                <div className="guarantor-details">
                                                    <div className="guarantor-header">
                                                        {selectedRider.guarantor1_id_image_url ? (
                                                            <img
                                                                src={selectedRider.guarantor1_id_image_url}
                                                                alt="Guarantor ID"
                                                                className="guarantor-id-image"
                                                            />
                                                        ) : (
                                                            <div className="id-placeholder">
                                                                <FaIdCard />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p><strong>Name:</strong> {selectedRider.guarantor1_name}</p>
                                                            <p><strong>Phone:</strong> {selectedRider.guarantor1_phone || 'N/A'}</p>
                                                            <p><strong>Relationship:</strong> {selectedRider.guarantor1_relationship || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <p><strong>Address:</strong> {selectedRider.guarantor1_address || 'N/A'}</p>
                                                    <div className="id-details">
                                                        <p><strong>ID Type:</strong> {selectedRider.guarantor1_id_type || 'N/A'}</p>
                                                        <p><strong>ID Number:</strong> {selectedRider.guarantor1_id_number || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-muted">No primary guarantor information provided</p>
                                            )}
                                        </div>

                                        {/* Guarantor 2 */}
                                        <div className="guarantor-card">
                                            <h4>Secondary Guarantor {selectedRider.guarantor2_name ? '' : '(Optional)'}</h4>
                                            {selectedRider.guarantor2_name ? (
                                                <div className="guarantor-details">
                                                    <div className="guarantor-header">
                                                        {selectedRider.guarantor2_id_image_url ? (
                                                            <img
                                                                src={selectedRider.guarantor2_id_image_url}
                                                                alt="Guarantor ID"
                                                                className="guarantor-id-image"
                                                            />
                                                        ) : (
                                                            <div className="id-placeholder">
                                                                <FaIdCard />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p><strong>Name:</strong> {selectedRider.guarantor2_name}</p>
                                                            <p><strong>Phone:</strong> {selectedRider.guarantor2_phone || 'N/A'}</p>
                                                            <p><strong>Relationship:</strong> {selectedRider.guarantor2_relationship || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <p><strong>Address:</strong> {selectedRider.guarantor2_address || 'N/A'}</p>
                                                    <div className="id-details">
                                                        <p><strong>ID Type:</strong> {selectedRider.guarantor2_id_type || 'N/A'}</p>
                                                        <p><strong>ID Number:</strong> {selectedRider.guarantor2_id_number || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-muted">No secondary guarantor information provided</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Credit & Sales Tab */}
                                <div id="tab-credit" className="details-tab-pane">
                                    <div className="credit-summary">
                                        <div className="credit-card">
                                            <h4>Credit Limit</h4>
                                            <p className="credit-value">{formatCurrency(selectedRider.credit_limit)}</p>
                                        </div>
                                        <div className="credit-card">
                                            <h4>Current Balance</h4>
                                            <p className={`credit-value ${selectedRider.current_balance > 0 ? 'text-danger' : 'text-success'}`}>
                                                {formatCurrency(selectedRider.current_balance)}
                                            </p>
                                        </div>
                                        <div className="credit-card">
                                            <h4>Available Credit</h4>
                                            <p className="credit-value text-success">
                                                {formatCurrency((selectedRider.credit_limit || 0) - (selectedRider.current_balance || 0))}
                                            </p>
                                        </div>
                                        <div className="credit-card">
                                            <h4>Payment Terms</h4>
                                            <p className="credit-value">{selectedRider.payment_terms || 'N/A'}</p>
                                        </div>
                                        <div className="credit-card">
                                            <h4>Default Payment Method</h4>
                                            <p className="credit-value">{selectedRider.default_payment_method || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Product-Specific Pricing Section */}
                                    <div className="products-section">
                                        <h4>Product-Specific Pricing</h4>
                                        {selectedRider.rider_product_prices && selectedRider.rider_product_prices.length > 0 ? (
                                            <div className="products-pricing-table-container">
                                                <table className="products-pricing-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Product</th>
                                                            <th>Custom Price</th>
                                                            <th>Default Price</th>
                                                            <th>Difference</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedRider.rider_product_prices.map((product, index) => {
                                                            // Find default product price (you might need to fetch this or it might be in the product data)
                                                            const defaultPrice = product.default_price || 0;
                                                            const customPrice = parseFloat(product.price) || 0;
                                                            const difference = customPrice - defaultPrice;

                                                            return (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <div className="product-info">
                                                                            <strong>{product.product_name}</strong>
                                                                            {product.product_id && (
                                                                                <span className="product-id">ID: {product.product_id}</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="custom-price">
                                                                        {formatCurrency(customPrice)}
                                                                    </td>
                                                                    <td className="default-price">
                                                                        {formatCurrency(defaultPrice)}
                                                                    </td>
                                                                    <td className={`price-difference ${difference > 0 ? 'positive' : difference < 0 ? 'negative' : 'zero'}`}>
                                                                        {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="no-products-message">
                                                <FaInfoCircle className="info-icon" />
                                                <p>No custom product prices set for this rider. Default product prices will be used.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Sales */}
                                    <div className="sales-section">
                                        <h4>Recent Sales</h4>
                                        {selectedRider.recent_sales && selectedRider.recent_sales.length > 0 ? (
                                            <table className="mini-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Amount</th>
                                                        <th>Status</th>
                                                        <th>Balance Due</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRider.recent_sales.map(sale => (
                                                        <tr key={sale.sale_id}>
                                                            <td>{formatDate(sale.sale_date)}</td>
                                                            <td>{formatCurrency(sale.total_amount)}</td>
                                                            <td>
                                                                <span className={`status-badge status-${sale.status?.toLowerCase() || 'completed'}`}>
                                                                    {sale.status || 'Completed'}
                                                                </span>
                                                            </td>
                                                            <td className={sale.balance_due > 0 ? 'text-danger' : 'text-success'}>
                                                                {formatCurrency(sale.balance_due || 0)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="text-muted">No recent sales</p>
                                        )}
                                    </div>

                                    {/* Recent Payments */}
                                    <div className="payments-section">
                                        <h4>Recent Payments</h4>
                                        {selectedRider.recent_payments && selectedRider.recent_payments.length > 0 ? (
                                            <table className="mini-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Amount</th>
                                                        <th>Method</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRider.recent_payments.map(payment => (
                                                        <tr key={payment.payment_id}>
                                                            <td>{formatDate(payment.payment_date)}</td>
                                                            <td>{formatCurrency(payment.amount)}</td>
                                                            <td>
                                                                <span className="payment-method-badge">
                                                                    {payment.payment_method}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="text-muted">No recent payments</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {selectedRider.notes && (
                                        <div className="notes-section">
                                            <h4>Notes</h4>
                                            <p>{selectedRider.notes}</p>
                                        </div>
                                    )}

                                    <div className="sales-actions">
                                        <button
                                            className="riders-btn riders-btn--secondary"
                                            onClick={() => navigate(`/riders/sales/${selectedRider.id}`)}
                                        >
                                            View All Sales History
                                        </button>
                                    </div>
                                </div>

                                {/* Documents Tab */}
                                <div id="tab-documents" className="details-tab-pane">
                                    <div className="documents-grid">
                                        <div className="document-card">
                                            <h4>Profile Image</h4>
                                            {selectedRider.profile_image_url ? (
                                                <img
                                                    src={selectedRider.profile_image_url}
                                                    alt="Profile"
                                                    className="document-image"
                                                    onClick={() => window.open(selectedRider.profile_image_url, '_blank')}
                                                />
                                            ) : (
                                                <div className="document-placeholder">
                                                    <FaImage />
                                                    <p>No profile image</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="document-card">
                                            <h4>Rider ID Document</h4>
                                            {selectedRider.id_image_url ? (
                                                <img
                                                    src={selectedRider.id_image_url}
                                                    alt="ID Document"
                                                    className="document-image"
                                                    onClick={() => window.open(selectedRider.id_image_url, '_blank')}
                                                />
                                            ) : (
                                                <div className="document-placeholder">
                                                    <FaIdCard />
                                                    <p>No ID document</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="document-card">
                                            <h4>Guarantor 1 ID</h4>
                                            {selectedRider.guarantor1_id_image_url ? (
                                                <img
                                                    src={selectedRider.guarantor1_id_image_url}
                                                    alt="Guarantor 1 ID"
                                                    className="document-image"
                                                    onClick={() => window.open(selectedRider.guarantor1_id_image_url, '_blank')}
                                                />
                                            ) : (
                                                <div className="document-placeholder">
                                                    <FaIdCard />
                                                    <p>No document</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="document-card">
                                            <h4>Guarantor 2 ID</h4>
                                            {selectedRider.guarantor2_id_image_url ? (
                                                <img
                                                    src={selectedRider.guarantor2_id_image_url}
                                                    alt="Guarantor 2 ID"
                                                    className="document-image"
                                                    onClick={() => window.open(selectedRider.guarantor2_id_image_url, '_blank')}
                                                />
                                            ) : (
                                                <div className="document-placeholder">
                                                    <FaIdCard />
                                                    <p>No document</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="riders-btn riders-btn--secondary"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Close
                            </button>
                            <button
                                className="riders-btn riders-btn--primary"
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    navigate(`/riders/edit/${selectedRider.id}`);
                                }}
                            >
                                Edit Rider
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && riderToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Deletion</h2>
                            <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <FaExclamationTriangle className="warning-icon" />
                            <p>Are you sure you want to delete rider <strong>{riderToDelete.fullname}</strong>?</p>
                            <p className="warning-text">This action cannot be undone. All associated data will be permanently removed.</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="riders-btn riders-btn--secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="riders-btn riders-btn--danger"
                                onClick={handleDeleteConfirm}
                            >
                                Delete Rider
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RidersPage;