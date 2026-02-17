// Dashboard.jsx - COMPLETELY STYLED WITH COLLAPSIBLE FILTERS
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Spinner, Alert, Form, Row, Col, Button, Badge, Card } from 'react-bootstrap';
import { 
    FaChartBar, FaSmile, FaDollarSign, FaCreditCard, FaBoxes, 
    FaUser, FaTractor, FaReceipt, FaExclamationTriangle, FaChartLine, 
    FaBoxOpen, FaUsers, FaCalendarAlt, FaFilter, FaSync, 
    FaStore, FaMoneyBillWave, FaShoppingCart,
    FaArrowUp, FaArrowDown, FaChevronDown, FaChevronUp, FaTimes, FaCheck,
    FaTrashAlt, FaChartPie, FaDownload, FaPrint, FaShare, FaEllipsisV,
    FaCalendarWeek, FaCalendarDay, FaClock, FaTag
} from 'react-icons/fa';
import { 
    Line, Bar, Pie, Doughnut 
} from 'react-chartjs-2';
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
import useAuth from '../hooks/useAuth';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import '../assets/styles/dashboard.css';
import { FaCalendarDays } from 'react-icons/fa6';

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

// Filter options
const DATE_RANGES = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'this_week',
    LAST_WEEK: 'last_week',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_QUARTER: 'this_quarter',
    LAST_QUARTER: 'last_quarter',
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    ALL_TIME: 'all_time',
    CUSTOM: 'custom'
};

const DATE_RANGE_LABELS = {
    [DATE_RANGES.TODAY]: 'Today',
    [DATE_RANGES.YESTERDAY]: 'Yesterday',
    [DATE_RANGES.THIS_WEEK]: 'This Week',
    [DATE_RANGES.LAST_WEEK]: 'Last Week',
    [DATE_RANGES.THIS_MONTH]: 'This Month',
    [DATE_RANGES.LAST_MONTH]: 'Last Month',
    [DATE_RANGES.THIS_QUARTER]: 'This Quarter',
    [DATE_RANGES.LAST_QUARTER]: 'Last Quarter',
    [DATE_RANGES.THIS_YEAR]: 'This Year',
    [DATE_RANGES.LAST_YEAR]: 'Last Year',
    [DATE_RANGES.ALL_TIME]: 'All Time',
    [DATE_RANGES.CUSTOM]: 'Custom Range'
};

const DATE_RANGE_ICONS = {
    [DATE_RANGES.TODAY]: <FaCalendarDay />,
    [DATE_RANGES.YESTERDAY]: <FaClock />,
    [DATE_RANGES.THIS_WEEK]: <FaCalendarWeek />,
    [DATE_RANGES.LAST_WEEK]: <FaCalendarWeek />,
    [DATE_RANGES.THIS_MONTH]: <FaCalendarDays />,
    [DATE_RANGES.LAST_MONTH]: <FaCalendarDays />,
    [DATE_RANGES.THIS_QUARTER]: <FaCalendarAlt />,
    [DATE_RANGES.LAST_QUARTER]: <FaCalendarAlt />,
    [DATE_RANGES.THIS_YEAR]: <FaCalendarAlt />,
    [DATE_RANGES.LAST_YEAR]: <FaCalendarAlt />,
    [DATE_RANGES.ALL_TIME]: <FaClock />,
    [DATE_RANGES.CUSTOM]: <FaCalendarAlt />
};

