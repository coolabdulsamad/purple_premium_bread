import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, Row, Col, Spinner, Alert, Form, Button, Table } from 'react-bootstrap';
import { FaChartBar, FaPercent, FaSyncAlt, FaLayerGroup, FaMoneyBillWave, FaWarehouse, FaUsers, FaChartArea, FaTractor, FaCalendarAlt, FaStore, FaBox, FaCubes, FaSeedling } from 'react-icons/fa';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import '../styles/analysis.css'; // New CSS file for analysis specific styles
import '../styles/forms.css'; // For general card styling

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const API_BASE_URL = 'http://localhost:5000/api';

const AnalysisPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [salesComparison, setSalesComparison] = useState(null);
    const [profitMarginTrend, setProfitMarginTrend] = useState([]);
    const [inventoryTurnover, setInventoryTurnover] = useState(null);
    const [salesTrendByCatProd, setSalesTrendByCatProd] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [productionWasteTrend, setProductionWasteTrend] = useState([]);
    const [rawMaterialStockValueTrend, setRawMaterialStockValueTrend] = useState([]);
    const [customerLifetimeValue, setCustomerLifetimeValue] = useState([]);


    // Filter states for analysis sections
    const [analysisFilters, setAnalysisFilters] = useState({
        // Sales Comparison
        salesComparisonPeriod: 'month', // 'month' or 'week'
        salesComparisonBranchId: '',
        // Profit Margin Trend
        profitMarginTrendPeriod: 'month', // 'month' or 'day'
        profitMarginTrendBranchId: '',
        // Inventory Turnover
        inventoryTurnoverProductId: '',
        inventoryTurnoverStartDate: '',
        inventoryTurnoverEndDate: '',
        inventoryTurnoverBranchId: '',
        // Sales Trend by Category/Product
        salesTrendStartDate: '',
        salesTrendEndDate: '',
        salesTrendCategory: '',
        salesTrendProductId: '',
        salesTrendPeriod: 'month',
        salesTrendBranchId: '',
        // Top Customers
        topCustomersStartDate: '',
        topCustomersEndDate: '',
        topCustomersLimit: 10,
        topCustomersBranchId: '',
        // Production Waste Over Time
        productionWasteStartDate: '',
        productionWasteEndDate: '',
        productionWastePeriod: 'month',
        productionWasteBranchId: '', // No longer used in backend due to schema, but kept here for UI if needed later
        // Raw Material Stock Value Trend
        rawMaterialStockStartDate: '',
        rawMaterialStockEndDate: '',
        rawMaterialStockId: '',
        rawMaterialStockPeriod: 'month',
        rawMaterialStockBranchId: '', // No longer used in backend due to schema, but kept here for UI if needed later
        // Customer Lifetime Value
        cltvStartDate: '',
        cltvEndDate: '',
        cltvCustomerId: '',
        cltvLimit: 10,
        cltvBranchId: '',
    });

    // Dropdown data states
    const [allCustomers, setAllCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [allRawMaterials, setAllRawMaterials] = useState([]);

    const fetchDropdownData = async () => {
        try {
            const [productsRes, categoriesRes, customersRes, branchesRes, rawMaterialsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/products`),
                axios.get(`${API_BASE_URL}/categories`),
                axios.get(`${API_BASE_URL}/customers`),
                axios.get(`${API_BASE_URL}/branches`),
                axios.get(`${API_BASE_URL}/raw-materials`),
            ]);
            setAllProducts(productsRes.data);
            setAllCategories(categoriesRes.data);
            setAllCustomers(customersRes.data);
            setAllBranches(branchesRes.data);
            setAllRawMaterials(rawMaterialsRes.data);
        } catch (err) {
            console.error('Error fetching dropdown data for analysis:', err);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Helper to build params string, ignoring empty values
            const buildParams = (filters) => {
                const params = new URLSearchParams();
                for (const key in filters) {
                    if (filters[key] !== '' && filters[key] !== undefined && filters[key] !== null) {
                        params.append(key, filters[key]);
                    }
                }
                return params.toString();
            };

            const [
                salesCompRes,
                profitMarginRes,
                inventoryTurnoverRes,
                salesTrendRes,
                topCustomersRes,
                productionWasteRes,
                rawMaterialStockValueRes,
                cltvRes,
            ] = await Promise.all([
                axios.get(`${API_BASE_URL}/analysis/sales-comparison?${buildParams({ period: analysisFilters.salesComparisonPeriod, branchId: analysisFilters.salesComparisonBranchId })}`),
                axios.get(`${API_BASE_URL}/analysis/profit-margin-trend?${buildParams({ period: analysisFilters.profitMarginTrendPeriod, limit: 12, branchId: analysisFilters.profitMarginTrendBranchId })}`),
                axios.get(`${API_BASE_URL}/analysis/inventory-turnover?${buildParams({ productId: analysisFilters.inventoryTurnoverProductId, startDate: analysisFilters.inventoryTurnoverStartDate, endDate: analysisFilters.inventoryTurnoverEndDate, branchId: analysisFilters.inventoryTurnoverBranchId })}`),
                axios.get(`${API_BASE_URL}/analysis/sales-trend-by-category-product?${buildParams({ startDate: analysisFilters.salesTrendStartDate, endDate: analysisFilters.salesTrendEndDate, category: analysisFilters.salesTrendCategory, productId: analysisFilters.salesTrendProductId, period: analysisFilters.salesTrendPeriod, branchId: analysisFilters.salesTrendBranchId })}`),
                axios.get(`${API_BASE_URL}/analysis/top-customers-by-sales?${buildParams({ startDate: analysisFilters.topCustomersStartDate, endDate: analysisFilters.topCustomersEndDate, limit: analysisFilters.topCustomersLimit, branchId: analysisFilters.topCustomersBranchId })}`),
                axios.get(`${API_BASE_URL}/analysis/production-waste-over-time?${buildParams({ startDate: analysisFilters.productionWasteStartDate, endDate: analysisFilters.productionWasteEndDate, period: analysisFilters.productionWastePeriod /* branchId removed here for API call as it's not used in backend */ })}`),
                axios.get(`${API_BASE_URL}/analysis/raw-material-stock-value-trend?${buildParams({ startDate: analysisFilters.rawMaterialStockStartDate, endDate: analysisFilters.rawMaterialStockEndDate, rawMaterialId: analysisFilters.rawMaterialStockId, period: analysisFilters.rawMaterialStockPeriod /* branchId removed here for API call as it's not used in backend */ })}`),
                axios.get(`${API_BASE_URL}/analysis/customer-lifetime-value?${buildParams({ startDate: analysisFilters.cltvStartDate, endDate: analysisFilters.cltvEndDate, customerId: analysisFilters.cltvCustomerId, limit: analysisFilters.cltvLimit, branchId: analysisFilters.cltvBranchId })}`),
            ]);
            setSalesComparison(salesCompRes.data);
            setProfitMarginTrend(profitMarginRes.data.reportData);
            setInventoryTurnover(inventoryTurnoverRes.data);
            setSalesTrendByCatProd(salesTrendRes.data.reportData);
            setTopCustomers(topCustomersRes.data.reportData);
            setProductionWasteTrend(productionWasteRes.data.reportData);
            setRawMaterialStockValueTrend(rawMaterialStockValueRes.data.reportData);
            setCustomerLifetimeValue(cltvRes.data.reportData);
        } catch (err) {
            console.error('Error fetching analysis data:', err.response?.data || err.message);
            setError('Failed to load analysis data. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    }, [analysisFilters]);

    useEffect(() => {
        fetchDropdownData();
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        const defaultEndDate = today.toISOString().split('T')[0];

        setAnalysisFilters(prev => ({
            ...prev,
            inventoryTurnoverStartDate: defaultStartDate,
            inventoryTurnoverEndDate: defaultEndDate,
            salesTrendStartDate: defaultStartDate,
            salesTrendEndDate: defaultEndDate,
            topCustomersStartDate: defaultStartDate,
            topCustomersEndDate: defaultEndDate,
            productionWasteStartDate: defaultStartDate,
            productionWasteEndDate: defaultEndDate,
            rawMaterialStockStartDate: defaultStartDate,
            rawMaterialStockEndDate: defaultEndDate,
            cltvStartDate: defaultStartDate,
            cltvEndDate: defaultEndDate,
        }));
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(handler);
    }, [analysisFilters, fetchData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setAnalysisFilters(prev => ({ ...prev, [name]: value }));
    };

    // --- Chart Data & Options ---
    const salesComparisonChartData = {
        labels: ['Total Sales', 'Total Profit'],
        datasets: [
            {
                label: `Current ${analysisFilters.salesComparisonPeriod.charAt(0).toUpperCase() + analysisFilters.salesComparisonPeriod.slice(1)}`,
                data: [salesComparison?.currentPeriod?.sales || 0, salesComparison?.currentPeriod?.profit || 0],
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
            },
            {
                label: `Previous ${analysisFilters.salesComparisonPeriod.charAt(0).toUpperCase() + analysisFilters.salesComparisonPeriod.slice(1)}`,
                data: [salesComparison?.previousPeriod?.sales || 0, salesComparison?.previousPeriod?.profit || 0],
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1,
            },
        ],
    };

    const salesComparisonChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Sales & Profit Comparison (${analysisFilters.salesComparisonPeriod.charAt(0).toUpperCase() + analysisFilters.salesComparisonPeriod.slice(1)})`,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount (₦)'
                }
            }
        }
    };

    // Chart Data for Profit Margin Trend
    const profitMarginTrendChartData = {
        labels: profitMarginTrend.map(item => item.period_label),
        datasets: [
            {
                label: 'Gross Profit Margin (%)',
                data: profitMarginTrend.map(item => parseFloat(item.gross_profit_margin).toFixed(2)),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1,
                fill: false,
            },
        ],
    };

    const profitMarginTrendChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Gross Profit Margin Trend',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Margin (%)'
                },
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            }
        }
    };

    // New Chart: Sales Trend by Category/Product
    const salesTrendByCatProdChartData = {
        labels: salesTrendByCatProd.map(item => item.period_label),
        datasets: [
            {
                label: 'Total Sales Amount (₦)',
                data: salesTrendByCatProd.map(item => item.total_sales_amount),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                tension: 0.1,
                fill: false,
            },
        ],
    };
    const salesTrendByCatProdChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Sales Trend by Category/Product' },
        },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Sales (₦)' } } }
    };

    // New Chart: Production Waste Over Time
    const productionWasteTrendChartData = {
        labels: productionWasteTrend.map(item => item.period_label),
        datasets: [
            {
                label: 'Total Produced',
                data: productionWasteTrend.map(item => item.total_produced),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-produced'
            },
            {
                label: 'Total Waste',
                data: productionWasteTrend.map(item => item.total_waste),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-produced'
            },
            {
                label: 'Waste Percentage (%)',
                data: productionWasteTrend.map(item => parseFloat(item.waste_percentage).toFixed(2)),
                borderColor: 'rgb(255, 205, 86)',
                backgroundColor: 'rgba(255, 205, 86, 0.5)',
                tension: 0.1,
                yAxisID: 'y-percentage', // Use a secondary Y-axis
            },
        ],
    };
    const productionWasteTrendChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Production & Waste Trend' },
        },
        scales: {
            'y-produced': {
                beginAtZero: true,
                position: 'left',
                title: { display: true, text: 'Quantity' }
            },
            'y-percentage': {
                beginAtZero: true,
                position: 'right',
                title: { display: true, text: 'Waste (%)' },
                grid: { drawOnChartArea: false }, // Only draw grid lines for the left axis
                ticks: {
                    callback: function(value) { return value + '%'; }
                }
            }
        }
    };

    // New Chart: Raw Material Stock Value Trend
    const rawMaterialStockValueTrendChartData = {
        labels: rawMaterialStockValueTrend.map(item => item.period_label),
        datasets: [
            {
                label: 'Cumulative Stock Value (₦)',
                data: rawMaterialStockValueTrend.map(item => item.cumulative_stock_value),
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                tension: 0.1,
                fill: true,
            },
        ],
    };
    const rawMaterialStockValueTrendChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Raw Material Stock Value Trend (Cumulative)' },
        },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Value (₦)' } } }
    };


    // Calculate Sales Change
    const salesChange = salesComparison?.currentPeriod?.sales - salesComparison?.previousPeriod?.sales;
    const salesChangePercent = salesComparison?.previousPeriod?.sales !== 0
        ? (salesChange / salesComparison?.previousPeriod?.sales) * 100
        : (salesChange > 0 ? 100 : 0);

    // Calculate Profit Change
    const profitChange = salesComparison?.currentPeriod?.profit - salesComparison?.previousPeriod?.profit;
    const profitChangePercent = salesComparison?.previousPeriod?.profit !== 0
        ? (profitChange / salesComparison?.previousPeriod?.profit) * 100
        : (profitChange > 0 ? 100 : 0);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading Analysis...</span>
                </Spinner>
                <p className="ms-3">Loading analysis data...</p>
            </div>
        );
    }

    return (
        <div className="analysis-page-container">
            <h1 className="main-header"><FaChartBar className="me-2" /> Data Analysis & Insights</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}

            {/* Sales Comparison Section */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Sales & Profit Comparison <FaChartArea className="ms-2" />
                    <Form.Group className="d-flex align-items-center mb-0">
                        <Form.Label className="me-2 mb-0"><FaCalendarAlt className="me-1"/>Period:</Form.Label>
                        <Form.Select className="w-auto me-2" name="salesComparisonPeriod" value={analysisFilters.salesComparisonPeriod} onChange={handleFilterChange}>
                            <option value="month">Month</option>
                            <option value="week">Week</option>
                        </Form.Select>
                        <Form.Label className="me-2 mb-0"><FaStore className="me-1"/>Branch:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="salesComparisonBranchId" value={analysisFilters.salesComparisonBranchId} onChange={handleFilterChange}>
                            <option value="">All Branches</option>
                            {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={7}>
                            <Bar data={salesComparisonChartData} options={salesComparisonChartOptions} />
                        </Col>
                        <Col md={5}>
                            <h6 className="mt-3">Summary:</h6>
                            <Table striped bordered hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>Current Period</th>
                                        <th>Previous Period</th>
                                        <th>Change (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Sales</td>
                                        <td>₦{salesComparison?.currentPeriod?.sales.toFixed(2) || '0.00'}</td>
                                        <td>₦{salesComparison?.previousPeriod?.sales.toFixed(2) || '0.00'}</td>
                                        <td className={salesChangePercent >= 0 ? 'text-success' : 'text-danger'}>{salesChangePercent.toFixed(2)}%</td>
                                    </tr>
                                    <tr>
                                        <td>Profit</td>
                                        <td>₦{salesComparison?.currentPeriod?.profit.toFixed(2) || '0.00'}</td>
                                        <td>₦{salesComparison?.previousPeriod?.profit.toFixed(2) || '0.00'}</td>
                                        <td className={profitChangePercent >= 0 ? 'text-success' : 'text-danger'}>{profitChangePercent.toFixed(2)}%</td>
                                    </tr>
                                </tbody>
                            </Table>
                            <Alert variant="info" className="mt-3">
                                <small>Current Period: {salesComparison?.currentPeriod?.start} to {salesComparison?.currentPeriod?.end}</small><br/>
                                <small>Previous Period: {salesComparison?.previousPeriod?.start} to {salesComparison?.previousPeriod?.end}</small>
                            </Alert>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Profit Margin Trend Section */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Gross Profit Margin Trend <FaPercent className="ms-2" />
                    <Form.Group className="d-flex align-items-center mb-0">
                        <Form.Label className="me-2 mb-0"><FaCalendarAlt className="me-1"/>Period:</Form.Label>
                        <Form.Select className="w-auto me-2" name="profitMarginTrendPeriod" value={analysisFilters.profitMarginTrendPeriod} onChange={handleFilterChange}>
                            <option value="month">Last 12 Months</option>
                            <option value="day">Last 30 Days</option>
                        </Form.Select>
                        <Form.Label className="me-2 mb-0"><FaStore className="me-1"/>Branch:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="profitMarginTrendBranchId" value={analysisFilters.profitMarginTrendBranchId} onChange={handleFilterChange}>
                            <option value="">All Branches</option>
                            {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Card.Header>
                <Card.Body>
                    <Line data={profitMarginTrendChartData} options={profitMarginTrendChartOptions} />
                </Card.Body>
            </Card>

            {/* Inventory Turnover Section */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5">Inventory Turnover Rate <FaSyncAlt className="ms-2" /></Card.Header>
                <Card.Body>
                    <Row className="mb-3 align-items-center">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaBox className="me-1"/>Product:</Form.Label>
                                <Form.Control as="select" name="inventoryTurnoverProductId" value={analysisFilters.inventoryTurnoverProductId} onChange={handleFilterChange}>
                                    <option value="">All Products</option>
                                    {allProducts.map(prod => (
                                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaStore className="me-1"/>Branch:</Form.Label>
                                <Form.Control as="select" name="inventoryTurnoverBranchId" value={analysisFilters.inventoryTurnoverBranchId} onChange={handleFilterChange}>
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>Start Date:</Form.Label>
                                <Form.Control type="date" name="inventoryTurnoverStartDate" value={analysisFilters.inventoryTurnoverStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>End Date:</Form.Label>
                                <Form.Control type="date" name="inventoryTurnoverEndDate" value={analysisFilters.inventoryTurnoverEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col xs={12}>
                            {inventoryTurnover && (
                                <Alert variant="info" className="mt-3">
                                    <p className="mb-1"><strong>COGS:</strong> ₦{inventoryTurnover.reportData?.cogs.toFixed(2) || '0.00'}</p>
                                    <p className="mb-1"><strong>Approx. Current Inventory Value:</strong> ₦{inventoryTurnover.reportData?.averageInventoryValue.toFixed(2) || '0.00'}</p>
                                    <p className="mb-1"><strong>Inventory Turnover Rate:</strong> {inventoryTurnover.reportData?.inventoryTurnoverRate.toFixed(2) || '0.00'} times</p>
                                    <small className="d-block text-muted">{inventoryTurnover.reportData?.explanation}</small>
                                </Alert>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Sales Trend by Category/Product */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Sales Trend by Category/Product <FaChartArea className="ms-2" />
                    <Form.Group className="d-flex align-items-center mb-0">
                        <Form.Label className="me-2 mb-0"><FaCalendarAlt className="me-1"/>Period:</Form.Label>
                        <Form.Select className="w-auto me-2" name="salesTrendPeriod" value={analysisFilters.salesTrendPeriod} onChange={handleFilterChange}>
                            <option value="month">Monthly</option>
                            <option value="day">Daily</option>
                        </Form.Select>
                        <Form.Label className="me-2 mb-0"><FaCubes className="me-1"/>Category:</Form.Label>
                        <Form.Control as="select" className="w-auto me-2" name="salesTrendCategory" value={analysisFilters.salesTrendCategory} onChange={handleFilterChange}>
                            <option value="">All Categories</option>
                            {allCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </Form.Control>
                        <Form.Label className="me-2 mb-0"><FaBox className="me-1"/>Product:</Form.Label>
                        <Form.Control as="select" className="w-auto me-2" name="salesTrendProductId" value={analysisFilters.salesTrendProductId} onChange={handleFilterChange}>
                            <option value="">All Products</option>
                            {allProducts.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                        </Form.Control>
                         <Form.Label className="me-2 mb-0"><FaStore className="me-1"/>Branch:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="salesTrendBranchId" value={analysisFilters.salesTrendBranchId} onChange={handleFilterChange}>
                            <option value="">All Branches</option>
                            {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>Start Date:</Form.Label>
                                <Form.Control type="date" name="salesTrendStartDate" value={analysisFilters.salesTrendStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>End Date:</Form.Label>
                                <Form.Control type="date" name="salesTrendEndDate" value={analysisFilters.salesTrendEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={12} className="mt-3">
                            <Line data={salesTrendByCatProdChartData} options={salesTrendByCatProdChartOptions} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Top Customers by Sales */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Top Customers by Sales <FaUsers className="ms-2" />
                    <Form.Group className="d-flex align-items-center mb-0">
                        <Form.Label className="me-2 mb-0">Limit:</Form.Label>
                        <Form.Control type="number" className="w-auto me-2" name="topCustomersLimit" value={analysisFilters.topCustomersLimit} onChange={handleFilterChange} min="1" />
                        <Form.Label className="me-2 mb-0">Branch:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="topCustomersBranchId" value={analysisFilters.topCustomersBranchId} onChange={handleFilterChange}>
                            <option value="">All Branches</option>
                            {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>Start Date:</Form.Label>
                                <Form.Control type="date" name="topCustomersStartDate" value={analysisFilters.topCustomersStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>End Date:</Form.Label>
                                <Form.Control type="date" name="topCustomersEndDate" value={analysisFilters.topCustomersEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col xs={12} className="mt-3">
                            {topCustomers.length === 0 ? (
                                <Alert variant="info">No customers found matching the filters.</Alert>
                            ) : (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Customer Name</th>
                                            <th className="text-end">Total Sales Amount (₦)</th>
                                            <th className="text-end">Total Transactions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCustomers.map(cust => (
                                            <tr key={cust.customer_id}>
                                                <td>{cust.customer_name}</td>
                                                <td className="text-end">₦{Number(cust.total_sales_amount).toFixed(2)}</td>
                                                <td className="text-end">{cust.total_transactions}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Production Waste Over Time */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Production & Waste Trend <FaTractor className="ms-2" />
                    <Form.Group className="d-flex align-items-center mb-0">
                        <Form.Label className="me-2 mb-0"><FaCalendarAlt className="me-1"/>Period:</Form.Label>
                        <Form.Select className="w-auto me-2" name="productionWastePeriod" value={analysisFilters.productionWastePeriod} onChange={handleFilterChange}>
                            <option value="month">Monthly</option>
                            <option value="day">Daily</option>
                        </Form.Select>
                         <Form.Label className="me-2 mb-0"><FaStore className="me-1"/>Branch:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="productionWasteBranchId" value={analysisFilters.productionWasteBranchId} onChange={handleFilterChange}>
                            <option value="">All Branches</option>
                            {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>Start Date:</Form.Label>
                                <Form.Control type="date" name="productionWasteStartDate" value={analysisFilters.productionWasteStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>End Date:</Form.Label>
                                <Form.Control type="date" name="productionWasteEndDate" value={analysisFilters.productionWasteEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={12} className="mt-3">
                            <Line data={productionWasteTrendChartData} options={productionWasteTrendChartOptions} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Raw Material Stock Value Trend */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Raw Material Stock Value Trend <FaWarehouse className="ms-2" />
                    <Form.Group className="d-flex align-items-center mb-0">
                        <Form.Label className="me-2 mb-0"><FaCalendarAlt className="me-1"/>Period:</Form.Label>
                        <Form.Select className="w-auto me-2" name="rawMaterialStockPeriod" value={analysisFilters.rawMaterialStockPeriod} onChange={handleFilterChange}>
                            <option value="month">Monthly</option>
                            <option value="day">Daily</option>
                        </Form.Select>
                        <Form.Label className="me-2 mb-0"><FaSeedling className="me-1"/>Raw Material:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="rawMaterialStockId" value={analysisFilters.rawMaterialStockId} onChange={handleFilterChange}>
                            <option value="">All Raw Materials</option>
                            {allRawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                        </Form.Control>
                        <Form.Label className="me-2 mb-0"><FaStore className="me-1"/>Branch:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="rawMaterialStockBranchId" value={analysisFilters.rawMaterialStockBranchId} onChange={handleFilterChange}>
                            <option value="">All Branches</option>
                            {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>Start Date:</Form.Label>
                                <Form.Control type="date" name="rawMaterialStockStartDate" value={analysisFilters.rawMaterialStockStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>End Date:</Form.Label>
                                <Form.Control type="date" name="rawMaterialStockEndDate" value={analysisFilters.rawMaterialStockEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={12} className="mt-3">
                            <Line data={rawMaterialStockValueTrendChartData} options={rawMaterialStockValueTrendChartOptions} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Customer Lifetime Value (CLTV) */}
            <Card className="analysis-card mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Customer Lifetime Value (Approximation) <FaMoneyBillWave className="ms-2" />
                    <Form.Group className="d-flex align-items-center mb-0">
                        <Form.Label className="me-2 mb-0">Limit:</Form.Label>
                        <Form.Control type="number" className="w-auto me-2" name="cltvLimit" value={analysisFilters.cltvLimit} onChange={handleFilterChange} min="1" />
                        <Form.Label className="me-2 mb-0">Branch:</Form.Label>
                        <Form.Control as="select" className="w-auto" name="cltvBranchId" value={analysisFilters.cltvBranchId} onChange={handleFilterChange}>
                            <option value="">All Branches</option>
                            {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>Start Date:</Form.Label>
                                <Form.Control type="date" name="cltvStartDate" value={analysisFilters.cltvStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaCalendarAlt className="me-1"/>End Date:</Form.Label>
                                <Form.Control type="date" name="cltvEndDate" value={analysisFilters.cltvEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label><FaUsers className="me-1"/>Customer:</Form.Label>
                                <Form.Control as="select" name="cltvCustomerId" value={analysisFilters.cltvCustomerId} onChange={handleFilterChange}>
                                    <option value="">All Customers</option>
                                    {allCustomers.map(cust => (
                                        <option key={cust.id} value={cust.id}>{cust.fullname}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col xs={12} className="mt-3">
                            {customerLifetimeValue.length === 0 ? (
                                <Alert variant="info">No CLTV data found matching the filters.</Alert>
                            ) : (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Customer Name</th>
                                            <th className="text-end">Total Revenue (₦)</th>
                                            <th className="text-end">Total Profit (₦)</th>
                                            <th className="text-end">Transactions</th>
                                            <th className="text-end">Lifespan (Months)</th>
                                            <th className="text-end">Approx. CLTV (₦)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerLifetimeValue.map(cust => (
                                            <tr key={cust.customer_id}>
                                                <td>{cust.customer_name}</td>
                                                <td className="text-end">₦{Number(cust.total_revenue_generated).toFixed(2)}</td>
                                                <td className="text-end">₦{Number(cust.total_profit_generated).toFixed(2)}</td>
                                                <td className="text-end">{cust.total_transactions}</td>
                                                <td className="text-end">{cust.customer_lifespan_months}</td>
                                                <td className="text-end">₦{Number(cust.approximated_cltv).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

        </div>
    );
};

export default AnalysisPage;
