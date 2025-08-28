import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaSearch, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import '../styles/forms.css'; // Reusing forms.css for general styling

const API_BASE_URL = 'http://localhost:5000/api';

const AllPayments = () => {
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]); // For customer filter dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [filters, setFilters] = useState({
        customerId: '',
        transactionId: '',
        startDate: '',
        endDate: '',
        paymentMethod: '',
    });

    const paymentMethods = ['Cash', 'Bank Transfer', 'POS', 'Cheque', 'Internal Transfer']; // Include 'Internal Transfer' for B2B if applicable

    // --- Data Fetching ---
    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/customers`);
            setCustomers(response.data);
        } catch (err) {
            console.error('Error fetching customers for filter:', err);
            // Don't set global error, just log. Payments can still load.
        }
    };

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await axios.get(`${API_BASE_URL}/payments?${queryParams}`);
            setPayments(response.data);
        } catch (err) {
            console.error('Error fetching all payments:', err.response?.data || err.message);
            setError('Failed to load payments history. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchCustomers();
        fetchPayments();
    }, [fetchPayments]);

    // --- Filter Handlers ---
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
    };

    return (
        <div className="all-payments-container">
            <h1 className="main-header">All Payments Overview</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}

            {/* Payment Filters */}
            <Card className="filter-card mb-4">
                <h2 className="card-title">Filter Payments</h2>
                <Form>
                    <Row className="g-3 mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Customer</Form.Label>
                                <Form.Control as="select" name="customerId" value={filters.customerId} onChange={handleFilterChange}>
                                    <option value="">All Customers</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.fullname}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Sales Transaction ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="transactionId"
                                    placeholder="e.g., 123"
                                    value={filters.transactionId}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Payment Method</Form.Label>
                                <Form.Control as="select" name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
                                    <option value="">All Methods</option>
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
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

            {/* All Payments Table */}
            <Card className="table-card mb-4">
                <h2 className="card-title">All Payments Recorded</h2>
                {loading ? (
                    <div className="text-center my-5"><Spinner animation="border" /><p>Loading all payments...</p></div>
                ) : payments.length === 0 ? (
                    <Alert variant="info">No payments found matching the filters.</Alert>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover className="all-payments-table">
                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Sales ID</th>
                                    <th>Amount (₦)</th>
                                    <th>Method</th>
                                    <th>Proof</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(payment => (
                                    <tr key={payment.id}>
                                        <td>{payment.id}</td>
                                        <td>{new Date(payment.payment_date).toLocaleString()}</td>
                                        <td>{payment.customer_name || 'N/A'}</td>
                                        <td>{payment.transaction_id}</td>
                                        <td>₦{Number(payment.amount).toFixed(2)}</td>
                                        <td>{payment.payment_method}</td>
                                        <td>{payment.proof || 'N/A'}</td>
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

export default AllPayments;
