// src/pages/SalesOutPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import useAuth from '../hooks/useAuth';
import {
  Building2,
  Truck,
  FileText,
  Search,
  Package,
  Phone,
  User2,
  RefreshCcw,
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomToast from '../components/CustomToast';
import '../styles/salesOut.css';

const API_BASE_URL = 'http://localhost:5000/api';

const getCashierIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.id;
  } catch {
    return null;
  }
};

const SalesOutPage = () => {
  const [inventory, setInventory] = useState({});
  const [salesOutData, setSalesOutData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [note, setNote] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhoneNumber, setNewDriverPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();

  // Load all data
  const fetchAllData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);   // show spinner only when not silent
    setError('');
    try {
      const [productsRes, inventoryRes, branchesRes, driversRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/products`),
        axios.get(`${API_BASE_URL}/inventory`),
        axios.get(`${API_BASE_URL}/branches`),
        axios.get(`${API_BASE_URL}/drivers`),
      ]);

      const products = productsRes.data || [];
      const activeProducts = products.filter((p) => p.is_active);

      setBranches(branchesRes.data || []);
      setDrivers(driversRes.data || []);
      if ((branchesRes.data || []).length > 0) {
        setSelectedBranch(branchesRes.data[0].id);
      }

      const inventoryMap = (inventoryRes.data || []).reduce((map, item) => {
        map[item.product_id] = item.quantity;
        return map;
      }, {});
      setInventory(inventoryMap);

      setSalesOutData(
        activeProducts.map((p) => ({
          ...p,
          quantity: 0,
        }))
      );

      if (!silent) {
        toast(<CustomToast type="success" message="Data refreshed" />);
      }
    } catch (err) {
      setError('Failed to load data for sales out.');
      toast(<CustomToast type="error" message="Failed to load sales out data." />);
      console.error(err);
    } finally {
      setLoading(false);   // ✅ always stop loading
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAllData({ silent: true });
  }, [isAuthenticated]);

  // Update driver inputs when selection changes
  useEffect(() => {
    if (selectedDriver === 'new') {
      setNewDriverName('');
      setNewDriverPhoneNumber('');
      return;
    }
    const driver = drivers.find((d) => d.id === parseInt(selectedDriver));
    if (driver) {
      setNewDriverName(driver.name);
      setNewDriverPhoneNumber(driver.phone_number);
    } else {
      setNewDriverName('');
      setNewDriverPhoneNumber('');
    }
  }, [selectedDriver, drivers]);

  const handleQuantityChange = (productId, newQuantity) => {
    const qty = Math.max(0, parseInt(newQuantity, 10) || 0);
    const stock = inventory[productId] || 0;

    if (qty > stock) {
      toast(<CustomToast type="warning" message={`Cannot sell more than available stock (${stock}).`} />);
      return;
    }

    setSalesOutData((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleSalesOut = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedBranch) {
      return toast(<CustomToast type="error" message="Please select a branch." />);
    }
    if (!selectedDriver) {
      return toast(<CustomToast type="warning" message="Please select a driver or add a new one." />);
    }
    if (selectedDriver === 'new' && (!newDriverName || !newDriverPhoneNumber)) {
      return toast(<CustomToast type="warning" message="Enter name and phone for the new driver." />);
    }

    const itemsToSell = salesOutData.filter((i) => i.quantity > 0);
    if (itemsToSell.length === 0) {
      return toast(<CustomToast type="info" message="Add quantities to sell." />);
    }

    const cashierId = getCashierIdFromToken();
    if (!cashierId) {
      return toast(<CustomToast type="error" message="You must be logged in." />);
    }

    toast(<CustomToast type="info" message="Submitting sale…" />);

    try {
      const response = await axios.post(`${API_BASE_URL}/sales/b2b`, {
        items: itemsToSell,
        cashierId,
        branchId: parseInt(selectedBranch),
        note,
        driverId: selectedDriver === 'new' ? null : parseInt(selectedDriver),
        driverName: newDriverName,
        driverPhoneNumber: newDriverPhoneNumber,
      });

      const successMsg = response?.data?.message || 'Bulk sale recorded successfully.';
      toast(<CustomToast type="success" message={successMsg} />);

      // Reset fields
      setNote('');
      setSelectedDriver('');
      setNewDriverName('');
      setNewDriverPhoneNumber('');
      setSalesOutData((prev) => prev.map((p) => ({ ...p, quantity: 0 })));

      // Silent refresh (keeps toast visible)
      fetchAllData({ silent: true });
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.details ||
        err.message ||
        'Failed to record bulk sale.';
      toast(<CustomToast type="error" message={errorMsg} />);
      console.error('Sale error:', err);
    }
  };

  const filteredProducts = salesOutData.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    // Keep ToastContainer mounted even during spinner render
    return (
      <div className="sop-center">
        <ToastContainer position="top-right" autoClose={3000} icon={false} />
        <div className="sop-spinner" />
        <div className="sop-muted mt-2">Loading sales out data…</div>
      </div>
    );
  }

  return (
    <div className="sop-page">
      <ToastContainer position="top-right" autoClose={3000} icon={false} />

      {error && <div className="sop-alert sop-alert--danger">{error}</div>}

      <div className="sop-card">
        <div className="sop-card__header">
          <div className="sop-title">
            <Package />
            <h2>Record Bulk Sale (to another branch)</h2>
          </div>
          <button type="button" className="sop-btn sop-btn--ghost" onClick={() => fetchAllData()}>
            <RefreshCcw />
            Refresh
          </button>
        </div>

        <div className="sop-card__body">
          <form onSubmit={handleSalesOut}>
            {/* Top Grid */}
            <div className="sop-grid sop-grid--4">
              <div className="sop-field">
                <label className="sop-label">
                  <Building2 /> Branch
                </label>
                <div className="sop-input">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(parseInt(e.target.value))}
                    required
                  >
                    <option value="">-- Select a Branch --</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sop-field">
                <label className="sop-label">
                  <Truck /> Driver
                </label>
                <div className="sop-input">
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    required
                  >
                    <option value="">-- Select or Add New --</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.phone_number})
                      </option>
                    ))}
                    <option value="new">Add New Driver</option>
                  </select>
                </div>
              </div>

              <div className="sop-field">
                <label className="sop-label">
                  <User2 /> New Driver Name
                </label>
                <div className="sop-input">
                  <input
                    type="text"
                    placeholder="Enter driver's name"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    disabled={selectedDriver !== 'new'}
                    required={selectedDriver === 'new'}
                  />
                </div>
              </div>

              <div className="sop-field">
                <label className="sop-label">
                  <Phone /> New Driver Phone
                </label>
                <div className="sop-input">
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={newDriverPhoneNumber}
                    onChange={(e) => setNewDriverPhoneNumber(e.target.value)}
                    disabled={selectedDriver !== 'new'}
                    required={selectedDriver === 'new'}
                  />
                </div>
              </div>

              <div className="sop-field sop-field--full">
                <label className="sop-label">
                  <FileText /> Note (optional)
                </label>
                <div className="sop-input">
                  <input
                    type="text"
                    placeholder="e.g., Monthly restock"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="sop-section-title">
              <Package />
              <span>Items to Sell</span>
            </div>

            <div className="sop-filterbar">
              <div className="sop-input sop-input--icon">
                <Search className="sop-input__icon" />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Table (desktop / tablet) */}
            <div className="sop-table-wrapper">
              <table className="sop-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Available</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img
                          src={product.image_url || 'https://via.placeholder.com/56'}
                          alt={product.name}
                          className="sop-thumb"
                        />
                      </td>
                      <td className="sop-ellipsis">{product.name}</td>
                      <td className="sop-ellipsis">{product.category}</td>
                      <td className="sop-num">{inventory[product.id] || 0}</td>
                      <td className="sop-qty">
                        <input
                          type="number"
                          min="0"
                          max={inventory[product.id] || 0}
                          value={salesOutData.find((i) => i.id === product.id)?.quantity || 0}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (mobile) */}
            <div className="sop-cards">
              {filteredProducts.map((item) => (
                <div className="sop-card-row" key={item.id}>
                  <div className="sop-card-row__head">
                    <img
                      src={item.image_url || 'https://via.placeholder.com/56'}
                      alt={item.name}
                      className="sop-thumb"
                    />
                    <div className="sop-card-row__title">
                      <div className="sop-name">{item.name}</div>
                      <div className="sop-muted">{item.category || '—'}</div>
                    </div>
                  </div>
                  <div className="sop-card-row__body">
                    <div className="sop-tag">In stock: {inventory[item.id] || 0}</div>
                    <div className="sop-input">
                      <input
                        type="number"
                        min="0"
                        max={inventory[item.id] || 0}
                        value={salesOutData.find((i) => i.id === item.id)?.quantity || 0}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="sop-btn sop-btn--primary sop-btn--block mt-16">
              Record Bulk Sale Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalesOutPage;