const Dashboard = () => {
    const { user } = useAuth();
    
    // Data states
    const [kpis, setKpis] = useState(null);
    const [salesOverTime, setSalesOverTime] = useState([]);
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [salesByPaymentMethod, setSalesByPaymentMethod] = useState([]);
    const [rawMaterialUsageTrend, setRawMaterialUsageTrend] = useState([]);
    const [customersByGender, setCustomersByGender] = useState([]);
    const [productionOverTime, setProductionOverTime] = useState([]);
    const [branches, setBranches] = useState([]);
    const [categories, setCategories] = useState([]);
    
    // Filter states
    const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [comparisonEnabled, setComparisonEnabled] = useState(true);
    const [showFilters, setShowFilters] = useState(false); // Filters hidden by default
    
    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Calculate date range based on selection
    const getDateRange = useCallback(() => {
        const now = new Date();
        let startDate = null;
        let endDate = null;

        switch (dateRange) {
            case DATE_RANGES.TODAY:
                startDate = format(now, 'yyyy-MM-dd');
                endDate = format(now, 'yyyy-MM-dd');
                break;
            case DATE_RANGES.YESTERDAY:
                const yesterday = subDays(now, 1);
                startDate = format(yesterday, 'yyyy-MM-dd');
                endDate = format(yesterday, 'yyyy-MM-dd');
                break;
            case DATE_RANGES.THIS_WEEK:
                startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.LAST_WEEK:
                const lastWeek = subDays(now, 7);
                startDate = format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                endDate = format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.THIS_MONTH:
                startDate = format(startOfMonth(now), 'yyyy-MM-dd');
                endDate = format(endOfMonth(now), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.LAST_MONTH:
                const lastMonth = subMonths(now, 1);
                startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.THIS_QUARTER:
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = format(new Date(now.getFullYear(), quarter * 3, 1), 'yyyy-MM-dd');
                endDate = format(new Date(now.getFullYear(), (quarter + 1) * 3, 0), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.LAST_QUARTER:
                const lastQuarterDate = subMonths(now, 3);
                const lastQuarter = Math.floor(lastQuarterDate.getMonth() / 3);
                startDate = format(new Date(lastQuarterDate.getFullYear(), lastQuarter * 3, 1), 'yyyy-MM-dd');
                endDate = format(new Date(lastQuarterDate.getFullYear(), (lastQuarter + 1) * 3, 0), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.THIS_YEAR:
                startDate = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
                endDate = format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.LAST_YEAR:
                startDate = format(new Date(now.getFullYear() - 1, 0, 1), 'yyyy-MM-dd');
                endDate = format(new Date(now.getFullYear() - 1, 11, 31), 'yyyy-MM-dd');
                break;
            case DATE_RANGES.ALL_TIME:
                startDate = null;
                endDate = null;
                break;
            case DATE_RANGES.CUSTOM:
                startDate = customStartDate || null;
                endDate = customEndDate || null;
                break;
            default:
                startDate = format(startOfMonth(now), 'yyyy-MM-dd');
                endDate = format(endOfMonth(now), 'yyyy-MM-dd');
        }

        return { startDate, endDate };
    }, [dateRange, customStartDate, customEndDate]);

    // Get previous period for comparison
    const getPreviousPeriod = useCallback(() => {
        const { startDate, endDate } = getDateRange();
        if (!startDate || !endDate) return { prevStartDate: null, prevEndDate: null };

        const start = parseISO(startDate);
        const end = parseISO(endDate);
        const daysDiff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const prevStartDate = format(subDays(start, daysDiff), 'yyyy-MM-dd');
        const prevEndDate = format(subDays(end, daysDiff), 'yyyy-MM-dd');

        return { prevStartDate, prevEndDate };
    }, [getDateRange]);

    // Fetch branches for filter
    const fetchBranches = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/branches`);
            setBranches(response.data);
        } catch (err) {
            console.error('Error fetching branches:', err);
        }
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products/categories`);
            setCategories(response.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }, []);

    // Fetch low stock products
    const fetchLowStockProducts = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/stock-levels`);
            setLowStockProducts(response.data);
        } catch (err) {
            console.error('Error fetching low stock products:', err);
        }
    }, []);

    // Fetch customers by gender
    const fetchCustomersByGender = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/customers-by-gender`);
            setCustomersByGender(response.data);
        } catch (err) {
            console.error('Error fetching customers by gender:', err);
        }
    }, []);

    // Fetch all dashboard data with filters
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError('');
        
        try {
            const { startDate, endDate } = getDateRange();
            
            // Build query params
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (selectedBranch && selectedBranch !== 'all') params.append('branchId', selectedBranch);
            if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);

            console.log('Fetching data with filters:', Object.fromEntries(params));

            // Fetch all data in parallel
            const [
                kpisRes,
                salesOverTimeRes,
                topProductsRes,
                paymentMethodsRes,
                rawMaterialRes,
                productionRes
            ] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/dashboard/kpis?${params}`),
                axios.get(`${API_BASE_URL}/dashboard/sales-over-time?period=day&limit=30&${params}`),
                axios.get(`${API_BASE_URL}/dashboard/top-selling-products?orderBy=amount&limit=10&${params}`),
                axios.get(`${API_BASE_URL}/dashboard/sales-by-payment-method?${params}`),
                axios.get(`${API_BASE_URL}/dashboard/raw-material-usage-trend?period=month&limit=6&${params}`),
                axios.get(`${API_BASE_URL}/dashboard/production-over-time?limit=30&${params}`)
            ]);

            // Handle KPIs
            if (kpisRes.status === 'fulfilled') {
                setKpis(kpisRes.value.data);
                console.log('KPIs updated:', kpisRes.value.data);
            } else {
                console.error('KPIs fetch failed:', kpisRes.reason);
            }

            // Handle Sales Over Time
            if (salesOverTimeRes.status === 'fulfilled') {
                setSalesOverTime(salesOverTimeRes.value.data);
            } else {
                console.error('Sales over time fetch failed:', salesOverTimeRes.reason);
            }

            // Handle Top Products
            if (topProductsRes.status === 'fulfilled') {
                setTopSellingProducts(topProductsRes.value.data);
            } else {
                console.error('Top products fetch failed:', topProductsRes.reason);
            }

            // Handle Payment Methods
            if (paymentMethodsRes.status === 'fulfilled') {
                setSalesByPaymentMethod(paymentMethodsRes.value.data);
            } else {
                console.error('Payment methods fetch failed:', paymentMethodsRes.reason);
            }

            // Handle Raw Material Usage
            if (rawMaterialRes.status === 'fulfilled') {
                setRawMaterialUsageTrend(rawMaterialRes.value.data);
            } else {
                console.error('Raw material usage fetch failed:', rawMaterialRes.reason);
            }

            // Handle Production
            if (productionRes.status === 'fulfilled') {
                setProductionOverTime(productionRes.value.data);
            } else {
                console.error('Production fetch failed:', productionRes.reason);
            }

            setLastUpdated(new Date());

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, [getDateRange, selectedBranch, selectedCategory]);

    // Initial data fetch
    useEffect(() => {
        fetchBranches();
        fetchCategories();
        fetchLowStockProducts();
        fetchCustomersByGender();
    }, [fetchBranches, fetchCategories, fetchLowStockProducts, fetchCustomersByGender]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [fetchDashboardData]);

    // Formatting helpers
    const formatCurrency = (amount) => `₦${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    const formatNumber = (num) => num !== null && num !== undefined ? Number(num).toLocaleString() : 'N/A';
    const formatPercentage = (num) => `${Number(num || 0).toFixed(1)}%`;

    // Calculate comparison percentages
    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return { percentage: 0, isPositive: true };
        const change = ((current - previous) / previous) * 100;
        return {
            percentage: Math.abs(change).toFixed(1),
            isPositive: change >= 0
        };
    };

    // Get active filter count
    const getActiveFilterCount = () => {
        let count = 0;
        if (dateRange !== DATE_RANGES.THIS_MONTH) count++;
        if (selectedBranch !== 'all') count++;
        if (selectedCategory !== 'all') count++;
        if (dateRange === DATE_RANGES.CUSTOM && (customStartDate || customEndDate)) count++;
        return count;
    };

    // Get current filter display text
    const getFilterDisplay = () => {
        const { startDate, endDate } = getDateRange();
        const rangeLabel = DATE_RANGE_LABELS[dateRange] || 'Custom Range';
        const branchName = selectedBranch !== 'all' 
            ? branches.find(b => b.id?.toString() === selectedBranch)?.name || 'Selected Branch'
            : 'All Branches';
        const categoryName = selectedCategory !== 'all' 
            ? categories.find(c => c.name === selectedCategory)?.name || 'Selected Category'
            : 'All Categories';
        
        if (dateRange === DATE_RANGES.ALL_TIME) {
            return `All Time • ${branchName} • ${categoryName}`;
        }
        
        if (startDate && endDate) {
            return `${rangeLabel} (${startDate} to ${endDate}) • ${branchName} • ${categoryName}`;
        }
        
        return `${rangeLabel} • ${branchName} • ${categoryName}`;
    };

    // KPI values
    const totalSales = kpis?.totalSales || 0;
    const totalProfit = kpis?.totalProfit || 0;
    const outstandingCredit = kpis?.outstandingCredit || 0;
    const netProductionToday = kpis?.netProductionToday || 0;
    const rawMaterialValue = kpis?.rawMaterialValue || 0;
    const activeAlertsCount = kpis?.activeAlertsCount || 0;
    const productionWasteRate = kpis?.productionWasteRate || 0;
    const averageSalesValue = kpis?.averageSalesValue || 0;
    const totalCustomers = kpis?.totalCustomers || 0;

    // Chart configurations
    const salesChartData = {
        labels: salesOverTime.map(item => item.period),
        datasets: [
            {
                label: 'Total Sales (₦)',
                data: salesOverTime.map(item => item.total_sales),
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#6366F1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Total Profit (₦)',
                data: salesOverTime.map(item => item.total_profit),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    const topProductsChartData = {
        labels: topSellingProducts.map(item => item.product_name),
        datasets: [
            {
                label: 'Sales Amount (₦)',
                data: topSellingProducts.map(item => item.total_sales_amount),
                backgroundColor: [
                    '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
                    '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#8B5CF6'
                ],
                borderWidth: 0,
                borderRadius: 8,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }
        ]
    };

    const paymentMethodChartData = {
        labels: salesByPaymentMethod.map(item => item.payment_method || 'Other'),
        datasets: [
            {
                data: salesByPaymentMethod.map(item => item.total_sales_amount),
                backgroundColor: [
                    '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
                    '#3B82F6', '#EF4444', '#14B8A6'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }
        ]
    };

    const rawMaterialChartData = {
        labels: rawMaterialUsageTrend.map(item => item.period),
        datasets: [
            {
                label: 'Material Used',
                data: rawMaterialUsageTrend.map(item => item.total_material_used),
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#EF4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Material Added',
                data: rawMaterialUsageTrend.map(item => item.total_material_added),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    const productionChartData = {
        labels: productionOverTime.map(item => item.production_date),
        datasets: [
            {
                label: 'Total Produced',
                data: productionOverTime.map(item => item.total_produced),
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#6366F1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Total Waste',
                data: productionOverTime.map(item => item.total_waste),
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#EF4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    const customersByGenderChartData = {
        labels: customersByGender.map(item => item.gender || 'Unknown'),
        datasets: [
            {
                data: customersByGender.map(item => item.customer_count),
                backgroundColor: ['#6366F1', '#F59E0B', '#10B981', '#BDBDBD'],
                borderWidth: 0,
                hoverOffset: 10
            }
        ]
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { 
                    color: '#4B5563', 
                    font: { size: 12, weight: '500' },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#F9FAFB',
                bodyColor: '#F3F4F6',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 14, weight: '600' },
                bodyFont: { size: 13 },
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== undefined) {
                            label += formatCurrency(context.parsed.y);
                        } else if (context.parsed !== undefined) {
                            label += formatCurrency(context.parsed);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#E5E7EB', drawBorder: false },
                ticks: { 
                    callback: (value) => formatCurrency(value),
                    color: '#6B7280',
                    font: { size: 11 }
                }
            },
            x: { 
                grid: { display: false },
                ticks: { 
                    color: '#6B7280',
                    font: { size: 11 },
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        },
        layout: {
            padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        }
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'right', 
                labels: { 
                    color: '#4B5563', 
                    font: { size: 12, weight: '500' },
                    usePointStyle: true,
                    pointStyle: 'circle'
                } 
            },
            tooltip: {
                backgroundColor: '#1F2937',
                titleColor: '#F9FAFB',
                bodyColor: '#F3F4F6',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                    }
                }
            }
        }
    };

    // KPI Card component
    const KPICard = ({ icon: Icon, title, value, subtitle, comparisonValue, bgColor, isCumulative = false }) => {
        const change = comparisonEnabled && comparisonValue ? calculateChange(value, comparisonValue) : null;
        
        return (
            <div className={`kpi-card ${bgColor}`}>
                <div className="kpi-icon-wrapper">
                    <Icon />
                </div>
                <div className="kpi-content">
                    <div className="kpi-title">
                        {title}
                        {isCumulative && <span className="kpi-badge">Cumulative</span>}
                    </div>
                    <div className="kpi-value">{value}</div>
                    <div className="kpi-subtitle">{subtitle}</div>
                    
                    {comparisonEnabled && change && comparisonValue > 0 && !isCumulative && (
                        <div className="kpi-comparison">
                            <div className={`comparison-badge ${change.isPositive ? 'positive' : 'negative'}`}>
                                {change.isPositive ? <FaArrowUp /> : <FaArrowDown />}
                                <span>{change.percentage}%</span>
                            </div>
                            <span className="comparison-label">vs previous period</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Loading state
    if (loading && !kpis) {
        return (
            <div className="loading-container">
                <div className="loading-spinner-wrapper">
                    <div className="loading-spinner"></div>
                </div>
                <p className="loading-text">Loading dashboard data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header with Filter Toggle */}
            <div className="dashboard-header-wrapper">
                <div className="dashboard-header">
                    <div className="header-left">
                        <div className="header-icon-wrapper">
                            <FaChartBar />
                        </div>
                        <div>
                            <h1 className="main-header second">Analytics Dashboard</h1>
                            <p className="header-subtitle2">Welcome back, {user?.full_name || 'User'}! Here's your business overview</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <Button 
                            variant="outline-primary" 
                            className="filter-toggle-btn filtersecond"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FaFilter />
                            <span>Filters</span>
                            {getActiveFilterCount() > 0 && (
                                <Badge bg="primary" className="filter-count">
                                    {getActiveFilterCount()}
                                </Badge>
                            )}
                        </Button>
                        <Button 
                            variant="outline-secondary" 
                            className="refresh-btn"
                            onClick={fetchDashboardData}
                        >
                            <FaSync />
                        </Button>
                    </div>
                </div>

                {/* Filter Panel - Collapsible */}
                {showFilters && (
                    <div className="filter-panel animate-slide-down">
                        <div className="filter-panel-header">
                            <h5><FaFilter /> Filter Dashboard Data</h5>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowFilters(false)}
                                className="close-filter-btn"
                            >
                                <FaTimes />
                            </Button>
                        </div>
                        <div className="filter-panel-body">
                            <Row>
                                <Col lg={3} md={6}>
                                    <Form.Group className="filter-group">
                                        <Form.Label>
                                            <FaCalendarAlt /> Date Range
                                        </Form.Label>
                                        <Form.Select 
                                            value={dateRange} 
                                            onChange={(e) => setDateRange(e.target.value)}
                                            className="filter-select"
                                        >
                                            {Object.entries(DATE_RANGE_LABELS).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                
                                {dateRange === DATE_RANGES.CUSTOM && (
                                    <>
                                        <Col lg={2} md={6}>
                                            <Form.Group className="filter-group">
                                                <Form.Label>Start Date</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    value={customStartDate}
                                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                                    className="filter-input"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col lg={2} md={6}>
                                            <Form.Group className="filter-group">
                                                <Form.Label>End Date</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    value={customEndDate}
                                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                                    className="filter-input"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </>
                                )}
                                
                                <Col lg={2} md={6}>
                                    <Form.Group className="filter-group">
                                        <Form.Label><FaStore /> Branch</Form.Label>
                                        <Form.Select 
                                            value={selectedBranch} 
                                            onChange={(e) => setSelectedBranch(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="all">All Branches</option>
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                
                                <Col lg={2} md={6}>
                                    <Form.Group className="filter-group">
                                        <Form.Label><FaBoxes /> Category</Form.Label>
                                        <Form.Select 
                                            value={selectedCategory} 
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                
                                <Col lg={1} md={12}>
                                    <Form.Group className="filter-group filter-actions">
                                        <Form.Label>&nbsp;</Form.Label>
                                        <Button 
                                            variant="outline-secondary" 
                                            className="clear-filters-btn"
                                            onClick={() => {
                                                setDateRange(DATE_RANGES.THIS_MONTH);
                                                setSelectedBranch('all');
                                                setSelectedCategory('all');
                                                setCustomStartDate('');
                                                setCustomEndDate('');
                                            }}
                                        >
                                            <FaTimes /> Clear
                                        </Button>
                                    </Form.Group>
                                </Col>
                            </Row>
                            
                            <div className="filter-footer">
                                <div className="filter-badges">
                                    <Badge bg="light" text="dark" className="filter-badge">
                                        {DATE_RANGE_ICONS[dateRange]} {getFilterDisplay()}
                                    </Badge>
                                    <Badge bg="light" text="dark" className="filter-badge">
                                        <FaClock /> Last Updated: {format(lastUpdated, 'HH:mm:ss')}
                                    </Badge>
                                </div>
                                <Form.Check
                                    type="switch"
                                    id="comparison-switch"
                                    label="Compare with previous period"
                                    checked={comparisonEnabled}
                                    onChange={(e) => setComparisonEnabled(e.target.checked)}
                                    className="comparison-switch"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="danger" className="error-alert">
                    <FaExclamationTriangle /> {error}
                </Alert>
            )}
            
            {/* KPI Cards Grid */}
            <div className="kpi-cards-grid">
                <KPICard 
                    icon={FaDollarSign}
                    title="Total Sales"
                    value={formatCurrency(totalSales)}
                    subtitle={getFilterDisplay()}
                    comparisonValue={kpis?.previousSales}
                    bgColor="purple"
                />
                
                <KPICard 
                    icon={FaChartLine}
                    title="Total Profit"
                    value={formatCurrency(totalProfit)}
                    subtitle={`${totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}% margin`}
                    comparisonValue={kpis?.previousProfit}
                    bgColor="green"
                />
                
                <KPICard 
                    icon={FaCreditCard}
                    title="Outstanding Credit"
                    value={formatCurrency(outstandingCredit)}
                    subtitle="From all customers"
                    bgColor="orange"
                    isCumulative={true}
                />
                
                <KPICard 
                    icon={FaBoxOpen}
                    title="Net Production Today"
                    value={formatNumber(netProductionToday)}
                    subtitle="Today's production"
                    bgColor="blue"
                />
                
                <KPICard 
                    icon={FaTractor}
                    title="Raw Material Value"
                    value={formatCurrency(rawMaterialValue)}
                    subtitle="Current stock value"
                    bgColor="gray"
                    isCumulative={true}
                />
                
                <KPICard 
                    icon={FaExclamationTriangle}
                    title="Active Alerts"
                    value={activeAlertsCount}
                    subtitle="Critical issues"
                    bgColor="red"
                    isCumulative={true}
                />
                
                <KPICard 
                    icon={FaTrashAlt}
                    title="Waste Rate"
                    value={formatPercentage(productionWasteRate)}
                    subtitle={`During ${getFilterDisplay()}`}
                    bgColor="brown"
                />
                
                <KPICard 
                    icon={FaReceipt}
                    title="Avg Transaction"
                    value={formatCurrency(averageSalesValue)}
                    subtitle={`During ${getFilterDisplay()}`}
                    bgColor="purple"
                />
                
                <KPICard 
                    icon={FaUsers}
                    title="New Customers"
                    value={formatNumber(totalCustomers)}
                    subtitle={`During ${getFilterDisplay()}`}
                    bgColor="green"
                />
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* Sales & Profit Trend */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <FaChartLine /> Sales & Profit Trend
                        </div>
                        <div className="chart-actions">
                            <span className="chart-period">{getFilterDisplay()}</span>
                        </div>
                    </div>
                    <div className="chart-body">
                        <div className="chart-container">
                            {salesOverTime.length > 0 ? (
                                <Line data={salesChartData} options={chartOptions} />
                            ) : (
                                <div className="empty-chart-state">
                                    <FaChartLine className="empty-icon" />
                                    <p>No sales data for this period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Selling Products */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <FaShoppingCart /> Top Selling Products
                        </div>
                        <div className="chart-actions">
                            <span className="chart-period">{getFilterDisplay()}</span>
                        </div>
                    </div>
                    <div className="chart-body">
                        <div className="chart-container">
                            {topSellingProducts.length > 0 ? (
                                <Bar data={topProductsChartData} options={chartOptions} />
                            ) : (
                                <div className="empty-chart-state">
                                    <FaShoppingCart className="empty-icon" />
                                    <p>No product sales for this period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <FaMoneyBillWave /> Payment Methods
                        </div>
                        <div className="chart-actions">
                            <span className="chart-period">{getFilterDisplay()}</span>
                        </div>
                    </div>
                    <div className="chart-body">
                        <div className="chart-container chart-pie-container">
                            {salesByPaymentMethod.length > 0 ? (
                                <Doughnut data={paymentMethodChartData} options={pieChartOptions} />
                            ) : (
                                <div className="empty-chart-state">
                                    <FaMoneyBillWave className="empty-icon" />
                                    <p>No payment data for this period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Raw Material Usage */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <FaBoxes /> Raw Material Usage
                        </div>
                        <div className="chart-actions">
                            <span className="chart-period">{getFilterDisplay()}</span>
                        </div>
                    </div>
                    <div className="chart-body">
                        <div className="chart-container">
                            {rawMaterialUsageTrend.length > 0 ? (
                                <Line data={rawMaterialChartData} options={chartOptions} />
                            ) : (
                                <div className="empty-chart-state">
                                    <FaBoxes className="empty-icon" />
                                    <p>No material data for this period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Production Trend */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <FaChartLine /> Production Trend
                        </div>
                        <div className="chart-actions">
                            <span className="chart-period">{getFilterDisplay()}</span>
                        </div>
                    </div>
                    <div className="chart-body">
                        <div className="chart-container">
                            {productionOverTime.length > 0 ? (
                                <Line data={productionChartData} options={chartOptions} />
                            ) : (
                                <div className="empty-chart-state">
                                    <FaChartLine className="empty-icon" />
                                    <p>No production data for this period</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customers by Gender */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <FaUsers /> Customer Demographics
                        </div>
                        <div className="chart-actions">
                            <span className="chart-period">All time</span>
                        </div>
                    </div>
                    <div className="chart-body">
                        <div className="chart-container chart-pie-container">
                            {customersByGender.length > 0 ? (
                                <Doughnut data={customersByGenderChartData} options={pieChartOptions} />
                            ) : (
                                <div className="empty-chart-state">
                                    <FaUsers className="empty-icon" />
                                    <p>No customer data</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Low Stock Products Table */}
            <div className="table-section-card">
                <div className="table-header">
                    <h5><FaExclamationTriangle className="text-danger" /> Low Stock Alert</h5>
                    <Badge bg={lowStockProducts.length > 0 ? 'danger' : 'success'} className="stock-badge">
                        {lowStockProducts.length} Products
                    </Badge>
                </div>
                
                {lowStockProducts.length === 0 ? (
                    <div className="empty-table-state">
                        <FaCheck className="success-icon" />
                        <p>All products are well-stocked. Great job!</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Image</th>
                                    <th>Current Stock</th>
                                    <th>Min Level</th>
                                    <th>Unit</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockProducts.map((product, index) => (
                                    <tr key={product.id}>
                                        <td>{index + 1}</td>
                                        <td className="product-name">{product.product_name}</td>
                                        <td>
                                            <img 
                                                src={product.image_url || 'https://placehold.co/40x40/e0e0e0/000000?text=No+Img'} 
                                                alt={product.product_name} 
                                                className="table-product-image"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/40x40/e0e0e0/000000?text=Img+Err';
                                                }}
                                            />
                                        </td>
                                        <td className={product.current_stock < product.min_stock_level ? 'stock-low' : ''}>
                                            <strong>{Number(product.current_stock).toFixed(0)}</strong>
                                        </td>
                                        <td>{Number(product.min_stock_level).toFixed(0)}</td>
                                        <td>{product.unit_display || 'units'}</td>
                                        <td>
                                            <span className="status-badge status-danger">
                                                Critical
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;