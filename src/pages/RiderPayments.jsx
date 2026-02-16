// src/pages/RiderPayments.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaMotorcycle,
    FaMoneyBillWave,
    FaSearch,
    FaTimes,
    FaCalendarAlt,
    FaUpload,
    FaHistory,
    FaCreditCard,
    FaUser,
    FaFileInvoiceDollar,
    FaCheckCircle,
    FaExclamationTriangle
} from 'react-icons/fa';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/credit-dashboard.css';
import CustomToast from '../components/CustomToast';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosInstance';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const RiderPayments = () => {
    const { user } = useAuth();

    // State for riders list
    const [riders, setRiders] = useState([]);
    const [selectedRiderId, setSelectedRiderId] = useState('');
    const [selectedRider, setSelectedRider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Payment related states
    const [outstandingSales, setOutstandingSales] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentFormData, setPaymentFormData] = useState({
        transaction_id: '',
        amount: 0.00,
        payment_method: 'Cash',
        paymentReference: '',
        proof: '',
    });

    // File upload states
    const [selectedFile, setSelectedFile] = useState(null);
    const [receiptImagePreview, setReceiptImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: 'all',
        dateFrom: '',
        dateTo: ''
    });

    const paymentMethods = ['Cash', 'Bank Transfer', 'POS', 'Cheque'];

    // Fetch riders on mount
    useEffect(() => {
        fetchRiders();
    }, []);

    // Fetch rider details when selected
    useEffect(() => {
        if (selectedRiderId) {
            fetchRiderDetails(selectedRiderId);
            resetPaymentForm();
        } else {
            setSelectedRider(null);
            setOutstandingSales([]);
            setPaymentHistory([]);
        }
    }, [selectedRiderId]);

    // Fetch riders with filters
    const fetchRiders = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
            if (filters.status !== 'all') params.append('status', filters.status);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);

            params.append('limit', '100'); // Get all riders for the dropdown

            const response = await api.get(`/riders?${params.toString()}`);
            setRiders(response.data.riders || []);

        } catch (err) {
            console.error('Error fetching riders:', err);
            setError('Failed to load riders');
            toast(<CustomToast id={`error-riders-${Date.now()}`} type="error" message="Failed to load riders" />);
        } finally {
            setLoading(false);
        }
    };

    // Fetch rider details including outstanding sales and payment history
    const fetchRiderDetails = async (riderId) => {
        setLoading(true);
        setError('');
        try {
            // Get rider details
            const riderRes = await api.get(`/riders/${riderId}`);
            setSelectedRider(riderRes.data);

            // Get outstanding sales - FIXED: Handle different response formats
            const salesRes = await api.get(`/sales/rider/${riderId}/outstanding`);
            console.log('Outstanding sales response:', salesRes.data); // Debug log

            // Handle different possible response formats
            if (Array.isArray(salesRes.data)) {
                setOutstandingSales(salesRes.data);
            } else if (salesRes.data && Array.isArray(salesRes.data.outstanding_sales)) {
                setOutstandingSales(salesRes.data.outstanding_sales);
            } else if (salesRes.data && salesRes.data.sales && Array.isArray(salesRes.data.sales)) {
                setOutstandingSales(salesRes.data.sales);
            } else {
                setOutstandingSales([]);
            }

            // Get payment history
            const paymentsRes = await api.get(`/payments/rider/${riderId}`);
            console.log('Payment history response:', paymentsRes.data); // Debug log

            // Handle different possible response formats
            if (Array.isArray(paymentsRes.data)) {
                setPaymentHistory(paymentsRes.data);
            } else if (paymentsRes.data && Array.isArray(paymentsRes.data.payments)) {
                setPaymentHistory(paymentsRes.data.payments);
            } else {
                setPaymentHistory([]);
            }

        } catch (err) {
            console.error('Error fetching rider details:', err);
            setError('Failed to load rider details');
            toast(<CustomToast id={`error-details-${Date.now()}`} type="error" message="Failed to load rider details" />);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            status: 'all',
            dateFrom: '',
            dateTo: ''
        });
        // Re-fetch riders with cleared filters
        setTimeout(fetchRiders, 100);
        toast(<CustomToast id={`info-clear-${Date.now()}`} type="info" message="Filters cleared" />);
    };

    // Handle payment form changes
    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value,
        }));
    };

    // Handle transaction selection
    const handleTransactionSelect = (e) => {
        const transactionId = e.target.value;
        const selectedTransaction = outstandingSales.find(sale => sale.id === parseInt(transactionId));
        setPaymentFormData(prev => ({
            ...prev,
            transaction_id: transactionId,
            amount: selectedTransaction ? Number(selectedTransaction.balance_due).toFixed(2) : 0.00,
        }));
    };

    // Handle file upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast(<CustomToast id={`error-file-${Date.now()}`} type="error" message="Please upload an image file" />);
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast(<CustomToast id={`error-size-${Date.now()}`} type="error" message="File size must be less than 5MB" />);
                return;
            }

            setSelectedFile(file);
            setReceiptImagePreview(URL.createObjectURL(file));
            setPaymentFormData(prev => ({ ...prev, paymentReference: '' }));
        }
    };

    const clearImage = () => {
        setSelectedFile(null);
        setReceiptImagePreview('');
        if (document.getElementById('receiptImageUpload')) {
            document.getElementById('receiptImageUpload').value = '';
        }
    };

    // Handle payment submission
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setUploadingImage(false);

        // Validate payment data
        if (!selectedRiderId || !paymentFormData.transaction_id || paymentFormData.amount <= 0) {
            const errorMsg = 'Please select a rider, an outstanding transaction, and enter a positive payment amount.';
            setError(errorMsg);
            toast(<CustomToast id={`error-validation-${Date.now()}`} type="error" message={errorMsg} />);
            return;
        }

        // Validate payment amount doesn't exceed balance due
        const selectedTransaction = outstandingSales.find(s => s.id === parseInt(paymentFormData.transaction_id));
        if (selectedTransaction && paymentFormData.amount > selectedTransaction.balance_due) {
            const errorMsg = `Payment amount cannot exceed the balance due (₦${Number(selectedTransaction.balance_due).toFixed(2)})`;
            setError(errorMsg);
            toast(<CustomToast id={`error-amount-${Date.now()}`} type="error" message={errorMsg} />);
            return;
        }

        let finalProof = paymentFormData.paymentReference;

        // Upload image if provided for non-cash payments
        if (paymentFormData.payment_method !== 'Cash') {
            if (selectedFile) {
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('receiptImage', selectedFile);
                try {
                    const uploadResponse = await api.post(`/sales/upload-receipt`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    finalProof = uploadResponse.data.url;
                } catch (uploadError) {
                    const errorMsg = 'Failed to upload receipt image.';
                    setError(errorMsg);
                    toast(<CustomToast id={`error-upload-${Date.now()}`} type="error" message={errorMsg} />);
                    setUploadingImage(false);
                    return;
                } finally {
                    setUploadingImage(false);
                }
            } else if (!paymentFormData.paymentReference) {
                const errorMsg = 'Please provide either a payment reference or upload a receipt image for non-cash payments.';
                setError(errorMsg);
                toast(<CustomToast id={`error-proof-${Date.now()}`} type="error" message={errorMsg} />);
                return;
            }
        }

        try {
            const payload = {
                transaction_id: parseInt(paymentFormData.transaction_id),
                rider_id: parseInt(selectedRiderId),
                amount: paymentFormData.amount,
                payment_method: paymentFormData.payment_method,
                proof: finalProof,
            };

            const response = await api.post(`/payments/rider`, payload);

            const successMsg = `Payment of ₦${Number(response.data.payment.amount).toFixed(2)} recorded successfully!`;
            setSuccessMessage(successMsg);
            toast(<CustomToast id={`success-payment-${Date.now()}`} type="success" message={successMsg} />);

            // Refresh rider details
            fetchRiderDetails(selectedRiderId);
            resetPaymentForm();
            clearImage();

        } catch (err) {
            console.error('Payment error:', err);
            const errorMsg = err.response?.data?.details || err.message || 'Failed to record payment';
            setError(errorMsg);
            toast(<CustomToast id={`error-payment-${Date.now()}`} type="error" message={errorMsg} />);
        }
    };

    const resetPaymentForm = () => {
        setPaymentFormData({
            transaction_id: '',
            amount: 0.00,
            payment_method: 'Cash',
            paymentReference: '',
            proof: '',
        });
    };

    // Check if rider is overdue
    const isOverdue = selectedRider &&
        Number(selectedRider.current_balance) > 0 &&
        selectedRider.due_date &&
        new Date(selectedRider.due_date) < new Date();

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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="rider-payments-container">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="section-header">
                <FaMotorcycle className="section-icon" />
                <h2>Rider Payments Management</h2>
            </div>

            {error && <Alert variant="danger" className="alert-message">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-message">{successMessage}</Alert>}

            {/* Filters Card */}
            <Card className="filter-card mb-4">
                <Card.Header className="filter-card-header">
                    <h3>
                        <FaSearch className="me-2" />
                        Search & Filter Riders
                    </h3>
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                        <FaTimes className="me-1" /> Clear Filters
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3">
                        <Col md={12} lg={4}>
                            <Form.Group>
                                <Form.Label>Search Riders</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="searchTerm"
                                        placeholder="Search by name or phone..."
                                        value={filters.searchTerm}
                                        onChange={handleFilterChange}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={3}>
                            <Form.Group>
                                <Form.Label>Status</Form.Label>
                                <Form.Control
                                    as="select"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="all">All Riders</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>From Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="dateFrom"
                                    value={filters.dateFrom}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>To Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="dateTo"
                                    value={filters.dateTo}
                                    onChange={handleFilterChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={1}>
                            <Button
                                variant="outline-primary"
                                onClick={fetchRiders}
                                className="w-100 filter-apply-btn"
                                style={{ marginTop: '32px' }}
                            >
                                Apply
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Rider Selection and Details */}
            <Card className="form-card mb-4">
                <Card.Header className="form-card-header">
                    <h3>
                        <FaUser className="me-2" />
                        Select Rider
                    </h3>
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-4">
                        <Form.Label>Choose Rider</Form.Label>
                        <Form.Control
                            as="select"
                            value={selectedRiderId}
                            onChange={(e) => setSelectedRiderId(e.target.value)}
                            className="full-width-input"
                        >
                            <option value="">-- Select a Rider --</option>
                            {riders.map(rider => (
                                <option key={rider.id} value={rider.id}>
                                    {rider.fullname} - Balance: {formatCurrency(rider.current_balance)}
                                    {rider.is_active ? '' : ' (Inactive)'}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    {selectedRider && (
                        <div className="rider-details-container">
                            <div className="rider-details-content">
                                <div className="rider-profile-mini">
                                    {selectedRider.profile_image_url ? (
                                        <img
                                            src={selectedRider.profile_image_url}
                                            alt={selectedRider.fullname}
                                            className="rider-avatar"
                                        />
                                    ) : (
                                        <div className="rider-avatar-placeholder">
                                            {selectedRider.fullname?.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h5>{selectedRider.fullname}</h5>
                                        <Badge bg={selectedRider.is_active ? 'success' : 'secondary'}>
                                            {selectedRider.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>

                                <Row className="rider-info mt-3">
                                    <Col md={6}>
                                        <p><strong>Phone:</strong> {selectedRider.phone_number || 'N/A'}</p>
                                        <p><strong>Email:</strong> {selectedRider.email || 'N/A'}</p>
                                        <p><strong>Payment Terms:</strong> {selectedRider.payment_terms || 'N/A'}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Credit Limit:</strong> {formatCurrency(selectedRider.credit_limit)}</p>
                                        <p><strong>Current Balance:</strong>
                                            <span className={selectedRider.current_balance > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                                {formatCurrency(selectedRider.current_balance)}
                                            </span>
                                        </p>
                                        <p><strong>Available Credit:</strong>
                                            <span className={selectedRider.credit_limit - selectedRider.current_balance > 0 ? 'text-success' : 'text-danger'}>
                                                {formatCurrency(selectedRider.credit_limit - selectedRider.current_balance)}
                                            </span>
                                        </p>
                                    </Col>
                                </Row>

                                {isOverdue && (
                                    <Alert variant="warning" className="mt-3">
                                        <FaExclamationTriangle className="me-2" />
                                        Overdue payment! Please contact rider.
                                    </Alert>
                                )}
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Record Payment Form */}
            {selectedRiderId && selectedRider && (
                <Card className="form-card mt-4">
                    <Card.Header className="form-card-header">
                        <h3>
                            <FaMoneyBillWave className="me-2" />
                            Record Payment
                        </h3>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleRecordPayment}>
                            <Row className="g-4">
                                <Col md={12} lg={6}>
                                    <Form.Group className="form-group-spaced">
                                        <Form.Label>Select Transaction to Pay</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="transaction_id"
                                            value={paymentFormData.transaction_id}
                                            onChange={handleTransactionSelect}
                                            required
                                            className="full-width-input"
                                        >
                                            <option value="">-- Select Outstanding Transaction --</option>
                                            {!Array.isArray(outstandingSales) || outstandingSales.length === 0 ? (
                                                <option value="" disabled>No outstanding credit sales</option>
                                            ) : (
                                                outstandingSales.map(sale => (
                                                    <option key={sale.id} value={sale.id}>
                                                        Sale #{sale.id} - {formatDate(sale.sale_date)} - Due: {formatCurrency(sale.balance_due)}
                                                    </option>
                                                ))
                                            )}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={12} lg={6}>
                                    <Form.Group className="form-group-spaced">
                                        <Form.Label>Payment Amount (₦)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="amount"
                                            value={paymentFormData.amount}
                                            onChange={handlePaymentChange}
                                            min="0.01"
                                            step="0.01"
                                            required
                                            className="full-width-input"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={12} lg={6}>
                                    <Form.Group className="form-group-spaced">
                                        <Form.Label>Payment Method</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="payment_method"
                                            value={paymentFormData.payment_method}
                                            onChange={handlePaymentChange}
                                            required
                                            className="full-width-input"
                                        >
                                            {paymentMethods.map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>

                                {/* Only show proof/reference for non-cash payments */}
                                {paymentFormData.payment_method !== 'Cash' && (
                                    <Col md={12} lg={6}>
                                        <Form.Group className="form-group-spaced">
                                            <Form.Label>Payment Proof/Reference *</Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="text"
                                                    name="paymentReference"
                                                    value={paymentFormData.paymentReference}
                                                    onChange={handlePaymentChange}
                                                    placeholder="e.g., Bank Ref: XYZ123 or upload image"
                                                    disabled={!!selectedFile}
                                                    className="full-width-input"
                                                />
                                                <Form.Control
                                                    type="file"
                                                    id="receiptImageUpload"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    style={{ display: 'none' }}
                                                />
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => document.getElementById('receiptImageUpload').click()}
                                                    disabled={!!paymentFormData.paymentReference}
                                                >
                                                    <FaUpload className="me-1" /> Upload
                                                </Button>
                                            </InputGroup>
                                            {receiptImagePreview && (
                                                <div className="receipt-preview mt-3 position-relative d-inline-block">
                                                    <img src={receiptImagePreview} alt="Receipt Preview" className="receipt-image" />
                                                    <Button variant="danger" size="sm" className="remove-image-btn" onClick={clearImage}>
                                                        <FaTimes />
                                                    </Button>
                                                </div>
                                            )}
                                            {uploadingImage && (
                                                <div className="uploading-indicator mt-3 d-flex align-items-center">
                                                    <Spinner animation="border" size="sm" className="me-2" /> Uploading...
                                                </div>
                                            )}
                                            <Form.Text className="text-muted">
                                                * Required for non-cash payments
                                            </Form.Text>
                                        </Form.Group>
                                    </Col>
                                )}
                            </Row>
                            <div className="form-actions mt-4 pt-3">
                                <Button
                                    variant="outline-primary"
                                    type="submit"
                                    disabled={
                                        !selectedRider ||
                                        paymentFormData.amount <= 0 ||
                                        outstandingSales.length === 0 ||
                                        uploadingImage ||
                                        (paymentFormData.payment_method !== 'Cash' && !selectedFile && !paymentFormData.paymentReference)
                                    }
                                    className="w-100 payment-submit-btn"
                                >
                                    <FaMoneyBillWave className="me-2" /> Record Payment
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {/* Payment History Table */}
            {selectedRiderId && (
                <Card className="payments-table-card mt-4">
                    <Card.Header className="table-card-header">
                        <h3>
                            <FaHistory className="me-2" />
                            Payment History for {selectedRider?.fullname}
                        </h3>
                        <Badge bg="secondary" pill>
                            {paymentHistory.length} payments
                        </Badge>
                    </Card.Header>
                    <Card.Body>
                        {loading ? (
                            <div className="loading-container">
                                <Spinner animation="border" variant="primary" />
                                <p>Loading payment history...</p>
                            </div>
                        ) : paymentHistory.length === 0 ? (
                            <div className="empty-state">
                                <FaHistory size={48} />
                                <h4>No payment history found</h4>
                                <p>This rider hasn't made any payments yet</p>
                            </div>
                        ) : (
                            <div className="table-responsive-wide">
                                <Table hover className="payments-table">
                                    <thead>
                                        <tr>
                                            <th>S/N</th>
                                            <th>Payment ID</th>
                                            <th>Date</th>
                                            <th>Sales ID</th>
                                            <th>Amount (₦)</th>
                                            <th>Method</th>
                                            <th>Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentHistory.map((payment, index) => (
                                            <tr key={payment.id}>
                                                <td className="fw-bold">{index + 1}</td>
                                                <td>#{payment.id}</td>
                                                <td>{formatDate(payment.payment_date)}</td>
                                                <td>#{payment.transaction_id}</td>
                                                <td className="fw-bold">{formatCurrency(payment.amount)}</td>
                                                <td>
                                                    <Badge bg="info" className="payment-method-badge">
                                                        {payment.payment_method}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {payment.proof && (
                                                        payment.proof.startsWith('http') ? (
                                                            <a href={payment.proof} target="_blank" rel="noopener noreferrer" className="proof-link">
                                                                View Image
                                                            </a>
                                                        ) : (
                                                            <span className="proof-text">{payment.proof}</span>
                                                        )
                                                    )}
                                                    {!payment.proof && <span className="text-muted">N/A</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-primary">
                                            <td colSpan="4" className="text-end fw-bold">Total Payments:</td>
                                            <td className="fw-bold">
                                                {formatCurrency(paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0))}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default RiderPayments;