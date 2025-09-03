import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaSearch, FaTimes, FaMoneyBillWave, FaFilter, FaRedo, FaReceipt, FaListAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../assets/styles/credit-dashboard.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = 'https://purple-premium-bread-backend.onrender.com/api';

const AllPayments = () => {
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'payment_date', direction: 'descending' });

    const [filters, setFilters] = useState({
        customerId: '',
        transactionId: '',
        startDate: '',
        endDate: '',
        paymentMethod: '',
    });

    const paymentMethods = ['Cash', 'Bank Transfer', 'POS', 'Cheque', 'Internal Transfer'];

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/customers`);
            setCustomers(response.data);
        } catch (err) {
            console.error('Error fetching customers for filter:', err);
        }
    };

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}/payments?${queryParams}`);
            setPayments(response.data);
            // toast.success('Payments loaded successfully');
            // toast(<CustomToast id="123" type="success" message="Payments loaded successfully" />);
            toast(<CustomToast id={`success-payment-${Date.now()}`} type="success" message="Payments loaded successfully" />, {
                toastId: 'payment-success'
            });
        } catch (err) {
            const errorMsg = 'Failed to load payments history. ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="123" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'error-error'
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchCustomers();
        fetchPayments();
    }, [fetchPayments]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            customerId: '',
            transactionId: '',
            startDate: '',
            endDate: '',
            paymentMethod: '',
        });
        // toast.info('Filters cleared');
        // toast(<CustomToast id="123" type="info" message="Filters cleared" />);
        toast(<CustomToast id={`info-cleared-${Date.now()}`} type="info" message="Filters cleared" />, {
            toastId: 'cleared-info'
        });
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSearch />;
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    const sortedPayments = [...payments].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const getPaymentMethodBadgeVariant = (method) => {
        switch (method) {
            case 'Cash': return 'success';
            case 'Bank Transfer': return 'primary';
            case 'POS': return 'info';
            case 'Cheque': return 'warning';
            case 'Internal Transfer': return 'secondary';
            default: return 'light';
        }
    };

    const formatProof = (proof) => {
        if (!proof) return 'N/A';
        if (proof.startsWith('http')) {
            return <a href={proof} target="_blank" rel="noopener noreferrer" className="proof-link">View Receipt</a>;
        }
        return <span className="proof-text">{proof}</span>;
    };

    return (
        <div className="all-payments-container">
            <div className="section-header">
                <FaListAlt className="section-icon" />
                <h2>All Payments Overview</h2>
            </div>

            {error && <Alert variant="danger" className="alert-message">{error}</Alert>}

            {/* Payment Filters */}
            <Card className="filter-card">
                <Card.Header className="filter-card-header">
                    <h3>
                        <FaFilter className="me-2" />
                        Filter Payments
                    </h3>
                    <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                        <FaRedo className="me-1" /> Clear Filters
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={12} lg={3}>
                            <Form.Group>
                                <Form.Label>Customer</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="customerId"
                                    value={filters.customerId}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                >
                                    <option value="">All Customers</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.fullname}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Transaction ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="transactionId"
                                    placeholder="e.g., 123"
                                    value={filters.transactionId}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Payment Method</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="paymentMethod"
                                    value={filters.paymentMethod}
                                    onChange={handleFilterChange}
                                    className="full-width-input"
                                >
                                    <option value="">All Methods</option>
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
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
                                onClick={fetchPayments}
                                className="w-100 filter-apply-btn"
                            >
                                <FaSearch className="me-1" /> Apply
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* All Payments Table */}
            <Card className="payments-table-card">
                <Card.Header className="table-card-header">
                    <h3>
                        <FaReceipt className="me-2" />
                        All Payments Recorded
                    </h3>
                    <Badge bg="secondary" pill>
                        {payments.length} payments
                    </Badge>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="loading-container">
                            <Spinner animation="border" variant="primary" />
                            <p>Loading all payments...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="empty-state">
                            <FaReceipt size={48} />
                            <h4>No payments found</h4>
                            <p>Try adjusting your filters or record new payments</p>
                        </div>
                    ) : (
                        <div className="table-responsive-wide">
                            <Table hover className="all-payments-table">
                                <thead>
                                    <tr>
                                        <th className="serial-number">S/N</th>
                                        <th className="sortable" onClick={() => handleSort('id')}>
                                            <div className="th-content">
                                                Payment ID {getSortIcon('id')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('payment_date')}>
                                            <div className="th-content">
                                                Date {getSortIcon('payment_date')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('customer_name')}>
                                            <div className="th-content">
                                                Customer {getSortIcon('customer_name')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('transaction_id')}>
                                            <div className="th-content">
                                                Sales ID {getSortIcon('transaction_id')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('amount')}>
                                            <div className="th-content">
                                                Amount (₦) {getSortIcon('amount')}
                                            </div>
                                        </th>
                                        <th>Method</th>
                                        <th>Proof</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPayments.map((payment, index) => (
                                        <tr key={payment.id}>
                                            <td className="fw-bold serial-number">{index + 1}</td>
                                            <td className="fw-bold payment-id">#{payment.id}</td>
                                            <td className="payment-date">
                                                {new Date(payment.payment_date).toLocaleDateString()}
                                                <br />
                                                <small className="text-muted">
                                                    {new Date(payment.payment_date).toLocaleTimeString()}
                                                </small>
                                            </td>
                                            <td className="customer-name">{payment.customer_name || 'N/A'}</td>
                                            <td className="transaction-id">#{payment.transaction_id}</td>
                                            <td className="payment-amount fw-bold">
                                                ₦{Number(payment.amount).toFixed(2)}
                                            </td>
                                            <td>
                                                <Badge
                                                    bg={getPaymentMethodBadgeVariant(payment.payment_method)}
                                                    className="payment-method-badge"
                                                >
                                                    {payment.payment_method}
                                                </Badge>
                                            </td>
                                            <td className="payment-proof">
                                                {formatProof(payment.proof)}
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

export default AllPayments;