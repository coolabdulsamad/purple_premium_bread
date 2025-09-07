// components/WasteStock.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaPlus, FaTimes, FaSave, FaTrash, FaSpinner, FaList, 
  FaCubes, FaDollarSign, FaInbox, FaChevronLeft, FaChevronRight,
  FaSearch, FaFilter, FaEdit, FaUndo
} from 'react-icons/fa';
import CustomToast from '../components/CustomToast';
import CustomDialog from '../components/CustomDialog';
import '../assets/styles/WasteStock.css';

const WasteStock = () => {
  const [wasteRecords, setWasteRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    recordId: null,
    recordName: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    reason: '',
    dateFrom: '',
    dateTo: '',
    minQuantity: '',
    maxQuantity: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // API base URL - adjust this based on your environment
  // const API_BASE = process.env.REACT_APP_API_BASE || '';
  const API_BASE = "https://purple-premium-bread-backend.onrender.com/api";

  // Fetch waste records, products, and inventory
  useEffect(() => {
    fetchWasteRecords();
    fetchProducts();
    fetchInventory();
  }, []);

  // Apply filters and search whenever records or filter criteria change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [wasteRecords, searchTerm, filters]);

  const showToast = (message, type = 'info') => {
    toast(<CustomToast 
      id={`waste-${type}-${Date.now()}`} 
      type={type} 
      message={message} 
      onClose={() => toast.dismiss()}
    />, {
      toastId: `waste-${type}`
    });
  };

  const fetchWasteRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/waste-stock`);
      if (!response.ok) throw new Error('Failed to fetch waste records');
      const data = await response.json();
      setWasteRecords(data);
    } catch (err) {
      showToast('Failed to load waste records.', 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      showToast('Failed to load products.', 'error');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE}/inventory`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      showToast('Failed to load inventory data.', 'error');
    }
  };

const handleApiError = (error, defaultMessage) => {
  console.error('API Error details:', error);
  
  // Check if it's a response error with data
  if (error.response) {
    const { data, status } = error.response;
    
    if (status === 500) {
      return 'Server error: Please check if all required data is available (products, inventory, users)';
    }
    
    if (data) {
      if (typeof data === 'object') {
        return data.error || data.details || data.message || defaultMessage;
      }
      return data || defaultMessage;
    }
    
    return `HTTP Error ${status}: ${defaultMessage}`;
  }
  
  // Check if it's a simple error with a message
  if (error.message) {
    return error.message;
  }
  
  // Return the default message as fallback
  return defaultMessage;
};

  const getProductStock = (productId) => {
    // Find the inventory record for this product
    const inventoryItem = inventory.find(item => item.product_id === parseInt(productId));
    return inventoryItem ? inventoryItem.quantity : 0;
  };

  const applyFiltersAndSearch = () => {
    let result = [...wasteRecords];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(record => 
        record.product_name.toLowerCase().includes(term) ||
        (record.reason && record.reason.toLowerCase().includes(term)) ||
        (record.notes && record.notes.toLowerCase().includes(term)) ||
        (record.recorded_by_name && record.recorded_by_name.toLowerCase().includes(term))
      );
    }

    // Apply reason filter
    if (filters.reason) {
      result = result.filter(record => record.reason === filters.reason);
    }

    // Apply quantity filters
    if (filters.minQuantity) {
      result = result.filter(record => record.quantity >= parseInt(filters.minQuantity));
    }
    if (filters.maxQuantity) {
      result = result.filter(record => record.quantity <= parseInt(filters.maxQuantity));
    }

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(record => new Date(record.date_recorded) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of the day
      result = result.filter(record => new Date(record.date_recorded) <= toDate);
    }

    setFilteredRecords(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'product_id') {
      const stock = getProductStock(value);
      const product = products.find(p => p.id === parseInt(value));
      setSelectedProduct({ ...product, currentStock: stock });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      reason: '',
      dateFrom: '',
      dateTo: '',
      minQuantity: '',
      maxQuantity: ''
    });
  };

