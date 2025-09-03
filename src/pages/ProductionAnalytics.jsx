import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Card, Spinner, Form, Button } from 'react-bootstrap';
import {
  BarChart3, Package, Trash2, TrendingUp, Percent, Filter, RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import CustomToast from '../components/CustomToast';
import '../assets/styles/productionAnalytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const ProductionAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    productId: '',
    category: '',
    shift: '',
    userId: '',
    batchNumber: '',
  });

  // Dropdown data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);

  // prevent duplicate info toasts per filter set
  const [lastToastKey, setLastToastKey] = useState('');

  const fetchFilterOptions = async () => {
    try {
      const [productsRes, categoriesRes, usersRes, batchesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`),
        axios.get(`${API_BASE_URL}/products/categories`),
        axios.get(`${API_BASE_URL}/users`),
        axios.get(`${API_BASE_URL}/production/batches`),
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setUsers((usersRes.data || []).filter((u) => u.role === 'baker'));
      setBatches(batchesRes.data || []);
    } catch (err) {
      // toast.error(<CustomToast message="Failed to load filter choices." type="error" />);
      toast(<CustomToast id={`error-filter-${Date.now()}`} type="error" message="Failed to load filter choices." />, {
        toastId: 'filter-error'
      });
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axios.get(`${API_BASE_URL}/production/analytics?${queryParams}`);
      const data = res.data;
      setAnalyticsData(data);

      // Show an info toast if there's effectively no data for these filters
      const empty =
        (!data?.totalProductionByDate?.some(d => (d.total_produced || 0) > 0 || (d.total_waste || 0) > 0)) &&
        (!data?.productMix?.some(p => (p.total_produced || 0) > 0)) &&
        (!data?.wasteByProduct?.some(w => (w.total_waste || 0) > 0)) &&
        (!data?.productionByShift?.some(s => (s.total_produced || 0) > 0)) &&
        (!data?.productionByBaker?.some(b => (b.total_produced || 0) > 0));

      const toastKey = JSON.stringify(filters);
      if (empty && toastKey !== lastToastKey) {
        // toast.info(<CustomToast message="No analytics for the selected filters." type="info" />);
        toast(<CustomToast id={`info-analytics-${Date.now()}`} type="info" message="No analytics for the selected filters." />, {
          toastId: 'analytics-info'
        });
        setLastToastKey(toastKey);
      }
    } catch (err) {
      setError('Failed to load analytics data.');
      // toast.error(<CustomToast message="Failed to load analytics data." type="error" />);
      toast(<CustomToast id={`error-analytics-${Date.now()}`} type="error" message="Failed to load analytics data." />, {
        toastId: 'analytics-error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      productId: '',
      category: '',
      shift: '',
      userId: '',
      batchNumber: '',
    });
    // toast(<CustomToast message="Filters cleared." type="success" />);
    toast(<CustomToast id={`success-filteres-${Date.now()}`} type="success" message="Filters cleared." />, {
      toastId: 'filteres-success'
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="analytics-loading">
        <Spinner animation="border" />
        <p>Loading analytics…</p>
      </div>
    );
  }

  // Error (still show page shell)
  if (error && !analyticsData) {
    return (
      <div className="analytics-container">
        <Card className="analytics-card">
          <div className="empty-state">
            <BarChart3 size={22} />
            <p>{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const {
    totalProductionByDate = [],
    productMix = [],
    wasteByProduct = [],
    productionByShift = [],
    productionByBaker = [],
    overallSummary = {},
  } = analyticsData || {};

  const totalProducedOverall = overallSummary?.grand_total_produced || 0;
  const totalWastedOverall = overallSummary?.grand_total_waste || 0;
  const wastePercentage =
    totalProducedOverall > 0 ? ((totalWastedOverall / totalProducedOverall) * 100).toFixed(2) : 0;
  const netProduction = totalProducedOverall - totalWastedOverall;

  // Chart Data (theme colors)
  const lineChartData = {
    labels: totalProductionByDate.map((d) => new Date(d.production_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Produced',
        data: totalProductionByDate.map((d) => d.total_produced),
        borderColor: '#6f42c1',
        backgroundColor: 'rgba(111, 66, 193, 0.2)',
        tension: 0.25,
        yAxisID: 'y',
      },
      {
        label: 'Total Waste',
        data: totalProductionByDate.map((d) => d.total_waste),
        borderColor: '#e63946',
        backgroundColor: 'rgba(230, 57, 70, 0.25)',
        tension: 0.25,
        yAxisID: 'y1',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    stacked: false,
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Produced' } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Waste' } },
    },
  };

  const pieChartData = {
    labels: productMix.map((p) => p.product_name),
    datasets: [
      {
        label: 'Items Produced',
        data: productMix.map((p) => p.total_produced),
        backgroundColor: [
          '#6f42c1', '#9f7aea', '#b794f4', '#e9d8fd',
          '#00a3c4', '#38b2ac', '#2ca02c', '#81e6d9',
          '#ffb703', '#f6ad55', '#ed8936', '#e53e3e',
        ],
        hoverOffset: 6,
      },
    ],
  };

  const wasteBarChartData = {
    labels: wasteByProduct.map((w) => w.product_name),
    datasets: [
      {
        label: 'Items Wasted',
        data: wasteByProduct.map((w) => w.total_waste),
        backgroundColor: '#e63946',
        borderRadius: 6,
      },
    ],
  };

  const shiftBarChartData = {
    labels: productionByShift.map((s) => s.shift),
    datasets: [
      {
        label: 'Total Produced by Shift',
        data: productionByShift.map((s) => s.total_produced),
        backgroundColor: '#6f42c1',
        borderRadius: 6,
      },
    ],
  };

  const bakerBarChartData = {
    labels: productionByBaker.map((b) => b.baker_name),
    datasets: [
      {
        label: 'Total Produced by Baker',
        data: productionByBaker.map((b) => b.total_produced),
        backgroundColor: '#2ca02c',
        borderRadius: 6,
      },
    ],
  };

  const hasLineChartData =
    totalProductionByDate.length > 0 &&
    totalProductionByDate.some((d) => (d.total_produced || 0) > 0 || (d.total_waste || 0) > 0);
  const hasPieChartData = productMix.length > 0 && productMix.some((p) => (p.total_produced || 0) > 0);
  const hasWasteBarChartData =
    wasteByProduct.length > 0 && wasteByProduct.some((w) => (w.total_waste || 0) > 0);
  const hasShiftBarChartData =
    productionByShift.length > 0 && productionByShift.some((s) => (s.total_produced || 0) > 0);
  const hasBakerBarChartData =
    productionByBaker.length > 0 && productionByBaker.some((b) => (b.total_produced || 0) > 0);

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="header-row">
        <div className="title-wrap">
          <BarChart3 size={22} />
          <h2>Production Analytics</h2>
        </div>
        <div className="header-actions">
          <Button variant="outline-secondary" className="icon-btn" onClick={fetchAnalyticsData}>
            <RotateCcw size={18} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="analytics-card filter-card">
        <div className="filter-header">
          <div className="title-wrap sm">
            <Filter size={18} />
            <h3>Filters</h3>
          </div>
          <div className="filter-actions">
            <Button variant="outline-secondary" className="icon-btn" onClick={handleClearFilters}>
              <RotateCcw size={16} />
              Clear
            </Button>
          </div>
        </div>

        <Form className="filters-grid">
          <Form.Group className="fg">
            <Form.Label>Start Date</Form.Label>
            <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </Form.Group>

          <Form.Group className="fg">
            <Form.Label>End Date</Form.Label>
            <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </Form.Group>

          <Form.Group className="fg">
            <Form.Label>Product</Form.Label>
            <Form.Select name="productId" value={filters.productId} onChange={handleFilterChange}>
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="fg">
            <Form.Label>Category</Form.Label>
            <Form.Select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="fg">
            <Form.Label>Shift</Form.Label>
            <Form.Select name="shift" value={filters.shift} onChange={handleFilterChange}>
              <option value="">All Shifts</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="fg">
            <Form.Label>Baker</Form.Label>
            <Form.Select name="userId" value={filters.userId} onChange={handleFilterChange}>
              <option value="">All Bakers</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullname}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="fg">
            <Form.Label>Batch</Form.Label>
            <Form.Select name="batchNumber" value={filters.batchNumber} onChange={handleFilterChange}>
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Card>

      {/* KPIs */}
      <Card className="analytics-card kpi-card">
        <div className="kpi-grid">
          <div className="kpi-item">
            <div className="kpi-icon purple"><Package size={18} /></div>
            <div className="kpi-meta">
              <p>Total Produced</p>
              <h3>{totalProducedOverall}</h3>
            </div>
          </div>
          <div className="kpi-item">
            <div className="kpi-icon red"><Trash2 size={18} /></div>
            <div className="kpi-meta">
              <p>Total Waste</p>
              <h3>{totalWastedOverall}</h3>
            </div>
          </div>
          <div className="kpi-item">
            <div className="kpi-icon green"><TrendingUp size={18} /></div>
            <div className="kpi-meta">
              <p>Net Production</p>
              <h3>{netProduction}</h3>
            </div>
          </div>
          <div className="kpi-item">
            <div className="kpi-icon amber"><Percent size={18} /></div>
            <div className="kpi-meta">
              <p>Waste %</p>
              <h3>{wastePercentage}%</h3>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="charts-grid">
        <Card className="analytics-card chart-card">
          <div className="chart-header">
            <h4>Production & Waste Over Time</h4>
          </div>
          <div className="chart-body h-320">
            {hasLineChartData ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="empty-state small"><p>No time-series data for these filters.</p></div>
            )}
          </div>
        </Card>

        <Card className="analytics-card chart-card">
          <div className="chart-header">
            <h4>Product Mix Breakdown</h4>
          </div>
          <div className="chart-body h-320">
            {hasPieChartData ? (
              <Pie data={pieChartData} />
            ) : (
              <div className="empty-state small"><p>No product mix data for these filters.</p></div>
            )}
          </div>
        </Card>

        <Card className="analytics-card chart-card">
          <div className="chart-header">
            <h4>Waste by Product</h4>
          </div>
          <div className="chart-body h-320">
            {hasWasteBarChartData ? (
              <Bar data={wasteBarChartData} />
            ) : (
              <div className="empty-state small"><p>No waste data for these filters.</p></div>
            )}
          </div>
        </Card>

        <Card className="analytics-card chart-card">
          <div className="chart-header">
            <h4>Production by Shift</h4>
          </div>
          <div className="chart-body h-320">
            {hasShiftBarChartData ? (
              <Bar data={shiftBarChartData} />
            ) : (
              <div className="empty-state small"><p>No shift production data for these filters.</p></div>
            )}
          </div>
        </Card>

        <Card className="analytics-card chart-card">
          <div className="chart-header">
            <h4>Production by Baker</h4>
          </div>
          <div className="chart-body h-320">
            {hasBakerBarChartData ? (
              <Bar data={bakerBarChartData} />
            ) : (
              <div className="empty-state small"><p>No baker production data for these filters.</p></div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProductionAnalytics;
