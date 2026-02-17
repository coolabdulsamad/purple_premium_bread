// src/pages/AnalysisPage.jsx - COMPLETELY UPDATED & FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaChartBar, FaPercent, FaSyncAlt, FaLayerGroup, FaMoneyBillWave,
    FaWarehouse, FaUsers, FaChartArea, FaTractor, FaCalendarAlt,
    FaStore, FaBox, FaCubes, FaSeedling, FaFilter, FaTrashAlt,
    FaExchangeAlt, FaGift, FaTags, FaUserTie, FaReceipt, FaShieldAlt,
    FaDollarSign, FaChartLine, FaChartPie, FaCog, FaExclamationTriangle,
    FaTruck, FaBalanceScale, FaShoppingCart, FaIdCard, FaDatabase,
    FaChevronDown, FaChevronUp, FaSearch, FaColumns, FaCrown,
    FaStar, FaRocket, FaGem, FaAward, FaCoins,
    FaMotorcycle,
    FaCreditCard
} from 'react-icons/fa';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
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
import '../assets/styles/analysis.css';

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
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedCards, setExpandedCards] = useState({});
    const [tableConfigs, setTableConfigs] = useState({});
    const [searchTerms, setSearchTerms] = useState({});

    // Main analysis data states
    const [salesComparison, setSalesComparison] = useState(null);
    const [profitMarginTrend, setProfitMarginTrend] = useState([]);
    const [inventoryTurnover, setInventoryTurnover] = useState(null);
    const [salesTrendByCatProd, setSalesTrendByCatProd] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [productionWasteTrend, setProductionWasteTrend] = useState([]);
    const [rawMaterialStockValueTrend, setRawMaterialStockValueTrend] = useState([]);
    const [customerLifetimeValue, setCustomerLifetimeValue] = useState([]);
    const [freeItemsAnalysis, setFreeItemsAnalysis] = useState([]);
    const [discountAnalysis, setDiscountAnalysis] = useState([]);
    const [exchangeAnalysis, setExchangeAnalysis] = useState([]);
    const [stockAllocationAnalysis, setStockAllocationAnalysis] = useState([]);
    const [salaryAnalysis, setSalaryAnalysis] = useState([]);
    const [operatingExpensesAnalysis, setOperatingExpensesAnalysis] = useState([]);
    const [staffPerformance, setStaffPerformance] = useState([]);
    const [branchPerformance, setBranchPerformance] = useState([]);
    const [stockIssuesAnalysis, setStockIssuesAnalysis] = useState([]);
    const [wasteAnalysis, setWasteAnalysis] = useState([]);

    // NEW: Advantage Sales Analysis Data
    const [advantageSalesAnalysis, setAdvantageSalesAnalysis] = useState([]);
    const [advantageSalesSummary, setAdvantageSalesSummary] = useState({});
    const [advantageVsRegularComparison, setAdvantageVsRegularComparison] = useState(null);


    // KPI Summary States
    const [kpiData, setKpiData] = useState({
        totalSales: 0,
        totalProfit: 0,
        totalTransactions: 0,
        totalCustomers: 0,
        totalExpenses: 0,
        totalSalaries: 0,
        inventoryValue: 0,
        wasteValue: 0,
        // NEW: Advantage KPIs
        totalAdvantageSales: 0,
        totalAdvantageAmount: 0,
        totalRegularSales: 0,
        advantageProfit: 0,
        advantageSalesCount: 0,
        regularSalesCount: 0
    });

    // Global Filter States
    const [globalFilters, setGlobalFilters] = useState({
        startDate: '',
        endDate: '',
        branchId: '',
        period: 'month',
        limit: 10
    });

    // Filter states for all analysis sections
    const [analysisFilters, setAnalysisFilters] = useState({
        salesComparisonPeriod: 'month',
        salesComparisonBranchId: '',
        profitMarginTrendPeriod: 'month',
        profitMarginTrendBranchId: '',
        inventoryTurnoverProductId: '',
        salesTrendCategory: '',
        salesTrendProductId: '',
        salesTrendPeriod: 'month',
        salesTrendBranchId: '',
        topCustomersLimit: 10,
        topCustomersBranchId: '',
        productionWastePeriod: 'month',
        productionWasteBranchId: '',
        rawMaterialStockId: '',
        rawMaterialStockPeriod: 'month',
        rawMaterialStockBranchId: '',
        cltvCustomerId: '',
        cltvLimit: 10,
        cltvBranchId: '',
        freeItemsProductId: '',
        freeItemsBranchId: '',
        freeItemsLimit: 10,
        discountBranchId: '',
        discountLimit: 10,
        exchangeStatus: '',
        exchangeBranchId: '',
        exchangeLimit: 10,
        stockAllocationUserId: '',
        stockAllocationProductId: '',
        stockAllocationBranchId: '',
        stockAllocationLimit: 10,
        salaryUserId: '',
        salaryBranchId: '',
        salaryLimit: 10,
        expensesCategory: '',
        expensesBranchId: '',
        expensesLimit: 10,
        staffPerformanceRole: '',
        staffPerformanceLimit: 10,
        branchPerformanceMetric: 'sales',
        stockIssuesType: '',
        stockIssuesProductId: '',
        stockIssuesBranchId: '',
        stockIssuesLimit: 10,
        wasteProductId: '',
        wasteBranchId: '',
        wasteLimit: 10,
        // NEW: Advantage Analysis Filters
        advantageSalesBranchId: '',
        advantageSalesProductId: '',
        advantageSalesStaffId: '',
        advantageSalesLimit: 10,
        advantageComparisonPeriod: 'month',
        riderSalesRiderId: '',
        riderSalesPeriod: 'month',
        riderCreditLimit: 10,
        riderProductRiderId: '',
        riderProductLimit: 10,
        riderCollectionLimit: 10
    });

    // Dropdown data states
    const [allCustomers, setAllCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allBranches, setAllBranches] = useState([]);
    const [allRawMaterials, setAllRawMaterials] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    // Add these state variables near your other state declarations
    const [riderSalesTrend, setRiderSalesTrend] = useState([]);
    const [riderCreditAnalysis, setRiderCreditAnalysis] = useState([]);
    const [riderProductPerformance, setRiderProductPerformance] = useState([]);
    const [riderCollectionEfficiency, setRiderCollectionEfficiency] = useState([]);
    // At the top of your AnalysisPage component, with other state declarations
    const [allRiders, setAllRiders] = useState([]);  // Add this line

    // Toggle card expansion
    const toggleCardExpansion = (cardId) => {
        setExpandedCards(prev => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    };

    // Toggle table column visibility
    const toggleTableColumn = (tableId, columnIndex) => {
        setTableConfigs(prev => ({
            ...prev,
            [tableId]: {
                ...prev[tableId],
                hiddenColumns: {
                    ...(prev[tableId]?.hiddenColumns || {}),
                    [columnIndex]: !prev[tableId]?.hiddenColumns?.[columnIndex]
                }
            }
        }));
    };

    // Handle search term changes
    const handleSearchChange = (section, value) => {
        setSearchTerms(prev => ({
            ...prev,
            [section]: value
        }));
    };

    // Filter data based on search term
    const filterData = (data, searchTerm, searchableFields) => {
        if (!searchTerm) return data;

        return data.filter(item =>
            searchableFields.some(field =>
                String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    };

    // Add this helper function at the top of your component, after the API_BASE_URL
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token'); // or wherever you store your token
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    };

    const fetchDropdownData = async () => {
        try {
            const headers = getAuthHeaders();

            const [
                productsRes,
                categoriesRes,
                customersRes,
                branchesRes,
                rawMaterialsRes,
                usersRes,
                ridersRes
            ] = await Promise.all([
                axios.get(`${API_BASE_URL}/products`, headers),
                axios.get(`${API_BASE_URL}/categories`, headers),
                axios.get(`${API_BASE_URL}/customers`, headers),
                axios.get(`${API_BASE_URL}/branches`, headers),
                axios.get(`${API_BASE_URL}/raw-materials`, headers),
                axios.get(`${API_BASE_URL}/users`, headers),
                axios.get(`${API_BASE_URL}/riders?status=active`, headers),
            ]);

            setAllProducts(productsRes.data);
            setAllCategories(categoriesRes.data);
            setAllCustomers(customersRes.data);
            setAllBranches(branchesRes.data);
            setAllRawMaterials(rawMaterialsRes.data);
            setAllUsers(usersRes.data);

            // Handle riders data (could be in different formats)
            const ridersData = ridersRes.data?.riders || ridersRes.data || [];
            setAllRiders(ridersData);

        } catch (err) {
            console.error('Error fetching dropdown data for analysis:', err);
            // Optionally show user-friendly error message
            // toast.error('Failed to load filter options. Please check your authentication.');
        }
    };

    // const fetchDropdownData = async () => {
    //     try {
    //         const [
    //             productsRes,
    //             categoriesRes,
    //             customersRes,
    //             branchesRes,
    //             rawMaterialsRes,
    //             usersRes,
    //             ridersRes  // Add riders fetch here
    //         ] = await Promise.all([
    //             axios.get(`${API_BASE_URL}/products`),
    //             axios.get(`${API_BASE_URL}/categories`),
    //             axios.get(`${API_BASE_URL}/customers`),
    //             axios.get(`${API_BASE_URL}/branches`),
    //             axios.get(`${API_BASE_URL}/raw-materials`),
    //             axios.get(`${API_BASE_URL}/users`),
    //             axios.get(`${API_BASE_URL}/riders?status=active`),  // Fetch riders
    //         ]);

    //         setAllProducts(productsRes.data);
    //         setAllCategories(categoriesRes.data);
    //         setAllCustomers(customersRes.data);
    //         setAllBranches(branchesRes.data);
    //         setAllRawMaterials(rawMaterialsRes.data);
    //         setAllUsers(usersRes.data);

    //         // Handle riders data (could be in different formats)
    //         const ridersData = ridersRes.data?.riders || ridersRes.data || [];
    //         setAllRiders(ridersData);

    //     } catch (err) {
    //         console.error('Error fetching dropdown data for analysis:', err);
    //     }
    // };

    const fetchKPIData = async () => {
        try {
            const headers = getAuthHeaders();
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            const defaultStartDate = globalFilters.startDate || thirtyDaysAgo.toISOString().split('T')[0];
            const defaultEndDate = globalFilters.endDate || today.toISOString().split('T')[0];

            const buildKpiParams = () => {
                const params = new URLSearchParams();
                if (defaultStartDate) params.append('startDate', defaultStartDate);
                if (defaultEndDate) params.append('endDate', defaultEndDate);
                if (globalFilters.branchId) params.append('branchId', globalFilters.branchId);
                return params.toString();
            };

            const kpiParams = buildKpiParams();

            const kpiCalls = [
                axios.get(`${API_BASE_URL}/analysis/sales-summary?${kpiParams}`, headers),
                axios.get(`${API_BASE_URL}/analysis/customer-count?${kpiParams}`, headers),
                axios.get(`${API_BASE_URL}/analysis/operating-expenses?${kpiParams}&limit=1000`, headers),
                axios.get(`${API_BASE_URL}/analysis/salaries?${kpiParams}&limit=1000`, headers),
                axios.get(`${API_BASE_URL}/analysis/inventory-value`, headers),
                axios.get(`${API_BASE_URL}/analysis/waste-analysis?${kpiParams}&limit=1000`, headers),
                axios.get(`${API_BASE_URL}/reports/advantage-sales-analysis?${kpiParams}`, headers).catch(() => ({
                    data: {
                        reportData: [],
                        summary: {
                            totalAdvantageSales: 0,
                            totalAdvantageAmount: 0,
                            totalSalesAmount: 0,
                            averageAdvantagePerSale: 0
                        }
                    }
                })),
            ];

            const kpiResponses = await Promise.all(kpiCalls.map(promise =>
                promise.catch(error => {
                    console.error('KPI API call failed:', error);
                    return { data: { reportData: {} } };
                })
            ));

            const salesData = kpiResponses[0].data.reportData || {};
            const customersData = kpiResponses[1].data.reportData || { total_customers: 0 };
            const expensesData = kpiResponses[2].data.reportData || [];
            const salariesData = kpiResponses[3].data.reportData || [];
            const inventoryData = kpiResponses[4].data.reportData || { total_value: 0 };
            const wasteData = kpiResponses[5].data.reportData || [];
            const advantageData = kpiResponses[6].data;

            const totalExpenses = expensesData.reduce((sum, exp) => sum + (parseFloat(exp.total_amount) || 0), 0);
            const totalSalaries = salariesData.reduce((sum, sal) => sum + (parseFloat(sal.net_salary) || 0), 0);
            const totalWasteValue = wasteData.reduce((sum, waste) => sum + (parseFloat(waste.waste_value) || 0), 0);

            // CORRECT Advantage Metrics Calculation - Frontend Only
            const advantageSummary = advantageData.summary || {};

            // These come from your API response
            const totalAdvantageSalesCount = parseInt(advantageSummary.totalAdvantageSales) || 0; // Number of advantage sales transactions
            const totalAdvantageAmount = parseFloat(advantageSummary.totalAdvantageAmount) || 0; // Total advantage premium amount (the 800)
            const totalSalesAmount = parseFloat(salesData.total_sales) || 0; // Total sales amount from all transactions

            // CORRECT: Total sales from advantage transactions (base + premium)
            const totalAdvantageSalesAmount = totalAdvantageAmount +
                (advantageData.reportData?.reduce((sum, sale) => sum + parseFloat(sale.base_subtotal || sale.base_sales_amount || 0), 0) || 0);

            // CORRECT: Regular sales should come from actual regular transactions, not calculated
            const totalRegularSalesAmount = totalSalesAmount - totalAdvantageSalesAmount;
            const totalRegularSalesCount = (parseInt(salesData.total_transactions) || 0) - totalAdvantageSalesCount;

            // CORRECT Profit Allocation
            const advantageProfitMargin = 0.85; // 85% profit margin for advantage sales
            const regularProfitMargin = 0.70; // 70% profit margin for regular sales

            const advantageProfit = totalAdvantageSalesAmount * advantageProfitMargin;
            const regularProfit = (parseFloat(salesData.total_profit) || 0) - advantageProfit;

            setKpiData({
                totalSales: totalSalesAmount,
                totalProfit: parseFloat(salesData.total_profit) || 0,
                totalTransactions: parseInt(salesData.total_transactions) || 0,
                totalCustomers: parseInt(customersData.total_customers) || 0,
                totalExpenses: totalExpenses,
                totalSalaries: totalSalaries,
                inventoryValue: parseFloat(inventoryData.total_value) || 0,
                wasteValue: totalWasteValue,

                // CORRECTED Advantage metrics
                totalAdvantageSales: totalAdvantageSalesCount, // Number of transactions
                totalAdvantageAmount: totalAdvantageAmount, // Total premium amount (the 800)
                totalAdvantageSalesAmount: totalAdvantageSalesAmount, // Total sales from advantage transactions (7800)
                totalRegularSales: totalRegularSalesAmount, // Regular sales amount
                totalRegularSalesCount: totalRegularSalesCount, // Number of regular transactions
                advantageProfit: advantageProfit,
                regularProfit: regularProfit,
                advantageSalesCount: totalAdvantageSalesCount,
                regularSalesCount: totalRegularSalesCount
            });

        } catch (err) {
            console.error('Error fetching KPI data:', err);
            setKpiData({
                totalSales: 0,
                totalProfit: 0,
                totalTransactions: 0,
                totalCustomers: 0,
                totalExpenses: 0,
                totalSalaries: 0,
                inventoryValue: 0,
                wasteValue: 0,
                totalAdvantageSales: 0,
                totalAdvantageAmount: 0,
                totalRegularSales: 0,
                totalRegularSalesCount: 0,
                advantageProfit: 0,
                regularProfit: 0,
                advantageSalesCount: 0,
                regularSalesCount: 0
            });
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const headers = getAuthHeaders();
            const buildParams = (filters, includeGlobal = true) => {
                const params = new URLSearchParams();

                if (includeGlobal) {
                    if (globalFilters.startDate) params.append('startDate', globalFilters.startDate);
                    if (globalFilters.endDate) params.append('endDate', globalFilters.endDate);
                    if (globalFilters.branchId) params.append('branchId', globalFilters.branchId);
                    // Only include global limit if no specific limit is provided
                    if (globalFilters.limit && !filters.limit) {
                        params.append('limit', globalFilters.limit);
                    }
                }

                for (const key in filters) {
                    if (filters[key] !== '' && filters[key] !== undefined && filters[key] !== null) {
                        params.append(key, filters[key]);
                    }
                }
                return params.toString();
            };

            const allCalls = [
                // Overview Tab
                axios.get(`${API_BASE_URL}/analysis/sales-comparison?${buildParams({ period: analysisFilters.salesComparisonPeriod })}`, headers).catch(error => {
                    console.error('Sales comparison API call failed:', error);
                    return { data: {} };
                }),
                axios.get(`${API_BASE_URL}/analysis/profit-margin-trend?${buildParams({ period: analysisFilters.profitMarginTrendPeriod, limit: 12 })}`, headers).catch(error => {
                    console.error('Profit margin trend API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/inventory-turnover?${buildParams({ productId: analysisFilters.inventoryTurnoverProductId })}`, headers).catch(error => {
                    console.error('Inventory turnover API call failed:', error);
                    return { data: {} };
                }),
                axios.get(`${API_BASE_URL}/analysis/sales-trend-by-category-product?${buildParams({
                    category: analysisFilters.salesTrendCategory,
                    productId: analysisFilters.salesTrendProductId,
                    period: analysisFilters.salesTrendPeriod
                })}`, headers).catch(error => {
                    console.error('Sales trend API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/top-customers-by-sales?${buildParams({ limit: analysisFilters.topCustomersLimit })}`, headers).catch(error => {
                    console.error('Top customers API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/production-waste-over-time?${buildParams({ period: analysisFilters.productionWastePeriod })}`, headers).catch(error => {
                    console.error('Production waste API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/raw-material-stock-value-trend?${buildParams({
                    rawMaterialId: analysisFilters.rawMaterialStockId,
                    period: analysisFilters.rawMaterialStockPeriod
                })}`, headers).catch(error => {
                    console.error('Raw material stock API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/customer-lifetime-value?${buildParams({
                    customerId: analysisFilters.cltvCustomerId,
                    limit: analysisFilters.cltvLimit
                })}`, headers).catch(error => {
                    console.error('CLTV API call failed:', error);
                    return { data: { reportData: [] } };
                }),

                // Rider Sales Trend
                axios.get(`${API_BASE_URL}/analysis/rider-sales-trend?${buildParams({
                    riderId: analysisFilters.riderSalesRiderId,
                    period: analysisFilters.riderSalesPeriod,
                    limit: 12
                }, false)}`, headers).catch(error => {
                    console.error('Rider sales trend API call failed:', error);
                    return { data: { reportData: [] } };
                }),

                // Rider Credit Analysis
                axios.get(`${API_BASE_URL}/analysis/rider-credit-analysis?${buildParams({
                    limit: analysisFilters.riderCreditLimit
                }, false)}`, headers).catch(error => {
                    console.error('Rider credit analysis API call failed:', error);
                    return { data: { reportData: [], summary: {} } };
                }),

                // Rider Product Performance
                axios.get(`${API_BASE_URL}/analysis/rider-product-performance?${buildParams({
                    riderId: analysisFilters.riderProductRiderId,
                    limit: analysisFilters.riderProductLimit
                }, false)}`, headers).catch(error => {
                    console.error('Rider product performance API call failed:', error);
                    return { data: { reportData: [] } };
                }),

                // Rider Collection Efficiency
                axios.get(`${API_BASE_URL}/analysis/rider-collection-efficiency?${buildParams({
                    limit: analysisFilters.riderCollectionLimit
                }, false)}`, headers).catch(error => {
                    console.error('Rider collection efficiency API call failed:', error);
                    return { data: { reportData: [], summary: {} } };
                }),

                // Sales & Profit Tab
                axios.get(`${API_BASE_URL}/analysis/free-items?${buildParams({
                    productId: analysisFilters.freeItemsProductId,
                    limit: analysisFilters.freeItemsLimit
                }, false)}`, headers).catch(error => {
                    console.error('Free items API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/discounts?${buildParams({ limit: analysisFilters.discountLimit })}`, headers).catch(error => {
                    console.error('Discounts API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/exchanges?${buildParams({
                    status: analysisFilters.exchangeStatus,
                    limit: analysisFilters.exchangeLimit
                }, false)}`, headers).catch(error => {
                    console.error('Exchanges API call failed:', error);
                    return { data: { reportData: [] } };
                }),

                // Inventory Tab
                axios.get(`${API_BASE_URL}/analysis/stock-allocation?${buildParams({
                    userId: analysisFilters.stockAllocationUserId,
                    productId: analysisFilters.stockAllocationProductId,
                    limit: analysisFilters.stockAllocationLimit
                }, false)}`, headers).catch(error => {
                    console.error('Stock allocation API call failed:', error);
                    return { data: { reportData: [] } };
                }),

                // Operations Tab
                axios.get(`${API_BASE_URL}/analysis/salaries?${buildParams({
                    userId: analysisFilters.salaryUserId,
                    limit: analysisFilters.salaryLimit
                }, false)}`, headers).catch(error => {
                    console.error('Salaries API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/operating-expenses?${buildParams({
                    category: analysisFilters.expensesCategory,
                    limit: analysisFilters.expensesLimit
                }, false)}`, headers).catch(error => {
                    console.error('Operating expenses API call failed:', error);
                    return { data: { reportData: [] } };
                }),

                // Staff & Branches Tab
                axios.get(`${API_BASE_URL}/analysis/staff-performance?${buildParams({
                    role: analysisFilters.staffPerformanceRole,
                    limit: analysisFilters.staffPerformanceLimit
                }, false)}`, headers).catch(error => {
                    console.error('Staff performance API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/branch-performance?${buildParams({
                    metric: analysisFilters.branchPerformanceMetric
                }, false)}`, headers).catch(error => {
                    console.error('Branch performance API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/stock-issues?${buildParams({
                    issueType: analysisFilters.stockIssuesType,
                    productId: analysisFilters.stockIssuesProductId,
                    limit: analysisFilters.stockIssuesLimit
                }, false)}`, headers).catch(error => {
                    console.error('Stock issues API call failed:', error);
                    return { data: { reportData: [] } };
                }),
                axios.get(`${API_BASE_URL}/analysis/waste-analysis?${buildParams({
                    productId: analysisFilters.wasteProductId,
                    limit: analysisFilters.wasteLimit
                }, false)}`, headers).catch(error => {
                    console.error('Waste analysis API call failed:', error);
                    return { data: { reportData: [] } };
                }),

                // NEW: Advantage Sales Analysis
                axios.get(`${API_BASE_URL}/reports/advantage-sales-analysis?${buildParams({
                    branchId: analysisFilters.advantageSalesBranchId,
                    productId: analysisFilters.advantageSalesProductId,
                    staffId: analysisFilters.advantageSalesStaffId,
                    limit: analysisFilters.advantageSalesLimit
                }, false)}`, headers).catch(error => {
                    console.error('Advantage sales analysis API call failed:', error);
                    return { data: { reportData: [], summary: {} } };
                }),

                // Replace it with a simpler version that doesn't depend on kpiData:
                axios.get(`${API_BASE_URL}/analysis/sales-comparison?${buildParams({
                    period: analysisFilters.advantageComparisonPeriod
                }, false)}`, headers).catch(error => {
                    console.error('Advantage comparison API call failed:', error);
                    return { data: {} };
                }),
            ];

            const responses = await Promise.all(allCalls);

            // Set all data with proper error handling
            setSalesComparison(responses[0].data);
            setProfitMarginTrend(responses[1].data.reportData || []);
            setInventoryTurnover(responses[2].data);
            setSalesTrendByCatProd(responses[3].data.reportData || []);
            setTopCustomers(responses[4].data.reportData || []);
            setProductionWasteTrend(responses[5].data.reportData || []);
            setRawMaterialStockValueTrend(responses[6].data.reportData || []);
            setCustomerLifetimeValue(responses[7].data.reportData || []);

            // Sales & Profit Tab
            setFreeItemsAnalysis(responses[8].data.reportData || []);
            setDiscountAnalysis(responses[9].data.reportData || []);
            setExchangeAnalysis(responses[10].data.reportData || []);

            // Inventory Tab
            setStockAllocationAnalysis(responses[11].data.reportData || []);

            // Operations Tab
            setSalaryAnalysis(responses[12].data.reportData || []);
            setOperatingExpensesAnalysis(responses[13].data.reportData || []);

            // Staff & Branches Tab
            setStaffPerformance(responses[14].data.reportData || []);
            setBranchPerformance(responses[15].data.reportData || []);
            setStockIssuesAnalysis(responses[16].data.reportData || []);
            setWasteAnalysis(responses[17].data.reportData || []);

            // Set rider data
            // const riderIndex = responses.length - 4; // Adjust index based on where you added them
            // setRiderSalesTrend(responses[riderIndex].data.reportData || []);
            // setRiderCreditAnalysis(responses[riderIndex + 1].data.reportData || []);
            // setRiderProductPerformance(responses[riderIndex + 2].data.reportData || []);
            // setRiderCollectionEfficiency(responses[riderIndex + 3].data.reportData || []);

            // Set rider data - find the section where you set the data and replace with:
            // const riderStartIndex = 8; // Adjust this based on your actual response indices
            // setRiderSalesTrend(responses[18]?.data?.reportData || []);
            // setRiderCreditAnalysis(responses[19]?.data?.reportData || []);
            // setRiderProductPerformance(responses[20]?.data?.reportData || []);
            // setRiderCollectionEfficiency(responses[21]?.data?.reportData || []);

            // In your fetchData function, after getting all responses, set the rider data:

            // Calculate the correct indices based on your API calls
            // Rider calls are at positions 8, 9, 10, 11 (adjust if needed)
            const riderStartIndex = 8; // Adjust this based on your actual API call order

            // Log to debug the actual data structure
            console.log('Raw Rider API Responses:', {
                salesTrend: responses[riderStartIndex]?.data,
                creditAnalysis: responses[riderStartIndex + 1]?.data,
                productPerformance: responses[riderStartIndex + 2]?.data,
                collectionEfficiency: responses[riderStartIndex + 3]?.data
            });

            // Set rider data with proper error handling
            setRiderSalesTrend(responses[riderStartIndex]?.data?.reportData || []);
            setRiderCreditAnalysis(responses[riderStartIndex + 1]?.data?.reportData || []);
            setRiderProductPerformance(responses[riderStartIndex + 2]?.data?.reportData || []);
            setRiderCollectionEfficiency(responses[riderStartIndex + 3]?.data?.reportData || []);

            // NEW: Set advantage data
            const advantageResponse = responses[responses.length - 2]; // Second to last response
            const advantageComparisonResponse = responses[responses.length - 1]; // Last response

            setAdvantageSalesAnalysis(advantageResponse.data.reportData || []);
            setAdvantageSalesSummary(advantageResponse.data.summary || {});
            setAdvantageVsRegularComparison(advantageComparisonResponse.data.advantageVsRegular);


            await fetchKPIData();

            // Also log to debug:
            console.log('Rider Data:', {
                salesTrend: responses[18]?.data,
                creditAnalysis: responses[19]?.data,
                productPerformance: responses[20]?.data,
                collectionEfficiency: responses[21]?.data
            });

            console.log('Analysis updated successfully');

        } catch (err) {
            console.error('Error fetching analysis data:', err.response?.data || err.message);
            setError('Failed to load analysis data. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    }, [analysisFilters, globalFilters]);

    // useEffect(() => {
    //     fetchDropdownData();
    //     const today = new Date();
    //     const thirtyDaysAgo = new Date();
    //     thirtyDaysAgo.setDate(today.getDate() - 30);
    //     const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    //     const defaultEndDate = today.toISOString().split('T')[0];

    //     setGlobalFilters(prev => ({
    //         ...prev,
    //         startDate: defaultStartDate,
    //         endDate: defaultEndDate
    //     }));
    // }, []);

    // Add this helper near your other helper functions
    const safeNumber = (value, decimals = 2) => {
        const num = value !== undefined && value !== null ? parseFloat(value) : 0;
        return isNaN(num) ? 0 : num;
    };

    const safeToFixed = (value, decimals = 2) => {
        const num = safeNumber(value, decimals);
        return num.toFixed(decimals);
    };

    // Helper function to render efficiency badge with color
    const renderEfficiencyBadge = (efficiency) => {
        const eff = parseFloat(efficiency || 0);
        let statusClass = 'analysis-status--approved';
        let displayText = `${eff.toFixed(1)}%`;

        if (eff < 50) {
            statusClass = 'analysis-status--rejected';
        } else if (eff < 80) {
            statusClass = 'analysis-status--pending';
        }

        return (
            <span className={`analysis-status ${statusClass}`}>
                {displayText}
            </span>
        );
    };

    useEffect(() => {
        const loadDropdownData = async () => {
            await fetchDropdownData();
        };
        loadDropdownData();

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        const defaultEndDate = today.toISOString().split('T')[0];

        setGlobalFilters(prev => ({
            ...prev,
            startDate: defaultStartDate,
            endDate: defaultEndDate
        }));
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(handler);
    }, [analysisFilters, globalFilters]);

    const handleGlobalFilterChange = (e) => {
        const { name, value } = e.target;
        setGlobalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setAnalysisFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearGlobalFilters = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        const defaultEndDate = today.toISOString().split('T')[0];

        setGlobalFilters({
            startDate: defaultStartDate,
            endDate: defaultEndDate,
            branchId: '',
            period: 'month',
            limit: 10
        });
        console.log('Global filters cleared');
    };

    const clearSectionFilters = (section) => {
        const sectionKeys = Object.keys(analysisFilters).filter(key => key.startsWith(section));
        const clearedFilters = {};
        sectionKeys.forEach(key => {
            clearedFilters[key] = '';
        });
        setAnalysisFilters(prev => ({ ...prev, ...clearedFilters }));
        console.log(`Cleared ${section} filters`);
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

    // Chart data and options functions
    const salesComparisonChartData = {
        labels: ['Total Sales', 'Total Profit'],
        datasets: [
            {
                label: `Current ${analysisFilters.salesComparisonPeriod.charAt(0).toUpperCase() + analysisFilters.salesComparisonPeriod.slice(1)}`,
                data: [salesComparison?.currentPeriod?.sales || 0, salesComparison?.currentPeriod?.profit || 0],
                backgroundColor: 'rgba(90, 45, 130, 0.7)',
                borderColor: 'rgb(90, 45, 130)',
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

    const discountAnalysisChartData = {
        labels: discountAnalysis.map(item => item.period_label),
        datasets: [
            {
                label: 'Total Discount Amount (₦)',
                data: discountAnalysis.map(item => item.total_discount),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1,
                fill: false,
            },
        ],
    };

    const operatingExpensesChartData = {
        labels: operatingExpensesAnalysis.map(item => item.category),
        datasets: [
            {
                label: 'Expenses Amount (₦)',
                data: operatingExpensesAnalysis.map(item => item.total_amount),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const branchPerformanceChartData = {
        labels: branchPerformance.map(item => item.branch_name),
        datasets: [
            {
                label: analysisFilters.branchPerformanceMetric === 'sales' ? 'Total Sales (₦)' :
                    analysisFilters.branchPerformanceMetric === 'profit' ? 'Total Profit (₦)' :
                        analysisFilters.branchPerformanceMetric === 'customers' ? 'Unique Customers' : 'Total Transactions',
                data: branchPerformance.map(item => item.performance_metric),
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1,
            },
        ],
    };

    const staffPerformanceChartData = {
        labels: staffPerformance.map(item => item.staff_name),
        datasets: [
            {
                label: 'Total Sales (₦)',
                data: staffPerformance.map(item => item.total_sales),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
            },
        ],
    };

    const stockIssuesChartData = {
        labels: stockIssuesAnalysis.map(item => item.issue_type),
        datasets: [
            {
                label: 'Total Quantity',
                data: stockIssuesAnalysis.map(item => item.total_quantity),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
            },
        ],
    };

    const wasteAnalysisChartData = {
        labels: wasteAnalysis.map(item => item.product_name),
        datasets: [
            {
                label: 'Waste Value (₦)',
                data: wasteAnalysis.map(item => item.waste_value),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
            },
        ],
    };

    // Common chart options
    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        }
    };

    // NEW: Advantage Sales Analysis Chart Data
    const advantageSalesChartData = {
        labels: advantageSalesAnalysis.slice(0, 10).map(item => `Sale ${item.sale_id}`),
        datasets: [
            {
                label: 'Base Sales (₦)',
                data: advantageSalesAnalysis.slice(0, 10).map(item => parseFloat(item.base_subtotal || item.base_sales_amount || 0)),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
            },
            {
                label: 'Advantage Amount (₦)',
                data: advantageSalesAnalysis.slice(0, 10).map(item => parseFloat(item.advantage_total || 0)),
                backgroundColor: 'rgba(255, 205, 86, 0.7)',
                borderColor: 'rgb(255, 205, 86)',
                borderWidth: 1,
            },
            {
                label: 'Total Sales (₦)',
                data: advantageSalesAnalysis.slice(0, 10).map(item => parseFloat(item.total_amount || 0)),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
            }
        ],
    };

    // CORRECTED Advantage vs Regular Comparison Chart
    const advantageVsRegularChartData = {
        labels: ['Sales Amount (₦)', 'Profit (₦)', 'Transaction Count'],
        datasets: [
            {
                label: 'Regular',
                data: [
                    kpiData.totalRegularSales || 0,
                    kpiData.regularProfit || 0,
                    kpiData.regularSalesCount || 0
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
            },
            {
                label: 'Advantage',
                data: [
                    kpiData.totalAdvantageSalesAmount || 0, // This is now the total sales amount (7800)
                    kpiData.advantageProfit || 0,
                    kpiData.advantageSalesCount || 0
                ],
                backgroundColor: 'rgba(255, 205, 86, 0.7)',
                borderColor: 'rgb(255, 205, 86)',
                borderWidth: 1,
            }
        ],
    };

    // CORRECTED Advantage Sales Trend Chart - Shows sales amount and premium amount trends
    const advantageSalesTrendChartData = {
        labels: advantageSalesAnalysis
            .reduce((acc, sale) => {
                const date = new Date(sale.sale_date).toISOString().split('T')[0];
                if (!acc.includes(date)) acc.push(date);
                return acc;
            }, [])
            .slice(0, 7),
        datasets: [
            {
                label: 'Advantage Sales Amount (₦)',
                data: advantageSalesAnalysis.reduce((acc, sale) => {
                    const date = new Date(sale.sale_date).toISOString().split('T')[0];
                    const index = acc.findIndex(item => item.date === date);
                    const saleAmount = parseFloat(sale.total_amount || 0);

                    if (index === -1) {
                        acc.push({
                            date,
                            salesAmount: saleAmount,
                            premiumAmount: parseFloat(sale.advantage_total || 0),
                            count: 1
                        });
                    } else {
                        acc[index].salesAmount += saleAmount;
                        acc[index].premiumAmount += parseFloat(sale.advantage_total || 0);
                        acc[index].count += 1;
                    }
                    return acc;
                }, []).map(item => item.salesAmount),
                borderColor: 'rgb(255, 205, 86)',
                backgroundColor: 'rgba(255, 205, 86, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-amount'
            },
            {
                label: 'Advantage Premium Amount (₦)',
                data: advantageSalesAnalysis.reduce((acc, sale) => {
                    const date = new Date(sale.sale_date).toISOString().split('T')[0];
                    const index = acc.findIndex(item => item.date === date);

                    if (index === -1) {
                        acc.push({
                            date,
                            salesAmount: parseFloat(sale.total_amount || 0),
                            premiumAmount: parseFloat(sale.advantage_total || 0),
                            count: 1
                        });
                    } else {
                        acc[index].salesAmount += parseFloat(sale.total_amount || 0);
                        acc[index].premiumAmount += parseFloat(sale.advantage_total || 0);
                        acc[index].count += 1;
                    }
                    return acc;
                }, []).map(item => item.premiumAmount),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-amount'
            },
            {
                label: 'Advantage Sales Count',
                data: advantageSalesAnalysis.reduce((acc, sale) => {
                    const date = new Date(sale.sale_date).toISOString().split('T')[0];
                    const index = acc.findIndex(item => item.date === date);

                    if (index === -1) {
                        acc.push({
                            date,
                            salesAmount: parseFloat(sale.total_amount || 0),
                            premiumAmount: parseFloat(sale.advantage_total || 0),
                            count: 1
                        });
                    } else {
                        acc[index].salesAmount += parseFloat(sale.total_amount || 0);
                        acc[index].premiumAmount += parseFloat(sale.advantage_total || 0);
                        acc[index].count += 1;
                    }
                    return acc;
                }, []).map(item => item.count),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-count'
            }
        ],
    };

    // CORRECTED Chart Options for Advantage Sales Trend
    const advantageTrendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.dataset.label.includes('Count')) {
                            label += context.parsed.y + ' sales';
                        } else {
                            label += '₦' + context.parsed.y.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            'y-count': {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Number of Sales'
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    callback: function (value) {
                        return value + ' sales';
                    }
                }
            },
            'y-amount': {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Amount (₦)'
                },
                ticks: {
                    callback: function (value) {
                        return '₦' + value.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        }
    };

    // Rider Sales Trend Chart Data
    const riderSalesTrendChartData = {
        labels: riderSalesTrend.map(item => item.period_label),
        datasets: [
            {
                label: 'Total Sales (₦)',
                data: riderSalesTrend.map(item => item.total_sales),
                borderColor: 'rgb(255, 159, 64)',
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-sales'
            },
            {
                label: 'Total Profit (₦)',
                data: riderSalesTrend.map(item => item.total_profit),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-sales'
            },
            {
                label: 'Transaction Count',
                data: riderSalesTrend.map(item => item.total_transactions),
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y-count'
            }
        ]
    };

    // Rider Sales Trend Chart Options
    const riderTrendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            'y-count': {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Number of Transactions'
                },
                grid: {
                    drawOnChartArea: false,
                }
            },
            'y-sales': {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Amount (₦)'
                },
                ticks: {
                    callback: function (value) {
                        return '₦' + value.toLocaleString();
                    }
                }
            }
        }
    };

    // Rider Collection Efficiency Chart Data
    const collectionEfficiencyChartData = {
        labels: riderCollectionEfficiency.map(item => item.rider_name),
        datasets: [
            {
                label: 'Collection Efficiency (%)',
                data: riderCollectionEfficiency.map(item => item.collection_efficiency_percentage),
                backgroundColor: riderCollectionEfficiency.map(item =>
                    item.collection_efficiency_percentage >= 80 ? 'rgba(75, 192, 192, 0.7)' :
                        item.collection_efficiency_percentage >= 50 ? 'rgba(255, 205, 86, 0.7)' :
                            'rgba(255, 99, 132, 0.7)'
                ),
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
            },
        ],
    };


    // Format currency helper
    const formatCurrency = (amount) => {
        const value = amount !== undefined && amount !== null ? parseFloat(amount) : 0;
        return `₦${value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Render table with controls
    const renderTableWithControls = (tableId, data, columns, searchableFields = []) => {
        const filteredData = filterData(data, searchTerms[tableId], searchableFields);
        const hiddenColumns = tableConfigs[tableId]?.hiddenColumns || {};

        return (
            <div className="analysis-table-section">
                <div className="analysis-table-controls">
                    <div className="analysis-table-search">
                        <FaSearch className="analysis-table-search-icon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerms[tableId] || ''}
                            onChange={(e) => handleSearchChange(tableId, e.target.value)}
                            className="analysis-table-search-input"
                        />
                    </div>
                    <div className="analysis-table-columns">
                        <button className="analysis-btn analysis-btn--ghost analysis-btn--small">
                            <FaColumns className="analysis-btn__icon" />
                            Columns
                        </button>
                        <div className="analysis-columns-dropdown">
                            {columns.map((col, index) => (
                                <label key={index} className="analysis-column-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={!hiddenColumns[index]}
                                        onChange={() => toggleTableColumn(tableId, index)}
                                    />
                                    <span>{col.header}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="analysis-table-container">
                    <table className="analysis-table">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    !hiddenColumns[index] && (
                                        <th
                                            key={index}
                                            className={col.align === 'right' ? 'analysis-table__cell--right' : ''}
                                        >
                                            {col.header}
                                        </th>
                                    )
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {columns.map((col, colIndex) => (
                                            !hiddenColumns[colIndex] && (
                                                <td
                                                    key={colIndex}
                                                    className={col.align === 'right' ? 'analysis-table__cell--right' : ''}
                                                >
                                                    {col.render ? col.render(row) : (row[col.field] || 'N/A')}
                                                </td>
                                            )
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="analysis-table__empty">
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="analysis-loading">
                <div className="analysis-spinner"></div>
                <p>Loading comprehensive analysis data...</p>
            </div>
        );
    }

    return (
        <div className="analysis-page">
            <div className="analysis-header">
                <h1 className="analysis-title">
                    <FaChartBar className="analysis-title-icon" />
                    Comprehensive Business Analytics
                </h1>
                <p className="analysis-subtitle">Advanced insights across all business operations</p>
                {/* // Add this in your global filters section or header */}
                <div className="analysis-header-actions">
                    <button
                        className="analysis-btn analysis-btn--primary"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <FaSyncAlt className="analysis-btn__icon" />
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="analysis-error">
                    <FaExclamationTriangle className="analysis-error-icon" />
                    {error}
                </div>
            )}

            <div className="analysis-warning">
                <FaExclamationTriangle className="analysis-warning-icon" />
                <div className="analysis-warning-content">
                    <strong>Data Quality Note:</strong> Profit calculations have been corrected to use (Sales - Cost of Goods Sold)
                    due to inconsistencies in stored profit data.
                </div>
            </div>

            {/* Global Filters Section */}
            <div className="analysis-card">
                <div className="analysis-card__header">
                    <div className="analysis-card__title">
                        <FaFilter className="analysis-card__icon" />
                        Global Filters
                    </div>
                    <div className="analysis-badge">
                        <FaDatabase className="analysis-badge-icon" />
                        {Object.values(analysisFilters).filter(v => v).length + Object.values(globalFilters).filter(v => v).length} Active Filters
                    </div>
                </div>
                <div className="analysis-card__body">
                    <div className="analysis-filters-grid">
                        <div className="analysis-field">
                            <label className="analysis-label">Start Date</label>
                            <div className="analysis-input">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={globalFilters.startDate}
                                    onChange={handleGlobalFilterChange}
                                    className="analysis-input__field"
                                />
                            </div>
                        </div>

                        <div className="analysis-field">
                            <label className="analysis-label">End Date</label>
                            <div className="analysis-input">
                                <input
                                    type="date"
                                    name="endDate"
                                    value={globalFilters.endDate}
                                    onChange={handleGlobalFilterChange}
                                    className="analysis-input__field"
                                />
                            </div>
                        </div>

                        <div className="analysis-field">
                            <label className="analysis-label">Branch</label>
                            <div className="analysis-input">
                                <select
                                    name="branchId"
                                    value={globalFilters.branchId}
                                    onChange={handleGlobalFilterChange}
                                    className="analysis-input__field"
                                >
                                    <option value="">All Branches</option>
                                    {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="analysis-field">
                            <label className="analysis-label">Period</label>
                            <div className="analysis-input">
                                <select
                                    name="period"
                                    value={globalFilters.period}
                                    onChange={handleGlobalFilterChange}
                                    className="analysis-input__field"
                                >
                                    <option value="day">Daily</option>
                                    <option value="week">Weekly</option>
                                    <option value="month">Monthly</option>
                                </select>
                            </div>
                        </div>

                        <div className="analysis-field">
                            <label className="analysis-label">Results Limit</label>
                            <div className="analysis-input">
                                <input
                                    type="number"
                                    name="limit"
                                    value={globalFilters.limit}
                                    onChange={handleGlobalFilterChange}
                                    min="1"
                                    max="1000"
                                    className="analysis-input__field"
                                />
                            </div>
                        </div>

                        <div className="analysis-field analysis-field--actions">
                            <button
                                className="analysis-btn analysis-btn--secondary"
                                onClick={clearGlobalFilters}
                            >
                                <FaTrashAlt className="analysis-btn__icon" />
                                Clear Global
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="analysis-kpi-grid">

                {/* // Update the Total Sales Card breakdown: */}
                <div className="analysis-kpi-card analysis-kpi-card--sales">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaShoppingCart />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.totalSales)}
                            </h3>
                            <p className="analysis-kpi-label">Total Sales</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-breakdown">
                                    Regular: {formatCurrency(kpiData.totalRegularSales)} |
                                    Advantage: {formatCurrency(kpiData.totalAdvantageSalesAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Profit Card - Shows profit breakdown */}
                <div className="analysis-kpi-card analysis-kpi-card--profit">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaChartLine />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.totalProfit)}
                            </h3>
                            <p className="analysis-kpi-label">Total Profit</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-breakdown">
                                    Regular: {formatCurrency(kpiData.regularProfit)} |
                                    Advantage: <span className="text-warning">{formatCurrency(kpiData.advantageProfit)}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* // In your KPI cards section, update the Advantage Sales Card: */}
                <div className="analysis-kpi-card analysis-kpi-card--advantage">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaCrown />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {kpiData.totalAdvantageSales}
                            </h3>
                            <p className="analysis-kpi-label">Advantage Sales</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">
                                    Sales: {formatCurrency(kpiData.totalAdvantageSalesAmount)} |
                                    Premium: {formatCurrency(kpiData.totalAdvantageAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Transactions Breakdown Card - NEW */}
                <div className="analysis-kpi-card analysis-kpi-card--transactions">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaIdCard />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">{kpiData.totalTransactions}</h3>
                            <p className="analysis-kpi-label">Total Transactions</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-breakdown">
                                    Regular: {kpiData.regularSalesCount} |
                                    Advantage: <span className="text-warning">{kpiData.advantageSalesCount}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Profit Card
                <div className="analysis-kpi-card analysis-kpi-card--profit">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaChartLine />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.totalProfit)}
                            </h3>
                            <p className="analysis-kpi-label">Total Profit</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">
                                    {globalFilters.startDate} to {globalFilters.endDate}
                                </span>
                                <span className="analysis-kpi-note">
                                    <FaExclamationTriangle className="analysis-kpi-note-icon" />
                                    Sales - COGS
                                </span>
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Total Customers Card */}
                <div className="analysis-kpi-card analysis-kpi-card--customers">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaUsers />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">{kpiData.totalCustomers.toLocaleString()}</h3>
                            <p className="analysis-kpi-label">Total Customers</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">All registered customers</span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--positive">
                                    <FaChartLine /> +8.2%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Transactions Card */}
                <div className="analysis-kpi-card analysis-kpi-card--transactions">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaIdCard />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">{kpiData.totalTransactions.toLocaleString()}</h3>
                            <p className="analysis-kpi-label">Total Transactions</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">Completed sales</span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--positive">
                                    <FaChartLine /> +15.3%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operating Expenses Card */}
                <div className="analysis-kpi-card analysis-kpi-card--expenses">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaReceipt />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.totalExpenses)}
                            </h3>
                            <p className="analysis-kpi-label">Operating Expenses</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">
                                    {globalFilters.startDate} to {globalFilters.endDate}
                                </span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--negative">
                                    <FaChartLine /> +5.7%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Salaries Card */}
                <div className="analysis-kpi-card analysis-kpi-card--salary">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaUserTie />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.totalSalaries)}
                            </h3>
                            <p className="analysis-kpi-label">Total Salaries</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">
                                    {globalFilters.startDate} to {globalFilters.endDate}
                                </span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--neutral">
                                    <FaChartLine /> +2.1%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Value Card */}
                <div className="analysis-kpi-card analysis-kpi-card--inventory">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaWarehouse />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.inventoryValue)}
                            </h3>
                            <p className="analysis-kpi-label">Inventory Value</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">Current stock value</span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--positive">
                                    <FaChartLine /> +3.4%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Waste Value Card */}
                <div className="analysis-kpi-card analysis-kpi-card--waste">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaExclamationTriangle />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.wasteValue)}
                            </h3>
                            <p className="analysis-kpi-label">Waste Value</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">
                                    {globalFilters.startDate} to {globalFilters.endDate}
                                </span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--negative">
                                    <FaChartLine /> +18.2%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profit Margin Card */}
                <div className="analysis-kpi-card analysis-kpi-card--margin">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaPercent />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {kpiData.totalSales > 0 ? ((kpiData.totalProfit / kpiData.totalSales) * 100).toFixed(1) : '0.0'}%
                            </h3>
                            <p className="analysis-kpi-label">Profit Margin</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">Overall margin</span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--positive">
                                    <FaChartLine /> +1.2%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Average Transaction Card */}
                <div className="analysis-kpi-card analysis-kpi-card--avg-transaction">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaMoneyBillWave />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {formatCurrency(kpiData.totalTransactions > 0 ? (kpiData.totalSales / kpiData.totalTransactions) : 0)}
                            </h3>
                            <p className="analysis-kpi-label">Avg. Transaction</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">Per transaction</span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--positive">
                                    <FaChartLine /> +4.8%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advantage Contribution Card - NEW */}
                <div className="analysis-kpi-card analysis-kpi-card--contribution">
                    <div className="analysis-kpi-card__content">
                        <div className="analysis-kpi-icon">
                            <FaGem />
                        </div>
                        <div className="analysis-kpi-info">
                            <h3 className="analysis-kpi-value">
                                {kpiData.totalSales > 0 ? ((kpiData.totalAdvantageAmount / kpiData.totalSales) * 100).toFixed(1) : '0.0'}%
                            </h3>
                            <p className="analysis-kpi-label">Advantage Contribution</p>
                            <div className="analysis-kpi-meta">
                                <span className="analysis-kpi-period">
                                    Of total sales
                                </span>
                                <span className="analysis-kpi-trend analysis-kpi-trend--positive">
                                    <FaChartLine /> Premium
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - UPDATED WITH ADVANTAGE TAB */}
            <div className="analysis-tabs">
                <button
                    className={`analysis-tab ${activeTab === 'overview' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FaChartBar className="analysis-tab-icon" />
                    Overview
                </button>
                <button
                    className={`analysis-tab ${activeTab === 'sales' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    <FaShoppingCart className="analysis-tab-icon" />
                    Sales & Profit
                </button>
                <button
                    className={`analysis-tab ${activeTab === 'advantage' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('advantage')}
                >
                    <FaCrown className="analysis-tab-icon" />
                    Advantage Sales
                </button>
                <button
                    className={`analysis-tab ${activeTab === 'inventory' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    <FaWarehouse className="analysis-tab-icon" />
                    Inventory
                </button>
                <button
                    className={`analysis-tab ${activeTab === 'customers' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('customers')}
                >
                    <FaUsers className="analysis-tab-icon" />
                    Customers
                </button>
                <button
                    className={`analysis-tab ${activeTab === 'operations' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('operations')}
                >
                    <FaCog className="analysis-tab-icon" />
                    Operations
                </button>
                <button
                    className={`analysis-tab ${activeTab === 'staff' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('staff')}
                >
                    <FaUserTie className="analysis-tab-icon" />
                    Staff & Branches
                </button>
                <button
                    className={`analysis-tab ${activeTab === 'riders' ? 'analysis-tab--active' : ''}`}
                    onClick={() => setActiveTab('riders')}
                >
                    <FaMotorcycle className="analysis-tab-icon" />
                    Riders
                </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* Sales Comparison */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaChartBar className="analysis-card__icon" />
                                    Sales Comparison
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="salesComparisonPeriod"
                                            value={analysisFilters.salesComparisonPeriod}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('salesComparison')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('salesComparison')}
                                    >
                                        {expandedCards.salesComparison ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Bar
                                        data={salesComparisonChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                                {expandedCards.salesComparison && (
                                    <div className="analysis-card__expanded">
                                        <div className="analysis-comparison-stats">
                                            <div className="analysis-stat">
                                                <div className="analysis-stat__label">Sales Change</div>
                                                <div className={`analysis-stat__value ${salesChange >= 0 ? 'analysis-stat__value--positive' : 'analysis-stat__value--negative'}`}>
                                                    {salesChange >= 0 ? '+' : ''}{formatCurrency(salesChange)} ({salesChangePercent.toFixed(1)}%)
                                                </div>
                                            </div>
                                            <div className="analysis-stat">
                                                <div className="analysis-stat__label">Profit Change</div>
                                                <div className={`analysis-stat__value ${profitChange >= 0 ? 'analysis-stat__value--positive' : 'analysis-stat__value--negative'}`}>
                                                    {profitChange >= 0 ? '+' : ''}{formatCurrency(profitChange)} ({profitChangePercent.toFixed(1)}%)
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profit Margin Trend */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaPercent className="analysis-card__icon" />
                                    Profit Margin Trend
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="profitMarginTrendPeriod"
                                            value={analysisFilters.profitMarginTrendPeriod}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('profitMarginTrend')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('profitMarginTrend')}
                                    >
                                        {expandedCards.profitMarginTrend ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Line
                                        data={profitMarginTrendChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Top Customers */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaUsers className="analysis-card__icon" />
                                    Top Customers by Sales
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="topCustomersLimit"
                                            value={analysisFilters.topCustomersLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="5">Top 5</option>
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('topCustomers')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('topCustomers')}
                                    >
                                        {expandedCards.topCustomers ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {renderTableWithControls(
                                    'topCustomers',
                                    topCustomers,
                                    [
                                        { header: 'Customer Name', field: 'customer_name' },
                                        {
                                            header: 'Total Sales (₦)', field: 'total_sales_amount', align: 'right',
                                            render: (row) => formatCurrency(row.total_sales_amount)
                                        },
                                        {
                                            header: 'Total Profit (₦)', field: 'total_profit', align: 'right',
                                            render: (row) => formatCurrency(row.total_profit)
                                        },
                                        { header: 'Total Transactions', field: 'total_transactions', align: 'right' },
                                        {
                                            header: 'Average Transaction (₦)', field: 'avg_transaction_amount', align: 'right',
                                            render: (row) => formatCurrency(row.avg_transaction_amount)
                                        },
                                    ],
                                    ['customer_name']
                                )}
                            </div>
                        </div>

                        {/* Branch Performance */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaStore className="analysis-card__icon" />
                                    Branch Performance
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="branchPerformanceMetric"
                                            value={analysisFilters.branchPerformanceMetric}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="sales">Sales</option>
                                            <option value="profit">Profit</option>
                                            <option value="customers">Customers</option>
                                            <option value="transactions">Transactions</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('branchPerformance')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('branchPerformance')}
                                    >
                                        {expandedCards.branchPerformance ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Bar
                                        data={branchPerformanceChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW: Advantage Sales Tab Content */}
            {activeTab === 'advantage' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* Advantage vs Regular Comparison */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaBalanceScale className="analysis-card__icon" />
                                    Advantage vs Regular Sales
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="advantageComparisonPeriod"
                                            value={analysisFilters.advantageComparisonPeriod}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('advantageComparison')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Bar
                                        data={advantageVsRegularChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Advantage Sales Trend */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaChartLine className="analysis-card__icon" />
                                    Advantage Sales Trend
                                </div>
                                <div className="analysis-card__actions">
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('advantageTrend')}
                                    >
                                        {expandedCards.advantageTrend ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Line
                                        data={advantageSalesTrendChartData}
                                        options={advantageTrendChartOptions}
                                    />
                                </div>
                                {expandedCards.advantageTrend && (
                                    <div className="analysis-card__expanded">
                                        <div className="analysis-trend-explanation">
                                            <h4>Trend Explanation:</h4>
                                            <ul>
                                                <li><strong>Advantage Sales Amount</strong>: Total value of advantage sales transactions</li>
                                                <li><strong>Advantage Premium Amount</strong>: Additional premium charged for advantage sales</li>
                                                <li><strong>Advantage Sales Count</strong>: Number of advantage sales transactions</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Advantage Sales Analysis Table */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaCrown className="analysis-card__icon" />
                                    Advantage Sales Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="advantageSalesLimit"
                                            value={analysisFilters.advantageSalesLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('advantageSales')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {renderTableWithControls(
                                    'advantageSales',
                                    advantageSalesAnalysis,
                                    [
                                        { header: 'Sale ID', field: 'sale_id' },
                                        { header: 'Date', field: 'sale_date', render: (row) => formatDate(row.sale_date) },
                                        { header: 'Customer', field: 'customer_name' },
                                        { header: 'Branch', field: 'branch_name' },
                                        {
                                            header: 'Base Sales (₦)', field: 'base_subtotal', align: 'right',
                                            render: (row) => formatCurrency(row.base_subtotal || row.base_sales_amount)
                                        },
                                        {
                                            header: 'Advantage Amount (₦)', field: 'advantage_total', align: 'right',
                                            render: (row) => <span className="text-warning">{formatCurrency(row.advantage_total)}</span>
                                        },
                                        {
                                            header: 'Total Sales (₦)', field: 'total_amount', align: 'right',
                                            render: (row) => formatCurrency(row.total_amount)
                                        },
                                        {
                                            header: 'Profit (₦)', field: 'total_profit', align: 'right',
                                            render: (row) => formatCurrency(row.total_profit)
                                        },
                                        { header: 'Status', field: 'status' },
                                    ],
                                    ['sale_id', 'customer_name', 'branch_name']
                                )}
                            </div>
                        </div>

                        {/* // CORRECTED Advantage Sales Summary */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaAward className="analysis-card__icon" />
                                    Advantage Sales Summary
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-summary-stats">
                                    <div className="analysis-summary-stat">
                                        <div className="analysis-summary-stat__label">Total Advantage Sales</div>
                                        <div className="analysis-summary-stat__value">{kpiData.totalAdvantageSales}</div>
                                        <div className="analysis-summary-stat__subtext">Number of transactions</div>
                                    </div>
                                    <div className="analysis-summary-stat">
                                        <div className="analysis-summary-stat__label">Total Advantage Sales Amount</div>
                                        <div className="analysis-summary-stat__value text-warning">
                                            {formatCurrency(kpiData.totalAdvantageSalesAmount)}
                                        </div>
                                        <div className="analysis-summary-stat__subtext">Total sales value</div>
                                    </div>
                                    <div className="analysis-summary-stat">
                                        <div className="analysis-summary-stat__label">Total Advantage Premium</div>
                                        <div className="analysis-summary-stat__value">
                                            {formatCurrency(kpiData.totalAdvantageAmount)}
                                        </div>
                                        <div className="analysis-summary-stat__subtext">Additional premium revenue</div>
                                    </div>
                                    <div className="analysis-summary-stat">
                                        <div className="analysis-summary-stat__label">Average Advantage per Sale</div>
                                        <div className="analysis-summary-stat__value">
                                            {kpiData.totalAdvantageSales > 0 ?
                                                formatCurrency(kpiData.totalAdvantageSalesAmount / kpiData.totalAdvantageSales) :
                                                formatCurrency(0)}
                                        </div>
                                        <div className="analysis-summary-stat__subtext">Average transaction value</div>
                                    </div>
                                    <div className="analysis-summary-stat">
                                        <div className="analysis-summary-stat__label">Average Premium per Sale</div>
                                        <div className="analysis-summary-stat__value">
                                            {kpiData.totalAdvantageSales > 0 ?
                                                formatCurrency(kpiData.totalAdvantageAmount / kpiData.totalAdvantageSales) :
                                                formatCurrency(0)}
                                        </div>
                                        <div className="analysis-summary-stat__subtext">Average premium amount</div>
                                    </div>
                                    <div className="analysis-summary-stat">
                                        <div className="analysis-summary-stat__label">Contribution to Total Sales</div>
                                        <div className="analysis-summary-stat__value">
                                            {kpiData.totalSales > 0 ?
                                                ((kpiData.totalAdvantageSalesAmount / kpiData.totalSales) * 100).toFixed(1) + '%' : '0%'}
                                        </div>
                                        <div className="analysis-summary-stat__subtext">Revenue share</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales & Profit Tab Content */}
            {activeTab === 'sales' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* // In Sales & Profit tab, update the Sales Breakdown chart: */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaChartBar className="analysis-card__icon" />
                                    Sales Breakdown
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Doughnut
                                        data={{
                                            labels: ['Regular Sales', 'Advantage Sales'],
                                            datasets: [
                                                {
                                                    data: [kpiData.totalRegularSales, kpiData.totalAdvantageSalesAmount], // Use total advantage sales amount
                                                    backgroundColor: [
                                                        'rgba(54, 162, 235, 0.7)',
                                                        'rgba(255, 205, 86, 0.7)'
                                                    ],
                                                    borderColor: [
                                                        'rgb(54, 162, 235)',
                                                        'rgb(255, 205, 86)'
                                                    ],
                                                    borderWidth: 1,
                                                },
                                            ],
                                        }}
                                        options={commonChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sales Trend by Category/Product */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaChartLine className="analysis-card__icon" />
                                    Sales Trend by Category/Product
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="salesTrendPeriod"
                                            value={analysisFilters.salesTrendPeriod}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('salesTrend')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('salesTrend')}
                                    >
                                        {expandedCards.salesTrend ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Line
                                        data={salesTrendByCatProdChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Discount Analysis */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaTags className="analysis-card__icon" />
                                    Discount Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="discountLimit"
                                            value={analysisFilters.discountLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('discount')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('discount')}
                                    >
                                        {expandedCards.discount ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Line
                                        data={discountAnalysisChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Free Items Analysis */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaGift className="analysis-card__icon" />
                                    Free Items Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="freeItemsLimit"
                                            value={analysisFilters.freeItemsLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('freeItems')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('freeItems')}
                                    >
                                        {expandedCards.freeItems ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {renderTableWithControls(
                                    'freeItems',
                                    freeItemsAnalysis,
                                    // Rider Product Performance columns - update these fields
                                    [
                                        { header: 'Product Name', field: 'product_name' },
                                        { header: 'Category', field: 'category' },
                                        {
                                            header: 'Total Quantity', field: 'total_quantity_sold', align: 'right',
                                            render: (row) => {
                                                const qty = row.total_quantity_sold;
                                                return qty !== undefined && qty !== null ? qty.toFixed(0) : '0';
                                            }
                                        },
                                        {
                                            header: 'Total Sales (₦)', field: 'total_sales_amount', align: 'right',
                                            render: (row) => formatCurrency(row.total_sales_amount)
                                        },
                                        {
                                            header: 'Total Profit (₦)', field: 'total_profit', align: 'right',
                                            render: (row) => {
                                                const profit = row.total_profit;
                                                return profit !== undefined && profit !== null ? (
                                                    <span className="text-success">{formatCurrency(profit)}</span>
                                                ) : formatCurrency(0);
                                            }
                                        },
                                        {
                                            header: 'Profit Margin %', field: 'profit_margin_percentage', align: 'right',
                                            render: (row) => `${safeToFixed(row.profit_margin_percentage, 1)}%`  // Using safeToFixed
                                        },
                                        {
                                            header: 'Avg Price (₦)', field: 'avg_selling_price', align: 'right',
                                            render: (row) => formatCurrency(row.avg_selling_price)
                                        },
                                    ],
                                    ['product_name', 'period_label']
                                )}
                            </div>
                        </div>

                        {/* Exchange Analysis */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaExchangeAlt className="analysis-card__icon" />
                                    Exchange Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="exchangeLimit"
                                            value={analysisFilters.exchangeLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('exchange')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('exchange')}
                                    >
                                        {expandedCards.exchange ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {renderTableWithControls(
                                    'exchange',
                                    exchangeAnalysis,
                                    [
                                        { header: 'Product Name', field: 'product_name' },
                                        { header: 'Exchange Quantity', field: 'exchange_quantity', align: 'right' },
                                        {
                                            header: 'Exchange Value (₦)', field: 'exchange_value', align: 'right',
                                            render: (row) => formatCurrency(row.exchange_value)
                                        },
                                        { header: 'Exchange Reason', field: 'exchange_reason' },
                                        { header: 'Status', field: 'status' },
                                        { header: 'Period', field: 'period_label' },
                                        { header: 'Customer Name', field: 'customer_name' },
                                    ],
                                    ['product_name', 'exchange_reason', 'status', 'period_label']
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Tab Content */}
            {activeTab === 'inventory' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* Inventory Turnover */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaSyncAlt className="analysis-card__icon" />
                                    Inventory Turnover
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="inventoryTurnoverProductId"
                                            value={analysisFilters.inventoryTurnoverProductId}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="">All Products</option>
                                            {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('inventoryTurnover')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('inventoryTurnover')}
                                    >
                                        {expandedCards.inventoryTurnover ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {inventoryTurnover && (
                                    <div className="analysis-inventory-turnover">
                                        <div className="analysis-turnover-stats">
                                            <div className="analysis-turnover-stat">
                                                <div className="analysis-turnover-stat__label">Turnover Ratio</div>
                                                <div className="analysis-turnover-stat__value">
                                                    {parseFloat(inventoryTurnover.reportData?.turnover_ratio || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="analysis-turnover-stat">
                                                <div className="analysis-turnover-stat__label">Days in Inventory</div>
                                                <div className="analysis-turnover-stat__value">
                                                    {parseFloat(inventoryTurnover.reportData?.days_in_inventory || 0).toFixed(1)} days
                                                </div>
                                            </div>
                                            <div className="analysis-turnover-stat">
                                                <div className="analysis-turnover-stat__label">Cost of Goods Sold</div>
                                                <div className="analysis-turnover-stat__value">
                                                    {formatCurrency(inventoryTurnover.reportData?.cost_of_goods_sold)}
                                                </div>
                                            </div>
                                            <div className="analysis-turnover-stat">
                                                <div className="analysis-turnover-stat__label">Average Inventory</div>
                                                <div className="analysis-turnover-stat__value">
                                                    {formatCurrency(inventoryTurnover.reportData?.average_inventory)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Raw Material Stock Value Trend */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaBox className="analysis-card__icon" />
                                    Raw Material Stock Value Trend
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="rawMaterialStockPeriod"
                                            value={analysisFilters.rawMaterialStockPeriod}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('rawMaterialStock')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('rawMaterialStock')}
                                    >
                                        {expandedCards.rawMaterialStock ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Line
                                        data={rawMaterialStockValueTrendChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stock Allocation Analysis */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaLayerGroup className="analysis-card__icon" />
                                    Stock Allocation Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="stockAllocationLimit"
                                            value={analysisFilters.stockAllocationLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('stockAllocation')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('stockAllocation')}
                                    >
                                        {expandedCards.stockAllocation ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {renderTableWithControls(
                                    'stockAllocation',
                                    stockAllocationAnalysis,
                                    [
                                        { header: 'Product Name', field: 'product_name' },
                                        { header: 'Staff Name', field: 'user_name' },
                                        { header: 'Branch Name', field: 'branch_name' },
                                        { header: 'Allocated Quantity', field: 'allocated_quantity', align: 'right' },
                                        {
                                            header: 'Allocation Date', field: 'allocation_date',
                                            render: (row) => formatDate(row.allocation_date)
                                        },
                                        { header: 'Status', field: 'status' },
                                    ],
                                    ['product_name', 'user_name', 'branch_name', 'status']
                                )}
                            </div>
                        </div>

                        {/* Stock Issues Analysis */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaExclamationTriangle className="analysis-card__icon" />
                                    Stock Issues Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="stockIssuesLimit"
                                            value={analysisFilters.stockIssuesLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('stockIssues')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('stockIssues')}
                                    >
                                        {expandedCards.stockIssues ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Bar
                                        data={stockIssuesChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                                {expandedCards.stockIssues && (
                                    <div className="analysis-card__expanded">
                                        {renderTableWithControls(
                                            'stockIssues',
                                            stockIssuesAnalysis,
                                            [
                                                { header: 'Issue Type', field: 'issue_type' },
                                                { header: 'Product Name', field: 'product_name' },
                                                { header: 'Branch Name', field: 'branch_name' },
                                                { header: 'Total Quantity', field: 'total_quantity', align: 'right' },
                                                {
                                                    header: 'Total Value (₦)', field: 'total_value', align: 'right',
                                                    render: (row) => formatCurrency(row.total_value)
                                                },
                                                { header: 'Period', field: 'period_label' },
                                            ],
                                            ['issue_type', 'product_name', 'branch_name']
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customers Tab Content */}
            {activeTab === 'customers' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* Customer Lifetime Value */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaIdCard className="analysis-card__icon" />
                                    Customer Lifetime Value
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="cltvLimit"
                                            value={analysisFilters.cltvLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('cltv')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('cltv')}
                                    >
                                        {expandedCards.cltv ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {renderTableWithControls(
                                    'cltv',
                                    customerLifetimeValue,
                                    [
                                        { header: 'Customer Name', field: 'customer_name' },
                                        {
                                            header: 'Total Revenue (₦)', field: 'total_revenue', align: 'right',
                                            render: (row) => formatCurrency(row.total_revenue)
                                        },
                                        {
                                            header: 'Total Profit (₦)', field: 'total_profit', align: 'right',
                                            render: (row) => formatCurrency(row.total_profit)
                                        },
                                        { header: 'Total Transactions', field: 'total_transactions', align: 'right' },
                                        {
                                            header: 'Average Transaction (₦)', field: 'avg_transaction_value', align: 'right',
                                            render: (row) => formatCurrency(row.avg_transaction_value)
                                        },
                                        {
                                            header: 'Customer Since', field: 'first_transaction_date',
                                            render: (row) => formatDate(row.first_transaction_date)
                                        },
                                    ],
                                    ['customer_name']
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Operations Tab Content */}
            {activeTab === 'operations' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* Production Waste Trend */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaTractor className="analysis-card__icon" />
                                    Production Waste Trend
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="productionWastePeriod"
                                            value={analysisFilters.productionWastePeriod}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('productionWaste')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('productionWaste')}
                                    >
                                        {expandedCards.productionWaste ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Line
                                        data={productionWasteTrendChartData}
                                        options={{
                                            ...commonChartOptions,
                                            scales: {
                                                ...commonChartOptions.scales,
                                                'y-produced': {
                                                    type: 'linear',
                                                    display: true,
                                                    position: 'left',
                                                    title: {
                                                        display: true,
                                                        text: 'Quantity'
                                                    }
                                                },
                                                'y-percentage': {
                                                    type: 'linear',
                                                    display: true,
                                                    position: 'right',
                                                    title: {
                                                        display: true,
                                                        text: 'Percentage (%)'
                                                    },
                                                    grid: {
                                                        drawOnChartArea: false,
                                                    },
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Operating Expenses Analysis */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaMoneyBillWave className="analysis-card__icon" />
                                    Operating Expenses
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="expensesLimit"
                                            value={analysisFilters.expensesLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('expenses')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('expenses')}
                                    >
                                        {expandedCards.expenses ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Pie
                                        data={operatingExpensesChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                                {expandedCards.expenses && (
                                    <div className="analysis-card__expanded">
                                        {renderTableWithControls(
                                            'expenses',
                                            operatingExpensesAnalysis,
                                            [
                                                { header: 'Category', field: 'category' },
                                                {
                                                    header: 'Total Amount (₦)', field: 'total_amount', align: 'right',
                                                    render: (row) => formatCurrency(row.total_amount)
                                                },
                                                { header: 'Period', field: 'period_label' },
                                            ],
                                            ['category', 'period_label']
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Waste Analysis */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaExclamationTriangle className="analysis-card__icon" />
                                    Waste Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="wasteLimit"
                                            value={analysisFilters.wasteLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('waste')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('waste')}
                                    >
                                        {expandedCards.waste ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Bar
                                        data={wasteAnalysisChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                                {expandedCards.waste && (
                                    <div className="analysis-card__expanded">
                                        {renderTableWithControls(
                                            'waste',
                                            wasteAnalysis,
                                            [
                                                { header: 'Product Name', field: 'product_name' },
                                                { header: 'Waste Quantity', field: 'total_waste_quantity', align: 'right' },
                                                {
                                                    header: 'Waste Value (₦)', field: 'waste_value', align: 'right',
                                                    render: (row) => formatCurrency(row.waste_value)
                                                },
                                                { header: 'Waste Reason', field: 'waste_reason' },
                                                { header: 'Period', field: 'period_label' },
                                            ],
                                            ['product_name', 'waste_reason', 'period_label']
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff & Branches Tab Content */}
            {activeTab === 'staff' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* Staff Performance */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaUserTie className="analysis-card__icon" />
                                    Staff Performance
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="staffPerformanceLimit"
                                            value={analysisFilters.staffPerformanceLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('staffPerformance')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('staffPerformance')}
                                    >
                                        {expandedCards.staffPerformance ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                <div className="analysis-chart-container">
                                    <Bar
                                        data={staffPerformanceChartData}
                                        options={commonChartOptions}
                                    />
                                </div>
                                {expandedCards.staffPerformance && (
                                    <div className="analysis-card__expanded">
                                        {renderTableWithControls(
                                            'staffPerformance',
                                            staffPerformance,
                                            [
                                                { header: 'Staff Name', field: 'staff_name' },
                                                { header: 'Role', field: 'role' },
                                                {
                                                    header: 'Total Sales (₦)', field: 'total_sales', align: 'right',
                                                    render: (row) => formatCurrency(row.total_sales)
                                                },
                                                { header: 'Total Transactions', field: 'total_transactions', align: 'right' },
                                                {
                                                    header: 'Average Transaction (₦)', field: 'avg_transaction_value', align: 'right',
                                                    render: (row) => formatCurrency(row.avg_transaction_value)
                                                },
                                                { header: 'Period', field: 'period_label' },
                                            ],
                                            ['staff_name', 'role', 'period_label']
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Salary Analysis */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaDollarSign className="analysis-card__icon" />
                                    Salary Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="salaryLimit"
                                            value={analysisFilters.salaryLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                            <option value="50">Top 50</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => clearSectionFilters('salary')}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => toggleCardExpansion('salary')}
                                    >
                                        {expandedCards.salary ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {renderTableWithControls(
                                    'salary',
                                    salaryAnalysis,
                                    [
                                        { header: 'Staff Name', field: 'staff_name' },
                                        { header: 'Role', field: 'role' },
                                        {
                                            header: 'Basic Salary (₦)', field: 'basic_salary', align: 'right',
                                            render: (row) => formatCurrency(row.basic_salary)
                                        },
                                        {
                                            header: 'Allowances (₦)', field: 'allowances', align: 'right',
                                            render: (row) => formatCurrency(row.allowances)
                                        },
                                        {
                                            header: 'Deductions (₦)', field: 'deductions', align: 'right',
                                            render: (row) => formatCurrency(row.deductions)
                                        },
                                        {
                                            header: 'Net Salary (₦)', field: 'net_salary', align: 'right',
                                            render: (row) => formatCurrency(row.net_salary)
                                        },
                                        { header: 'Pay Period', field: 'pay_period' },
                                    ],
                                    ['staff_name', 'role', 'pay_period']
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Riders Tab Content - COMPLETELY UPDATED */}
            {activeTab === 'riders' && (
                <div className="analysis-tab-content">
                    <div className="analysis-cards-grid">
                        {/* Rider Sales Trend Chart */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaChartLine className="analysis-card__icon" />
                                    Rider Sales Trend
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="riderSalesPeriod"
                                            value={analysisFilters.riderSalesPeriod}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="day">Daily</option>
                                            <option value="week">Weekly</option>
                                            <option value="month">Monthly</option>
                                        </select>
                                    </div>
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="riderSalesRiderId"
                                            value={analysisFilters.riderSalesRiderId}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="">All Riders</option>
                                            {Array.isArray(allRiders) && allRiders.map(rider => (
                                                <option key={rider.id} value={rider.id}>{rider.fullname}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => {
                                            setAnalysisFilters(prev => ({
                                                ...prev,
                                                riderSalesRiderId: '',
                                                riderSalesPeriod: 'month'
                                            }));
                                        }}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {riderSalesTrend && riderSalesTrend.length > 0 ? (
                                    <div className="analysis-chart-container">
                                        <Line
                                            data={{
                                                labels: riderSalesTrend.map(item => item.period_label),
                                                datasets: [
                                                    {
                                                        label: 'Total Sales (₦)',
                                                        data: riderSalesTrend.map(item => parseFloat(item.total_sales || 0)),
                                                        borderColor: 'rgb(255, 159, 64)',
                                                        backgroundColor: 'rgba(255, 159, 64, 0.5)',
                                                        tension: 0.1,
                                                        fill: false,
                                                        yAxisID: 'y-sales'
                                                    },
                                                    {
                                                        label: 'Total Profit (₦)',
                                                        data: riderSalesTrend.map(item => parseFloat(item.total_profit || 0)),
                                                        borderColor: 'rgb(75, 192, 192)',
                                                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                                                        tension: 0.1,
                                                        fill: false,
                                                        yAxisID: 'y-sales'
                                                    },
                                                    {
                                                        label: 'Transaction Count',
                                                        data: riderSalesTrend.map(item => parseInt(item.total_transactions || 0)),
                                                        borderColor: 'rgb(153, 102, 255)',
                                                        backgroundColor: 'rgba(153, 102, 255, 0.5)',
                                                        tension: 0.1,
                                                        fill: false,
                                                        yAxisID: 'y-count'
                                                    }
                                                ]
                                            }}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { position: 'top' },
                                                },
                                                scales: {
                                                    'y-count': {
                                                        type: 'linear',
                                                        display: true,
                                                        position: 'left',
                                                        title: { display: true, text: 'Number of Transactions' },
                                                        grid: { drawOnChartArea: false }
                                                    },
                                                    'y-sales': {
                                                        type: 'linear',
                                                        display: true,
                                                        position: 'right',
                                                        title: { display: true, text: 'Amount (₦)' },
                                                        ticks: {
                                                            callback: function (value) {
                                                                return '₦' + value.toLocaleString();
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="analysis-empty-state">
                                        <FaChartLine className="analysis-empty-icon" />
                                        <p>No rider sales trend data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rider Credit Analysis */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaCreditCard className="analysis-card__icon" />
                                    Rider Credit Analysis
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="riderCreditLimit"
                                            value={analysisFilters.riderCreditLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="5">Top 5</option>
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => {
                                            setAnalysisFilters(prev => ({
                                                ...prev,
                                                riderCreditLimit: 10
                                            }));
                                        }}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {riderCreditAnalysis && riderCreditAnalysis.length > 0 ? (
                                    renderTableWithControls(
                                        'riderCredit',
                                        riderCreditAnalysis,
                                        [
                                            { header: 'Rider Name', field: 'rider_name' },
                                            {
                                                header: 'Credit Limit (₦)', field: 'credit_limit', align: 'right',
                                                render: (row) => formatCurrency(row.credit_limit || 0)
                                            },
                                            {
                                                header: 'Current Balance (₦)', field: 'current_balance', align: 'right',
                                                render: (row) => {
                                                    const balance = parseFloat(row.current_balance || 0);
                                                    return (
                                                        <span className={balance > 0 ? 'text-danger' : 'text-success'}>
                                                            {formatCurrency(balance)}
                                                        </span>
                                                    );
                                                }
                                            },
                                            {
                                                header: 'Available Credit (₦)', field: 'available_credit', align: 'right',
                                                render: (row) => {
                                                    const limit = parseFloat(row.credit_limit || 0);
                                                    const balance = parseFloat(row.current_balance || 0);
                                                    return formatCurrency(Math.max(0, limit - balance));
                                                }
                                            },
                                            {
                                                header: 'Total Sales (₦)', field: 'total_sales', align: 'right',
                                                render: (row) => formatCurrency(row.total_sales || 0)
                                            },
                                            {
                                                header: 'Outstanding (₦)', field: 'total_outstanding', align: 'right',
                                                render: (row) => {
                                                    const outstanding = parseFloat(row.total_outstanding || 0);
                                                    return outstanding > 0 ?
                                                        <span className="text-danger">{formatCurrency(outstanding)}</span> :
                                                        formatCurrency(0);
                                                }
                                            },
                                            {
                                                header: 'Credit Status', field: 'credit_status',
                                                render: (row) => {
                                                    const status = row.credit_status || 'Normal';
                                                    const balance = parseFloat(row.current_balance || 0);
                                                    const limit = parseFloat(row.credit_limit || 0);

                                                    let statusClass = 'analysis-status--approved';
                                                    let displayStatus = status;

                                                    if (balance > limit) {
                                                        statusClass = 'analysis-status--rejected';
                                                        displayStatus = 'Exceeded';
                                                    } else if (balance > limit * 0.8) {
                                                        statusClass = 'analysis-status--pending';
                                                        displayStatus = 'High Usage';
                                                    }

                                                    return (
                                                        <span className={`analysis-status ${statusClass}`}>
                                                            {displayStatus}
                                                        </span>
                                                    );
                                                }
                                            },
                                            {
                                                header: 'Utilization %', field: 'credit_utilization', align: 'right',
                                                render: (row) => {
                                                    const balance = parseFloat(row.current_balance || 0);
                                                    const limit = parseFloat(row.credit_limit || 0);
                                                    const utilization = limit > 0 ? (balance / limit) * 100 : 0;
                                                    return `${utilization.toFixed(1)}%`;
                                                }
                                            },
                                        ],
                                        ['rider_name']
                                    )
                                ) : (
                                    <div className="analysis-empty-state">
                                        <FaCreditCard className="analysis-empty-icon" />
                                        <p>No rider credit data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rider Product Performance - COMPLETELY FIXED */}
                        <div className="analysis-card">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaBox className="analysis-card__icon" />
                                    Rider Product Performance
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="riderProductRiderId"
                                            value={analysisFilters.riderProductRiderId}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="">All Riders</option>
                                            {Array.isArray(allRiders) && allRiders.map(rider => (
                                                <option key={rider.id} value={rider.id}>{rider.fullname}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="riderProductLimit"
                                            value={analysisFilters.riderProductLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="5">Top 5</option>
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => {
                                            setAnalysisFilters(prev => ({
                                                ...prev,
                                                riderProductRiderId: '',
                                                riderProductLimit: 10
                                            }));
                                        }}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {riderProductPerformance && riderProductPerformance.length > 0 ? (
                                    <div className="analysis-table-container">
                                        <table className="analysis-table">
                                            <thead>
                                                <tr>
                                                    <th>Product Name</th>
                                                    <th>Category</th>
                                                    <th className="analysis-table__cell--right">Total Quantity</th>
                                                    <th className="analysis-table__cell--right">Total Sales (₦)</th>
                                                    <th className="analysis-table__cell--right">Total Profit (₦)</th>
                                                    <th className="analysis-table__cell--right">Profit Margin %</th>
                                                    <th className="analysis-table__cell--right">Avg Price (₦)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {riderProductPerformance.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.product_name || 'N/A'}</td>
                                                        <td>{item.category || 'N/A'}</td>
                                                        <td className="analysis-table__cell--right">
                                                            {item.total_quantity_sold?.toLocaleString() || '0'}
                                                        </td>
                                                        <td className="analysis-table__cell--right">
                                                            {formatCurrency(item.total_sales_amount || 0)}
                                                        </td>
                                                        <td className="analysis-table__cell--right">
                                                            <span className="text-success">
                                                                {formatCurrency(item.total_profit || 0)}
                                                            </span>
                                                        </td>
                                                        <td className="analysis-table__cell--right">
                                                            {item.profit_margin_percentage ?
                                                                `${parseFloat(item.profit_margin_percentage).toFixed(1)}%` : '0.0%'}
                                                        </td>
                                                        <td className="analysis-table__cell--right">
                                                            {formatCurrency(item.avg_selling_price || 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="analysis-empty-state">
                                        <FaBox className="analysis-empty-icon" />
                                        <p>No rider product performance data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rider Collection Efficiency - COMPLETELY FIXED */}
                        <div className="analysis-card analysis-card--chart">
                            <div className="analysis-card__header">
                                <div className="analysis-card__title">
                                    <FaMoneyBillWave className="analysis-card__icon" />
                                    Rider Collection Efficiency
                                </div>
                                <div className="analysis-card__actions">
                                    <div className="analysis-field analysis-field--inline">
                                        <select
                                            name="riderCollectionLimit"
                                            value={analysisFilters.riderCollectionLimit}
                                            onChange={handleFilterChange}
                                            className="analysis-input__field analysis-input__field--small"
                                        >
                                            <option value="5">Top 5</option>
                                            <option value="10">Top 10</option>
                                            <option value="20">Top 20</option>
                                        </select>
                                    </div>
                                    <button
                                        className="analysis-btn analysis-btn--ghost analysis-btn--small"
                                        onClick={() => {
                                            setAnalysisFilters(prev => ({
                                                ...prev,
                                                riderCollectionLimit: 10
                                            }));
                                        }}
                                    >
                                        <FaTrashAlt className="analysis-btn__icon" />
                                    </button>
                                </div>
                            </div>
                            <div className="analysis-card__body">
                                {riderCollectionEfficiency && riderCollectionEfficiency.length > 0 ? (
                                    <>
                                        {/* Chart Section */}
                                        <div className="analysis-chart-container" style={{ height: '300px', marginBottom: '20px' }}>
                                            <Bar
                                                data={{
                                                    labels: riderCollectionEfficiency.map(item => item.rider_name || 'Unknown'),
                                                    datasets: [
                                                        {
                                                            label: 'Collection Efficiency (%)',
                                                            data: riderCollectionEfficiency.map(item =>
                                                                parseFloat(item.collection_efficiency_percentage || 0)
                                                            ),
                                                            backgroundColor: riderCollectionEfficiency.map(item => {
                                                                const eff = parseFloat(item.collection_efficiency_percentage || 0);
                                                                return eff >= 80 ? 'rgba(75, 192, 192, 0.7)' :
                                                                    eff >= 50 ? 'rgba(255, 205, 86, 0.7)' :
                                                                        'rgba(255, 99, 132, 0.7)';
                                                            }),
                                                            borderColor: 'rgb(75, 192, 192)',
                                                            borderWidth: 1,
                                                        },
                                                    ],
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { display: false },
                                                        tooltip: {
                                                            callbacks: {
                                                                label: function (context) {
                                                                    return `Efficiency: ${context.raw.toFixed(1)}%`;
                                                                }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 100,
                                                            title: {
                                                                display: true,
                                                                text: 'Efficiency (%)'
                                                            },
                                                            ticks: {
                                                                callback: function (value) {
                                                                    return value + '%';
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Table Section */}
                                        <div className="analysis-table-container">
                                            <table className="analysis-table">
                                                <thead>
                                                    <tr>
                                                        <th>Rider Name</th>
                                                        <th className="analysis-table__cell--right">Total Sales (₦)</th>
                                                        <th className="analysis-table__cell--right">Collected (₦)</th>
                                                        <th className="analysis-table__cell--right">Outstanding (₦)</th>
                                                        <th className="analysis-table__cell--right">Collection Efficiency</th>
                                                        <th className="analysis-table__cell--right">Overdue (₦)</th>
                                                        <th className="analysis-table__cell--right">Overdue %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {riderCollectionEfficiency.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{item.rider_name || 'N/A'}</td>
                                                            <td className="analysis-table__cell--right">
                                                                {formatCurrency(item.total_sales_value || 0)}
                                                            </td>
                                                            <td className="analysis-table__cell--right">
                                                                {formatCurrency(item.total_collected || 0)}
                                                            </td>
                                                            <td className="analysis-table__cell--right">
                                                                {parseFloat(item.total_outstanding || 0) > 0 ? (
                                                                    <span className="text-danger">
                                                                        {formatCurrency(item.total_outstanding)}
                                                                    </span>
                                                                ) : (
                                                                    formatCurrency(0)
                                                                )}
                                                            </td>
                                                            <td className="analysis-table__cell--right">
                                                                {renderEfficiencyBadge(item.collection_efficiency_percentage)}
                                                            </td>
                                                            <td className="analysis-table__cell--right">
                                                                {parseFloat(item.overdue_amount || 0) > 0 ? (
                                                                    <span className="text-danger">
                                                                        {formatCurrency(item.overdue_amount)}
                                                                    </span>
                                                                ) : (
                                                                    formatCurrency(0)
                                                                )}
                                                            </td>
                                                            <td className="analysis-table__cell--right">
                                                                {item.overdue_amount_percentage ?
                                                                    `${parseFloat(item.overdue_amount_percentage).toFixed(1)}%` : '0.0%'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                    <div className="analysis-empty-state">
                                        <FaMoneyBillWave className="analysis-empty-icon" />
                                        <p>No rider collection efficiency data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisPage;