import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Form, Row, Col, Modal, Card, Alert, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:5000/api';

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [transactionType, setTransactionType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [status, setStatus] = useState(''); // New state for status filter
    const [showModal, setShowModal] = useState(false);
    const [saleDetails, setSaleDetails] = useState(null);
    const [companyDetails, setCompanyDetails] = useState({});

    const fetchSales = async () => {
        setLoading(true);
        setError('');
        try {
            const params = { search, startDate, endDate, transactionType, paymentMethod, status };
            const response = await axios.get(`${API_BASE_URL}/sales`, { params });
            setSales(response.data);
        } catch (err) {
            setError('Failed to fetch sales history.');
            console.error('Sales fetch error:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSaleDetails = async (saleId) => {
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/sales/details/${saleId}`);
            setSaleDetails(response.data);
            setShowModal(true);
        } catch (err) {
            setError('Failed to fetch sale details.');
            console.error('Sale details fetch error:', err.response?.data || err.message);
        }
    };

    const fetchCompanyDetails = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/company`);
            setCompanyDetails(response.data);
        } catch (err) {
            console.error('Company details fetch error:', err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchCompanyDetails();
        fetchSales();
    }, [search, startDate, endDate, transactionType, paymentMethod, status]); // Added status to dependency array

    const handleSearch = (e) => {
        e.preventDefault();
        // The useEffect hook will handle the re-fetch when state changes
    };

    const handlePrintReceipt = () => {
        if (!saleDetails) return;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
            .receipt-header { text-align: center; margin-bottom: 15px; }
            .receipt-header h1 { font-size: 18px; margin: 0; }
            .receipt-header p { font-size: 10px; margin: 2px 0; }
            .receipt-details { margin-bottom: 15px; }
            .receipt-details p { margin: 2px 0; }
            .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .receipt-table th, .receipt-table td { padding: 5px; text-align: left; border-bottom: 1px solid #ddd; }
            .receipt-total { text-align: right; }
            .receipt-total p { margin: 2px 0; }
            .receipt-total h4 { margin: 5px 0; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');

        // Company Header
        printWindow.document.write('<div class="receipt-header">');
        printWindow.document.write(`<h1>${companyDetails.name || 'Purple Premium Bread & Pastries'}</h1>`);
        printWindow.document.write(`<p>${companyDetails.address || '123 Bakery Lane, Lekki, Lagos'}</p>`);
        printWindow.document.write(`<p>${companyDetails.phone_number || '+234 801 234 5678'} | ${companyDetails.email || 'info@purplebread.com'}</p>`);
        // ADDED COMPANY DESCRIPTION HERE
        printWindow.document.write(`<p>${companyDetails.description || ''}</p>`);
        printWindow.document.write('</div>');

        // Transaction Details
        printWindow.document.write('<div class="receipt-details">');
        printWindow.document.write(`<p><strong>Receipt ID:</strong> ${saleDetails.id}</p>`);
        printWindow.document.write(`<p><strong>Date:</strong> ${format(new Date(saleDetails.created_at), 'MM/dd/yyyy h:mm:ss a')}</p>`);
        printWindow.document.write(`<p><strong>Cashier:</strong> ${saleDetails.cashier_name || 'N/A'}</p>`);
        if (saleDetails.transaction_type === 'Retail' && saleDetails.customer_name) {
            printWindow.document.write(`<p><strong>Customer:</strong> ${saleDetails.customer_name}</p>`);
        }
        if (saleDetails.transaction_type === 'B2B' && saleDetails.branch_name) {
            printWindow.document.write(`<p><strong>Branch:</strong> ${saleDetails.branch_name}</p>`);
            printWindow.document.write(`<p><strong>Driver:</strong> ${saleDetails.driver_name || 'N/A'} (${saleDetails.driver_phone_number || 'N/A'})</p>`);
        }
        printWindow.document.write(`<p><strong>Transaction Type:</strong> ${saleDetails.transaction_type}</p>`);
        printWindow.document.write(`<p><strong>Payment Method:</strong> ${saleDetails.payment_method}</p>`);
        if (saleDetails.payment_reference) {
            printWindow.document.write(`<p><strong>Payment Reference:</strong> ${saleDetails.payment_reference}</p>`);
        }
        if (saleDetails.note) {
            printWindow.document.write(`<p><strong>Note:</strong> ${saleDetails.note}</p>`);
        }
        printWindow.document.write('</div>');

        // Items Table
        printWindow.document.write('<table class="receipt-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>');
        saleDetails.items.forEach(item => {
            printWindow.document.write(`<tr><td>${item.product_name}</td><td>${item.quantity}</td><td>₦${item.price_at_sale}</td><td>₦${(parseFloat(item.price_at_sale) * item.quantity).toFixed(2)}</td></tr>`);
        });
        printWindow.document.write('</tbody></table>');

        // Financial Summary
        printWindow.document.write('<div class="receipt-total">');
        printWindow.document.write(`<p><strong>Subtotal:</strong> ₦${saleDetails.subtotal}</p>`);
        if (saleDetails.discount_amount > 0) {
            printWindow.document.write(`<p><strong>Discount:</strong> ₦${saleDetails.discount_amount}</p>`);
        }
        printWindow.document.write(`<p><strong>Tax:</strong> ₦${saleDetails.tax_amount}</p>`);
        printWindow.document.write(`<h4><strong>GRAND TOTAL:</strong> ₦${saleDetails.total_amount}</h4>`);
        if (saleDetails.payment_method === 'Credit') {
            printWindow.document.write(`<p><strong>Amount Paid:</strong> ₦${saleDetails.amount_paid || '0.00'}</p>`);
            printWindow.document.write(`<p><strong>Balance Due:</strong> ₦${saleDetails.balance_due || saleDetails.total_amount}</p>`);
            printWindow.document.write(`<p><strong>Due Date:</strong> ${saleDetails.due_date ? format(new Date(saleDetails.due_date), 'MM/dd/yyyy') : 'N/A'}</p>`);
            printWindow.document.write(`<p><strong>Status:</strong> ${saleDetails.status}</p>`);
        }
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSaleDetails(null);
    };

    return (
        <Container>
            <h2 className="my-4">Sales History</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSearch} className="mb-4">
                <Row className="align-items-end">
                    <Col>
                        <Form.Group>
                            <Form.Label>Search</Form.Label>
                            <Form.Control type="text" placeholder="By customer, cashier, or note..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Transaction Type</Form.Label>
                            <Form.Control as="select" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                                <option value="">All</option>
                                <option value="Retail">Retail</option>
                                <option value="B2B">B2B</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Payment Method</Form.Label>
                            <Form.Control as="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <option value="">All</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Credit">Credit</option>
                                <option value="Internal">Internal (B2B)</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Status</Form.Label>
                            <Form.Control as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">All</option>
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partially Paid">Partially Paid</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>End Date</Form.Label>
                            <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col xs="auto">
                        <Button variant="primary" type="submit">Filter</Button>
                    </Col>
                </Row>
            </Form>

            {loading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" />
                    <p>Loading sales...</p>
                </div>
            ) : sales.length === 0 ? (
                <Alert variant="info">No sales found for the selected criteria.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Customer/Branch</th>
                            <th>Type</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                            <th>Total Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => (
                            <tr key={sale.id}>
                                <td>{sale.id}</td>
                                <td>{format(new Date(sale.created_at), 'MM/dd/yyyy h:mm:ss a')}</td>
                                <td>{sale.customer_name || 'N/A'}</td>
                                <td>{sale.transaction_type}</td>
                                <td>{sale.payment_method}</td>
                                <td>{sale.status}</td>
                                <td>₦{sale.total_amount}</td>
                                <td>
                                    <Button variant="info" size="sm" onClick={() => fetchSaleDetails(sale.id)}>
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Sale Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {saleDetails && (
                        <Card>
                            <Card.Header>Transaction #{saleDetails.id}</Card.Header>
                            <Card.Body>
                                <p><strong>Date:</strong> {format(new Date(saleDetails.created_at), 'MM/dd/yyyy h:mm:ss a')}</p>
                                <p><strong>Cashier:</strong> {saleDetails.cashier_name || 'N/A'}</p>
                                {saleDetails.transaction_type === 'Retail' && saleDetails.customer_name && <p><strong>Customer:</strong> {saleDetails.customer_name}</p>}
                                {saleDetails.transaction_type === 'B2B' && saleDetails.branch_name && <p><strong>Branch:</strong> {saleDetails.branch_name}</p>}
                                <p><strong>Transaction Type:</strong> {saleDetails.transaction_type}</p>
                                <p><strong>Payment Method:</strong> {saleDetails.payment_method}</p>
                                {saleDetails.payment_reference && <p><strong>Payment Reference:</strong> {saleDetails.payment_reference}</p>}
                                {saleDetails.transaction_type === 'B2B' && saleDetails.driver_name && <p><strong>Driver:</strong> {saleDetails.driver_name} ({saleDetails.driver_phone_number})</p>}
                                {saleDetails.note && <p><strong>Note:</strong> {saleDetails.note}</p>}
                                {saleDetails.payment_image_url && <p><strong>Payment Proof:</strong> <a href={saleDetails.payment_image_url} target="_blank" rel="noopener noreferrer">View Image</a></p>}

                                <h5>Items Sold</h5>
                                <Table striped bordered size="sm">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price per Unit</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleDetails.items.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.product_name}</td>
                                                <td>{item.quantity}</td>
                                                <td>₦{item.price_at_sale}</td>
                                                <td>₦{(parseFloat(item.price_at_sale) * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                <div className="text-end mt-3">
                                    <p><strong>Subtotal:</strong> ₦{saleDetails.subtotal}</p>
                                    <p><strong>Tax:</strong> ₦{saleDetails.tax_amount}</p>
                                    {saleDetails.discount_amount > 0 && <p><strong>Discount:</strong> ₦{saleDetails.discount_amount}</p>}
                                    <h4><strong>Grand Total:</strong> ₦{saleDetails.total_amount}</h4>
                                    {saleDetails.payment_method === 'Credit' && (
                                        <>
                                            <p><strong>Status:</strong> {saleDetails.status}</p>
                                            <p><strong>Amount Paid:</strong> ₦{saleDetails.amount_paid || '0.00'}</p>
                                            <p><strong>Balance Due:</strong> ₦{saleDetails.balance_due || saleDetails.total_amount}</p>
                                            <p><strong>Due Date:</strong> {saleDetails.due_date ? format(new Date(saleDetails.due_date), 'MM/dd/yyyy') : 'N/A'}</p>
                                        </>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handlePrintReceipt}>
                        Print Receipt
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SalesHistoryPage;