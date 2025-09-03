import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, Badge } from 'react-bootstrap';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaFilter, FaSync, FaTimes, FaInfoCircle, FaClock } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/alerts-dashboard.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AlertsDashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resolving, setResolving] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        status: 'active',
        alertType: '',
        searchTerm: '',
    });

    const alertTypes = ['low_stock_material', 'overdue_customer_payment', 'low_stock_product'];
    const alertStatuses = ['active', 'resolved'];

    // --- Data Fetching ---
    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}/alerts?${queryParams}`);
            setAlerts(response.data);
        } catch (err) {
            console.error('Error fetching alerts:', err.response?.data || err.message);
            setError('Failed to load alerts. ' + (err.response?.data?.details || err.message));
            toast.error('Failed to load alerts.');
            // toast(<CustomToast id="123" type="success" message="Failed to load alerts." />);
            toast(<CustomToast id={`error-alert-${Date.now()}`} type="error" message="Failed to load alerts." />, {
                toastId: 'alert-error'
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAlerts();
        // Set up a polling interval to refresh alerts periodically
        const intervalId = setInterval(fetchAlerts, 60 * 1000);
        return () => clearInterval(intervalId);
    }, [fetchAlerts]);

    // --- Actions ---
    const handleResolveAlert = async (alertId, alertMessage) => {
        if (window.confirm(`Are you sure you want to mark "${alertMessage}" as resolved?`)) {
            setError('');
            setSuccessMessage('');
            setResolving(true);
            try {
                await axios.put(`${API_BASE_URL}/alerts/${alertId}/resolve`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Alert resolved successfully!');
                // toast.success('Alert resolved successfully!');
                // toast(<CustomToast id="123" type="success" message="Alert resolved successfully!" />);
                toast(<CustomToast id={`success-alert-${Date.now()}`} type="success" message="Alert resolved succeessfully!" />, {
                    toastId: 'alert-success'
                });
                fetchAlerts();
            } catch (err) {
                console.error('Error resolving alert:', err.response?.data || err.message);
                setError('Failed to resolve alert. ' + (err.response?.data?.details || err.message));
                // toast.error('Failed to resolve alert.');
                // toast(<CustomToast id="123" type="error" message="Failed to resolve alert." />);
                toast(<CustomToast id={`error-resolve-${Date.now()}`} type="error" message="Failed to resolve alert." />, {
                    toastId: 'resolve-error'
                });
            } finally {
                setResolving(false);
            }
        }
    };

    // --- Filter Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            status: 'active',
            alertType: '',
            searchTerm: '',
        });
        // toast.info('Filters cleared');
        // toast(<CustomToast id="123" type="info" message="Filters cleared" />);
        toast(<CustomToast id={`info-filter-${Date.now()}`} type="info" message="Filters cleared" />, {
            toastId: 'filter-info'
        });
    };

    const handleRefresh = () => {
        fetchAlerts();
        // toast.info('Alerts refreshed');
        // toast(<CustomToast id="123" type="info" message="Alerts refreshed" />);
        toast(<CustomToast id={`info-refreshed-${Date.now()}`} type="info" message="Alerts refreshed" />, {
            toastId: 'refreshed-info'
        });
    };

    const getAlertTypeIcon = (type) => {
        switch (type) {
            case 'low_stock_material':
            case 'low_stock_product':
                return <FaExclamationTriangle className="text-warning me-1" />;
            case 'overdue_customer_payment':
                return <FaClock className="text-danger me-1" />;
            default:
                return <FaInfoCircle className="text-info me-1" />;
        }
    };

    const getAlertTypeVariant = (type) => {
        switch (type) {
            case 'low_stock_material':
            case 'low_stock_product':
                return 'warning';
            case 'overdue_customer_payment':
                return 'danger';
            default:
                return 'info';
        }
    };

    // Calculate stats
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

    return (
        <div className="alerts-dashboard-container">
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

            <div className="page-header">
                <h1>
                    <FaBell className="me-2" />
                    Alerts Dashboard
                </h1>
                <p>Monitor and manage system alerts in real-time</p>
            </div>

            {error && <Alert variant="danger" className="alert-custom">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-custom">{successMessage}</Alert>}

            {/* Stats Summary - Compact horizontal layout */}
            <Row className="stats-row mb-4">
                <Col lg={4} md={12} className="mb-3 mb-md-0">
                    <Card className="stat-card h-100">
                        <Card.Body className="stat-card-body">
                            <div className="stat-content">
                                <div className="stat-icon total-alerts">
                                    <FaBell />
                                </div>
                                <div className="stat-text">
                                    <h3 className="stat-number">{totalAlerts}</h3>
                                    <p className="stat-label">Total Alerts</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3 mb-md-0">
                    <Card className="stat-card h-100">
                        <Card.Body className="stat-card-body">
                            <div className="stat-content">
                                <div className="stat-icon active-alerts">
                                    <FaExclamationTriangle />
                                </div>
                                <div className="stat-text">
                                    <h3 className="stat-number">{activeAlerts}</h3>
                                    <p className="stat-label">Active Alerts</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} md={6}>
                    <Card className="stat-card h-100">
                        <Card.Body className="stat-card-body">
                            <div className="stat-content">
                                <div className="stat-icon resolved-alerts">
                                    <FaCheckCircle />
                                </div>
                                <div className="stat-text">
                                    <h3 className="stat-number">{resolvedAlerts}</h3>
                                    <p className="stat-label">Resolved Alerts</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Alert Filters */}
            <Card className="filter-card mb-4">
                <Card.Header className="card-header-custom-f d-flex justify-content-between align-items-center">
                    <div>
                        <FaFilter className="me-2" />
                        Filter Alerts
                    </div>
                    <div>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleClearFilters}
                            className="me-2"
                            disabled={!filters.alertType && filters.status === 'active'}
                        >
                            <FaTimes className="me-1" /> Clear
                        </Button>
                        <Button
                            variant="outline-light"
                            size="sm"
                            onClick={handleRefresh}
                        >
                            <FaSync className="me-1" /> Refresh
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Alert Status</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    {alertStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Alert Type</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="alertType"
                                    value={filters.alertType}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Types</option>
                                    {alertTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Search</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search alerts..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Alerts Table */}
            <Card className="table-card">
                <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                    <div>
                        <FaBell className="me-2" />
                        Current Alerts
                    </div>
                    <Badge bg="light" text="dark" className="alert-count">
                        {alerts.length} alerts
                    </Badge>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="loading-container">
                            <Spinner animation="border" variant="primary" />
                            <p>Loading alerts...</p>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="empty-state">
                            <FaBell className="empty-icon" />
                            <h4>No Alerts Found</h4>
                            <p>No alerts found matching the current filters.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <Table responsive bordered hover className="alerts-table">
                                <thead>
                                    <tr>
                                        <th className="col-sn">S/N</th>
                                        <th className="col-type">Type</th>
                                        <th className="col-entity">Entity</th>
                                        <th className="col-message">Message</th>
                                        <th className="col-status">Status</th>
                                        <th className="col-created">Created</th>
                                        <th className="col-actions">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map((alert, index) => (
                                        <tr key={alert.id} className={alert.status === 'active' ? 'alert-active' : 'alert-resolved'}>
                                            <td className="col-sn text-center">{index + 1}</td>
                                            <td className="col-type">
                                                <div className="d-flex align-items-center">
                                                    {getAlertTypeIcon(alert.alert_type)}
                                                    <span className="alert-type-text">
                                                        {alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="col-entity">
                                                <div className="entity-info">
                                                    <div className="entity-name">{alert.entity_name || 'N/A'}</div>
                                                    <div className="entity-id">ID: {alert.entity_id}</div>
                                                </div>
                                            </td>
                                            <td className="col-message">
                                                <div className="alert-message">{alert.message}</div>
                                            </td>
                                            <td className="col-status">
                                                {alert.status === 'active' ? (
                                                    <Badge bg="danger" className="status-badge">
                                                        <FaExclamationTriangle className="me-1" /> Active
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="success" className="status-badge">
                                                        <FaCheckCircle className="me-1" /> Resolved
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="col-created">
                                                <div className="created-time">
                                                    {new Date(alert.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="created-date text-muted small">
                                                    {new Date(alert.created_at).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="col-actions">
                                                {alert.status === 'active' && (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => handleResolveAlert(alert.id, alert.message)}
                                                        disabled={resolving}
                                                        className="resolve-btn"
                                                    >
                                                        {resolving ? (
                                                            <Spinner animation="border" size="sm" />
                                                        ) : (
                                                            <>
                                                                <FaCheckCircle className="me-1" /> Resolve
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default AlertsDashboard;