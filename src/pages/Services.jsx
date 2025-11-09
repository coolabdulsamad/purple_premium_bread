import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ToggleOn as ActiveIcon,
  ToggleOff as InactiveIcon,
  Build as BuildIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const Services = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchServices();
  }, [filter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/services`;
      
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      showSnackbar('Error fetching services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        rate: service.rate.toString(),
        is_active: service.is_active
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        rate: '',
        is_active: true
      });
    }
    setErrors({});
    setOpenDialog(true);
    setMobileMenuOpen(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
    setFormData({
      name: '',
      rate: '',
      is_active: true
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      newErrors.rate = 'Valid rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      let response;

      const submitData = {
        ...formData,
        rate: parseFloat(formData.rate)
      };

      if (selectedService) {
        response = await axios.put(
          `${API_BASE_URL}/services/${selectedService.id}`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/services`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        showSnackbar(
          selectedService ? 'Service updated successfully' : 'Service created successfully'
        );
        fetchServices();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error saving service:', error);
      const message = error.response?.data?.message || 'Error saving service';
      showSnackbar(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/services/${service.id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showSnackbar(response.data.message);
        fetchServices();
      }
      setMobileMenuOpen(null);
    } catch (error) {
      console.error('Error toggling service status:', error);
      showSnackbar('Error updating service status', 'error');
    }
  };

  const handleOpenDeleteDialog = (service) => {
    setSelectedService(service);
    setOpenDeleteDialog(true);
    setMobileMenuOpen(null);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedService(null);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_BASE_URL}/services/${selectedService.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showSnackbar('Service deleted successfully');
        fetchServices();
        handleCloseDeleteDialog();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      const message = error.response?.data?.message || 'Error deleting service';
      showSnackbar(message, 'error');
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setFilter('all');
  };

  const handleMobileMenuOpen = (event, service) => {
    setMobileMenuOpen(service?.id || 'new');
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(null);
  };

  // Mobile Card View
  const ServiceCard = ({ service, index }) => (
    <div className="sm-service-card">
      <div className="sm-service-card__header">
        <div className="sm-service-card__title">
          <h4>{service.name}</h4>
          <span className={`sm-badge ${service.is_active ? 'sm-badge--success' : 'sm-badge--danger'}`}>
            {service.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
        <button 
          className="sm-service-card__menu"
          onClick={(e) => handleMobileMenuOpen(e, service)}
        >
          <MoreIcon />
        </button>
      </div>
      
      <div className="sm-service-card__content">
        <div className="sm-service-card__row">
          <span>Rate:</span>
          <strong>${parseFloat(service.rate).toFixed(2)}</strong>
        </div>
        <div className="sm-service-card__row">
          <span>Created:</span>
          <span>{formatDate(service.created_at)}</span>
        </div>
        <div className="sm-service-card__row">
          <span>Updated:</span>
          <span>{formatDate(service.updated_at)}</span>
        </div>
      </div>

      {mobileMenuOpen === service.id && (
        <div className="sm-mobile-menu">
          <button 
            className="sm-mobile-menu__item"
            onClick={() => handleOpenDialog(service)}
          >
            <EditIcon />
            Edit Service
          </button>
          <button 
            className="sm-mobile-menu__item"
            onClick={() => handleToggleStatus(service)}
          >
            {service.is_active ? <InactiveIcon /> : <ActiveIcon />}
            {service.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button 
            className="sm-mobile-menu__item sm-mobile-menu__item--danger"
            onClick={() => handleOpenDeleteDialog(service)}
          >
            <DeleteIcon />
            Delete
          </button>
          <button 
            className="sm-mobile-menu__item"
            onClick={handleMobileMenuClose}
          >
            <ClearIcon />
            Close
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="sm-page">
      {/* Header Section */}
      <div className="sm-header">
        <div className="sm-header-content">
          <h1 className="sm-title">
            <BuildIcon className="sm-title-icon" />
            Services Management
          </h1>
          <p className="sm-subtitle">
            Manage your services, rates, and availability
          </p>
        </div>
        <div className="sm-header-actions">
          {!isSmallMobile && (
            <button
              className="sm-btn sm-btn--ghost sm-btn--icon"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <FilterIcon className="sm-btn-icon" />
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
          )}
          <button
            className="sm-btn sm-btn--primary"
            onClick={() => handleOpenDialog()}
          >
            <AddIcon />
            {isSmallMobile ? 'Add' : 'Add New Service'}
          </button>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      {isMobile && (
        <div className="sm-mobile-filter-toggle">
          <button
            className="sm-btn sm-btn--outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <FilterIcon />
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      )}

      {/* Filters Card */}
      {filtersOpen && (
        <div className="sm-card">
          <div className="sm-card__header">
            <div className="sm-card__title">
              <FilterIcon />
              Service Filters
            </div>
            <span className="sm-badge sm-badge--secondary">{services.length} services</span>
          </div>
          <div className="sm-card__body">
            <div className="sm-filters-grid">
              <div className="sm-field">
                <label className="sm-label">Status Filter</label>
                <div className="sm-input">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="sm-input__field"
                  >
                    <option value="all">All Services</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              <div className="sm-field sm-field--actions">
                <button
                  className="sm-btn sm-btn--ghost"
                  onClick={clearFilters}
                >
                  <ClearIcon />
                  Clear Filters
                </button>
                <button
                  className="sm-btn sm-btn--primary"
                  onClick={fetchServices}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Table/Card */}
      <div className="sm-card">
        <div className="sm-card__header">
          <div className="sm-card__title">
            <BuildIcon />
            Services List
          </div>
          {!isMobile && (
            <div className="sm-header-badges">
              <span className="sm-badge sm-badge--primary">{services.length} Services</span>
            </div>
          )}
        </div>
        <div className="sm-card__body">
          {loading ? (
            <div className="sm-loading">
              <div className="sm-spinner"></div>
              <div className="sm-loading-text">Loading services...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="sm-empty-state">
              <BuildIcon className="sm-empty-icon" />
              <h3>No Services Found</h3>
              <p>No services found matching your filters.</p>
              <button 
                className="sm-btn sm-btn--primary"
                onClick={() => handleOpenDialog()}
              >
                <AddIcon />
                Add Your First Service
              </button>
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="sm-services-grid">
              {services.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="sm-table-container">
              <table className="sm-table">
                <thead className="sm-table__head">
                  <tr>
                    <th className="sm-table__cell sm-table__cell--header">S/N</th>
                    <th className="sm-table__cell sm-table__cell--header">Service Name</th>
                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Rate ($)</th>
                    <th className="sm-table__cell sm-table__cell--header">Status</th>
                    <th className="sm-table__cell sm-table__cell--header">Created Date</th>
                    <th className="sm-table__cell sm-table__cell--header">Updated Date</th>
                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--actions">Actions</th>
                  </tr>
                </thead>
                <tbody className="sm-table__body">
                  {services.map((service, index) => (
                    <tr key={service.id} className="sm-table__row">
                      <td className="sm-table__cell sm-table__cell--index">{index + 1}</td>
                      <td className="sm-table__cell sm-table__cell--staff">
                        <div className="sm-staff-info">
                          <strong>{service.name}</strong>
                        </div>
                      </td>
                      <td className="sm-table__cell sm-table__cell--amount">
                        <strong>${parseFloat(service.rate).toFixed(2)}</strong>
                      </td>
                      <td className="sm-table__cell">
                        <span className={`sm-badge ${service.is_active ? 'sm-badge--success' : 'sm-badge--danger'}`}>
                          {service.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="sm-table__cell sm-table__cell--date">
                        {formatDate(service.created_at)}
                      </td>
                      <td className="sm-table__cell sm-table__cell--date">
                        {formatDate(service.updated_at)}
                      </td>
                      <td className="sm-table__cell sm-table__cell--actions">
                        <div className="sm-actions">
                          <button
                            className="sm-action-btn sm-action-btn--edit"
                            onClick={() => handleOpenDialog(service)}
                            title="Edit Service"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={`sm-action-btn ${service.is_active ? 'sm-action-btn--warning' : 'sm-action-btn--success'}`}
                            onClick={() => handleToggleStatus(service)}
                            title={service.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {service.is_active ? <InactiveIcon /> : <ActiveIcon />}
                          </button>
                          <button
                            className="sm-action-btn sm-action-btn--danger"
                            onClick={() => handleOpenDeleteDialog(service)}
                            title="Delete Service"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {openDialog && (
        <div className="sm-modal">
          <div className={`sm-modal__content ${isMobile ? 'sm-modal__content--mobile' : ''}`}>
            <div className="sm-modal__header">
              <h3 className="sm-modal__title">
                <BuildIcon className="sm-modal__icon" />
                {selectedService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button className="sm-modal__close" onClick={handleCloseDialog}>
                <ClearIcon />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="sm-modal__body">
                <div className="sm-form-grid">
                  <div className="sm-field sm-field--full">
                    <label className="sm-label">Service Name *</label>
                    <div className="sm-input">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter service name"
                        className="sm-input__field"
                        required
                      />
                    </div>
                    {errors.name && <div className="sm-input-error">{errors.name}</div>}
                  </div>

                  <div className="sm-field">
                    <label className="sm-label">Rate ($) *</label>
                    <div className="sm-input">
                      <input
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="sm-input__field"
                        required
                      />
                    </div>
                    {errors.rate && <div className="sm-input-error">{errors.rate}</div>}
                  </div>

                  <div className="sm-field">
                    <label className="sm-label">Status</label>
                    <div className="sm-status-toggle">
                      <label className="sm-toggle">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="sm-toggle-input"
                        />
                        <span className="sm-toggle-slider"></span>
                        <span className="sm-toggle-label">
                          {formData.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="sm-field sm-field--full">
                    <div className="sm-summary-card">
                      <div className="sm-summary-card__header">
                        <h6>Service Summary</h6>
                      </div>
                      <div className="sm-summary-card__body">
                        <div className="sm-summary-grid">
                          <div className="sm-summary-item">
                            <span className="sm-summary-label">Service Name:</span>
                            <span className="sm-summary-value">{formData.name || 'N/A'}</span>
                          </div>
                          <div className="sm-summary-item">
                            <span className="sm-summary-label">Rate:</span>
                            <span className="sm-summary-value">${parseFloat(formData.rate || 0).toFixed(2)}</span>
                          </div>
                          <div className="sm-summary-item">
                            <span className="sm-summary-label">Status:</span>
                            <span className={`sm-summary-value ${formData.is_active ? 'sm-summary-value--positive' : 'sm-summary-value--negative'}`}>
                              {formData.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm-modal__footer">
                <button 
                  className="sm-btn sm-btn--ghost" 
                  type="button" 
                  onClick={handleCloseDialog}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  className="sm-btn sm-btn--primary" 
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="sm-spinner sm-spinner--small"></div>
                      {selectedService ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    selectedService ? 'Update Service' : 'Create Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {openDeleteDialog && (
        <div className="sm-modal sm-modal--confirm">
          <div className={`sm-modal__content sm-modal__content--confirm ${isMobile ? 'sm-modal__content--mobile' : ''}`}>
            <div className="sm-modal__header">
              <h3 className="sm-modal__title">
                <DeleteIcon className="sm-modal__icon sm-modal__icon--warning" />
                Confirm Delete
              </h3>
              <button className="sm-modal__close" onClick={handleCloseDeleteDialog}>
                <ClearIcon />
              </button>
            </div>
            <div className="sm-modal__body">
              <div className="sm-confirm-content">
                <p className="sm-confirm-message">
                  Are you sure you want to delete the service <strong>"{selectedService?.name}"</strong>?
                </p>
                <div className="sm-confirm-details">
                  <p><strong>Service Details:</strong></p>
                  <p>Name: {selectedService?.name}</p>
                  <p>Rate: ${parseFloat(selectedService?.rate || 0).toFixed(2)}</p>
                  <p>Status: {selectedService?.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="sm-confirm-note">
                  <span>This action cannot be undone.</span>
                </div>
              </div>
            </div>
            <div className="sm-modal__footer">
              <button 
                className="sm-btn sm-btn--ghost" 
                onClick={handleCloseDeleteDialog}
              >
                Cancel
              </button>
              <button 
                className="sm-btn sm-btn--danger" 
                onClick={handleDelete}
              >
                <DeleteIcon />
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ 
          vertical: isMobile ? 'top' : 'bottom', 
          horizontal: 'center' 
        }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            borderRadius: 2,
            fontWeight: 'medium',
            width: isMobile ? '90vw' : 'auto'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Services;