// components/WasteStock.jsx
// ... all your imports remain unchanged ...

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const url = editMode 
      ? `${API_BASE}/waste-stock/${editId}`
      : `${API_BASE}/waste-stock`;
    
    const method = editMode ? 'PUT' : 'POST';

    // ensure numeric values
    const payload = {
      ...formData,
      product_id: parseInt(formData.product_id, 10),
      quantity: parseInt(formData.quantity, 10),
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || data.details || 'Request failed');
      error.response = { data, status: response.status };
      throw error;
    }

    // success → reset form
    setFormData({ product_id: '', quantity: '', reason: '', notes: '' });
    setSelectedProduct(null);
    setShowForm(false);
    setEditMode(false);
    setEditId(null);

    fetchWasteRecords();
    fetchInventory();
    showToast(`Waste record ${editMode ? 'updated' : 'added'} successfully!`, 'success');
  } catch (err) {
    console.error('Full error details:', err);
    const errorMessage = handleApiError(err, `Failed to ${editMode ? 'update' : 'add'} waste record`);
    showToast(errorMessage, 'error');
  } finally {
    setLoading(false);
  }
};


  const openDeleteDialog = (id, productName) => {
    setDeleteDialog({
      isOpen: true,
      recordId: id,
      recordName: productName
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      recordId: null,
      recordName: ''
    });
  };

  const handleDelete = async () => {
    const { recordId } = deleteDialog;
    
    try {
      const response = await fetch(`${API_BASE}/waste-stock/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete waste record');

      // Refresh data
      fetchWasteRecords();
      fetchInventory(); // Refresh inventory data
      showToast('Waste record deleted successfully!', 'success');
    } catch (err) {
      showToast('Failed to delete waste record.', 'error');
    } finally {
      closeDeleteDialog();
    }
  };

  const handleEdit = (record) => {
    setFormData({
      product_id: record.product_id.toString(),
      quantity: record.quantity.toString(),
      reason: record.reason || '',
      notes: record.notes || ''
    });
    
    const product = products.find(p => p.id === record.product_id);
    if (product) {
      const stock = getProductStock(record.product_id) + record.quantity; // Add back the wasted quantity for editing
      setSelectedProduct({ ...product, currentStock: stock });
    }
    
    setEditMode(true);
    setEditId(record.id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setFormData({
      product_id: '',
      quantity: '',
      reason: '',
      notes: ''
    });
    setSelectedProduct(null);
    setEditMode(false);
    setEditId(null);
    setShowForm(false);
  };

  // Get unique reasons for filter dropdown
  const uniqueReasons = [...new Set(wasteRecords.map(record => record.reason).filter(Boolean))];

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalWasteValue = filteredRecords.reduce((total, record) => {
    return total + (record.quantity * (record.price || 0));
  }, 0);

  const totalWasteQuantity = filteredRecords.reduce((total, record) => {
    return total + record.quantity;
  }, 0);

  const totalFilteredRecords = filteredRecords.length;

  return (
    <div className="waste-stock-container">
      <CustomDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the waste record for "${deleteDialog.recordName}"? This action cannot be undone.`}
      />

      <div className="waste-stock-header">
        <h1>Waste Stock Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            if (editMode) cancelEdit();
            setShowForm(!showForm);
          }}
        >
          {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Add Waste Record</>}
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by product, reason, notes, or recorded by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button 
          className="btn btn-secondary filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {(searchTerm || Object.values(filters).some(val => val)) && (
          <button 
            className="btn btn-secondary reset-filters"
            onClick={resetFilters}
          >
            <FaUndo /> Reset Filters
          </button>
        )}
      </div>

      {showFilters && (
        <div className="filters-panel">
          <h3>Filter Records</h3>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Reason</label>
              <select
                name="reason"
                value={filters.reason}
                onChange={handleFilterChange}
              >
                <option value="">All Reasons</option>
                {uniqueReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Quantity From</label>
              <input
                type="number"
                name="minQuantity"
                value={filters.minQuantity}
                onChange={handleFilterChange}
                min="0"
                placeholder="Min quantity"
              />
            </div>

            <div className="filter-group">
              <label>Quantity To</label>
              <input
                type="number"
                name="maxQuantity"
                value={filters.maxQuantity}
                onChange={handleFilterChange}
                min="0"
                placeholder="Max quantity"
              />
            </div>

            <div className="filter-group">
              <label>Date From</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Date To</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="waste-form-container">
          <h2>{editMode ? 'Edit Waste Record' : 'Add Waste Record'}</h2>
          <form onSubmit={handleSubmit} className="waste-form">
            <div className="form-group">
              <label htmlFor="product_id">Product *</label>
              <select
                id="product_id"
                name="product_id"
                value={formData.product_id}
                onChange={handleInputChange}
                required
                disabled={editMode} // Disable product selection in edit mode
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="stock-info">
                <p>Current Stock: <span className={selectedProduct.currentStock === 0 ? 'stock-danger' : 'stock-ok'}>
                  {selectedProduct.currentStock} units
                </span></p>
                {selectedProduct.currentStock === 0 && (
                  <p className="stock-warning">This product is out of stock!</p>
                )}
                {editMode && (
                  <p className="edit-note">Note: Editing will adjust inventory accordingly</p>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                max={selectedProduct ? selectedProduct.currentStock : undefined}
                required
                disabled={selectedProduct && selectedProduct.currentStock === 0}
              />
              {selectedProduct && (
                <div className="input-hint">
                  Max: {selectedProduct.currentStock} units available
                  {selectedProduct.currentStock === 0 && ' (Out of stock)'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason</label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
              >
                <option value="">Select a reason</option>
                <option value="expired">Expired</option>
                <option value="damaged">Damaged</option>
                <option value="overproduction">Overproduction</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                placeholder="Additional details about the waste..."
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={editMode ? cancelEdit : () => setShowForm(false)}
              >
                <FaTimes /> Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || (selectedProduct && selectedProduct.currentStock === 0)}
                className="btn btn-primary"
              >
                {loading ? (
                  <><FaSpinner className="spinner" /> {editMode ? 'Updating...' : 'Adding...'}</>
                ) : (
                  <><FaSave /> {editMode ? 'Update Waste Record' : 'Add Waste Record'}</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="waste-summary">
        <h2>Waste Summary</h2>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon">
              <FaList />
            </div>
            <div className="summary-content">
              <h3>Filtered Records</h3>
              <p>{totalFilteredRecords} of {wasteRecords.length}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <FaCubes />
            </div>
            <div className="summary-content">
              <h3>Total Waste Quantity</h3>
              <p>{totalWasteQuantity} units</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <FaDollarSign />
            </div>
            <div className="summary-content">
              <h3>Total Waste Value</h3>
              <p>${totalWasteValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="waste-records">
        <div className="section-header">
          <h2>Waste Records</h2>
          <div className="records-count">{totalFilteredRecords} records</div>
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            <FaInbox />
            <h3>No waste records found</h3>
            <p>{wasteRecords.length === 0 
              ? 'Get started by adding your first waste record' 
              : 'Try adjusting your search or filters'}</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <FaPlus /> Add Waste Record
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="waste-table">
                <thead>
                  <tr>
                    <th className="sn-column">S/N</th>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Value</th>
                    <th>Reason</th>
                    <th>Note</th>
                    <th>Recorded By</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record, index) => {
                    const serialNumber = indexOfFirstRecord + index + 1;
                    return (
                      <tr key={record.id}>
                        <td data-label="S/N" className="sn-column">{serialNumber}</td>
                        <td data-label="Date">{new Date(record.date_recorded).toLocaleDateString()}</td>
                        <td data-label="Product">{record.product_name}</td>
                        <td data-label="Quantity">{record.quantity}</td>
                        <td data-label="Unit Price">&#8358;{record.price}</td>
                        <td data-label="Total Value">&#8358;{(record.quantity * record.price).toFixed(2)}</td>
                        <td data-label="Reason">
                          <span className={`reason-badge reason-${record.reason || 'other'}`}>
                            {record.reason || 'Not specified'}
                          </span>
                        </td>
                        <td data-label="Notes">{record.notes}</td>
                        <td data-label="Recorded By">{record.recorded_by_name || 'System'}</td>
                        <td data-label="Actions" className="actions-column">
                          <div className="action-buttons">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleEdit(record)}
                              title="Edit record"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => openDeleteDialog(record.id, record.product_name)}
                              title="Delete record"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => paginate(currentPage - 1)}
                >
                  <FaChevronLeft /> Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      className={`btn btn-sm ${currentPage === number ? 'btn-primary' : ''}`}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="btn btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => paginate(currentPage + 1)}
                >
                  Next <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WasteStock;