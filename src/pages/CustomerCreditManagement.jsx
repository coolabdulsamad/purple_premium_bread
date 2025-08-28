import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaMoneyBillWave, FaCreditCard, FaUser, FaCalendarAlt, FaUpload, FaTimesCircle } from 'react-icons/fa'; // Added FaUpload, FaTimesCircle
import '../styles/forms.css'; // Reusing forms.css for general styling

const API_BASE_URL = 'http://localhost:5000/api';

const CustomerCreditManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [outstandingSales, setOutstandingSales] = useState([]); // Sales with balance_due > 0
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Payment form data
    const [paymentFormData, setPaymentFormData] = useState({
        transaction_id: '', // To link payment to a specific sales transaction
        amount: 0.00,
        payment_method: 'Cash',
        paymentReference: '', // New: For text reference
        proof: '', // This will store either the paymentReference or the uploaded image URL
    });

    // States for image upload
    const [selectedFile, setSelectedFile] = useState(null);
    const [receiptImagePreview, setReceiptImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);


    const paymentMethods = ['Cash', 'Bank Transfer', 'POS', 'Cheque'];

    // --- Data Fetching ---
    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/customers`); // Assuming a /customers endpoint
            setCustomers(response.data);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to load customers.');
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
            // Fetch selected customer's profile
            const customerRes = await axios.get(`${API_BASE_URL}/customers/${selectedCustomerId}`); // Assuming /customers/:id
            setSelectedCustomer(customerRes.data);

            // Fetch outstanding credit sales for this customer
            const outstandingSalesRes = await axios.get(`${API_BASE_URL}/sales/customer/${selectedCustomerId}/outstanding`);
            setOutstandingSales(outstandingSalesRes.data);

            // Fetch payment history for this customer
            const paymentHistoryRes = await axios.get(`${API_BASE_URL}/payments/customer/${selectedCustomerId}`);
            setPaymentHistory(paymentHistoryRes.data);

        } catch (err) {
            console.error('Error fetching customer details or sales:', err.response?.data || err.message);
            setError('Failed to load customer details. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    }, [selectedCustomerId]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        fetchCustomerDetails();
        // Reset payment form and image states when customer changes
        setPaymentFormData(prev => ({ ...prev, transaction_id: '', amount: 0.00, paymentReference: '', proof: '' }));
        setSelectedFile(null);
        setReceiptImagePreview('');
    }, [selectedCustomerId, fetchCustomerDetails]);

    // --- Payment Form Handlers ---
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
            amount: selectedTransaction ? Number(selectedTransaction.balance_due).toFixed(2) : 0.00, // Pre-fill with full balance due
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setReceiptImagePreview(URL.createObjectURL(file)); // Create a preview URL
            setPaymentFormData(prev => ({ ...prev, paymentReference: '' })); // Clear text reference if image selected
        } else {
            setSelectedFile(null);
            setReceiptImagePreview('');
        }
    };

    const clearImage = () => {
        setSelectedFile(null);
        setReceiptImagePreview('');
        if (document.getElementById('receiptImageUpload')) {
            document.getElementById('receiptImageUpload').value = ''; // Clear file input
        }
    };


    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setUploadingImage(false);

        if (!selectedCustomerId || !paymentFormData.transaction_id || paymentFormData.amount <= 0) {
            setError('Please select a customer, an outstanding transaction, and enter a positive payment amount.');
            return;
        }

        let finalProof = paymentFormData.paymentReference; // Default to text reference

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
                finalProof = uploadResponse.data.url; // Use the uploaded image URL as proof
            } catch (uploadError) {
                console.error('Error uploading receipt image:', uploadError.response?.data || uploadError.message);
                setError('Failed to upload receipt image. ' + (uploadError.response?.data?.details || ''));
                setUploadingImage(false);
                return;
            } finally {
                setUploadingImage(false);
            }
        } else if (!paymentFormData.paymentReference) {
            // If no file and no text reference, prompt for one
            setError('Please provide either a payment reference or upload a receipt image.');
            return;
        }


        try {
            const payload = {
                transaction_id: parseInt(paymentFormData.transaction_id),
                customer_id: parseInt(selectedCustomerId),
                amount: paymentFormData.amount,
                payment_method: paymentFormData.payment_method,
                proof: finalProof, // Use the uploaded image URL or text reference
            };
            const response = await axios.post(`${API_BASE_URL}/payments`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSuccessMessage(`Payment of ₦${Number(response.data.payment.amount).toFixed(2)} recorded successfully!`);
            fetchCustomerDetails(); // Refresh details and history
            resetPaymentForm();
            clearImage(); // Also clear image selection
        } catch (err) {
            console.error('Error recording payment:', err.response?.data || err.message);
            setError('Failed to record payment. ' + (err.response?.data?.details || err.message));
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
            <h1 className="main-header">Customer Credit Management</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* Customer Selection */}
            <Card className="form-card mb-4">
                <h2 className="card-title">Select Customer</h2>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="3">Choose Customer:</Form.Label>
                    <Col sm="9">
                        <Form.Control as="select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                            <option value="">-- Select a Customer --</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.fullname} (Balance: ₦{Number(c.balance).toFixed(2)})</option>
                            ))}
                        </Form.Control>
                    </Col>
                </Form.Group>

                {selectedCustomer && (
                    <Card className="mt-3 p-3 bg-light">
                        <h5><FaUser className="me-2" />{selectedCustomer.fullname}</h5>
                        <p className="mb-1">Phone: {selectedCustomer.phone || 'N/A'}</p>
                        <p className="mb-1">Email: {selectedCustomer.email || 'N/A'}</p>
                        <p className="mb-1">Address: {selectedCustomer.address || 'N/A'}</p>
                        <hr />
                        <h4 className="mb-2">Current Balance: <span className={Number(selectedCustomer.balance) > 0 ? 'text-danger' : 'text-success'}>₦{Number(selectedCustomer.balance).toFixed(2)}</span></h4>
                        <p className="mb-1">Credit Limit: ₦{Number(selectedCustomer.credit_limit).toFixed(2)}</p>
                        {isOverdue && <Alert variant="warning" className="mt-2 p-2">Overdue since {new Date(selectedCustomer.due_date).toLocaleDateString()}!</Alert>}
                    </Card>
                )}
            </Card>

            {/* Record Payment Form */}
            {selectedCustomerId && selectedCustomer && (
                <Card className="form-card mb-4">
                    <h2 className="card-title">Record Payment</h2>
                    <Form onSubmit={handleRecordPayment}>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Select Transaction to Pay</Form.Label>
                                    <Form.Control as="select" name="transaction_id" value={paymentFormData.transaction_id} onChange={handleTransactionSelectForPayment} required>
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
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Payment Amount (₦)</Form.Label>
                                    <Form.Control type="number" name="amount" value={paymentFormData.amount} onChange={handlePaymentChange} min="0.01" step="0.01" required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Payment Method</Form.Label>
                                    <Form.Control as="select" name="payment_method" value={paymentFormData.payment_method} onChange={handlePaymentChange} required>
                                        {paymentMethods.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Payment Proof/Reference (Optional)</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            name="paymentReference"
                                            value={paymentFormData.paymentReference}
                                            onChange={handlePaymentChange}
                                            placeholder="e.g., Bank Ref: XYZ123 or upload image"
                                            disabled={!!selectedFile} // Disable text input if file is selected
                                        />
                                        <Form.Control
                                            type="file"
                                            id="receiptImageUpload"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }} // Hide default file input
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => document.getElementById('receiptImageUpload').click()}
                                            disabled={!!paymentFormData.paymentReference} // Disable upload if text is entered
                                        >
                                            <FaUpload /> Upload Image
                                        </Button>
                                    </InputGroup>
                                    {receiptImagePreview && (
                                        <div className="mt-2 position-relative d-inline-block">
                                            <img src={receiptImagePreview} alt="Receipt Preview" style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                            <Button variant="danger" size="sm" className="position-absolute top-0 end-0 translate-middle-x" onClick={clearImage} style={{borderRadius: '50%', padding: '0.2rem 0.4rem'}}>
                                                <FaTimesCircle />
                                            </Button>
                                        </div>
                                    )}
                                    {uploadingImage && (
                                        <div className="mt-2 d-flex align-items-center">
                                            <Spinner animation="border" size="sm" className="me-2" /> Uploading...
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="success" type="submit" disabled={!selectedCustomer || paymentFormData.amount <= 0 || outstandingSales.length === 0 || uploadingImage || (!selectedFile && !paymentFormData.paymentReference)}>
                                <FaMoneyBillWave className="me-1" /> Record Payment
                            </Button>
                        </div>
                    </Form>
                </Card>
            )}

            {/* Customer's Payment History */}
            {selectedCustomerId && (
                <Card className="table-card mb-4">
                    <h2 className="card-title">Payment History for {selectedCustomer?.fullname}</h2>
                    {loading ? (
                        <div className="text-center my-5"><Spinner animation="border" /><p>Loading payment history...</p></div>
                    ) : paymentHistory.length === 0 ? (
                        <Alert variant="info">No payment history found for this customer.</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="payment-history-table">
                                <thead>
                                    <tr>
                                        <th>Payment ID</th>
                                        <th>Date</th>
                                        <th>Sales ID</th>
                                        <th>Amount (₦)</th>
                                        <th>Method</th>
                                        <th>Proof</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentHistory.map(payment => (
                                        <tr key={payment.id}>
                                            <td>{payment.id}</td>
                                            <td>{new Date(payment.payment_date).toLocaleString()}</td>
                                            <td>{payment.transaction_id}</td>
                                            <td>₦{Number(payment.amount).toFixed(2)}</td>
                                            <td>{payment.payment_method}</td>
                                            <td>
                                                {payment.proof && (
                                                    payment.proof.startsWith('http') ? (
                                                        <a href={payment.proof} target="_blank" rel="noopener noreferrer">View Image</a>
                                                    ) : (
                                                        <span>{payment.proof}</span>
                                                    )
                                                )}
                                                {!payment.proof && 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default CustomerCreditManagement;
