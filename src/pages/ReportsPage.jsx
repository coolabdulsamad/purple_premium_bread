// src/pages/ReportsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    FaFileInvoiceDollar, FaChartLine, FaShoppingBag, FaDollarSign,
    FaPrint, FaFilter, FaTrashAlt, FaCalendarAlt, FaStore,
    FaUsers, FaBox, FaCubes, FaExchangeAlt, FaSeedling,
    FaMoneyBillWave, FaDownload, FaSync
} from 'react-icons/fa';
import '../assets/styles/forms.css';
import '../assets/styles/reports.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const ReportsPage = () => {
    const [reportType, setReportType] = useState('profit-loss');
    const [reportResult, setReportResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');

    const [filterData, setFilterData] = useState({
        startDate: '',
        endDate: '',
        branchId: '',
        paymentMethod: '',
        customerId: '',
        status: '',
        minTotal: '',
        maxTotal: '',
        staffId: '',
        transactionType: '',
        productId: '',
        category: '',
        inventoryTransactionType: '',
        rawMaterialId: '',
        rawMaterialTransactionType: '',
        groupBy: 'staff',
    });

    // Dropdown data states
    const [allCustomers, setAllCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [allRawMaterials, setAllRawMaterials] = useState([]);

    const reportContentRef = useRef(null);

    const fetchDropdownData = async () => {
        try {
            setLoading(true);
            const [
                customersRes,
                productsRes,
                categoriesRes,
                usersRes,
                branchesRes,
                rawMaterialsRes
            ] = await Promise.all([
                axios.get(`${API_BASE_URL}/customers`),
                axios.get(`${API_BASE_URL}/products`),
                axios.get(`${API_BASE_URL}/categories`),
                axios.get(`${API_BASE_URL}/users`),
                axios.get(`${API_BASE_URL}/branches`),
                axios.get(`${API_BASE_URL}/raw-materials`),
            ]);
            setAllCustomers(customersRes.data);
            setAllProducts(productsRes.data);
            setAllCategories(categoriesRes.data);
            setAllUsers(usersRes.data);
            setAllBranches(branchesRes.data);
            setAllRawMaterials(rawMaterialsRes.data);
            // toast.success('Filter options loaded successfully');
            // toast(<CustomToast id="123" type="success" message="Filter options loaded successfully" />);
            toast(<CustomToast id={`success-dropdown-${Date.now()}`} type="success" message="Filter options loaded successfully" />, {
                toastId: 'dropdown-success'
            });
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            setError('Failed to load filter options. Some filters may not work.');
            // toast.error('Failed to load filter options');
            // toast(<CustomToast id="123" type="error" message="Failed to load filter options" />);
            toast(<CustomToast id={`error-dropdown-${Date.now()}`} type="error" message="Failed to load filter options" />, {
                toastId: 'dropdown-error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdownData();
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setFilterData(prev => ({
            ...prev,
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
        }));
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterData(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setFilterData({
            startDate: thirtyDaysAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            branchId: '',
            paymentMethod: '',
            customerId: '',
            status: '',
            minTotal: '',
            maxTotal: '',
            staffId: '',
            transactionType: '',
            productId: '',
            category: '',
            inventoryTransactionType: '',
            rawMaterialId: '',
            rawMaterialTransactionType: '',
            groupBy: 'staff',
        });
        // toast.info('Filters cleared');
        // toast(<CustomToast id="123" type="info" message="Filters cleared" />);
        toast(<CustomToast id={`info-clear-${Date.now()}`} type="info" message="Filters cleared" />, {
            toastId: 'clear-filters'
        });
    };

    const generateReport = useCallback(async () => {
        setLoading(true);
        setError('');
        setReportResult(null);

        try {
            const params = new URLSearchParams();

            const relevantFiltersMap = {
                'profit-loss': ['startDate', 'endDate', 'branchId'],
                'detailed-sales': ['startDate', 'endDate', 'paymentMethod', 'customerId', 'status', 'minTotal', 'maxTotal', 'staffId', 'branchId', 'transactionType'],
                'product-profitability': ['startDate', 'endDate', 'productId', 'category', 'branchId'],
                'inventory-movement': ['startDate', 'endDate', 'productId', 'inventoryTransactionType'],
                'raw-material-consumption': ['startDate', 'endDate', 'rawMaterialId', 'rawMaterialTransactionType', 'branchId'],
                'sales-performance-by-staff-branch': ['startDate', 'endDate', 'staffId', 'branchId', 'groupBy'],
            };

            const relevantFilters = relevantFiltersMap[reportType] || [];

            for (const key in filterData) {
                if (filterData[key] !== '' && filterData[key] !== null && filterData[key] !== undefined) {
                    if (relevantFilters.includes(key)) {
                        params.append(key, filterData[key]);
                    }
                }
            }

            const response = await axios.get(`${API_BASE_URL}/reports/${reportType}?${params.toString()}`);
            setReportResult(response.data);
            setLastUpdated(new Date().toLocaleTimeString());
            // toast.success('Report generated successfully');
            // toast(<CustomToast id="123" type="success" message="Report generated successfully" />);
            toast(<CustomToast id={`success-report-${Date.now()}`} type="success" message="Report generated successfully" />, {
                toastId: 'report-success'
            });
        } catch (err) {
            console.error('Error generating report:', err.response?.data || err.message);
            setError('Failed to generate report. ' + (err.response?.data?.details || err.message));
            // toast.error('Failed to generate report');
            // toast(<CustomToast id="123" type="error" message="Failed to generate report" />);
            toast(<CustomToast id={`error-report-${Date.now()}`} type="error" message="Failed to generate report" />, {
                toastId: 'report-error'
            });
        } finally {
            setLoading(false);
        }
    }, [reportType, filterData]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            generateReport();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filterData, reportType, generateReport]);

    const getFilterDescription = (key, value) => {
        if (!value) return '';
        switch (key) {
            case 'startDate': return `From ${value}`;
            case 'endDate': return `To ${value}`;
            case 'branchId': return `Branch: ${allBranches.find(b => b.id === parseInt(value))?.name || value}`;
            case 'paymentMethod': return `Method: ${value}`;
            case 'customerId': return `Customer: ${allCustomers.find(c => c.id === parseInt(value))?.fullname || value}`;
            case 'status': return `Status: ${value}`;
            case 'minTotal': return `Min Total: ₦${Number(value).toFixed(2)}`;
            case 'maxTotal': return `Max Total: ₦${Number(value).toFixed(2)}`;
            case 'staffId': return `Staff: ${allUsers.find(u => u.id === parseInt(value))?.fullname || value}`;
            case 'productId': return `Product: ${allProducts.find(p => p.id === parseInt(value))?.name || value}`;
            case 'category': return `Category: ${value}`;
            case 'inventoryTransactionType': return `Inv. Type: ${value}`;
            case 'rawMaterialId': return `Raw Material: ${allRawMaterials.find(rm => rm.id === parseInt(value))?.name || value}`;
            case 'rawMaterialTransactionType': return `RM Trans. Type: ${value}`;
            case 'groupBy': return `Grouped By: ${value}`;
            case 'transactionType': return `Sales Type: ${value}`;
            default: return `${key}: ${value}`;
        }
    };

    const getReportHeader = () => {
        if (!reportResult) return null;

        const { reportTitle, filtersUsed } = reportResult;
        const filterDescriptions = [];

        const orderedFilters = [
            'startDate', 'endDate', 'branchId', 'staffId', 'customerId', 'productId', 'category',
            'paymentMethod', 'status', 'minTotal', 'maxTotal', 'transactionType',
            'inventoryTransactionType', 'rawMaterialId', 'rawMaterialTransactionType', 'groupBy'
        ];

        orderedFilters.forEach(key => {
            if (filtersUsed[key] && filtersUsed[key] !== '' && filtersUsed[key] !== null && filtersUsed[key] !== undefined) {
                filterDescriptions.push(getFilterDescription(key, filtersUsed[key]));
            }
        });

        return (
            <div className="report-header-for-print mb-4">
                <h3 className="text-center report-print-title">{reportTitle}</h3>
                {filterDescriptions.length > 0 && (
                    <p className="text-center report-print-filters">
                        Filters: {filterDescriptions.join(' | ')}
                    </p>
                )}
                <hr />
            </div>
        );
    };

    const handlePrint = () => {
        const printContent = reportContentRef.current;
        if (!printContent) {
            // toast.warning("No report content to print");
            // toast(<CustomToast id="123" type="warning" message="No report content to print" />);
            toast(<CustomToast id={`warning-print-${Date.now()}`} type="warning" message="No report content to print" />, {
                toastId: 'print-warning'
            });
            return;
        }

        const printWindow = window.open('', '', 'height=700,width=1000');
        printWindow.document.write('<html><head><title>Print Report</title>');

        printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />');

        const reportsCssLink = document.querySelector('link[href*="reports.css"]');
        let reportsCssPromise = Promise.resolve('');
        if (reportsCssLink) {
            reportsCssPromise = fetch(reportsCssLink.href)
                .then(res => res.text())
                .catch(err => {
                    console.error("Failed to load reports.css for printing", err);
                    return '';
                });
        }

        reportsCssPromise.then(css => {
            printWindow.document.write(`<style>${css}</style>`);
            printWindow.document.write(`
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; margin: 0; padding: 0; }
                    @page { size: A4 landscape; margin: 1cm; }
                    .report-header-for-print { text-align: center; margin-bottom: 20px; }
                    .report-print-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px; }
                    .report-print-filters { font-size: 14px; color: #666; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
                    th { background-color: #e9ecef !important; color: #333 !important; }
                    .text-end { text-align: right; }
                    .fw-bold { font-weight: bold; }
                    .text-success { color: #4a1480 !important; }
                    .text-danger { color: #dc3545 !important; }
                    img { max-width: 50px; max-height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
                    .table-success { background-color: #d4edda !important; }
                    .table-danger { background-color: #f8d7da !important; }
                    .table-primary { background-color: #cfe2ff !important; }
                    /* Hide UI elements not meant for print */
                    .reports-page-container .form-card,
                    .reports-page-container .filter-card,
                    .reports-page-container .main-header,
                    .reports-page-container .card-title,
                    .reports-page-container .btn {
                        display: none !important;
                    }
                    .table-card { border: none !important; box-shadow: none !important; padding: 0 !important; }

                    /* Ensure text colors are printed */
                    @media print {
                        body {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .text-success { color: #4a1480 !important; }
                        .text-danger { color: #dc3545 !important; }
                    }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        });
        // toast.info('Preparing report for printing');
        // toast(<CustomToast id="123" type="info" message="Preparing report for printing" />);
        toast(<CustomToast id={`info-print-${Date.now()}`} type="info" message="Preparing report for printing" />, {
            toastId: 'print-info'
        });
    };

    const exportToCSV = () => {
        if (!reportResult || !reportResult.reportData) {
            // toast.warning('No data to export');
            // toast(<CustomToast id="123" type="warning" message="No data to export" />);
            toast(<CustomToast id={`warning-export-${Date.now()}`} type="warning" message="No data to export" />, {
                toastId: 'export-warning'
            });
            return;
        }

        try {
            const data = reportResult.reportData;
            let csvContent = "data:text/csv;charset=utf-8,";

            // Add report title
            csvContent += `${reportResult.reportTitle}\r\n\r\n`;

            // Add filters
            const filters = Object.entries(reportResult.filtersUsed || {})
                .filter(([key, value]) => value && value !== '')
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');

            if (filters) {
                csvContent += `Filters: ${filters}\r\n\r\n`;
            }

            // Add headers and data based on report type
            if (reportType === 'profit-loss') {
                csvContent += "Item,Amount (₦)\r\n";
                csvContent += `Total Revenue (Sales),${data.totalRevenue?.toFixed(2) || '0.00'}\r\n`;
                csvContent += `Total Cost of Goods Sold (COGS),${data.totalCostOfGoodsSold?.toFixed(2) || '0.00'}\r\n`;
                csvContent += `Gross Profit,${data.grossProfit?.toFixed(2) || '0.00'}\r\n`;
                csvContent += `Total Operating Expenses,${data.totalOperatingExpenses?.toFixed(2) || '0.00'}\r\n`;
                csvContent += `Net Profit,${data.netProfit?.toFixed(2) || '0.00'}\r\n`;
            } else if (Array.isArray(data) && data.length > 0) {
                // Get headers from the first object
                const headers = Object.keys(data[0]);
                csvContent += "S/N," + headers.join(",") + "\r\n";

                // Add data rows with serial numbers
                data.forEach((row, index) => {
                    const values = Object.values(row).map(value =>
                        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                    );
                    csvContent += `${index + 1},${values.join(",")}\r\n`;
                });
            }

            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${reportResult.reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // toast.success('CSV exported successfully');
            // toast(<CustomToast id="123" type="success" message="CSV exported successfully" />);
            toast(<CustomToast id={`success-export-${Date.now()}`} type="success" message="CSV exported successfully" />, {
                toastId: 'export-success'
            });
        } catch (err) {
            console.error('Error exporting CSV:', err);
            // toast.error('Failed to export CSV');
            // toast(<CustomToast id="123" type="error" message="Failed to export CSV" />);
            toast(<CustomToast id={`error-export-${Date.now()}`} type="error" message="Failed to export CSV" />, {
                toastId: 'export-error'
            });
        }
    };

    const renderReportTable = () => {
        if (!reportResult || reportResult.reportData === undefined || reportResult.reportData === null) {
            return <Alert variant="info">No data available for the selected filters.</Alert>;
        }

        const data = reportResult.reportData;

        switch (reportType) {
            case 'profit-loss':
                const plData = data;
                return (
                    <Table striped bordered hover responsive className="report-table">
                        <thead>
                            <tr>
                                <th colSpan="2" className="text-center">Profit & Loss Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="table-row-revenue">
                                <td><FaDollarSign className="me-2" /> Total Revenue (Sales)</td>
                                <td className="text-end">₦{plData.totalRevenue?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-cogs">
                                <td><FaShoppingBag className="me-2" /> Total Cost of Goods Sold (COGS)</td>
                                <td className="text-end">-₦{plData.totalCostOfGoodsSold?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-profit fw-bold">
                                <td><FaChartLine className="me-2" /> Gross Profit</td>
                                <td className="text-end">₦{plData.grossProfit?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-expenses">
                                <td>Total Operating Expenses</td>
                                <td className="text-end">-₦{plData.totalOperatingExpenses?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-net fw-bold">
                                <td>Net Profit</td>
                                <td className="text-end">₦{plData.netProfit?.toFixed(2) || '0.00'}</td>
                            </tr>
                        </tbody>
                    </Table>
                );
            case 'detailed-sales':
            case 'product-profitability':
            case 'inventory-movement':
            case 'raw-material-consumption':
            case 'sales-performance-by-staff-branch':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No data found matching the selected filters for this report.</Alert>;
                }

                if (reportType === 'detailed-sales') {
                    const detailedSales = data;
                    return (
                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Sale ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Cashier</th>
                                    <th>Branch</th>
                                    <th>Payment Method</th>
                                    <th>Status</th>
                                    <th>Sales Type</th>
                                    <th>Total Amt (₦)</th>
                                    <th>COGS (₦)</th>
                                    <th>Profit (₦)</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailedSales.map((sale, index) => (
                                    <tr key={sale.sale_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{sale.sale_id}</td>
                                        <td>{new Date(sale.sale_date).toLocaleString()}</td>
                                        <td>{sale.customer_name || 'N/A'}</td>
                                        <td>{sale.cashier_name || 'N/A'}</td>
                                        <td>{sale.branch_name || 'N/A'}</td>
                                        <td>{sale.payment_method}</td>
                                        <td>{sale.status}</td>
                                        <td>{sale.transaction_type || 'N/A'}</td>
                                        <td className="text-end">₦{Number(sale.total_amount).toFixed(2)}</td>
                                        <td className="text-end">₦{Number(sale.total_cogs).toFixed(2)}</td>
                                        <td className="text-end">
                                            <span className={Number(sale.total_profit) >= 0 ? 'text-success' : 'text-danger'}>
                                                ₦{Number(sale.total_profit).toFixed(2)}
                                            </span>
                                        </td>
                                        <td>{sale.note || 'N/A'}</td>
                                    </tr>
                                ))}
                                <tr className="table-totals">
                                    <td colSpan="9" className="text-end fw-bold">Grand Totals:</td>
                                    <td className="text-end fw-bold">₦{detailedSales.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{detailedSales.reduce((sum, s) => sum + Number(s.total_cogs), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{detailedSales.reduce((sum, s) => sum + Number(s.total_profit), 0).toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </Table>
                    );
                } else if (reportType === 'product-profitability') {
                    const productProfitability = data;
                    return (
                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Image</th>
                                    <th>Total Qty Sold</th>
                                    <th>Total Sales (₦)</th>
                                    <th>Total COGS (₦)</th>
                                    <th>Gross Profit (₦)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productProfitability.map((prod, index) => (
                                    <tr key={prod.product_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{prod.product_name}</td>
                                        <td>{prod.category}</td>
                                        <td>
                                            <img
                                                src={prod.image_url || 'https://placehold.co/50x50/e0e0e0/000000?text=No+Img'}
                                                alt={prod.product_name}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/e0e0e0/000000?text=Img+Err'; }}
                                            />
                                        </td>
                                        <td className="text-end">{Number(prod.total_quantity_sold).toFixed(0)}</td>
                                        <td className="text-end">₦{Number(prod.total_sales_amount).toFixed(2)}</td>
                                        <td className="text-end">₦{Number(prod.total_product_cogs).toFixed(2)}</td>
                                        <td className="text-end">
                                            <span className={Number(prod.product_gross_profit) >= 0 ? 'text-success' : 'text-danger'}>
                                                ₦{Number(prod.product_gross_profit).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="table-totals">
                                    <td colSpan="4" className="text-end fw-bold">Grand Totals:</td>
                                    <td className="text-end fw-bold">{productProfitability.reduce((sum, p) => sum + Number(p.total_quantity_sold), 0).toFixed(0)}</td>
                                    <td className="text-end fw-bold">₦{productProfitability.reduce((sum, p) => sum + Number(p.total_sales_amount), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{productProfitability.reduce((sum, p) => sum + Number(p.total_product_cogs), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{productProfitability.reduce((sum, p) => sum + Number(p.product_gross_profit), 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </Table>
                    );
                } else if (reportType === 'inventory-movement') {
                    const inventoryMovements = data;
                    return (
                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Trans. ID</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Unit</th>
                                    <th>Qty Change</th>
                                    <th>Type</th>
                                    <th>Reason</th>
                                    <th>Recorded By</th>
                                    <th>Branch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryMovements.map((movement, index) => (
                                    <tr key={movement.transaction_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{movement.transaction_id}</td>
                                        <td>{new Date(movement.transaction_date).toLocaleString()}</td>
                                        <td>{movement.product_name}</td>
                                        <td>{movement.product_unit || 'units'}</td>
                                        <td className={Number(movement.quantity_change) > 0 ? 'text-success' : 'text-danger'}>
                                            {Number(movement.quantity_change) > 0 ? '+' : ''}{Number(movement.quantity_change).toFixed(0)}
                                        </td>
                                        <td>{movement.transaction_type}</td>
                                        <td>{movement.reason || 'N/A'}</td>
                                        <td>{movement.recorded_by_staff || 'N/A'}</td>
                                        <td>{movement.branch_name || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    );
                } else if (reportType === 'raw-material-consumption') {
                    const rmConsumption = data;
                    return (
                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Trans. ID</th>
                                    <th>Date</th>
                                    <th>Raw Material</th>
                                    <th>Unit</th>
                                    <th>Qty Consumed</th>
                                    <th>Type</th>
                                    <th>Reason</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rmConsumption.map((item, index) => (
                                    <tr key={item.transaction_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{item.transaction_id}</td>
                                        <td>{new Date(item.transaction_date).toLocaleString()}</td>
                                        <td>{item.raw_material_name}</td>
                                        <td>{item.raw_material_unit || 'units'}</td>
                                        <td className="text-danger">{Number(item.quantity_change).toFixed(2)}</td>
                                        <td>{item.transaction_type}</td>
                                        <td>{item.reason || 'N/A'}</td>
                                        <td>{item.recorded_by_staff || 'N/A'}</td>
                                    </tr>
                                ))}
                                <tr className="table-totals">
                                    <td colSpan="5" className="text-end fw-bold">Total Consumed:</td>
                                    <td className="text-danger fw-bold">{rmConsumption.reduce((sum, i) => sum + Number(i.quantity_change), 0).toFixed(2)}</td>
                                    <td colSpan="3"></td>
                                </tr>
                            </tbody>
                        </Table>
                    );
                } else if (reportType === 'sales-performance-by-staff-branch') {
                    const salesPerformance = data;
                    const groupByField = filterData.groupBy === 'branch' ? 'Branch' : 'Staff Member';
                    return (
                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>{groupByField}</th>
                                    <th>Total Sales Amount (₦)</th>
                                    <th>Total Profit (₦)</th>
                                    <th>Total Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesPerformance.map((perf, index) => (
                                    <tr key={perf.group_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{perf.group_name || 'N/A'}</td>
                                        <td className="text-end">₦{Number(perf.total_sales_amount).toFixed(2)}</td>
                                        <td className="text-end">
                                            <span className={Number(perf.total_profit) >= 0 ? 'text-success' : 'text-danger'}>
                                                ₦{Number(perf.total_profit).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="text-end">{Number(perf.total_transactions).toFixed(0)}</td>
                                    </tr>
                                ))}
                                <tr className="table-totals">
                                    <td className="text-end fw-bold" colSpan="2">Grand Totals:</td>
                                    <td className="text-end fw-bold">₦{salesPerformance.reduce((sum, p) => sum + Number(p.total_sales_amount), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{salesPerformance.reduce((sum, p) => sum + Number(p.total_profit), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">{salesPerformance.reduce((sum, p) => sum + Number(p.total_transactions), 0).toFixed(0)}</td>
                                </tr>
                            </tbody>
                        </Table>
                    );
                }
                return null;
            default:
                return null;
        }
    };

    return (
        <div className="reports-page-container">
            <div className="page-header">
                <h1 className="main-header"><FaFileInvoiceDollar className="me-2" /> Financial Reports</h1>
                {lastUpdated && <div className="last-updated">Last updated: {lastUpdated}</div>}
            </div>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}

            <Card className="form-card mb-4">
                <div className="card-header">
                    <h2 className="card-title">Select Report Type</h2>
                    <Button variant="outline-primary" size="sm" onClick={fetchDropdownData} disabled={loading}>
                        <FaSync className="me-1" /> Refresh Data
                    </Button>
                </div>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="3">Report Type:</Form.Label>
                    <Col sm="9">
                        <Form.Control as="select" value={reportType} onChange={(e) => {
                            setReportType(e.target.value);
                            clearFilters();
                        }}>
                            <option value="profit-loss">Profit & Loss Summary</option>
                            <option value="detailed-sales">Detailed Sales Report</option>
                            <option value="product-profitability">Product Profitability Report</option>
                            <option value="inventory-movement">Inventory Movement Report (Finished Products)</option>
                            <option value="raw-material-consumption">Raw Material Consumption Report</option>
                            <option value="sales-performance-by-staff-branch">Sales Performance (Staff/Branch)</option>
                        </Form.Control>
                    </Col>
                </Form.Group>
            </Card>

            <Card className="filter-card mb-4">
                <div className="card-header">
                    <h2 className="card-title">Report Filters <FaFilter className="ms-2 text-muted" /></h2>
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                        <FaTrashAlt className="me-1" /> Clear All
                    </Button>
                </div>
                <Form onSubmit={(e) => { e.preventDefault(); generateReport(); }}>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1" />Start Date</Form.Label>
                                <Form.Control type="date" name="startDate" value={filterData.startDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1" />End Date</Form.Label>
                                <Form.Control type="date" name="endDate" value={filterData.endDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaStore className="me-1" />Branch</Form.Label>
                                <Form.Control as="select" name="branchId" value={filterData.branchId} onChange={handleFilterChange}>
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>

                        {(reportType === 'detailed-sales' || reportType === 'sales-performance-by-staff-branch') && (
                            <>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaMoneyBillWave className="me-1" />Payment Method</Form.Label>
                                        <Form.Control as="select" name="paymentMethod" value={filterData.paymentMethod} onChange={handleFilterChange}>
                                            <option value="">All Methods</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Credit">Credit</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaUsers className="me-1" />Customer</Form.Label>
                                        <Form.Control as="select" name="customerId" value={filterData.customerId} onChange={handleFilterChange}>
                                            <option value="">All Customers</option>
                                            {allCustomers.map(cust => (
                                                <option key={cust.id} value={cust.id}>{cust.fullname}</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaChartLine className="me-1" />Sale Status</Form.Label>
                                        <Form.Control as="select" name="status" value={filterData.status} onChange={handleFilterChange}>
                                            <option value="">All Statuses</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Partially Paid">Partially Paid</option>
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaUsers className="me-1" />Staff (Cashier)</Form.Label>
                                        <Form.Control as="select" name="staffId" value={filterData.staffId} onChange={handleFilterChange}>
                                            <option value="">All Staff</option>
                                            {allUsers.map(user => (
                                                <option key={user.id} value={user.id}>{user.fullname} ({user.role})</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaShoppingBag className="me-1" />Sales Transaction Type</Form.Label>
                                        <Form.Control as="select" name="transactionType" value={filterData.transactionType} onChange={handleFilterChange}>
                                            <option value="">All Types</option>
                                            <option value="Retail">Retail</option>
                                            <option value="B2B">B2B (Business to Business)</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Min Total</Form.Label>
                                        <Form.Control type="number" name="minTotal" value={filterData.minTotal} onChange={handleFilterChange} placeholder="Min Total" step="0.01" />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group>
                                        <Form.Label>Max Total</Form.Label>
                                        <Form.Control type="number" name="maxTotal" value={filterData.maxTotal} onChange={handleFilterChange} placeholder="Max Total" step="0.01" />
                                    </Form.Group>
                                </Col>
                            </>
                        )}

                        {(reportType === 'product-profitability' || reportType === 'inventory-movement') && (
                            <>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaBox className="me-1" />Product</Form.Label>
                                        <Form.Control as="select" name="productId" value={filterData.productId} onChange={handleFilterChange}>
                                            <option value="">All Products</option>
                                            {allProducts.map(prod => (
                                                <option key={prod.id} value={prod.id}>{prod.name}</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaCubes className="me-1" />Category</Form.Label>
                                        <Form.Control as="select" name="category" value={filterData.category} onChange={handleFilterChange}>
                                            <option value="">All Categories</option>
                                            {allCategories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            </>
                        )}
                        {reportType === 'inventory-movement' && (
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label><FaExchangeAlt className="me-1" />Inventory Transaction Type</Form.Label>
                                    <Form.Control as="select" name="inventoryTransactionType" value={filterData.inventoryTransactionType} onChange={handleFilterChange}>
                                        <option value="">All Types</option>
                                        <option value="production">Production</option>
                                        <option value="sale">Sale</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        )}

                        {reportType === 'raw-material-consumption' && (
                            <>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaSeedling className="me-1" />Raw Material</Form.Label>
                                        <Form.Control as="select" name="rawMaterialId" value={filterData.rawMaterialId} onChange={handleFilterChange}>
                                            <option value="">All Raw Materials</option>
                                            {allRawMaterials.map(rm => (
                                                <option key={rm.id} value={rm.id}>{rm.name}</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaExchangeAlt className="me-1" />RM Transaction Type</Form.Label>
                                        <Form.Control as="select" name="rawMaterialTransactionType" value={filterData.rawMaterialTransactionType} onChange={handleFilterChange}>
                                            <option value="">All Types</option>
                                            <option value="restock">Restock</option>
                                            <option value="production_use">Production Use</option>
                                            <option value="waste">Waste</option>
                                            <option value="adjustment">Adjustment</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            </>
                        )}

                        {reportType === 'sales-performance-by-staff-branch' && (
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label><FaUsers className="me-1" />Group By</Form.Label>
                                    <Form.Control as="select" name="groupBy" value={filterData.groupBy} onChange={handleFilterChange}>
                                        <option value="staff">Staff</option>
                                        <option value="branch">Branch</option>
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                </Form>
            </Card>

            <Card className="table-card mb-4">
                <div className="card-header">
                    <h2 className="card-title">Report Results</h2>
                    <div className="action-buttons">
                        <Button variant="outline-primary" size="sm" onClick={exportToCSV} disabled={!reportResult || loading}>
                            <FaDownload className="me-1" /> Export CSV
                        </Button>
                        <Button variant="primary" size="sm" onClick={handlePrint} disabled={!reportResult || loading || (Array.isArray(reportResult.reportData) && reportResult.reportData.length === 0 && reportType !== 'profit-loss')}>
                            <FaPrint className="me-1" /> Print Report
                        </Button>
                    </div>
                </div>
                <div ref={reportContentRef}>
                    {reportResult && getReportHeader()}
                    {loading ? (
                        <div className="text-center my-5"><Spinner animation="border" /><p>Generating report...</p></div>
                    ) : reportResult && reportResult.reportData !== undefined && reportResult.reportData !== null ? (
                        Array.isArray(reportResult.reportData) && reportResult.reportData.length === 0 && reportType !== 'profit-loss' ? (
                            <Alert variant="info">No data available for the selected filters and period.</Alert>
                        ) : (
                            renderReportTable()
                        )
                    ) : (
                        <Alert variant="info">Select a report type and filters to view results.</Alert>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ReportsPage;