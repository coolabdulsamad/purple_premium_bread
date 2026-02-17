// src/pages/ReportsPage.jsx - Enhanced with Consistent Styling
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    FaFileInvoiceDollar, FaChartLine, FaShoppingBag, FaDollarSign,
    FaPrint, FaFilter, FaTrashAlt, FaCalendarAlt, FaStore,
    FaUsers, FaBox, FaCubes, FaExchangeAlt, FaSeedling,
    FaMoneyBillWave, FaDownload, FaSync, FaGift, FaReceipt,
    FaTrash, FaIndustry, FaUserTie, FaShieldAlt, FaPercentage,
    FaCalculator,
    FaMotorcycle
} from 'react-icons/fa';
import '../assets/styles/reports.css';
import CustomToast from '../components/CustomToast';
import api from '../api/axiosInstance';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const ReportsPage = () => {
    const [reportType, setReportType] = useState('profit-loss');
    const [reportResult, setReportResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to access reports.');
            toast(<CustomToast id={`error-auth-${Date.now()}`} type="error" message="Authentication required" />, {
                toastId: 'auth-error'
            });
            // Optional: redirect to login after a delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            setIsAuthenticated(true);
            // Set default date range
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            setFilterData(prev => ({
                ...prev,
                startDate: thirtyDaysAgo.toISOString().split('T')[0],
                endDate: today.toISOString().split('T')[0],
            }));
        }
    }, []);

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
        expenseType: '',
        expenseCategory: '',
        salaryStatus: '',
        wasteReason: '',
        issueType: '',
        // Rider filters
        riderId: '',
    });

    // Dropdown data states
    const [allCustomers, setAllCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [allRawMaterials, setAllRawMaterials] = useState([]);
    const [allOperatingExpenses, setAllOperatingExpenses] = useState([]);
    // NEW: Riders state
    const [allRiders, setAllRiders] = useState([]);

    const reportContentRef = useRef(null);

    // Fetch dropdown data only when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchDropdownData();
        }
    }, [isAuthenticated]);

    const fetchDropdownData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const [
                customersRes,
                productsRes,
                categoriesRes,
                usersRes,
                branchesRes,
                rawMaterialsRes,
                operatingExpensesRes,
                // NEW: Fetch riders
                ridersRes
            ] = await Promise.all([
                api.get('/customers'),
                api.get('/products'),
                api.get('/categories'),
                api.get('/users'),
                api.get('/branches'),
                api.get('/raw-materials'),
                api.get('/operating-expenses'),
                api.get('/riders?status=active'),
            ]);

            // Check if responses have data
            if (customersRes.data) setAllCustomers(customersRes.data);
            if (productsRes.data) setAllProducts(productsRes.data);
            if (categoriesRes.data) setAllCategories(categoriesRes.data);
            if (usersRes.data) setAllUsers(usersRes.data);
            if (branchesRes.data) setAllBranches(branchesRes.data);
            if (rawMaterialsRes.data) setAllRawMaterials(rawMaterialsRes.data);
            if (operatingExpensesRes.data) setAllOperatingExpenses(operatingExpensesRes.data);
            // NEW: Set riders data
            if (ridersRes.data) {
                // Handle both possible response formats
                const ridersData = ridersRes.data.riders || ridersRes.data;
                setAllRiders(ridersData);
            }

            toast(<CustomToast id={`success-dropdown-${Date.now()}`} type="success" message="Filter options loaded successfully" />, {
                toastId: 'dropdown-success'
            });
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load filter options';
            setError(`Failed to load filter options: ${errorMessage}`);
            toast(<CustomToast id={`error-dropdown-${Date.now()}`} type="error" message="Failed to load filter options" />, {
                toastId: 'dropdown-error'
            });
        } finally {
            setLoading(false);
        }
    };

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
            expenseType: '',
            expenseCategory: '',
            salaryStatus: '',
            wasteReason: '',
            issueType: '',
            riderId: '',
        });
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
                'advantage-sales-analysis': ['startDate', 'endDate', 'branchId', 'productId', 'staffId'],
                'product-profitability': ['startDate', 'endDate', 'productId', 'category', 'branchId'],
                'inventory-movement': ['startDate', 'endDate', 'productId', 'inventoryTransactionType'],
                'raw-material-consumption': ['startDate', 'endDate', 'rawMaterialId', 'rawMaterialTransactionType', 'branchId'],
                'sales-performance-by-staff-branch': ['startDate', 'endDate', 'staffId', 'branchId', 'groupBy'],
                'free-stock': ['startDate', 'endDate', 'productId', 'branchId'],
                'discount-analysis': ['startDate', 'endDate', 'productId', 'branchId', 'staffId'],
                'exchange-requests': ['startDate', 'endDate', 'customerId', 'status'],
                'operating-expenses': ['startDate', 'endDate', 'expenseType', 'expenseCategory', 'branchId'],
                'salary-payroll': ['startDate', 'endDate', 'staffId', 'salaryStatus'],
                'waste-stock': ['startDate', 'endDate', 'productId', 'wasteReason'],
                'stock-issue-transfer': ['startDate', 'endDate', 'productId', 'issueType'],
                'production-efficiency': ['startDate', 'endDate', 'productId'],
                // NEW: Rider reports filters
                'rider-sales': ['startDate', 'endDate', 'riderId', 'branchId', 'paymentMethod', 'status'],
                'rider-performance': ['startDate', 'endDate', 'riderId'],
                'rider-payments': ['startDate', 'endDate', 'riderId', 'paymentMethod'],
                'rider-collection': ['startDate', 'endDate', 'riderId'],
                'rider-sales-summary': ['startDate', 'endDate', 'branchId'], // NEW
            };

            const relevantFilters = relevantFiltersMap[reportType] || [];

            for (const key in filterData) {
                if (filterData[key] !== '' && filterData[key] !== null && filterData[key] !== undefined) {
                    if (relevantFilters.includes(key)) {
                        params.append(key, filterData[key]);
                    }
                }
            }

            const response = await api.get(`/reports/${reportType}?${params.toString()}`);
            setReportResult(response.data);
            setLastUpdated(new Date().toLocaleTimeString());
            toast(<CustomToast id={`success-report-${Date.now()}`} type="success" message="Report generated successfully" />, {
                toastId: 'report-success'
            });
        } catch (err) {
            console.error('Error generating report:', err.response?.data || err.message);
            setError('Failed to generate report. ' + (err.response?.data?.details || err.message));
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
            case 'expenseType': return `Expense Type: ${value}`;
            case 'expenseCategory': return `Expense Category: ${value}`;
            case 'salaryStatus': return `Salary Status: ${value}`;
            case 'wasteReason': return `Waste Reason: ${value}`;
            case 'issueType': return `Issue Type: ${value}`;
            case 'riderId': return `Rider: ${allRiders.find(r => r.id === parseInt(value))?.fullname || value}`;
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
            'inventoryTransactionType', 'rawMaterialId', 'rawMaterialTransactionType', 'groupBy',
            'expenseType', 'expenseCategory', 'salaryStatus', 'wasteReason', 'issueType',
            'riderId'
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
        toast(<CustomToast id={`info-print-${Date.now()}`} type="info" message="Preparing report for printing" />, {
            toastId: 'print-info'
        });
    };

    const exportToCSV = () => {
        if (!reportResult || !reportResult.reportData) {
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
                csvContent += `Total Salaries,${data.totalSalaries?.toFixed(2) || '0.00'}\r\n`;
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

            toast(<CustomToast id={`success-export-${Date.now()}`} type="success" message="CSV exported successfully" />, {
                toastId: 'export-success'
            });
        } catch (err) {
            console.error('Error exporting CSV:', err);
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
            // Update the profit-loss report table rendering
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
                            {/* Revenue Breakdown */}
                            <tr className="table-row-revenue">
                                <td><FaDollarSign className="me-2" /> Total Revenue (Sales)</td>
                                <td className="text-end">₦{plData.totalRevenue?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-regular-sales">
                                <td><FaShoppingBag className="me-2" /> &nbsp;&nbsp; Regular Sales</td>
                                <td className="text-end">₦{plData.totalRegularSales?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-advantage-sales">
                                <td><FaChartLine className="me-2" /> &nbsp;&nbsp; Advantage Sales</td>
                                <td className="text-end">₦{plData.totalAdvantageSales?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-advantage-amount">
                                <td><FaMoneyBillWave className="me-2" /> &nbsp;&nbsp; Total Advantage Amount (Premium)</td>
                                <td className="text-end text-success">+₦{plData.totalAdvantageAmount?.toFixed(2) || '0.00'}</td>
                            </tr>

                            {/* COGS */}
                            <tr className="table-row-cogs">
                                <td><FaShoppingBag className="me-2" /> Total Cost of Goods Sold (COGS)</td>
                                <td className="text-end">-₦{plData.totalCostOfGoodsSold?.toFixed(2) || '0.00'}</td>
                            </tr>

                            {/* Gross Profit */}
                            <tr className="table-row-profit fw-bold">
                                <td><FaChartLine className="me-2" /> Gross Profit</td>
                                <td className="text-end">₦{plData.grossProfit?.toFixed(2) || '0.00'}</td>
                            </tr>

                            {/* Expenses */}
                            <tr className="table-row-expenses">
                                <td><FaMoneyBillWave className="me-2" /> Total Operating Expenses</td>
                                <td className="text-end">-₦{plData.totalOperatingExpenses?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-salaries">
                                <td><FaUserTie className="me-2" /> Total Salaries & Wages</td>
                                <td className="text-end">-₦{plData.totalSalaries?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-total-expenses fw-bold">
                                <td><FaMoneyBillWave className="me-2" /> Total Expenses</td>
                                <td className="text-end">-₦{plData.totalExpenses?.toFixed(2) || '0.00'}</td>
                            </tr>

                            {/* Net Profit Before Tax */}
                            <tr className="table-row-net-before-tax fw-bold table-warning">
                                <td><FaChartLine className="me-2" /> Net Profit Before Tax</td>
                                <td className="text-end">₦{plData.netProfitBeforeTax?.toFixed(2) || '0.00'}</td>
                            </tr>

                            {/* Tax Calculation */}
                            <tr className="table-row-taxable-income">
                                <td><FaCalculator className="me-2" /> Taxable Income</td>
                                <td className="text-end">₦{plData.taxableIncome?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="table-row-tax">
                                <td><FaPercentage className="me-2" /> Corporate Tax ({plData.taxRate?.toFixed(1) || '30.0'}%)</td>
                                <td className="text-end text-danger">-₦{plData.taxAmount?.toFixed(2) || '0.00'}</td>
                            </tr>

                            {/* Final Net Profit */}
                            <tr className="table-row-net fw-bold table-primary">
                                <td><FaChartLine className="me-2" /> Net Profit After Tax</td>
                                <td className="text-end">₦{plData.netProfit?.toFixed(2) || '0.00'}</td>
                            </tr>
                        </tbody>
                    </Table>
                );

            // Add the new Advantage Sales Analysis Report rendering
            case 'advantage-sales-analysis':
                if (!reportResult || !reportResult.reportData || !Array.isArray(reportResult.reportData) || reportResult.reportData.length === 0) {
                    return <Alert variant="info">No advantage sales data found matching the selected filters.</Alert>;
                }

                const advantageData = reportResult.reportData;
                const advantageSummary = reportResult.summary || {};

                return (
                    <div>
                        {/* Summary Statistics */}
                        <Card className="mb-4 bg-light">
                            <Card.Body>
                                <Row>
                                    <Col md={3} className="text-center">
                                        <h5>Total Advantage Sales</h5>
                                        <h3 className="text-primary">{advantageSummary.totalAdvantageSales || 0}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Total Advantage Amount</h5>
                                        <h3 className="text-success">₦{Number(advantageSummary.totalAdvantageAmount || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Total Sales Amount</h5>
                                        <h3 className="text-info">₦{Number(advantageSummary.totalSalesAmount || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Avg Advantage/Sale</h5>
                                        <h3 className="text-warning">₦{Number(advantageSummary.averageAdvantagePerSale || 0).toFixed(2)}</h3>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Detailed Table */}
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
                                    <th>Base Subtotal (₦)</th>
                                    <th>Advantage Amount (₦)</th>
                                    <th>Final Subtotal (₦)</th>
                                    <th>Total Amount (₦)</th>
                                    <th>COGS (₦)</th>
                                    <th>Total Profit (₦)</th>
                                    <th>Advantage Profit (₦)</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advantageData.map((sale, index) => (
                                    <tr key={sale.sale_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{sale.sale_id}</td>
                                        <td>{new Date(sale.sale_date).toLocaleString()}</td>
                                        <td>{sale.customer_name || 'Walk-in Customer'}</td>
                                        <td>{sale.cashier_name || 'N/A'}</td>
                                        <td>{sale.branch_name || 'N/A'}</td>
                                        <td>{sale.payment_method}</td>
                                        <td>{sale.status}</td>
                                        <td className="text-end">₦{Number(sale.base_subtotal || sale.base_sales_amount || 0).toFixed(2)}</td>
                                        <td className="text-end text-success">+₦{Number(sale.advantage_total || 0).toFixed(2)}</td>
                                        <td className="text-end">₦{Number(sale.subtotal || 0).toFixed(2)}</td>
                                        <td className="text-end">₦{Number(sale.total_amount).toFixed(2)}</td>
                                        <td className="text-end">₦{Number(sale.total_cogs).toFixed(2)}</td>
                                        <td className="text-end">
                                            <span className={Number(sale.total_profit) >= 0 ? 'text-success' : 'text-danger'}>
                                                ₦{Number(sale.total_profit).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="text-end text-success">
                                            +₦{Number(sale.advantage_profit || 0).toFixed(2)}
                                        </td>
                                        <td>{sale.note || 'N/A'}</td>
                                    </tr>
                                ))}
                                <tr className="table-totals table-primary">
                                    <td colSpan="8" className="text-end fw-bold">Grand Totals:</td>
                                    <td className="text-end fw-bold">₦{advantageData.reduce((sum, s) => sum + Number(s.base_subtotal || s.base_sales_amount || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold text-success">+₦{advantageData.reduce((sum, s) => sum + Number(s.advantage_total || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{advantageData.reduce((sum, s) => sum + Number(s.subtotal || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{advantageData.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{advantageData.reduce((sum, s) => sum + Number(s.total_cogs), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{advantageData.reduce((sum, s) => sum + Number(s.total_profit), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold text-success">+₦{advantageData.reduce((sum, s) => sum + Number(s.advantage_profit || 0), 0).toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                );

            // Update the detailed sales report to show advantage amounts
            case 'detailed-sales':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No sales data found matching the selected filters.</Alert>;
                }
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
                                <th>Subtotal (₦)</th>
                                <th>Discount (₦)</th>
                                <th>Tax (₦)</th>
                                <th>Total Amt (₦)</th>
                                <th>COGS (₦)</th>
                                <th>Profit (₦)</th>
                                <th>Advantage Sale</th>
                                <th>Advantage Amt (₦)</th>
                                <th>Stock Source</th>
                                <th>Receipt Ref</th>
                                <th>Receipt Images</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((sale, index) => (
                                <tr key={sale.sale_id || index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{sale.sale_id}</td>
                                    <td>{new Date(sale.sale_date).toLocaleString()}</td>
                                    <td>{sale.customer_name || 'Walk-in Customer'}</td>
                                    <td>{sale.cashier_name || 'N/A'}</td>
                                    <td>{sale.branch_name || 'N/A'}</td>
                                    <td>{sale.payment_method}</td>
                                    <td>{sale.status}</td>
                                    <td>{sale.transaction_type || 'Retail'}</td>
                                    <td className="text-end">₦{Number(sale.subtotal || sale.total_amount).toFixed(2)}</td>
                                    <td className="text-end text-danger">-₦{Number(sale.discount_amount || 0).toFixed(2)}</td>
                                    <td className="text-end">₦{Number(sale.tax_amount || sale.tax || 0).toFixed(2)}</td>
                                    <td className="text-end">₦{Number(sale.total_amount).toFixed(2)}</td>
                                    <td className="text-end">₦{Number(sale.total_cogs).toFixed(2)}</td>
                                    <td className="text-end">
                                        <span className={Number(sale.total_profit) >= 0 ? 'text-success' : 'text-danger'}>
                                            ₦{Number(sale.total_profit).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        {sale.is_advantage_sale ? (
                                            <span className="badge bg-warning text-dark">Advantage</span>
                                        ) : (
                                            <span className="badge bg-secondary">Regular</span>
                                        )}
                                    </td>
                                    <td className="text-end text-success">
                                        {sale.is_advantage_sale ? `+₦${Number(sale.advantage_total || 0).toFixed(2)}` : '-'}
                                    </td>
                                    <td>{sale.stock_source || 'Main Inventory'}</td>
                                    <td>{sale.receipt_reference || 'N/A'}</td>
                                    <td>{sale.payment_image_url || 'N/A'}</td>
                                    <td>{sale.note || 'N/A'}</td>
                                </tr>
                            ))}
                            <tr className="table-totals table-primary">
                                <td colSpan="9" className="text-end fw-bold">Grand Totals:</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.subtotal || s.total_amount), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold text-danger">-₦{data.reduce((sum, s) => sum + Number(s.discount_amount || 0), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.tax_amount || s.tax || 0), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.total_amount), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.total_cogs), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.total_profit), 0).toFixed(2)}</td>
                                <td colSpan="3"></td>
                            </tr>
                        </tbody>
                    </Table>
                );

            case 'product-profitability':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No product profitability data found.</Alert>;
                }
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
                                <th>Profit Margin %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((prod, index) => {
                                const profitMargin = prod.total_sales_amount > 0 ?
                                    (prod.product_gross_profit / prod.total_sales_amount) * 100 : 0;
                                return (
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
                                        <td className="text-end">
                                            <span className={profitMargin >= 0 ? 'text-success' : 'text-danger'}>
                                                {profitMargin.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="table-totals table-primary">
                                <td colSpan="4" className="text-end fw-bold">Grand Totals:</td>
                                <td className="text-end fw-bold">{data.reduce((sum, p) => sum + Number(p.total_quantity_sold), 0).toFixed(0)}</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, p) => sum + Number(p.total_sales_amount), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, p) => sum + Number(p.total_product_cogs), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold">₦{data.reduce((sum, p) => sum + Number(p.product_gross_profit), 0).toFixed(2)}</td>
                                <td className="text-end fw-bold">
                                    {data.reduce((sum, p) => sum + Number(p.total_sales_amount), 0) > 0 ?
                                        ((data.reduce((sum, p) => sum + Number(p.product_gross_profit), 0) /
                                            data.reduce((sum, p) => sum + Number(p.total_sales_amount), 0)) * 100).toFixed(1) + '%' : '0%'}
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                );

            case 'free-stock':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No free stock data found.</Alert>;
                }
                return (
                    <Table striped bordered hover responsive className="report-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Date</th>
                                <th>Sale ID</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Reason</th>
                                <th>Recorded By</th>
                                <th>Branch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{new Date(item.recorded_at).toLocaleString()}</td>
                                    <td>{item.sale_id}</td>
                                    <td>{item.product_name}</td>
                                    <td className="text-end text-success">{Number(item.quantity).toFixed(0)}</td>
                                    <td>{item.reason || 'N/A'}</td>
                                    <td>{item.recorded_by_name || 'N/A'}</td>
                                    <td>{item.branch_name || 'N/A'}</td>
                                </tr>
                            ))}
                            <tr className="table-totals table-primary">
                                <td colSpan="4" className="text-end fw-bold">Total Free Stock Given:</td>
                                <td className="text-end fw-bold text-success">{data.reduce((sum, i) => sum + Number(i.quantity), 0).toFixed(0)}</td>
                                <td colSpan="3"></td>
                            </tr>
                        </tbody>
                    </Table>
                );

            case 'discount-analysis':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No discount data found.</Alert>;
                }
                return (
                    <Table striped bordered hover responsive className="report-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Sale ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Original Price (₦)</th>
                                <th>Discount Amount (₦)</th>
                                <th>Discount %</th>
                                <th>Final Price (₦)</th>
                                <th>Cashier</th>
                                <th>Branch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.sale_item_id || index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{item.sale_id}</td>
                                    <td>{new Date(item.sale_date).toLocaleString()}</td>
                                    <td>{item.customer_name || 'Walk-in Customer'}</td>
                                    <td>{item.product_name}</td>
                                    <td className="text-end">{Number(item.quantity).toFixed(0)}</td>
                                    <td className="text-end">₦{Number(item.original_price || 0).toFixed(2)}</td>
                                    <td className="text-end text-danger">-₦{Number(item.discount_amount || 0).toFixed(2)}</td>
                                    <td className="text-end text-danger">{Number(item.discount_percentage || 0).toFixed(1)}%</td>
                                    <td className="text-end">₦{Number(item.final_price || 0).toFixed(2)}</td>
                                    <td>{item.cashier_name || 'N/A'}</td>
                                    <td>{item.branch_name || 'N/A'}</td>
                                </tr>
                            ))}
                            <tr className="table-totals table-primary">
                                <td colSpan="6" className="text-end fw-bold">Total Discounts Given:</td>
                                <td colSpan="2" className="text-end fw-bold text-danger">
                                    -₦{data.reduce((sum, i) => sum + Number((i.discount_amount || 0) * i.quantity), 0).toFixed(2)}
                                </td>
                                <td colSpan="4"></td>
                            </tr>
                        </tbody>
                    </Table>
                );

            case 'exchange-requests':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No exchange request data found.</Alert>;
                }
                return (
                    <Table striped bordered hover responsive className="report-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Request ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Original Sale ID</th>
                                <th>Items Requested</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Requested By</th>
                                <th>Approved By</th>
                                <th>Approval Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((exchange, index) => (
                                <tr key={exchange.id || index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{exchange.id}</td>
                                    <td>{new Date(exchange.created_at).toLocaleString()}</td>
                                    <td>{exchange.customer_name}</td>
                                    <td>{exchange.original_sale_id || 'N/A'}</td>
                                    <td>
                                        {/* Enhanced items display with better formatting */}
                                        {exchange.items_with_names && exchange.items_with_names.length > 0 ? (
                                            <div className="exchange-items-list">
                                                {exchange.items_with_names.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="exchange-item">
                                                        <small>
                                                            <strong>{item.product_name}</strong>
                                                            {item.quantity && ` - Qty: ${item.quantity}`}
                                                            {item.reason && ` - Reason: ${item.reason}`}
                                                        </small>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : exchange.items_display && exchange.items_display !== 'N/A' ? (
                                            <div>{exchange.items_display}</div>
                                        ) : (
                                            'No items specified'
                                        )}
                                    </td>
                                    <td>{exchange.reason || 'N/A'}</td>
                                    <td>
                                        <span className={`badge ${exchange.status === 'APPROVED' ? 'bg-success' :
                                            exchange.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                                            {exchange.status}
                                        </span>
                                    </td>
                                    <td>{exchange.requested_by_name || 'N/A'}</td>
                                    <td>{exchange.approved_by_name || 'N/A'}</td>
                                    <td>{exchange.approval_date ? new Date(exchange.approval_date).toLocaleString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                );

            case 'operating-expenses':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No operating expenses data found.</Alert>;
                }
                return (
                    <Table striped bordered hover responsive className="report-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Date</th>
                                <th>Expense Type</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount (₦)</th>
                                <th>Payment Method</th>
                                <th>Reference No</th>
                                <th>Recorded By</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((expense, index) => (
                                <tr key={expense.id || index}>
                                    <td className="text-center">{index + 1}</td>
                                    <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                                    <td>{expense.expense_type}</td>
                                    <td>{expense.category}</td>
                                    <td>{expense.description || 'N/A'}</td>
                                    <td className="text-end text-danger">-₦{Number(expense.amount).toFixed(2)}</td>
                                    <td>{expense.payment_method}</td>
                                    <td>{expense.reference_number || 'N/A'}</td>
                                    <td>{expense.recorded_by_name || 'N/A'}</td>
                                    <td>
                                        <span className={`badge ${expense.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            <tr className="table-totals table-primary">
                                <td colSpan="5" className="text-end fw-bold">Total Operating Expenses:</td>
                                <td className="text-end fw-bold text-danger">-₦{data.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)}</td>
                                <td colSpan="4"></td>
                            </tr>
                        </tbody>
                    </Table>
                );

            // Rider Sales Report - FIXED
            case 'rider-sales':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No rider sales data found matching the selected filters.</Alert>;
                }

                const riderSummary = reportResult.summary || {};

                return (
                    <div>
                        {/* Summary Statistics */}
                        <Card className="mb-4 bg-light">
                            <Card.Body>
                                <Row>
                                    <Col md={3} className="text-center">
                                        <h5>Total Sales</h5>
                                        <h3 className="text-primary">₦{Number(riderSummary.totalSales || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Total Profit</h5>
                                        <h3 className="text-success">₦{Number(riderSummary.totalProfit || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Transactions</h5>
                                        <h3 className="text-info">{Number(riderSummary.totalTransactions || 0)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Outstanding</h5>
                                        <h3 className="text-danger">₦{Number(riderSummary.totalOutstandingBalance || 0).toFixed(2)}</h3>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Sale ID</th>
                                    <th>Date</th>
                                    <th>Rider</th>
                                    <th>Rider Phone</th>
                                    <th>Customer</th>
                                    <th>Branch</th>
                                    <th>Payment Method</th>
                                    <th>Status</th>
                                    <th>Subtotal (₦)</th>
                                    <th>Discount (₦)</th>
                                    <th>Tax (₦)</th>
                                    <th>Total (₦)</th>
                                    <th>Profit (₦)</th>
                                    <th>Amount Paid (₦)</th>
                                    <th>Balance (₦)</th>
                                    <th>Due Date</th>
                                    <th>Advantage</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((sale, index) => (
                                    <tr key={sale.sale_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{sale.sale_id}</td>
                                        <td>{new Date(sale.sale_date).toLocaleString()}</td>
                                        <td><span className="badge bg-info">{sale.rider_name || 'N/A'}</span></td>
                                        <td>{sale.rider_phone || 'N/A'}</td>
                                        <td>{sale.customer_name || 'Walk-in'}</td>
                                        <td>{sale.branch_name || 'N/A'}</td>
                                        <td>{sale.payment_method}</td>
                                        <td>
                                            <span className={`badge ${sale.status === 'Paid' ? 'bg-success' :
                                                sale.status === 'Partially Paid' ? 'bg-warning' : 'bg-danger'
                                                }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="text-end">₦{Number(sale.subtotal || 0).toFixed(2)}</td>
                                        <td className="text-end text-danger">-₦{Number(sale.discount_amount || 0).toFixed(2)}</td>
                                        <td className="text-end">₦{Number(sale.tax_amount || sale.tax || 0).toFixed(2)}</td>
                                        <td className="text-end">₦{Number(sale.total_amount || 0).toFixed(2)}</td>
                                        <td className={`text-end ${Number(sale.total_profit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                            ₦{Number(sale.total_profit || 0).toFixed(2)}
                                        </td>
                                        <td className="text-end">₦{Number(sale.amount_paid || 0).toFixed(2)}</td>
                                        <td className={`text-end ${Number(sale.balance_due || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                                            ₦{Number(sale.balance_due || 0).toFixed(2)}
                                        </td>
                                        <td>{sale.due_date ? new Date(sale.due_date).toLocaleDateString() : 'N/A'}</td>
                                        <td className="text-center">
                                            {sale.is_advantage_sale ? (
                                                <span className="badge bg-warning text-dark">
                                                    +₦{Number(sale.advantage_total || 0).toFixed(2)}
                                                </span>
                                            ) : 'No'}
                                        </td>
                                        <td>{sale.note || 'N/A'}</td>
                                    </tr>
                                ))}
                                <tr className="table-totals table-primary">
                                    <td colSpan="9" className="text-end fw-bold">Grand Totals:</td>
                                    <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.subtotal || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold text-danger">-₦{data.reduce((sum, s) => sum + Number(s.discount_amount || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.tax_amount || s.tax || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.total_amount || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.total_profit || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold">₦{data.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold text-danger">₦{data.reduce((sum, s) => sum + Number(s.balance_due || 0), 0).toFixed(2)}</td>
                                    <td colSpan="3"></td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                );
            // Rider Performance Report - FIXED
            case 'rider-performance':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No rider performance data found.</Alert>;
                }

                const performanceOverall = reportResult.overall || {};

                return (
                    <div>
                        <Card className="mb-4 bg-light">
                            <Card.Body>
                                <Row>
                                    <Col md={3} className="text-center">
                                        <h5>Total Riders</h5>
                                        <h3 className="text-primary">{performanceOverall.totalRiders || 0}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Total Sales</h5>
                                        <h3 className="text-success">₦{Number(performanceOverall.totalSales || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Outstanding</h5>
                                        <h3 className="text-danger">₦{Number(performanceOverall.totalOutstanding || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Avg per Rider</h5>
                                        <h3 className="text-info">₦{Number(performanceOverall.avgPerRider || 0).toFixed(2)}</h3>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Rider Name</th>
                                    <th>Phone</th>
                                    <th>Credit Limit (₦)</th>
                                    <th>Current Balance (₦)</th>
                                    <th>Available Credit (₦)</th>
                                    <th>Total Sales (₦)</th>
                                    <th>Total Profit (₦)</th>
                                    <th>Outstanding (₦)</th>
                                    <th>Transactions</th>
                                    <th>Unique Customers</th>
                                    <th>Avg Transaction (₦)</th>
                                    <th>Collection Rate</th>
                                    <th>Last Sale</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((rider, index) => {
                                    // Parse all numeric values
                                    const totalSales = Number(rider.total_sales || 0);
                                    const totalProfit = Number(rider.total_profit || 0);
                                    const outstandingBalance = Number(rider.outstanding_balance || 0);
                                    const creditLimit = Number(rider.credit_limit || 0);
                                    const currentBalance = Number(rider.current_balance || 0);
                                    const totalTransactions = Number(rider.total_transactions || 0);
                                    const uniqueCustomers = Number(rider.unique_customers || 0);
                                    const avgTransactionValue = Number(rider.avg_transaction_value || 0);

                                    // Calculate derived values
                                    const collectionRate = totalSales > 0
                                        ? ((totalSales - outstandingBalance) / totalSales * 100)
                                        : 0;
                                    const availableCredit = creditLimit - currentBalance;

                                    return (
                                        <tr key={rider.rider_id || index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td><strong>{rider.rider_name || 'N/A'}</strong></td>
                                            <td>{rider.phone_number || 'N/A'}</td>
                                            <td className="text-end">₦{creditLimit.toFixed(2)}</td>
                                            <td className={`text-end ${currentBalance > 0 ? 'text-danger' : 'text-success'}`}>
                                                ₦{currentBalance.toFixed(2)}
                                            </td>
                                            <td className={`text-end ${availableCredit > 0 ? 'text-success' : 'text-danger'}`}>
                                                ₦{availableCredit.toFixed(2)}
                                            </td>
                                            <td className="text-end">₦{totalSales.toFixed(2)}</td>
                                            <td className="text-end text-success">₦{totalProfit.toFixed(2)}</td>
                                            <td className="text-end text-danger">₦{outstandingBalance.toFixed(2)}</td>
                                            <td className="text-end">{totalTransactions}</td>
                                            <td className="text-end">{uniqueCustomers}</td>
                                            <td className="text-end">₦{avgTransactionValue.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge ${collectionRate >= 80 ? 'bg-success' :
                                                    collectionRate >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                                    {collectionRate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td>{rider.last_sale_date ? new Date(rider.last_sale_date).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                );

            // Rider Payment History - FIXED
            case 'rider-payments':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No rider payment history found.</Alert>;
                }

                const paymentSummary = reportResult.summary || {};

                return (
                    <div>
                        <Card className="mb-4 bg-light">
                            <Card.Body>
                                <Row>
                                    <Col md={4} className="text-center">
                                        <h5>Total Payments</h5>
                                        <h3 className="text-primary">{Number(paymentSummary.totalPayments || 0)}</h3>
                                    </Col>
                                    <Col md={4} className="text-center">
                                        <h5>Total Amount</h5>
                                        <h3 className="text-success">₦{Number(paymentSummary.totalAmount || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={4} className="text-center">
                                        <h5>Average Payment</h5>
                                        <h3 className="text-info">₦{Number(paymentSummary.avgPayment || 0).toFixed(2)}</h3>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Payment ID</th>
                                    <th>Date</th>
                                    <th>Rider Name</th>
                                    <th>Amount (₦)</th>
                                    <th>Payment Method</th>
                                    <th>Transactions Covered</th>
                                    <th>Notes</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((payment, index) => (
                                    <tr key={payment.payment_id || index}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{payment.payment_id}</td>
                                        <td>{new Date(payment.payment_date).toLocaleString()}</td>
                                        <td><strong>{payment.rider_name || 'N/A'}</strong></td>
                                        <td className="text-end text-success">₦{Number(payment.amount || 0).toFixed(2)}</td>
                                        <td>{payment.payment_method || 'N/A'}</td>
                                        <td className="text-center">{Number(payment.transactions_covered || 0)}</td>
                                        <td>{payment.notes || 'N/A'}</td>
                                        <td>{payment.recorded_by_name || 'N/A'}</td>
                                    </tr>
                                ))}
                                <tr className="table-totals table-primary">
                                    <td colSpan="4" className="text-end fw-bold">Total:</td>
                                    <td className="text-end fw-bold text-success">₦{data.reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)}</td>
                                    <td colSpan="4"></td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                );
            // Rider Collection Efficiency Report - FIXED
            case 'rider-collection':
                if (!Array.isArray(data) || data.length === 0) {
                    return <Alert variant="info">No rider collection data found matching the selected filters.</Alert>;
                }

                const collectionSummary = reportResult.summary || {};

                return (
                    <div>
                        {/* Summary Statistics */}
                        <Card className="mb-4 bg-light">
                            <Card.Body>
                                <Row>
                                    <Col md={3} className="text-center">
                                        <h5>Total Riders</h5>
                                        <h3 className="text-primary">{collectionSummary.totalRiders || 0}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Total Sales</h5>
                                        <h3 className="text-info">₦{Number(collectionSummary.totalSales || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Total Collected</h5>
                                        <h3 className="text-success">₦{Number(collectionSummary.totalCollected || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={3} className="text-center">
                                        <h5>Outstanding</h5>
                                        <h3 className="text-danger">₦{Number(collectionSummary.totalOutstanding || 0).toFixed(2)}</h3>
                                    </Col>
                                </Row>
                                <Row className="mt-3">
                                    <Col md={4} className="text-center">
                                        <h5>Overdue Amount</h5>
                                        <h3 className="text-danger">₦{Number(collectionSummary.totalOverdue || 0).toFixed(2)}</h3>
                                    </Col>
                                    <Col md={4} className="text-center">
                                        <h5>Avg Collection Rate</h5>
                                        <h3 className="text-warning">{Number(collectionSummary.avgCollectionEfficiency || 0).toFixed(1)}%</h3>
                                    </Col>
                                    <Col md={4} className="text-center">
                                        <h5>Collection Status</h5>
                                        <h3>
                                            <span className={`badge ${Number(collectionSummary.avgCollectionEfficiency || 0) >= 80 ? 'bg-success' :
                                                Number(collectionSummary.avgCollectionEfficiency || 0) >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                                {Number(collectionSummary.avgCollectionEfficiency || 0) >= 80 ? 'Good' :
                                                    Number(collectionSummary.avgCollectionEfficiency || 0) >= 50 ? 'Average' : 'Poor'}
                                            </span>
                                        </h3>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Rider Name</th>
                                    <th>Credit Limit (₦)</th>
                                    <th>Current Balance (₦)</th>
                                    <th>Available Credit (₦)</th>
                                    <th>Total Sales (₦)</th>
                                    <th>Total Collected (₦)</th>
                                    <th>Outstanding (₦)</th>
                                    <th>Collection Rate</th>
                                    <th>Overdue Amount (₦)</th>
                                    <th>Overdue %</th>
                                    <th>Unpaid Trans</th>
                                    <th>Overdue Trans</th>
                                    <th>Credit Utilization</th>
                                    <th>Avg Transaction (₦)</th>
                                    <th>Last Sale</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((rider, index) => {
                                    // Parse all numeric values to ensure they're numbers
                                    const totalSales = Number(rider.total_sales || 0);
                                    const totalCollected = Number(rider.total_collected || 0);
                                    const totalOutstanding = Number(rider.total_outstanding || 0);
                                    const overdueAmount = Number(rider.overdue_amount || 0);
                                    const creditLimit = Number(rider.credit_limit || 0);
                                    const currentBalance = Number(rider.current_balance || 0);
                                    const unpaidTransactions = Number(rider.unpaid_transactions || 0);
                                    const overdueTransactions = Number(rider.overdue_transactions || 0);
                                    const avgTransactionValue = Number(rider.avg_transaction_value || 0);

                                    // Calculate derived values
                                    const collectionRate = totalSales > 0 ? (totalCollected / totalSales) * 100 : 0;
                                    const overduePct = totalOutstanding > 0 ? (overdueAmount / totalOutstanding) * 100 : 0;
                                    const creditUtil = creditLimit > 0 ? (totalOutstanding / creditLimit) * 100 : 0;
                                    const availableCredit = creditLimit - currentBalance;

                                    return (
                                        <tr key={rider.rider_id || index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td><strong>{rider.rider_name || 'N/A'}</strong></td>
                                            <td className="text-end">₦{creditLimit.toFixed(2)}</td>
                                            <td className={`text-end ${currentBalance > 0 ? 'text-danger' : 'text-success'}`}>
                                                ₦{currentBalance.toFixed(2)}
                                            </td>
                                            <td className={`text-end ${availableCredit > 0 ? 'text-success' : 'text-danger'}`}>
                                                ₦{availableCredit.toFixed(2)}
                                            </td>
                                            <td className="text-end">₦{totalSales.toFixed(2)}</td>
                                            <td className="text-end text-success">₦{totalCollected.toFixed(2)}</td>
                                            <td className="text-end text-danger">₦{totalOutstanding.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge ${collectionRate >= 80 ? 'bg-success' :
                                                    collectionRate >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                                    {collectionRate.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="text-end text-danger">₦{overdueAmount.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge ${overduePct <= 20 ? 'bg-success' :
                                                    overduePct <= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                                    {overduePct.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="text-center">{unpaidTransactions}</td>
                                            <td className="text-center">{overdueTransactions}</td>
                                            <td className="text-center">
                                                <span className={`badge ${creditUtil <= 70 ? 'bg-success' :
                                                    creditUtil <= 90 ? 'bg-warning' : 'bg-danger'}`}>
                                                    {creditUtil.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="text-end">₦{avgTransactionValue.toFixed(2)}</td>
                                            <td>{rider.last_sale_date ? new Date(rider.last_sale_date).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="table-totals table-primary">
                                <tr>
                                    <td colSpan="5" className="text-end fw-bold">Totals/Averages:</td>
                                    <td className="text-end fw-bold">₦{data.reduce((sum, r) => sum + Number(r.total_sales || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold text-success">₦{data.reduce((sum, r) => sum + Number(r.total_collected || 0), 0).toFixed(2)}</td>
                                    <td className="text-end fw-bold text-danger">₦{data.reduce((sum, r) => sum + Number(r.total_outstanding || 0), 0).toFixed(2)}</td>
                                    <td className="text-center fw-bold">
                                        {data.length > 0 ?
                                            (data.reduce((sum, r) => {
                                                const sales = Number(r.total_sales || 0);
                                                const collected = Number(r.total_collected || 0);
                                                return sum + (sales > 0 ? (collected / sales) * 100 : 0);
                                            }, 0) / data.length).toFixed(1) : '0'}%
                                    </td>
                                    <td className="text-end fw-bold text-danger">₦{data.reduce((sum, r) => sum + Number(r.overdue_amount || 0), 0).toFixed(2)}</td>
                                    <td className="text-center fw-bold">
                                        {data.length > 0 ?
                                            (data.reduce((sum, r) => {
                                                const outstanding = Number(r.total_outstanding || 0);
                                                const overdue = Number(r.overdue_amount || 0);
                                                return sum + (outstanding > 0 ? (overdue / outstanding) * 100 : 0);
                                            }, 0) / data.length).toFixed(1) : '0'}%
                                    </td>
                                    <td className="text-center fw-bold">{data.reduce((sum, r) => sum + (Number(r.unpaid_transactions) || 0), 0)}</td>
                                    <td className="text-center fw-bold">{data.reduce((sum, r) => sum + (Number(r.overdue_transactions) || 0), 0)}</td>
                                    <td className="text-center fw-bold">
                                        {data.length > 0 ?
                                            (data.reduce((sum, r) => {
                                                const limit = Number(r.credit_limit || 0);
                                                const outstanding = Number(r.total_outstanding || 0);
                                                return sum + (limit > 0 ? (outstanding / limit) * 100 : 0);
                                            }, 0) / data.length).toFixed(1) : '0'}%
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        </Table>
                    </div>
                );
            // Add other report types here (inventory-movement, raw-material-consumption, etc.)
            // ... existing code for other report types ...

            default:
                if (Array.isArray(data) && data.length > 0) {
                    // Generic table for reports without specific formatting
                    const headers = Object.keys(data[0]);
                    return (
                        <Table striped bordered hover responsive className="report-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    {headers.map(header => (
                                        <th key={header}>{header.replace(/_/g, ' ').toUpperCase()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => (
                                    <tr key={index}>
                                        <td className="text-center">{index + 1}</td>
                                        {headers.map(header => (
                                            <td key={header}>
                                                {typeof row[header] === 'number' ?
                                                    header.toLowerCase().includes('amount') || header.toLowerCase().includes('price') || header.toLowerCase().includes('cost') ?
                                                        `₦${Number(row[header]).toFixed(2)}` : Number(row[header]).toFixed(0)
                                                    : String(row[header] || 'N/A')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    );
                }
                return <Alert variant="info">No data available for this report type.</Alert>;
        }
    };

    // Show authentication message if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="reports-page-container">
                <div className="page-header">
                    <h1 className="main-headers"><FaFileInvoiceDollar className="me-2" /> Financial Reports</h1>
                </div>
                <Alert variant="warning" className="my-4">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access the reports section.</p>
                    <Button variant="primary" onClick={() => window.location.href = '/login'}>
                        Go to Login
                    </Button>
                </Alert>
            </div>
        );
    }

    return (
        <div className="reports-page-container">
            <div className="page-header">
                <h1 className="main-headers"><FaFileInvoiceDollar className="me-2" /> Financial Reports</h1>
                {lastUpdated && <div className="last-updated">Last updated: {lastUpdated}</div>}
            </div>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}

            <Card className="form-card mb-4">
                <div className="card-header">
                    <h2 className="card-titlesd">Select Report Type</h2>
                    <Button variant="outline-primary" size="sm" onClick={fetchDropdownData} disabled={loading}>
                        <FaSync className="me-1" /> Refresh Data
                    </Button>
                </div>
                <div className="card-body">
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
                                <option value="advantage-sales-analysis">Advantage Sales Analysis Report</option>
                                <option value="inventory-movement">Inventory Movement Report</option>
                                <option value="raw-material-consumption">Raw Material Consumption Report</option>
                                <option value="sales-performance-by-staff-branch">Sales Performance (Staff/Branch)</option>
                                <option value="free-stock">Free Stock Report</option>
                                <option value="discount-analysis">Discount Analysis Report</option>
                                <option value="exchange-requests">Bread Exchange Report</option>
                                <option value="operating-expenses">Operating Expenses Report</option>
                                <option value="salary-payroll">Salary & Payroll Report</option>
                                <option value="waste-stock">Waste Stock Report</option>
                                <option value="stock-issue-transfer">Stock Issue/Transfer Report</option>
                                <option value="production-efficiency">Production Efficiency Report</option>
                                {/* NEW: Rider Reports */}
                                <option value="rider-sales">Rider Sales Report</option>
                                <option value="rider-performance">Rider Performance Report</option>
                                <option value="rider-payments">Rider Payment History</option>
                                <option value="rider-collection">Rider Collection Efficiency</option>  {/* ADD THIS LINE */}
                            </Form.Control>
                        </Col>
                    </Form.Group>
                </div>
            </Card>

            <Card className="filter-card mb-4">
                <div className="card-header">
                    <h2 className="card-titless">Report Filters <FaFilter className="ms-2 text-muted" /></h2>
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                        <FaTrashAlt className="me-1" /> Clear All
                    </Button>
                </div>
                <div className="card-body">
                    <Form onSubmit={(e) => { e.preventDefault(); generateReport(); }}>
                        <Row className="g-3">
                            {/* Common Filters */}
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

                            {/* Sales-related filters */}
                            {(reportType === 'detailed-sales' || reportType === 'sales-performance-by-staff-branch' || reportType === 'discount-analysis') && (
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
                                </>
                            )}

                            {/* Product-related filters */}
                            {(reportType === 'product-profitability' || reportType === 'inventory-movement' ||
                                reportType === 'free-stock' || reportType === 'discount-analysis' ||
                                reportType === 'waste-stock' || reportType === 'stock-issue-transfer' ||
                                reportType === 'production-efficiency' || reportType === 'advantage-sales-analysis') && (
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

                            {/* Raw Material filters */}
                            {(reportType === 'raw-material-consumption') && (
                                <>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label><FaSeedling className="me-1" />Raw Material</Form.Label>
                                            <Form.Control as="select" name="rawMaterialId" value={filterData.rawMaterialId} onChange={handleFilterChange}>
                                                <option value="">All Materials</option>
                                                {allRawMaterials.map(rm => (
                                                    <option key={rm.id} value={rm.id}>{rm.name}</option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label><FaExchangeAlt className="me-1" />Transaction Type</Form.Label>
                                            <Form.Control as="select" name="rawMaterialTransactionType" value={filterData.rawMaterialTransactionType} onChange={handleFilterChange}>
                                                <option value="">All Types</option>
                                                <option value="production_use">Production Use</option>
                                                <option value="restock">Restock</option>
                                                <option value="waste">Waste</option>
                                                <option value="adjustment">Adjustment</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                </>
                            )}

                            {/* Rider-related filters */}
                            {(reportType === 'rider-sales' || reportType === 'rider-performance' ||
                                reportType === 'rider-payments') && (
                                    <>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label><FaMotorcycle className="me-1" />Rider</Form.Label>
                                                <Form.Control as="select" name="riderId" value={filterData.riderId} onChange={handleFilterChange}>
                                                    <option value="">All Riders</option>
                                                    {allRiders.map(rider => (
                                                        <option key={rider.id} value={rider.id}>{rider.fullname}</option>
                                                    ))}
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label><FaMoneyBillWave className="me-1" />Payment Method</Form.Label>
                                                <Form.Control as="select" name="paymentMethod" value={filterData.paymentMethod} onChange={handleFilterChange}>
                                                    <option value="">All Methods</option>
                                                    <option value="Cash">Cash</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                    <option value="Card">Card</option>
                                                    <option value="Credit">Credit</option>
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
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                    </>
                                )}

                            {/* Inventory Movement filters */}
                            {(reportType === 'inventory-movement') && (
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaExchangeAlt className="me-1" />Transaction Type</Form.Label>
                                        <Form.Control as="select" name="inventoryTransactionType" value={filterData.inventoryTransactionType} onChange={handleFilterChange}>
                                            <option value="">All Types</option>
                                            <option value="production">Production</option>
                                            <option value="sale">Sale</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Operating Expenses filters */}
                            {(reportType === 'operating-expenses') && (
                                <>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label><FaReceipt className="me-1" />Expense Type</Form.Label>
                                            <Form.Control as="select" name="expenseType" value={filterData.expenseType} onChange={handleFilterChange}>
                                                <option value="">All Types</option>
                                                <option value="Rent">Rent</option>
                                                <option value="Utilities">Utilities</option>
                                                <option value="Salaries">Salaries</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="Transport">Transport</option>
                                                <option value="Maintenance">Maintenance</option>
                                                <option value="Other">Other</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label><FaCubes className="me-1" />Category</Form.Label>
                                            <Form.Control as="select" name="expenseCategory" value={filterData.expenseCategory} onChange={handleFilterChange}>
                                                <option value="">All Categories</option>
                                                <option value="Fixed">Fixed</option>
                                                <option value="Variable">Variable</option>
                                                <option value="Operational">Operational</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                </>
                            )}

                            {/* Salary filters */}
                            {(reportType === 'salary-payroll') && (
                                <>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label><FaUserTie className="me-1" />Staff</Form.Label>
                                            <Form.Control as="select" name="staffId" value={filterData.staffId} onChange={handleFilterChange}>
                                                <option value="">All Staff</option>
                                                {allUsers.map(user => (
                                                    <option key={user.id} value={user.id}>{user.fullname}</option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label><FaChartLine className="me-1" />Salary Status</Form.Label>
                                            <Form.Control as="select" name="salaryStatus" value={filterData.salaryStatus} onChange={handleFilterChange}>
                                                <option value="">All Statuses</option>
                                                <option value="paid">Paid</option>
                                                <option value="pending">Pending</option>
                                                <option value="cancelled">Cancelled</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                </>
                            )}

                            {/* Waste Stock filters */}
                            {(reportType === 'waste-stock') && (
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaTrash className="me-1" />Waste Reason</Form.Label>
                                        <Form.Control as="select" name="wasteReason" value={filterData.wasteReason} onChange={handleFilterChange}>
                                            <option value="">All Reasons</option>
                                            <option value="Expired">Expired</option>
                                            <option value="Damaged">Damaged</option>
                                            <option value="Quality Issue">Quality Issue</option>
                                            <option value="Other">Other</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Exchange Request filters */}
                            {(reportType === 'exchange-requests') && (
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaExchangeAlt className="me-1" />Request Status</Form.Label>
                                        <Form.Control as="select" name="status" value={filterData.status} onChange={handleFilterChange}>
                                            <option value="">All Statuses</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="APPROVED">Approved</option>
                                            <option value="REJECTED">Rejected</option>
                                            <option value="COMPLETED">Completed</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            )}

                            {/* Stock Issue/Transfer filters */}
                            {(reportType === 'stock-issue-transfer') && (
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label><FaExchangeAlt className="me-1" />Issue Type</Form.Label>
                                        <Form.Control as="select" name="issueType" value={filterData.issueType} onChange={handleFilterChange}>
                                            <option value="">All Types</option>
                                            <option value="ISSUE">Issue</option>
                                            <option value="RETURN">Return</option>
                                            <option value="TRANSFER">Transfer</option>
                                            <option value="WASTE">Waste</option>
                                            <option value="MANUAL_ADJUSTMENT">Adjustment</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                    </Form>
                </div>
            </Card>

            <Card className="table-card mb-4">
                <div className="card-header">
                    <h2 className="card-titless">Report Results</h2>
                    <div className="action-buttons">
                        <Button variant="outline-primary" size="sm" onClick={exportToCSV} disabled={!reportResult || loading}>
                            <FaDownload className="me-1" /> Export CSV
                        </Button>
                        <Button variant="primary" className='okay' size="sm" onClick={handlePrint} disabled={!reportResult || loading || (Array.isArray(reportResult.reportData) && reportResult.reportData.length === 0 && reportType !== 'profit-loss')}>
                            <FaPrint className="me-1" /> Print Report
                        </Button>
                    </div>
                </div>
                <div className="card-body">
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
                </div>
            </Card>
        </div>
    );
};

export default ReportsPage;