// src/pages/AnalysisPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, Row, Col, Spinner, Alert, Form, Button, Table } from 'react-bootstrap';
import { FaChartBar, FaPercent, FaSyncAlt, FaLayerGroup, FaMoneyBillWave, FaWarehouse, FaUsers, FaChartArea, FaTractor, FaCalendarAlt, FaStore, FaBox, FaCubes, FaSeedling, FaFilter, FaTrashAlt } from 'react-icons/fa';
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
import { toast } from 'react-toastify';
import '../assets/styles/analysis.css';
import CustomToast from '../components/CustomToast';

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

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

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
        salesComparisonPeriod: 'month',
        salesComparisonBranchId: '',
        profitMarginTrendPeriod: 'month',
        profitMarginTrendBranchId: '',
        inventoryTurnoverProductId: '',
        inventoryTurnoverStartDate: '',
        inventoryTurnoverEndDate: '',
        inventoryTurnoverBranchId: '',
        salesTrendStartDate: '',
        salesTrendEndDate: '',
        salesTrendCategory: '',
        salesTrendProductId: '',
        salesTrendPeriod: 'month',
        salesTrendBranchId: '',
        topCustomersStartDate: '',
        topCustomersEndDate: '',
        topCustomersLimit: 10,
        topCustomersBranchId: '',
        productionWasteStartDate: '',
        productionWasteEndDate: '',
        productionWastePeriod: 'month',
        productionWasteBranchId: '',
        rawMaterialStockStartDate: '',
        rawMaterialStockEndDate: '',
        rawMaterialStockId: '',
        rawMaterialStockPeriod: 'month',
        rawMaterialStockBranchId: '',
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
            // toast.success('Analysis data loaded successfully');
            // toast(<CustomToast id="123" type="success" message="Analysis data loaded successfully" />);
            toast(<CustomToast id={`success-analysis-${Date.now()}`} type="success" message="Analysis data loaded successfully" />, {
                toastId: 'analysis-success'
            });
        } catch (err) {
            console.error('Error fetching dropdown data for analysis:', err);
            // toast.error('Failed to load analysis options');
            // toast(<CustomToast id="123" type="error" message="Failed to load analysis options" />);
            toast(<CustomToast id={`error-analysis-${Date.now()}`} type="error" message="Failed to load analysis options" />, {
                toastId: 'analysis-error'
            });
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
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
                axios.get(`${API_BASE_URL}/analysis/production-waste-over-time?${buildParams({ startDate: analysisFilters.productionWasteStartDate, endDate: analysisFilters.productionWasteEndDate, period: analysisFilters.productionWastePeriod })}`),
                axios.get(`${API_BASE_URL}/analysis/raw-material-stock-value-trend?${buildParams({ startDate: analysisFilters.rawMaterialStockStartDate, endDate: analysisFilters.rawMaterialStockEndDate, rawMaterialId: analysisFilters.rawMaterialStockId, period: analysisFilters.rawMaterialStockPeriod })}`),
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

            // toast.success('Analysis updated successfully');
            // toast(<CustomToast id="123" type="success" message="Analysis updated successfully" />);
            toast(<CustomToast id={`success-update-${Date.now()}`} type="success" message="Analysis updated successfully" />, {
                toastId: 'update-success'
            });
        } catch (err) {
            console.error('Error fetching analysis data:', err.response?.data || err.message);
            setError('Failed to load analysis data. ' + (err.response?.data?.details || err.message));
            // toast.error('Failed to load analysis data');
            // toast(<CustomToast id="123" type="error" message="Failed to load analysis data" />);
            toast(<CustomToast id={`error-load-${Date.now()}`} type="error" message="Failed to load analysis data" />, {
                toastId: 'load-error'
            });
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

    const clearFilters = (section = null) => {
        if (section) {
            const sectionFilters = {};
            Object.keys(analysisFilters).forEach(key => {
                if (key.startsWith(section)) {
                    sectionFilters[key] = '';
                }
            });
            setAnalysisFilters(prev => ({ ...prev, ...sectionFilters }));
            // toast.info(`Cleared ${section} filters`);
            // toast(<CustomToast id="123" type="info" message={`Cleared ${section} filters`} />);
            toast(<CustomToast id={`info-filter-${Date.now()}`} type="info" message={`Cleared ${section} filters`} />, {
                toastId: 'filter-info'
            });
        } else {
            const clearedFilters = {};
            Object.keys(analysisFilters).forEach(key => {
                clearedFilters[key] = '';
            });
            setAnalysisFilters(prev => ({ ...prev, ...clearedFilters }));
            // toast.info('All filters cleared');
            // toast(<CustomToast id="123" type="info" message="All filters cleared" />);
            toast(<CustomToast id={`info-cleared-${Date.now()}`} type="info" message="All filters cleared" />, {
                toastId: 'cleared-info'
            });
        }
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

    // Chart data and options
    const salesComparisonChartData = {
        labels: ['Total Sales', 'Total Profit'],
        datasets: [
            {
                label: `Current ${analysisFilters.salesComparisonPeriod.charAt(0).toUpperCase() + analysisFilters.salesComparisonPeriod.slice(1)}`,
                data: [salesComparison?.currentPeriod?.sales || 0, salesComparison?.currentPeriod?.profit || 0],
                backgroundColor: 'rgba(74, 20, 140, 0.7)',
                borderColor: 'rgb(74, 20, 140)',
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
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Sales & Profit Comparison (${analysisFilters.salesComparisonPeriod.charAt(0).toUpperCase() + analysisFilters.salesComparisonPeriod.slice(1)})`,
                color: 'var(--report--purple)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Amount (₦)',
                    color: 'var(--ink)'
                },
                grid: {
                    color: 'var(--line)'
                }
            },
            x: {
                grid: {
                    color: 'var(--line)'
                }
            }
        }
    };

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
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Gross Profit Margin Trend',
                color: 'var(--report--purple)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Margin (%)',
                    color: 'var(--ink)'
                },
                ticks: {
                    callback: function (value) {
                        return value + '%';
                    }
                },
                grid: {
                    color: 'var(--line)'
                }
            },
            x: {
                grid: {
                    color: 'var(--line)'
                }
            }
        }
    };

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
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: 'Sales Trend by Category/Product',
                color: 'var(--report--purple)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Sales (₦)',
                    color: 'var(--ink)'
                },
                grid: {
                    color: 'var(--line)'
                }
            },
            x: {
                grid: {
                    color: 'var(--line)'
                }
            }
        }
    };

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
                yAxisID: 'y-percentage',
            },
        ],
    };

    const productionWasteTrendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: 'Production & Waste Trend',
                color: 'var(--report--purple)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
        },
        scales: {
            'y-produced': {
                beginAtZero: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Quantity',
                    color: 'var(--ink)'
                },
                grid: {
                    color: 'var(--line)'
                }
            },
            'y-percentage': {
                beginAtZero: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Waste (%)',
                    color: 'var(--ink)'
                },
                grid: { drawOnChartArea: false },
                ticks: {
                    callback: function (value) { return value + '%'; }
                }
            },
            x: {
                grid: {
                    color: 'var(--line)'
                }
            }
        }
    };

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
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: 'Raw Material Stock Value Trend (Cumulative)',
                color: 'var(--report--purple)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Value (₦)',
                    color: 'var(--ink)'
                },
                grid: {
                    color: 'var(--line)'
                }
            },
            x: {
                grid: {
                    color: 'var(--line)'
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Spinner animation="border" role="status" variant="primary" />
                <p>Loading analysis data...</p>
            </div>
        );
    }

    return (
        <div className="analysis-page-container">
            <div className="page-header">
                <h1 className="main-header"><FaChartBar className="me-2" /> Data Analysis & Insights</h1>
                <p className="subtitle">Comprehensive business analytics and performance metrics</p>
            </div>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}

            {/* Sales Comparison Section */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaChartArea />
                        </div>
                        <h5>Sales & Profit Comparison</h5>
                    </div>
                    <div className="filter-controls">
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Period:</Form.Label>
                            <Form.Select name="salesComparisonPeriod" value={analysisFilters.salesComparisonPeriod} onChange={handleFilterChange}>
                                <option value="month">Month</option>
                                <option value="week">Week</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaStore className="me-1" />Branch:</Form.Label>
                            <Form.Control as="select" name="salesComparisonBranchId" value={analysisFilters.salesComparisonBranchId} onChange={handleFilterChange}>
                                <option value="">All Branches</option>
                                {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Form.Control>
                        </Form.Group>
                        <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('salesComparison')} className="clear-btn">
                            <FaTrashAlt className="me-1" /> Clear
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="salesComparisonStartDate" value={analysisFilters.salesComparisonStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="salesComparisonEndDate" value={analysisFilters.salesComparisonEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={7}>
                            <div className="chart-container">
                                <Bar data={salesComparisonChartData} options={salesComparisonChartOptions} />
                            </div>
                        </Col>
                        <Col md={5}>
                            <div className="summary-section">
                                <h6 className="summary-title">Performance Summary</h6>
                                <div className="summary-grid">
                                    <div className="summary-item">
                                        <div className="summary-label">Current Sales</div>
                                        <div className="summary-value">₦{salesComparison?.currentPeriod?.sales?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="summary-label">Previous Sales</div>
                                        <div className="summary-value">₦{salesComparison?.previousPeriod?.sales?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="summary-label">Sales Change</div>
                                        <div className={`summary-value ${salesChangePercent >= 0 ? 'positive' : 'negative'}`}>
                                            {salesChangePercent >= 0 ? '+' : ''}{salesChangePercent?.toFixed(2) || '0.00'}%
                                        </div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="summary-label">Current Profit</div>
                                        <div className="summary-value">₦{salesComparison?.currentPeriod?.profit?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="summary-label">Previous Profit</div>
                                        <div className="summary-value">₦{salesComparison?.previousPeriod?.profit?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="summary-label">Profit Change</div>
                                        <div className={`summary-value ${profitChangePercent >= 0 ? 'positive' : 'negative'}`}>
                                            {profitChangePercent >= 0 ? '+' : ''}{profitChangePercent?.toFixed(2) || '0.00'}%
                                        </div>
                                    </div>
                                </div>
                                <div className="period-info">
                                    <div className="period-dates">
                                        <span className="period-label">Current Period:</span>
                                        <span>{salesComparison?.currentPeriod?.start} to {salesComparison?.currentPeriod?.end}</span>
                                    </div>
                                    <div className="period-dates">
                                        <span className="period-label">Previous Period:</span>
                                        <span>{salesComparison?.previousPeriod?.start} to {salesComparison?.previousPeriod?.end}</span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Profit Margin Trend Section */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaPercent />
                        </div>
                        <h5>Gross Profit Margin Trend</h5>
                    </div>
                    <div className="filter-controls">
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Period:</Form.Label>
                            <Form.Select name="profitMarginTrendPeriod" value={analysisFilters.profitMarginTrendPeriod} onChange={handleFilterChange}>
                                <option value="month">Last 12 Months</option>
                                <option value="day">Last 30 Days</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaStore className="me-1" />Branch:</Form.Label>
                            <Form.Control as="select" name="profitMarginTrendBranchId" value={analysisFilters.profitMarginTrendBranchId} onChange={handleFilterChange}>
                                <option value="">All Branches</option>
                                {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Form.Control>
                        </Form.Group>
                        <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('profitMarginTrend')} className="clear-btn">
                            <FaTrashAlt className="me-1" /> Clear
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="profitMarginTrendStartDate" value={analysisFilters.profitMarginTrendStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="profitMarginTrendEndDate" value={analysisFilters.profitMarginTrendEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="chart-container">
                        <Line data={profitMarginTrendChartData} options={profitMarginTrendChartOptions} />
                    </div>
                </Card.Body>
            </Card>

            {/* Inventory Turnover Section */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaSyncAlt />
                        </div>
                        <h5>Inventory Turnover Rate</h5>
                    </div>
                    <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('inventoryTurnover')} className="clear-btn">
                        <FaTrashAlt className="me-1" /> Clear
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaBox className="me-1" />Product:</Form.Label>
                                <Form.Control as="select" name="inventoryTurnoverProductId" value={analysisFilters.inventoryTurnoverProductId} onChange={handleFilterChange}>
                                    <option value="">All Products</option>
                                    {allProducts.map(prod => (
                                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaStore className="me-1" />Branch:</Form.Label>
                                <Form.Control as="select" name="inventoryTurnoverBranchId" value={analysisFilters.inventoryTurnoverBranchId} onChange={handleFilterChange}>
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="inventoryTurnoverStartDate" value={analysisFilters.inventoryTurnoverStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="inventoryTurnoverEndDate" value={analysisFilters.inventoryTurnoverEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    {inventoryTurnover && (
                        <Row className="mt-3">
                            <Col xs={12}>
                                <div className="metrics-grid">
                                    <div className="metric-item">
                                        <div className="metric-label">COGS</div>
                                        <div className="metric-value">₦{inventoryTurnover.reportData?.cogs?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-label">Approx. Current Inventory Value</div>
                                        <div className="metric-value">₦{inventoryTurnover.reportData?.averageInventoryValue?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-label">Inventory Turnover Rate</div>
                                        <div className="metric-value">{inventoryTurnover.reportData?.inventoryTurnoverRate?.toFixed(2) || '0.00'} times</div>
                                    </div>
                                    <div className="metric-explanation">
                                        <small>{inventoryTurnover.reportData?.explanation}</small>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Sales Trend by Category/Product */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaChartArea />
                        </div>
                        <h5>Sales Trend by Category/Product</h5>
                    </div>
                    <div className="filter-controls">
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Period:</Form.Label>
                            <Form.Select name="salesTrendPeriod" value={analysisFilters.salesTrendPeriod} onChange={handleFilterChange}>
                                <option value="month">Monthly</option>
                                <option value="day">Daily</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaCubes className="me-1" />Category:</Form.Label>
                            <Form.Control as="select" name="salesTrendCategory" value={analysisFilters.salesTrendCategory} onChange={handleFilterChange}>
                                <option value="">All Categories</option>
                                {allCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaBox className="me-1" />Product:</Form.Label>
                            <Form.Control as="select" name="salesTrendProductId" value={analysisFilters.salesTrendProductId} onChange={handleFilterChange}>
                                <option value="">All Products</option>
                                {allProducts.map(prod => <option key={prod.id} value={prod.id}>{prod.name}</option>)}
                            </Form.Control>
                        </Form.Group>
                        <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('salesTrend')} className="clear-btn">
                            <FaTrashAlt className="me-1" /> Clear
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="salesTrendStartDate" value={analysisFilters.salesTrendStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="salesTrendEndDate" value={analysisFilters.salesTrendEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaStore className="me-1" />Branch:</Form.Label>
                                <Form.Control as="select" name="salesTrendBranchId" value={analysisFilters.salesTrendBranchId} onChange={handleFilterChange}>
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col md={12}>
                            <div className="chart-container">
                                <Line data={salesTrendByCatProdChartData} options={salesTrendByCatProdChartOptions} />
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Top Customers by Sales */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaUsers />
                        </div>
                        <h5>Top Customers by Sales</h5>
                    </div>
                    <div className="filter-controls">
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label">Limit:</Form.Label>
                            <Form.Control type="number" name="topCustomersLimit" value={analysisFilters.topCustomersLimit} onChange={handleFilterChange} min="1" />
                        </Form.Group>
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label">Branch:</Form.Label>
                            <Form.Control as="select" name="topCustomersBranchId" value={analysisFilters.topCustomersBranchId} onChange={handleFilterChange}>
                                <option value="">All Branches</option>
                                {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Form.Control>
                        </Form.Group>
                        <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('topCustomers')} className="clear-btn">
                            <FaTrashAlt className="me-1" /> Clear
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="topCustomersStartDate" value={analysisFilters.topCustomersStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="topCustomersEndDate" value={analysisFilters.topCustomersEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col xs={12}>
                            {topCustomers.length === 0 ? (
                                <Alert variant="info" className="no-data-alert">No customers found matching the filters.</Alert>
                            ) : (
                                <div className="table-container">
                                    <Table striped bordered hover className="data-table">
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
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Production Waste Over Time */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaTractor />
                        </div>
                        <h5>Production & Waste Trend</h5>
                    </div>
                    <div className="filter-controls">
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Period:</Form.Label>
                            <Form.Select name="productionWastePeriod" value={analysisFilters.productionWastePeriod} onChange={handleFilterChange}>
                                <option value="month">Monthly</option>
                                <option value="day">Daily</option>
                            </Form.Select>
                        </Form.Group>
                        <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('productionWaste')} className="clear-btn">
                            <FaTrashAlt className="me-1" /> Clear
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="productionWasteStartDate" value={analysisFilters.productionWasteStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="productionWasteEndDate" value={analysisFilters.productionWasteEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaStore className="me-1" />Branch:</Form.Label>
                                <Form.Control as="select" name="productionWasteBranchId" value={analysisFilters.productionWasteBranchId} onChange={handleFilterChange}>
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col md={12}>
                            <div className="chart-container">
                                <Line data={productionWasteTrendChartData} options={productionWasteTrendChartOptions} />
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Raw Material Stock Value Trend */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaWarehouse />
                        </div>
                        <h5>Raw Material Stock Value Trend</h5>
                    </div>
                    <div className="filter-controls">
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Period:</Form.Label>
                            <Form.Select name="rawMaterialStockPeriod" value={analysisFilters.rawMaterialStockPeriod} onChange={handleFilterChange}>
                                <option value="month">Monthly</option>
                                <option value="day">Daily</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label"><FaSeedling className="me-1" />Raw Material:</Form.Label>
                            <Form.Control as="select" name="rawMaterialStockId" value={analysisFilters.rawMaterialStockId} onChange={handleFilterChange}>
                                <option value="">All Raw Materials</option>
                                {allRawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                            </Form.Control>
                        </Form.Group>
                        <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('rawMaterialStock')} className="clear-btn">
                            <FaTrashAlt className="me-1" /> Clear
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="rawMaterialStockStartDate" value={analysisFilters.rawMaterialStockStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="rawMaterialStockEndDate" value={analysisFilters.rawMaterialStockEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaStore className="me-1" />Branch:</Form.Label>
                                <Form.Control as="select" name="rawMaterialStockBranchId" value={analysisFilters.rawMaterialStockBranchId} onChange={handleFilterChange}>
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col md={12}>
                            <div className="chart-container">
                                <Line data={rawMaterialStockValueTrendChartData} options={rawMaterialStockValueTrendChartOptions} />
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Customer Lifetime Value (CLTV) */}
            <Card className="analysis-card mb-4">
                <Card.Header className="analysis-card-header">
                    <div className="d-flex align-items-center">
                        <div className="card-icon">
                            <FaMoneyBillWave />
                        </div>
                        <h5>Customer Lifetime Value (Approximation)</h5>
                    </div>
                    <div className="filter-controls">
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label">Limit:</Form.Label>
                            <Form.Control type="number" name="cltvLimit" value={analysisFilters.cltvLimit} onChange={handleFilterChange} min="1" />
                        </Form.Group>
                        <Form.Group className="filter-group">
                            <Form.Label className="filter-label">Branch:</Form.Label>
                            <Form.Control as="select" name="cltvBranchId" value={analysisFilters.cltvBranchId} onChange={handleFilterChange}>
                                <option value="">All Branches</option>
                                {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Form.Control>
                        </Form.Group>
                        <Button variant="outline-secondary" size="sm" onClick={() => clearFilters('cltv')} className="clear-btn">
                            <FaTrashAlt className="me-1" /> Clear
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="filter-row">
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />Start Date:</Form.Label>
                                <Form.Control type="date" name="cltvStartDate" value={analysisFilters.cltvStartDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaCalendarAlt className="me-1" />End Date:</Form.Label>
                                <Form.Control type="date" name="cltvEndDate" value={analysisFilters.cltvEndDate} onChange={handleFilterChange} />
                            </Form.Group>
                        </Col>
                        <Col md={3} className="filter-col">
                            <Form.Group>
                                <Form.Label className="filter-label"><FaUsers className="me-1" />Customer:</Form.Label>
                                <Form.Control as="select" name="cltvCustomerId" value={analysisFilters.cltvCustomerId} onChange={handleFilterChange}>
                                    <option value="">All Customers</option>
                                    {allCustomers.map(cust => (
                                        <option key={cust.id} value={cust.id}>{cust.fullname}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col xs={12}>
                            {customerLifetimeValue.length === 0 ? (
                                <Alert variant="info" className="no-data-alert">No CLTV data found matching the filters.</Alert>
                            ) : (
                                <div className="table-container">
                                    <Table striped bordered hover className="data-table">
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
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
};

export default AnalysisPage;