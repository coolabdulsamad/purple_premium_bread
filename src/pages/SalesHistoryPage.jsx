// SalesHistoryPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Table, Button, Form, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
import { FiEye, FiPrinter, FiX, FiSearch, FiCalendar, FiDollarSign, FiList } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import '../assets/styles/SalesHistoryPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [transactionType, setTransactionType] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [status, setStatus] = useState('');
    const [showDialog, setShowDialog] = useState(false);
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
            // toast.error('Failed to fetch sales history.');
            toast(<CustomToast id={`error-history-${Date.now()}`} type="error" message="Failed to fetch sales history." />, {
                toastId: 'history-error'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchSaleDetails = async (saleId) => {
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/sales/details/${saleId}`);
            setSaleDetails(response.data);
            setShowDialog(true);
        } catch (err) {
            setError('Failed to fetch sale details.');
            console.error('Sale details fetch error:', err.response?.data || err.message);
            // toast.error('Failed to fetch sale details.');
            toast(<CustomToast id={`error-sale-${Date.now()}`} type="error" message="Failed to fetch sale details." />, {
                toastId: 'sale-error'
            });
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
    }, [search, startDate, endDate, transactionType, paymentMethod, status]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSales();
    };

    const handlePrintReceipt = () => {
        if (!saleDetails) return;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            :root{ --purple:#4a148c; }
            *{box-sizing:border-box}
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 12px; margin: 0; padding: 10px; }
            .receipt-header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid var(--purple); padding-bottom: 10px; }
            .receipt-header h1 { font-size: 18px; margin: 0; color: var(--purple); }
            .receipt-header p { font-size: 10px; margin: 2px 0; }
            .receipt-details { margin-bottom: 15px; }
            .receipt-details p { margin: 2px 0; }
            .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .receipt-table th, .receipt-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .receipt-table th { background:#f3e9ff; }
            .receipt-total { text-align: right; }
            .receipt-total p { margin: 2px 0; }
            .receipt-total h4 { margin: 5px 0; }
            @page { margin: 10mm; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="receipt-header">');
        printWindow.document.write(`<h1>${companyDetails.name || 'Purple Premium Bread & Pastries'}</h1>`);
        printWindow.document.write(`<p>${companyDetails.address || '123 Bakery Lane, Lekki, Lagos'}</p>`);
        printWindow.document.write(`<p>${companyDetails.phone_number || '+234 801 234 5678'} | ${companyDetails.email || 'info@purplebread.com'}</p>`);
        printWindow.document.write(`<p>${companyDetails.description || ''}</p>`);
        printWindow.document.write('</div>');
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
        printWindow.document.write('<table class="receipt-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>');
        saleDetails.items.forEach(item => {
            printWindow.document.write(`<tr><td>${item.product_name}</td><td>${item.quantity}</td><td>₦${item.price_at_sale}</td><td>₦${(parseFloat(item.price_at_sale) * item.quantity).toFixed(2)}</td></tr>`);
        });
        printWindow.document.write('</tbody></table>');
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
        // toast.success('Receipt sent to printer.');
        toast(<CustomToast id={`success-printer-${Date.now()}`} type="success" message="Receipt sent to printer." />, {
            toastId: 'printer-success'
        });
    };

    const closeDialog = () => {
        setShowDialog(false);
        setSaleDetails(null);
    };

    return (
        <Container fluid className="sales-history-container">
            <Toaster position="top-right" />
            <h2 className="page-title">Sales History</h2>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

            <Form onSubmit={handleSearch} className="filter-form">
                <Row className="align-items-end g-3">
                    <Col md={6} lg={4}>
                        <Form.Group>
                            <Form.Label><FiSearch /> Search</Form.Label>
                            <Form.Control type="text" placeholder="By customer, cashier, or note..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                        <Form.Group>
                            <Form.Label><FiList /> Type</Form.Label>
                            <Form.Control as="select" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                                <option value="">All</option>
                                <option value="Retail">Retail</option>
                                <option value="B2B">B2B</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                        <Form.Group>
                            <Form.Label><FiDollarSign /> Payment</Form.Label>
                            <Form.Control as="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <option value="">All</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Credit">Credit</option>
                                <option value="Internal">Internal (B2B)</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                        <Form.Group>
                            <Form.Label><FiList /> Status</Form.Label>
                            <Form.Control as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="">All</option>
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partially Paid">Partially Paid</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                        <Form.Group>
                            <Form.Label><FiCalendar /> Start Date</Form.Label>
                            <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                        <Form.Group>
                            <Form.Label><FiCalendar /> End Date</Form.Label>
                            <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </Form.Group>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-end">
                        <Button className="btn-primary-pp" type="submit">Filter</Button>
                    </Col>
                </Row>
            </Form>

            {loading ? (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" className="text-purple" />
                    <p className="mt-2 text-muted">Loading sales...</p>
                </div>
            ) : sales.length === 0 ? (
                <Alert variant="info" className="text-center">No sales found for the selected criteria.</Alert>
            ) : (
                <div className="table-wrapper mt-4">
                    <Table hover responsive className="sales-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Date</th>
                                <th>Customer/Branch</th>
                                <th>Type</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th className="text-right">Total</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale, index) => (
                                <tr key={sale.id}>
                                    <td className="mono">{index + 1}</td>
                                    <td>{format(new Date(sale.created_at), 'MMM d, yyyy h:mm a')}</td>
                                    <td className="truncate">{sale.customer_name || sale.branch_name || 'N/A'}</td>
                                    <td>{sale.transaction_type}</td>
                                    <td>{sale.payment_method}</td>
                                    <td>
                                        <span className={`pill ${sale.status?.toLowerCase().replace(' ', '-') || 'unknown'}`}>
                                            {sale.status}
                                        </span>
                                    </td>
                                    <td className="text-right mono">&#8358;{sale.total_amount}</td>
                                    <td className="text-center">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => fetchSaleDetails(sale.id)}
                                            title="View details"
                                        >
                                            <FiEye />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            {showDialog && (
                <>
                    <div className="dialog-overlay" onClick={closeDialog} />
                    <div className="dialog-box" role="dialog" aria-modal="true">
                        <div className="dialog-header">
                            <h4>Sale Details</h4>
                            <button className="dialog-close" onClick={closeDialog} aria-label="Close dialog">
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="dialog-body">
                            {saleDetails && (
                                <Card className="sale-details-card">
                                    <Card.Header className="card-header-subtle">Transaction #{saleDetails.id}</Card.Header>
                                    <Card.Body>
                                        <div className="details-grid">
                                            <p><strong>Date:</strong> {format(new Date(saleDetails.created_at), 'MM/dd/yyyy h:mm:ss a')}</p>
                                            <p><strong>Cashier:</strong> {saleDetails.cashier_name || 'N/A'}</p>
                                            {saleDetails.transaction_type === 'Retail' && <p><strong>Customer:</strong> {saleDetails.customer_name}</p>}
                                            {saleDetails.transaction_type === 'B2B' && <p><strong>Branch:</strong> {saleDetails.branch_name}</p>}
                                            <p><strong>Transaction Type:</strong> {saleDetails.transaction_type}</p>
                                            <p><strong>Payment Method:</strong> {saleDetails.payment_method}</p>
                                            {saleDetails.payment_reference && <p><strong>Payment Reference:</strong> {saleDetails.payment_reference}</p>}
                                            {saleDetails.transaction_type === 'B2B' && saleDetails.driver_name && <p><strong>Driver:</strong> {saleDetails.driver_name} ({saleDetails.driver_phone_number})</p>}
                                            {saleDetails.note && <p><strong>Note:</strong> {saleDetails.note}</p>}
                                            {saleDetails.payment_image_url && <p><strong>Payment Proof:</strong> <a href={saleDetails.payment_image_url} target="_blank" rel="noopener noreferrer">View Image</a></p>}
                                        </div>
                                        <h5 className="section-title">Items Sold</h5>
                                        <div className="modal-table-wrapper">
                                            <Table striped bordered size="sm" className="modal-items-table">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Quantity</th>
                                                        <th>Price per Unit</th>
                                                        <th className="text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {saleDetails.items.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td className="truncate">{item.product_name}</td>
                                                            <td>{item.quantity}</td>
                                                            <td className="mono">₦{item.price_at_sale}</td>
                                                            <td className="text-right mono">₦{(parseFloat(item.price_at_sale) * item.quantity).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                        <div className="totals-box">
                                            <p><strong>Subtotal:</strong> <span className="mono">₦{saleDetails.subtotal}</span></p>
                                            <p><strong>Tax:</strong> <span className="mono">₦{saleDetails.tax_amount}</span></p>
                                            {saleDetails.discount_amount > 0 && <p><strong>Discount:</strong> <span className="mono">₦{saleDetails.discount_amount}</span></p>}
                                            <h4 className="grand"><strong>Grand Total:</strong> <span className="mono">₦{saleDetails.total_amount}</span></h4>
                                            {saleDetails.payment_method === 'Credit' && (
                                                <>
                                                    <p><strong>Status:</strong> {saleDetails.status}</p>
                                                    <p><strong>Amount Paid:</strong> <span className="mono">₦{saleDetails.amount_paid || '0.00'}</span></p>
                                                    <p><strong>Balance Due:</strong> <span className="mono">₦{saleDetails.balance_due || saleDetails.total_amount}</span></p>
                                                    <p><strong>Due Date:</strong> {saleDetails.due_date ? format(new Date(saleDetails.due_date), 'MM/dd/yyyy') : 'N/A'}</p>
                                                </>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                        <div className="dialog-footer">
                            <Button variant="secondary" onClick={closeDialog}>Close</Button>
                            <Button className="btn-primary-pp" onClick={handlePrintReceipt}>
                                <FiPrinter /> Print Receipt
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Container>
    );
};

export default SalesHistoryPage;