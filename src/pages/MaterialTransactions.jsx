import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode'; // For getting user ID from token
import '../styles/forms.css'; // Reusing forms.css for general styling

const API_BASE_URL = 'http://localhost:5000/api';

const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            return decoded.id;
        } catch (e) {
            console.error("Failed to decode token", e);
            return null;
        }
    }
    return null;
};

const MaterialTransactions = () => {
    const [rawMaterials, setRawMaterials] = useState([]);
    const [users, setUsers] = useState([]); // For filter dropdown
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form data for recording a restock
    const [restockFormData, setRestockFormData] = useState({
        raw_material_id: '',
        quantity_added: 0,
        unit_cost: 0.00,
        notes: '',
    });

    // Filter states for transaction history
    const [filters, setFilters] = useState({
        rawMaterialId: '',
        transactionType: '',
        startDate: '',
        endDate: '',
        recordedByUserId: '',
    });

    const transactionTypes = ['restock', 'production_use', 'waste']; // Defined types

    // --- Data Fetching ---
    const fetchRawMaterials = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/raw-materials`);
            setRawMaterials(response.data);
        } catch (err) {
            console.error('Error fetching raw materials for form:', err);
            setError('Failed to load raw materials for restock form.');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users`);
            setUsers(response.data); // Fetch all users for the recorded by filter
        } catch (err) {
            console.error('Error fetching users for filters:', err);
        }
    };

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}/material-transactions?${queryParams}`);
            setTransactions(response.data);
        } catch (err) {
            console.error('Error fetching material transactions:', err.response?.data || err.message);
            setError('Failed to load material transaction history. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchRawMaterials();
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [filters, fetchTransactions]);

    // --- Restock Form Handlers ---
    const handleRestockChange = (e) => {
        const { name, value } = e.target;
        setRestockFormData(prev => ({
            ...prev,
            [name]: name === 'quantity_added' || name === 'unit_cost' ? parseFloat(value) : value,
        }));
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!restockFormData.raw_material_id || restockFormData.quantity_added <= 0 || restockFormData.unit_cost <= 0) {
            setError('Please select a raw material and enter valid positive quantities and unit cost.');
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/material-transactions/restock`, restockFormData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } // Send token for user identification
            });
            setSuccessMessage(`Restock of "${response.data.rawMaterial.name}" successful! New stock: ${response.data.rawMaterial.current_stock} ${response.data.rawMaterial.unit}`);
            fetchTransactions(); // Refresh transaction history
            fetchRawMaterials(); // Refresh raw materials list (for updated stock/price)
            resetRestockForm();
        } catch (err) {
            console.error('Error recording restock:', err.response?.data || err.message);
            setError('Failed to record restock. ' + (err.response?.data?.details || err.message));
        }
    };

    const resetRestockForm = () => {
        setRestockFormData({
            raw_material_id: '',
            quantity_added: 0,
            unit_cost: 0.00,
            notes: '',
        });
    };

    // --- History Filter Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            rawMaterialId: '',
            transactionType: '',
            startDate: '',
            endDate: '',
            recordedByUserId: '',
        });
    };

    return (
        <div className="material-transactions-container">
            <h1 className="main-header">Raw Material Transactions</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* Restock Raw Material Form */}
            <Card className="form-card mb-4">
                <h2 className="card-title">Record New Restock</h2>
                <Form onSubmit={handleRestockSubmit}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Raw Material</Form.Label>
                                <Form.Control as="select" name="raw_material_id" value={restockFormData.raw_material_id} onChange={handleRestockChange} required>
                                    <option value="">-- Select Raw Material --</option>
                                    {rawMaterials.map(rm => (
                                        <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Quantity Added</Form.Label>
                                <Form.Control type="number" name="quantity_added" value={restockFormData.quantity_added} onChange={handleRestockChange} min="0.01" step="0.01" required />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Unit Cost at Restock (₦)</Form.Label>
                                <Form.Control type="number" name="unit_cost" value={restockFormData.unit_cost} onChange={handleRestockChange} min="0.01" step="0.01" required />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Notes (Optional)</Form.Label>
                                <Form.Control as="textarea" name="notes" value={restockFormData.notes} onChange={handleRestockChange} rows="2" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="primary" type="submit">
                            <FaPlus className="me-1" /> Record Restock
                        </Button>
                    </div>
                </Form>
            </Card>

            {/* Transaction History Filters */}
            <Card className="filter-card mb-4">
                <h2 className="card-title">Filter Transaction History</h2>
                <Form>
                    <Row className="g-3 mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Raw Material</Form.Label>
                                <Form.Control as="select" name="rawMaterialId" value={filters.rawMaterialId} onChange={handleFilterChange}>
                                    <option value="">All Raw Materials</option>
                                    {rawMaterials.map(rm => (
                                        <option key={rm.id} value={rm.id}>{rm.name}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Transaction Type</Form.Label>
                                <Form.Control as="select" name="transactionType" value={filters.transactionType} onChange={handleFilterChange}>
                                    <option value="">All Types</option>
                                    {transactionTypes.map(type => (
                                        <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Recorded By</Form.Label>
                                <Form.Control as="select" name="recordedByUserId" value={filters.recordedByUserId} onChange={handleFilterChange}>
                                    <option value="">All Users</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.fullname}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end justify-content-end">
                            <Button variant="outline-secondary" onClick={handleClearFilters}>
                                <FaTimes className="me-1" /> Clear Filters
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Material Transactions History Table */}
            <Card className="table-card mb-4">
                <h2 className="card-title">Material Transaction History</h2>
                {loading ? (
                    <div className="text-center my-5"><Spinner animation="border" /><p>Loading transactions...</p></div>
                ) : transactions.length === 0 ? (
                    <Alert variant="info">No material transactions found matching the filters.</Alert>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover className="material-transactions-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Raw Material</th>
                                    <th>Type</th>
                                    <th>Quantity Change</th>
                                    <th>Unit Cost (₦)</th>
                                    <th>Total Cost (₦)</th>
                                    <th>Recorded By</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(transaction => (
                                    <tr key={transaction.id}>
                                        <td>{transaction.id}</td>
                                        <td>{new Date(transaction.transaction_date).toLocaleString()}</td>
                                        <td>{transaction.raw_material_name} ({transaction.raw_material_unit})</td>
                                        <td>{transaction.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                                        <td className={transaction.transaction_type === 'restock' ? 'text-success' : 'text-danger'}>
                                            {transaction.transaction_type === 'restock' ? '+' : '-'} {Number(transaction.quantity_change).toFixed(2)}
                                        </td>
                                        <td>₦{Number(transaction.unit_cost).toFixed(2)}</td>
                                        <td>₦{(Number(transaction.quantity_change) * Number(transaction.unit_cost)).toFixed(2)}</td>
                                        <td>{transaction.recorded_by_user_name || 'N/A'}</td>
                                        <td>{transaction.notes || 'N/A'}</td>
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

export default MaterialTransactions;
