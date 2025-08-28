import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { FaBell, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'; // FaSyncAlt removed
import '../styles/forms.css'; // Reusing forms.css for general styling

const API_BASE_URL = 'http://localhost:5000/api';

const AlertsDashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    // const [generatingAlerts, setGeneratingAlerts] = useState(false); // Removed state

    // Filter states
    const [filters, setFilters] = useState({
        status: 'active', // Default to active alerts
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
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAlerts();
        // Set up a polling interval to refresh alerts periodically
        const intervalId = setInterval(fetchAlerts, 60 * 1000); // Refresh every 1 minute
        return () => clearInterval(intervalId); // Clear interval on component unmount
    }, [fetchAlerts]);

    // --- Actions ---
    // handleGenerateAlerts function removed
    const handleResolveAlert = async (alertId) => {
        if (window.confirm('Are you sure you want to mark this alert as resolved?')) {
            setError('');
            setSuccessMessage('');
            try {
                await axios.put(`${API_BASE_URL}/alerts/${alertId}/resolve`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setSuccessMessage('Alert resolved successfully!');
                fetchAlerts(); // Refresh to update status
            } catch (err) {
                console.error('Error resolving alert:', err.response?.data || err.message);
                setError('Failed to resolve alert. ' + (err.response?.data?.details || err.message));
            }
        }
    };

    // --- Filter Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="alerts-dashboard-container">
            <h1 className="main-header"><FaBell className="me-2" /> Alerts Dashboard</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* Alert Filters */}
            <Card className="form-card mb-4">
                <h2 className="card-title">Filter Alerts</h2>
                <Row className="g-3 align-items-end">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Alert Status</Form.Label>
                            <Form.Control as="select" name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">All Statuses</option>
                                {alertStatuses.map(status => (
                                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Alert Type</Form.Label>
                            <Form.Control as="select" name="alertType" value={filters.alertType} onChange={handleFilterChange}>
                                <option value="">All Types</option>
                                {alertTypes.map(type => (
                                    <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>
            </Card>

            {/* Alerts Table */}
            <Card className="table-card mb-4">
                <h2 className="card-title">Current Alerts</h2>
                {loading ? (
                    <div className="text-center my-5"><Spinner animation="border" /><p>Loading alerts...</p></div>
                ) : alerts.length === 0 ? (
                    <Alert variant="info">No alerts found matching the filters.</Alert>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover className="alerts-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Entity</th>
                                    <th>Message</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th>Resolved At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map(alert => (
                                    <tr key={alert.id} className={alert.status === 'active' ? 'table-warning' : 'table-success'}>
                                        <td>{alert.id}</td>
                                        <td>
                                            {alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </td>
                                        <td>{alert.entity_name || 'N/A'} (ID: {alert.entity_id})</td>
                                        <td>{alert.message}</td>
                                        <td>
                                            {alert.status === 'active' ? (
                                                <span className="badge bg-danger"><FaExclamationTriangle className="me-1" /> Active</span>
                                            ) : (
                                                <span className="badge bg-success"><FaCheckCircle className="me-1" /> Resolved</span>
                                            )}
                                        </td>
                                        <td>{new Date(alert.created_at).toLocaleString()}</td>
                                        <td>{alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A'}</td>
                                        <td>
                                            {alert.status === 'active' && (
                                                <Button variant="success" size="sm" onClick={() => handleResolveAlert(alert.id)}>
                                                    <FaCheckCircle /> Resolve Manually
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AlertsDashboard;
