import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaMoneyBillWave, FaCreditCard, FaUser, FaCalendarAlt, FaUpload, FaTimesCircle, FaSearch, FaTimes, FaFileInvoiceDollar, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../assets/styles/credit-dashboard.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const CustomerCreditManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [outstandingSales, setOutstandingSales] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [paymentFormData, setPaymentFormData] = useState({
        transaction_id: '',
        amount: 0.00,
        payment_method: 'Cash',
        paymentReference: '',
        proof: '',
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [receiptImagePreview, setReceiptImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const paymentMethods = ['Cash', 'Bank Transfer', 'POS', 'Cheque'];

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/customers`);
            setCustomers(response.data);
            // toast.success('Customers loaded successfully');
            // toast(<CustomToast id="123" type="success" message="Customers loaded successfully" />);
            toast(<CustomToast id={`success-customer-${Date.now()}`} type="success" message="Customers loaded successfully" />, {
                toastId: 'customer-success'
            });
        } catch (err) {
            const errorMsg = 'Failed to load customers.';
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="123" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
        }
    };

    const fetchCustomerDetails = useCallback(async () => {
        if (!selectedCustomerId) {
            setSelectedCustomer(null);
            setOutstandingSales([]);
            setPaymentHistory([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const customerRes = await axios.get(`${API_BASE_URL}/customers/${selectedCustomerId}`);
            setSelectedCustomer(customerRes.data);

            const outstandingSalesRes = await axios.get(`${API_BASE_URL}/sales/customer/${selectedCustomerId}/outstanding`);
            setOutstandingSales(outstandingSalesRes.data);

            const paymentHistoryRes = await axios.get(`${API_BASE_URL}/payments/customer/${selectedCustomerId}`);
            setPaymentHistory(paymentHistoryRes.data);

            // toast.success('Customer details loaded successfully');
            // toast(<CustomToast id="123" type="success" message="Customer details loaded successfully" />);
            toast(<CustomToast id={`success-customer-${Date.now()}`} type="success" message="Customer details loaded successfully" />, {
                toastId: 'customer-success'
            });
        } catch (err) {
            const errorMsg = 'Failed to load customer details. ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="123" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
        } finally {
            setLoading(false);
        }
    }, [selectedCustomerId]);

    // useEffect(() => {
    //     fetchCustomers();
    // }, []);

    // src/pages/CustomerCreditManagement.jsx - Add event listener

    useEffect(() => {
        fetchCustomers();

        // Listen for rider payment events to refresh customer data
        const handleRiderPayment = (event) => {
            console.log('Rider payment recorded, refreshing customer data:', event.detail);
            // If the currently selected customer is linked to this rider, refresh their details
            if (selectedCustomerId) {
                fetchCustomerDetails();
            }
        };

        window.addEventListener('rider-payment-recorded', handleRiderPayment);

        return () => {
            window.removeEventListener('rider-payment-recorded', handleRiderPayment);
        };
    }, [selectedCustomerId]); // Add selectedCustomerId as dependency

    useEffect(() => {
        fetchCustomerDetails();
        setPaymentFormData(prev => ({ ...prev, transaction_id: '', amount: 0.00, paymentReference: '', proof: '' }));
        setSelectedFile(null);
        setReceiptImagePreview('');
    }, [selectedCustomerId, fetchCustomerDetails]);

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value,
        }));
    };

    const handleTransactionSelectForPayment = (e) => {
        const transactionId = e.target.value;
        const selectedTransaction = outstandingSales.find(sale => sale.id === parseInt(transactionId));
        setPaymentFormData(prev => ({
            ...prev,
            transaction_id: transactionId,
            amount: selectedTransaction ? Number(selectedTransaction.balance_due).toFixed(2) : 0.00,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setReceiptImagePreview(URL.createObjectURL(file));
            setPaymentFormData(prev => ({ ...prev, paymentReference: '' }));
        } else {
            setSelectedFile(null);
            setReceiptImagePreview('');
        }
    };

    const clearImage = () => {
        setSelectedFile(null);
        setReceiptImagePreview('');
        if (document.getElementById('receiptImageUpload')) {
            document.getElementById('receiptImageUpload').value = '';
        }
        // toast.info('Receipt image cleared');
        // toast(<CustomToast id="123" type="info" message="Receipt image cleared" />);
        toast(<CustomToast id={`info-receipt-${Date.now()}`} type="info" message="Receipt image cleared" />, {
            toastId: 'receipt-info'
        });
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setUploadingImage(false);

        if (!selectedCustomerId || !paymentFormData.transaction_id || paymentFormData.amount <= 0) {
            const errorMsg = 'Please select a customer, an outstanding transaction, and enter a positive payment amount.';
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="123" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
            return;
        }

        let finalProof = paymentFormData.paymentReference;

        // Only require proof for non-cash payments
        if (paymentFormData.payment_method !== 'Cash') {
            if (selectedFile) {
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('receiptImage', selectedFile);
                try {
                    const uploadResponse = await axios.post(`${API_BASE_URL}/sales/upload-receipt`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    finalProof = uploadResponse.data.url;
                    // toast.success('Receipt image uploaded successfully');
                    // toast(<CustomToast id="123" type="success" message="Receipt image uploaded successfully" />);
                    toast(<CustomToast id={`success-receipt-${Date.now()}`} type="success" message="Receipt image uploaded successfully" />, {
                        toastId: 'receipt-success'
                    });
                } catch (uploadError) {
                    const errorMsg = 'Failed to upload receipt image. ' + (uploadError.response?.data?.details || '');
                    setError(errorMsg);
                    // toast.error(errorMsg);
                    // toast(<CustomToast id="123" type="error" message={errorMsg} />);
                    toast(<CustomToast id={`error-dropdown-${Date.now()}`} type="error" message={errorMsg} />, {
                        toastId: 'e-error'
                    });
                    setUploadingImage(false);
                    return;
                } finally {
                    setUploadingImage(false);
                }
            } else if (!paymentFormData.paymentReference) {
                const errorMsg = 'Please provide either a payment reference or upload a receipt image for non-cash payments.';
                setError(errorMsg);
                // toast.error(errorMsg);
                // toast(<CustomToast id="123" type="error" message={errorMsg} />);
                toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                    toastId: 'e-error'
                });
                return;
            }
        }

        try {
            const payload = {
                transaction_id: parseInt(paymentFormData.transaction_id),
                customer_id: parseInt(selectedCustomerId),
                amount: paymentFormData.amount,
                payment_method: paymentFormData.payment_method,
                proof: finalProof,
            };
            const response = await axios.post(`${API_BASE_URL}/payments`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const successMsg = `Payment of ₦${Number(response.data.payment.amount).toFixed(2)} recorded successfully!`;
            setSuccessMessage(successMsg);
            // toast.success(successMsg);
            // toast(<CustomToast id="123" type="success" message={successMsg} />);
            toast(<CustomToast id={`success-s-${Date.now()}`} type="success" message={successMsg} />, {
                toastId: 's-success'
            });
            fetchCustomerDetails();
            resetPaymentForm();
            clearImage();
        } catch (err) {
            const errorMsg = 'Failed to record payment. ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="123" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
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
        clearImage();
    };

    const isOverdue = selectedCustomer && Number(selectedCustomer.balance) > 0 && selectedCustomer.due_date && new Date(selectedCustomer.due_date) < new Date();

    return (
        <div className="customer-credit-management-container">
            <div className="section-header">
                <FaFileInvoiceDollar className="section-icon" />
                <h2>Customer Credit Management</h2>
            </div>

            {error && <Alert variant="danger" className="alert-message">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-message">{successMessage}</Alert>}

            {/* Customer Selection */}
            <Card className="form-card">
                <Card.Header className="form-card-header">
                    <h3>
                        <FaUser className="me-2" />
                        Select Customer
                    </h3>
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-4">
                        <Form.Label>Choose Customer</Form.Label>
                        <Form.Control
                            as="select"
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="full-width-input"
                        >
                            <option value="">-- Select a Customer --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.fullname} (Balance: ₦{Number(c.balance).toFixed(2)})
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>

                    {selectedCustomer && (
                        <div className="customer-details-container">
                            <div className="customer-details-content">
                                <h5><FaUser className="me-2" />{selectedCustomer.fullname}</h5>
                                <Row className="customer-info">
                                    <Col md={6} className="customer-info-col">
                                        <p className="mb-2"><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
                                        <p className="mb-2"><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</p>
                                    </Col>
                                    <Col md={6} className="customer-info-col">
                                        <p className="mb-2"><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</p>
                                        <p className="mb-2"><strong>Credit Limit:</strong> ₦{Number(selectedCustomer.credit_limit).toFixed(2)}</p>
                                    </Col>
                                </Row>
                                <hr className="my-3" />
                                <div className="balance-section">
                                    <h4 className="mb-2">
                                        Current Balance:
                                        <span className={Number(selectedCustomer.balance) > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                            ₦{Number(selectedCustomer.balance).toFixed(2)}
                                        </span>
                                    </h4>
                                    {isOverdue && (
                                        <Badge bg="warning" text="dark" className="overdue-badge mt-2">
                                            Overdue since {new Date(selectedCustomer.due_date).toLocaleDateString()}!
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Record Payment Form */}
            {selectedCustomerId && selectedCustomer && (
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
                                            onChange={handleTransactionSelectForPayment}
                                            required
                                            className="full-width-input"
                                        >
                                            <option value="">-- Select Outstanding Transaction --</option>
                                            {outstandingSales.length === 0 ? (
                                                <option value="" disabled>No outstanding credit sales</option>
                                            ) : (
                                                outstandingSales.map(sale => (
                                                    <option key={sale.id} value={sale.id}>
                                                        Sale #{sale.id} (Date: {new Date(sale.sale_date).toLocaleDateString()}, Due: ₦{Number(sale.balance_due).toFixed(2)})
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
                                                        <FaTimesCircle />
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
                                        !selectedCustomer ||
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

            {/* Customer's Payment History */}
            {selectedCustomerId && (
                <Card className="payments-table-card mt-4">
                    <Card.Header className="table-card-header">
                        <h3>
                            <FaHistory className="me-2" />
                            Payment History for {selectedCustomer?.fullname}
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
                                <p>This customer hasn't made any payments yet</p>
                            </div>
                        ) : (
                            <div className="table-responsive-wide">
                                <Table hover className="payments-table">
                                    <thead>
                                        <tr>
                                            <th className="serial-number">S/N</th>
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
                                                <td className="fw-bold serial-number">{index + 1}</td>
                                                <td className="fw-bold payment-id">#{payment.id}</td>
                                                <td className="payment-date">
                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                    <br />
                                                    <small className="text-muted">
                                                        {new Date(payment.payment_date).toLocaleTimeString()}
                                                    </small>
                                                </td>
                                                <td className="transaction-id">#{payment.transaction_id}</td>
                                                <td className="payment-amount fw-bold">
                                                    ₦{Number(payment.amount).toFixed(2)}
                                                </td>
                                                <td>
                                                    <Badge bg="info" className="payment-method-badge">
                                                        {payment.payment_method}
                                                    </Badge>
                                                </td>
                                                <td className="payment-proof">
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
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default CustomerCreditManagement;