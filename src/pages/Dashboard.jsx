import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Spinner, Alert } from 'react-bootstrap';
import { FaChartBar, FaSmile, FaDollarSign, FaCreditCard, FaBoxes, FaUser, FaTractor, FaReceipt, FaExclamationTriangle, FaChartLine, FaBoxOpen, FaUsers, FaArrowUp, FaArrowDown, FaCog, FaCalendarAlt, FaCalendarTimes, FaCalendarDay, FaTrashAlt, FaChartArea, FaShoppingCart } from 'react-icons/fa';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import useAuth from '../hooks/useAuth';
import '../assets/styles/dashboard.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE_URL = 'https://purple-premium-bread-backend.onrender.com/api';


const Dashboard = () => {
    const { user } = useAuth();
    const [kpis, setKpis] = useState(null);
    const [salesOverTime, setSalesOverTime] = useState([]);
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [salesByPaymentMethod, setSalesByPaymentMethod] = useState([]);
    const [rawMaterialUsageTrend, setRawMaterialUsageTrend] = useState([]);
    const [customersByGender, setCustomersByGender] = useState([]);
    const [productionOverTime, setProductionOverTime] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [kpisRes, salesOverTimeRes, topSellingProductsRes, lowStockProductsRes, salesByPaymentMethodRes, rawMaterialUsageTrendRes, customersByGenderRes, productionOverTimeRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/dashboard/kpis`),
                axios.get(`${API_BASE_URL}/dashboard/sales-over-time?period=month&limit=6`),
                axios.get(`${API_BASE_URL}/dashboard/top-selling-products?orderBy=amount&limit=5`),
                axios.get(`${API_BASE_URL}/dashboard/stock-levels`),
                axios.get(`${API_BASE_URL}/dashboard/sales-by-payment-method`),
                axios.get(`${API_BASE_URL}/dashboard/raw-material-usage-trend?period=month&limit=6`),
                axios.get(`${API_BASE_URL}/dashboard/customers-by-gender`),
                axios.get(`${API_BASE_URL}/dashboard/production-over-time?limit=14`),
            ]);
            setKpis(kpisRes.data);
            setSalesOverTime(salesOverTimeRes.data);
            setTopSellingProducts(topSellingProductsRes.data);
            setLowStockProducts(lowStockProductsRes.data);
            setSalesByPaymentMethod(salesByPaymentMethodRes.data);
            setRawMaterialUsageTrend(rawMaterialUsageTrendRes.data);
            setCustomersByGender(customersByGenderRes.data);
            setProductionOverTime(productionOverTimeRes.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err.response?.data || err.message);
            setError('Failed to load dashboard data. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const formatCurrency = (amount) => `₦${Number(amount).toFixed(2)}`;
    const formatNumber = (num) => num !== null && num !== undefined ? Number(num).toLocaleString() : 'N/A';
    
    const totalSales = kpis?.totalSales || 0;
    const totalProfit = kpis?.totalProfit || 0;
    const outstandingCredit = kpis?.outstandingCredit || 0;
    const netProductionToday = kpis?.netProductionToday || 0;
    const rawMaterialValue = kpis?.rawMaterialValue || 0;
    const activeAlertsCount = kpis?.activeAlertsCount || 0;
    const productionWasteRate = kpis?.productionWasteRate || 0;
    const averageSalesValue = kpis?.averageSalesValue || 0;
    const totalCustomers = kpis?.totalCustomers || 0;
    
    // Chart Data and Options
    const salesChartData = { labels: salesOverTime.map(item => item.period), datasets: [{ label: 'Total Sales (₦)', data: salesOverTime.map(item => item.total_sales), borderColor: '#5C6BC0', backgroundColor: 'rgba(92, 107, 192, 0.2)', tension: 0.4, borderWidth: 3 }, { label: 'Total Profit (₦)', data: salesOverTime.map(item => item.total_profit), borderColor: '#AB47BC', backgroundColor: 'rgba(171, 71, 188, 0.2)', tension: 0.4, borderWidth: 3 }] };
    const salesChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#666' } }, title: { display: true, text: 'Sales & Profit Over Time', font: { size: 16, weight: 'bold' } } }, scales: { y: { beginAtZero: true, grid: { color: '#e9ecef' } }, x: { grid: { color: '#e9ecef' } } } };
    const topProductsChartData = { labels: topSellingProducts.map(item => item.product_name), datasets: [{ label: 'Total Sales Amount (₦)', data: topSellingProducts.map(item => item.total_sales_amount), backgroundColor: '#7B68EE', borderWidth: 1 }, { label: 'Total Quantity Sold', data: topSellingProducts.map(item => item.total_quantity_sold), backgroundColor: '#42A5F5', borderWidth: 1 }] };
    const topProductsChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#666' } }, title: { display: true, text: 'Top Selling Products', font: { size: 16, weight: 'bold' } } }, scales: { y: { beginAtZero: true, grid: { color: '#e9ecef' } }, x: { grid: { color: '#e9ecef' } } } };
    const paymentMethodChartData = { labels: salesByPaymentMethod.map(item => item.payment_method), datasets: [{ data: salesByPaymentMethod.map(item => item.total_sales_amount), backgroundColor: ['#7B68EE', '#42A5F5', '#AB47BC', '#5C6BC0'], hoverOffset: 4 }] };
    const paymentMethodChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#666' } }, title: { display: true, text: 'Sales by Payment Method', font: { size: 16, weight: 'bold' } } } };
    const productionTrendChartData = { labels: productionOverTime.map(item => new Date(item.production_date).toLocaleDateString()), datasets: [{ label: 'Total Produced', data: productionOverTime.map(item => item.total_produced), borderColor: '#7B68EE', backgroundColor: 'rgba(123, 104, 238, 0.4)', tension: 0.4, fill: false, borderWidth: 3 }, { label: 'Total Waste', data: productionOverTime.map(item => item.total_waste), borderColor: '#BDBDBD', backgroundColor: 'rgba(189, 189, 189, 0.5)', tension: 0.4, fill: false, borderWidth: 3 }] };
    const productionTrendChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#666' } }, title: { display: true, text: 'Daily Production & Waste Trend', font: { size: 16, weight: 'bold' } } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Units' }, grid: { color: '#e9ecef' } }, x: { grid: { color: '#e9ecef' } } } };
    const rawMaterialUsageChartData = { labels: rawMaterialUsageTrend.map(item => item.period), datasets: [{ label: 'Material Used', data: rawMaterialUsageTrend.map(item => item.total_material_used), borderColor: '#42A5F5', backgroundColor: 'rgba(66, 165, 245, 0.5)', tension: 0.4, borderWidth: 3 }, { label: 'Material Added', data: rawMaterialUsageTrend.map(item => item.total_material_added), borderColor: '#AB47BC', backgroundColor: 'rgba(171, 71, 188, 0.5)', tension: 0.4, borderWidth: 3 }] };
    const rawMaterialUsageChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#666' } }, title: { display: true, text: 'Raw Material Flow', font: { size: 16, weight: 'bold' } } }, scales: { y: { beginAtZero: true, grid: { color: '#e9ecef' } }, x: { grid: { color: '#e9ecef' } } } };
    const customersByGenderChartData = { labels: customersByGender.map(item => item.gender), datasets: [{ data: customersByGender.map(item => item.customer_count), backgroundColor: ['#7B68EE', '#BDBDBD'], hoverOffset: 4 }] };
    const customersByGenderChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#666' } }, title: { display: true, text: 'Customers by Gender', font: { size: 16, weight: 'bold' } } } };

    if (loading) {
        return (
            <div className="loading-container">
                <Spinner animation="border" role="status" className="loading-spinner" />
                <p className="loading-text">Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {user && (
                <div className="welcome-banner">
                    <div className="banner-content">
                        <FaSmile className="banner-icon" />
                        <div className="banner-text">
                            <span className="banner-title">Welcome back, {user?.full_name || 'User'}! 👋</span>
                            <span className="banner-subtitle">
                                <FaUser /> {user?.username || 'Username'} | {user?.role || 'Role'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="dashboard-header">
                <FaChartBar className="header-icon" />
                <h1 className="main-header">Business Overview Dashboard</h1>
            </div>

            {error && <Alert variant="danger" className="error-alert">{error}</Alert>}
            
            <div className="dashboard-content">
                {/* KPI Cards Section */}
                <div className="kpi-cards-grid">
                    <div className="kpi-card">
                        <FaDollarSign className="kpi-icon-absolute" />
                        <span className="kpi-title">Total Sales</span>
                        <span className="kpi-value-large">{formatCurrency(totalSales)}</span>
                        <span className="kpi-subtitle-large"><FaCalendarAlt className="subtitle-icon"/> This month so far</span>
                    </div>
                    <div className="kpi-card">
                        <FaChartLine className="kpi-icon-absolute" />
                        <span className="kpi-title">Total Profit</span>
                        <span className="kpi-value-large">{formatCurrency(totalProfit)}</span>
                        <span className="kpi-subtitle-large"><FaCalendarAlt className="subtitle-icon"/> This month so far</span>
                    </div>
                    <div className="kpi-card">
                        <FaCreditCard className="kpi-icon-absolute" />
                        <span className="kpi-title">Outstanding Credit</span>
                        <span className="kpi-value-large">{formatCurrency(outstandingCredit)}</span>
                        <span className="kpi-subtitle-large"><FaCalendarTimes className="subtitle-icon"/> From all customers</span>
                    </div>
                    <div className="kpi-card">
                        <FaBoxOpen className="kpi-icon-absolute" />
                        <span className="kpi-title">Net Production Today</span>
                        <span className="kpi-value-large">{formatNumber(netProductionToday)}</span>
                        <span className="kpi-subtitle-large"><FaCalendarDay className="subtitle-icon"/> Total units produced</span>
                    </div>
                    <div className="kpi-card">
                        <FaTractor className="kpi-icon-absolute" />
                        <span className="kpi-title">Raw Material Value</span>
                        <span className="kpi-value-large">{formatCurrency(rawMaterialValue)}</span>
                        <span className="kpi-subtitle-large"><FaBoxOpen className="subtitle-icon"/> Current stock value</span>
                    </div>
                    <div className="kpi-card">
                        <FaExclamationTriangle className="kpi-icon-absolute" />
                        <span className="kpi-title">Active Alerts</span>
                        <span className="kpi-value-large">{activeAlertsCount}</span>
                        <span className="kpi-subtitle-large"><FaCog className="subtitle-icon"/> Critical issues</span>
                    </div>
                    <div className="kpi-card">
                        <FaTrashAlt className="kpi-icon-absolute" />
                        <span className="kpi-title">Overall Waste Rate</span>
                        <span className="kpi-value-large">{productionWasteRate ? `${productionWasteRate.toFixed(2)}%` : '0.00%'}</span>
                        <span className="kpi-subtitle-large"><FaChartArea className="subtitle-icon"/> Past 30 days</span>
                    </div>
                    <div className="kpi-card">
                        <FaReceipt className="kpi-icon-absolute" />
                        <span className="kpi-title">Average Sales Value</span>
                        <span className="kpi-value-large">{formatCurrency(averageSalesValue)}</span>
                        <span className="kpi-subtitle-large"><FaShoppingCart className="subtitle-icon"/> Per transaction</span>
                    </div>
                    <div className="kpi-card">
                        <FaUsers className="kpi-icon-absolute" />
                        <span className="kpi-title">Total Customers</span>
                        <span className="kpi-value-large">{formatNumber(totalCustomers)}</span>
                        <span className="kpi-subtitle-large"><FaUser className="subtitle-icon"/> Unique customers</span>
                    </div>
                </div>
            
                {/* Charts Section */}
                <div className="charts-grid">
                    <div className="chart-card">
                        <Line data={salesChartData} options={salesChartOptions} />
                    </div>
                    <div className="chart-card">
                        <Bar data={topProductsChartData} options={topProductsChartOptions} />
                    </div>
                    <div className="chart-card">
                        <Line data={productionTrendChartData} options={productionTrendChartOptions} />
                    </div>
                    <div className="chart-card">
                        <Line data={rawMaterialUsageChartData} options={rawMaterialUsageChartOptions} />
                    </div>
                    <div className="chart-card chart-card-small">
                        <Pie data={paymentMethodChartData} options={paymentMethodChartOptions} />
                    </div>
                    <div className="chart-card chart-card-small">
                        <Pie data={customersByGenderChartData} options={customersByGenderChartOptions} />
                    </div>
                </div>

                {/* Low Stock Products Section */}
                <div className="table-section-card">
                    <h2 className="section-title"><FaExclamationTriangle className="icon-danger" /> Low Stock Finished Products</h2>
                    {lowStockProducts.length === 0 ? (
                        <Alert variant="success" className="no-stock-alert">All products are well-stocked. Great job!</Alert>
                    ) : (
                        <div className="table-responsive-wrapper">
                            <table className="low-stock-table">
                                <thead>
                                    <tr>
                                        <th>S/N</th>
                                        <th>Product Name</th>
                                        <th>Image</th>
                                        <th>Current Stock</th>
                                        <th>Min Stock Level</th>
                                        <th>Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockProducts.map((product, index) => (
                                        <tr key={product.id}>
                                            <td>{index + 1}</td>
                                            <td>{product.product_name}</td>
                                            <td>
                                                <img src={product.image_url || 'https://placehold.co/50x50/e0e0e0/000000?text=No+Img'} alt={product.product_name} className="product-image" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/e0e0e0/000000?text=Img+Err'; }} />
                                            </td>
                                            <td className={product.current_stock < product.min_stock_level ? 'stock-low' : ''}>{Number(product.current_stock).toFixed(0)}</td>
                                            <td>{Number(product.min_stock_level).toFixed(0)}</td>
                                            <td>{product.unit_display || 'units'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;