import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaPlus, FaSearch, FaTimes, FaFilter, FaRedo, FaExchangeAlt, FaHistory, FaBox, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = process.env.REACT_APP_API_URL;

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
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'transaction_date', direction: 'descending' });

    const [restockFormData, setRestockFormData] = useState({
        raw_material_id: '',
        quantity_added: 0,
        unit_cost: 0.00,
        notes: '',
    });

    const [filters, setFilters] = useState({
        rawMaterialId: '',
        transactionType: '',
        startDate: '',
        endDate: '',
        recordedByUserId: '',
    });

    const transactionTypes = ['restock', 'production_use', 'waste'];

    const fetchRawMaterials = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/raw-materials`);
            setRawMaterials(response.data);
        } catch (err) {
            console.error('Error fetching raw materials for form:', err);
            setError('Failed to load raw materials for restock form.');
            // toast.error('Failed to load raw materials');
            // toast(<CustomToast id="raw" type="error" message="Failed to load raw materials" />);
            toast(<CustomToast id={`error-material-${Date.now()}`} type="error" message="Failed to load raw materials" />, {
                toastId: 'material-error'
            });
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users`);
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users for filters:', err);
            // toast.error('Failed to load users');
            // toast(<CustomToast id="raw" type="error" message="Failed to load users" />);
            toast(<CustomToast id={`error-users-${Date.now()}`} type="error" message="Failed to load users" />, {
                toastId: 'users-error'
            });
        }
    };

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}/material-transactions?${queryParams}`);
            setTransactions(response.data);
            // toast.success('Transactions loaded successfully');
            // toast(<CustomToast id="raw" type="success" message="Transactions loaded successfully" />);
            toast(<CustomToast id={`success-transaction-${Date.now()}`} type="success" message="Transactions loaded successfully" />, {
                toastId: 'transaction-success'
            });
        } catch (err) {
            const errorMsg = 'Failed to load material transaction history. ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="raw" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
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
            const errorMsg = 'Please select a raw material and enter valid positive quantities and unit cost.';
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="raw" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/material-transactions/restock`, restockFormData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const successMsg = `Restock of "${response.data.rawMaterial.name}" successful! New stock: ${response.data.rawMaterial.current_stock} ${response.data.rawMaterial.unit}`;
            setSuccessMessage(successMsg);
            // toast.success(successMsg);
            // toast(<CustomToast id="raw" type="success" message={successMsg} />);
            toast(<CustomToast id={`success-s-${Date.now()}`} type="success" message={successMsg} />, {
                toastId: 's-success'
            });
            fetchTransactions();
            fetchRawMaterials();
            resetRestockForm();
        } catch (err) {
            const errorMsg = 'Failed to record restock. ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="raw" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
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
        // toast.info('Filters cleared');
        // toast(<CustomToast id="raw" type="info" message="Filters cleared" />);
        toast(<CustomToast id={`info-filter-${Date.now()}`} type="info" message="Filters cleared" />, {
            toastId: 'filter-info'
        });
    };

    const formatTransactionType = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const getTransactionBadgeVariant = (type) => {
        switch (type) {
            case 'restock': return 'success';
            case 'production_use': return 'primary';
            case 'waste': return 'danger';
            default: return 'secondary';
        }
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    return (
        <div className="material-transactions-container">
            <div className="section-header">
                <FaExchangeAlt className="section-icon" />
                <h2>Material Transactions</h2>
            </div>

            {error && <Alert variant="danger" className="alert-message">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-message">{successMessage}</Alert>}

            {/* Record Restock Form */}
            <Card className="form-card">
                <Card.Header className="form-card-header">
                    <h3>
                        <FaPlus className="me-2" />
                        Record New Restock
                    </h3>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleRestockSubmit}>
                        <Row className="g-3">
                            <Col md={12} lg={4}>
                                <Form.Group>
                                    <Form.Label>Raw Material *</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="raw_material_id"
                                        value={restockFormData.raw_material_id}
                                        onChange={handleRestockChange}
                                        required
                                        className="full-width-input"
                                    >
                                        <option value="">-- Select Raw Material --</option>
                                        {rawMaterials.map(rm => (
                                            <option key={rm.id} value={rm.id}>
                                                {rm.name} ({rm.unit}) - Stock: {rm.current_stock}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={12} lg={4}>
                                <Form.Group>
                                    <Form.Label>Quantity Added *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="quantity_added"
                                        value={restockFormData.quantity_added}
                                        onChange={handleRestockChange}
                                        min="0.01"
                                        step="0.01"
                                        required
                                        className="full-width-input"
                                        placeholder="Enter quantity"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12} lg={4}>
                                <Form.Group>
                                    <Form.Label>Unit Cost (₦) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="unit_cost"
                                        value={restockFormData.unit_cost}
                                        onChange={handleRestockChange}
                                        min="0.01"
                                        step="0.01"
                                        required
                                        className="full-width-input"
                                        placeholder="Enter unit cost"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Notes (Optional)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="notes"
                                        value={restockFormData.notes}
                                        onChange={handleRestockChange}
                                        rows="3"
                                        className="full-width-input"
                                        placeholder="Additional notes about this restock"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="form-actions">
                            <Button variant="outline-primary" type="submit">
                                <FaPlus className="me-1" /> Record Restock
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Transaction History Filters */}
            <Card className="filter-card">
                <Card.Header className="filter-card-header">
                    <h3>
                        <FaFilter className="me-2" />
                        Filter Transaction History
                    </h3>
                    <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                        <FaRedo className="me-1" /> Clear Filters
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={12} lg={3}>
                            <Form.Group>
                                <Form.Label>Raw Material</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="rawMaterialId"
                                    value={filters.rawMaterialId}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                >
                                    <option value="">All Raw Materials</option>
                                    {rawMaterials.map(rm => (
                                        <option key={rm.id} value={rm.id}>{rm.name}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Type</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="transactionType"
                                    value={filters.transactionType}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                >
                                    <option value="">All Types</option>
                                    {transactionTypes.map(type => (
                                        <option key={type} value={type}>
                                            {formatTransactionType(type)}
                                        </option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Recorded By</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="recordedByUserId"
                                    value={filters.recordedByUserId}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                >
                                    <option value="">All Users</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.fullname}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={1}>
                            <Button
                                variant="outline-primary"
                                onClick={fetchTransactions}
                                className="w-100 filter-apply-btn"
                            >
                                <FaSearch className="me-1" /> Apply
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Material Transactions History Table */}
            <Card className="transactions-table-card">
                <Card.Header className="table-card-header">
                    <h3>
                        <FaHistory className="me-2" />
                        Transaction History
                    </h3>
                    <Badge bg="secondary" pill>
                        {transactions.length} transactions
                    </Badge>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="loading-container">
                            <Spinner animation="border" variant="primary" />
                            <p>Loading transactions...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="empty-state">
                            <FaBox size={48} />
                            <h4>No transactions found</h4>
                            <p>Try adjusting your filters or record a new transaction</p>
                        </div>
                    ) : (
                        <div className="table-responsive-wide">
                            <Table hover className="transactions-table">
                                <thead>
                                    <tr>
                                        <th className="serial-number">S/N</th>
                                        <th className="sortable" onClick={() => handleSort('id')}>
                                            <div className="th-content">
                                                ID {getSortIcon('id')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('transaction_date')}>
                                            <div className="th-content">
                                                Date {getSortIcon('transaction_date')}
                                            </div>
                                        </th>
                                        <th>Raw Material</th>
                                        <th>Type</th>
                                        <th className="sortable" onClick={() => handleSort('quantity_change')}>
                                            <div className="th-content">
                                                Qty Change {getSortIcon('quantity_change')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('unit_cost')}>
                                            <div className="th-content">
                                                Unit Cost (₦) {getSortIcon('unit_cost')}
                                            </div>
                                        </th>
                                        <th>Total Cost (₦)</th>
                                        <th>Recorded By</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTransactions.map((transaction, index) => (
                                        <tr key={transaction.id}>
                                            <td className="fw-bold serial-number">{index + 1}</td>
                                            <td className="fw-bold transaction-id">#{transaction.id}</td>
                                            <td className="transaction-date">
                                                {new Date(transaction.transaction_date).toLocaleDateString()}
                                                <br />
                                                <small className="text-muted">
                                                    {new Date(transaction.transaction_date).toLocaleTimeString()}
                                                </small>
                                            </td>
                                            <td className="material-name">
                                                {transaction.raw_material_name}
                                                <br />
                                                <small className="text-muted">
                                                    ({transaction.raw_material_unit})
                                                </small>
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={getTransactionBadgeVariant(transaction.transaction_type)}
                                                    className="transaction-type-badge"
                                                >
                                                    {formatTransactionType(transaction.transaction_type)}
                                                </Badge>
                                            </td>
                                            <td className={
                                                transaction.transaction_type === 'restock'
                                                    ? 'text-success fw-bold quantity-change'
                                                    : 'text-danger fw-bold quantity-change'
                                            }>
                                                {transaction.transaction_type === 'restock' ? '+' : '-'}
                                                {Number(transaction.quantity_change).toFixed(2)}
                                            </td>
                                            <td className="unit-cost">
                                                ₦{Number(transaction.unit_cost).toFixed(2)}
                                            </td>
                                            <td className="total-cost fw-bold">
                                                ₦{(Number(transaction.quantity_change) * Number(transaction.unit_cost)).toFixed(2)}
                                            </td>
                                            <td className="recorded-by">
                                                {transaction.recorded_by_user_name || 'N/A'}
                                            </td>
                                            <td className="transaction-notes">
                                                {transaction.notes || (
                                                    <span className="text-muted">No notes</span>
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

export default MaterialTransactions;