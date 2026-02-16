// src/pages/RegisterRider.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FaMotorcycle,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaIdCard,
    FaCreditCard,
    FaDollarSign,
    FaCalendarAlt,
    FaUpload,
    FaTimes,
    FaPlus,
    FaCheckCircle,
    FaExclamationTriangle,
    FaArrowLeft,
    FaSave,
    FaImage,
    FaArrowRight,
    FaArrowLeft as FaArrowLeftIcon
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/registerRider.css';
import CustomToast from '../components/CustomToast';
import useAuth from '../hooks/useAuth';
import api from '../api/axiosInstance';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const RegisterRider = () => {
    const { id } = useParams(); // For editing existing rider
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('personal'); // personal, guarantor1, guarantor2, credit

    // Form data state
    const [formData, setFormData] = useState({
        // Personal Information
        fullname: '',
        phone_number: '',
        email: '',
        address: '',
        date_of_birth: '',
        id_type: '',
        id_number: '',
        id_image: null,
        profile_image: null,

        // Guarantor 1
        guarantor1_name: '',
        guarantor1_phone: '',
        guarantor1_address: '',
        guarantor1_relationship: '',
        guarantor1_id_type: '',
        guarantor1_id_number: '',
        guarantor1_id_image: null,

        // Guarantor 2 (Optional)
        guarantor2_name: '',
        guarantor2_phone: '',
        guarantor2_address: '',
        guarantor2_relationship: '',
        guarantor2_id_type: '',
        guarantor2_id_number: '',
        guarantor2_id_image: null,

        // Credit & Payment Settings
        credit_limit: '',
        payment_terms: 'weekly',
        default_payment_method: 'Cash',
        notes: '',

        // Product-specific pricing
        product_prices: []
    });

    // Product pricing states
    const [products, setProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [showProductPriceForm, setShowProductPriceForm] = useState(false);

    // Image previews
    const [imagePreviews, setImagePreviews] = useState({
        profile_image: null,
        id_image: null,
        guarantor1_id_image: null,
        guarantor2_id_image: null
    });

    // Validation errors per tab
    const [tabErrors, setTabErrors] = useState({
        personal: [],
        guarantor1: [],
        guarantor2: [],
        credit: []
    });

    // Fetch products for pricing
    useEffect(() => {
        fetchProducts();
        if (id) {
            fetchRiderDetails();
        }
    }, [id]);

    // Update available products when product_prices changes
    useEffect(() => {
        if (products.length > 0) {
            const addedProductIds = formData.product_prices.map(pp => pp.product_id);
            const available = products.filter(p => !addedProductIds.includes(p.id));
            setAvailableProducts(available);
        }
    }, [products, formData.product_prices]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
            toast(<CustomToast id={`error-products-${Date.now()}`} type="error" message="Failed to load products" />);
        }
    };

    const fetchRiderDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/riders/${id}`);
            const riderData = response.data;

            // Convert stored JSON to form data
            setFormData({
                fullname: riderData.fullname || '',
                phone_number: riderData.phone_number || '',
                email: riderData.email || '',
                address: riderData.address || '',
                date_of_birth: riderData.date_of_birth || '',
                id_type: riderData.id_type || '',
                id_number: riderData.id_number || '',
                id_image: null,
                profile_image: null,

                guarantor1_name: riderData.guarantor1_name || '',
                guarantor1_phone: riderData.guarantor1_phone || '',
                guarantor1_address: riderData.guarantor1_address || '',
                guarantor1_relationship: riderData.guarantor1_relationship || '',
                guarantor1_id_type: riderData.guarantor1_id_type || '',
                guarantor1_id_number: riderData.guarantor1_id_number || '',
                guarantor1_id_image: null,

                guarantor2_name: riderData.guarantor2_name || '',
                guarantor2_phone: riderData.guarantor2_phone || '',
                guarantor2_address: riderData.guarantor2_address || '',
                guarantor2_relationship: riderData.guarantor2_relationship || '',
                guarantor2_id_type: riderData.guarantor2_id_type || '',
                guarantor2_id_number: riderData.guarantor2_id_number || '',
                guarantor2_id_image: null,

                credit_limit: riderData.credit_limit || '',
                payment_terms: riderData.payment_terms || 'weekly',
                default_payment_method: riderData.default_payment_method || 'Cash',
                notes: riderData.notes || '',

                product_prices: riderData.rider_product_prices || []
            });

            // Set image previews if URLs exist
            if (riderData.profile_image_url) {
                setImagePreviews(prev => ({ ...prev, profile_image: riderData.profile_image_url }));
            }
            if (riderData.id_image_url) {
                setImagePreviews(prev => ({ ...prev, id_image: riderData.id_image_url }));
            }
            if (riderData.guarantor1_id_image_url) {
                setImagePreviews(prev => ({ ...prev, guarantor1_id_image: riderData.guarantor1_id_image_url }));
            }
            if (riderData.guarantor2_id_image_url) {
                setImagePreviews(prev => ({ ...prev, guarantor2_id_image: riderData.guarantor2_id_image_url }));
            }

        } catch (err) {
            console.error('Error fetching rider details:', err);
            setError('Failed to load rider details');
            toast(<CustomToast id={`error-fetch-${Date.now()}`} type="error" message="Failed to load rider details" />);
        } finally {
            setLoading(false);
        }
    };

    // Check if a tab is complete based on actual form data
    const isTabComplete = (tabName) => {
        switch (tabName) {
            case 'personal':
                return !!(formData.fullname && formData.phone_number);
            case 'guarantor1':
                return !!(formData.guarantor1_name && formData.guarantor1_phone && formData.guarantor1_relationship);
            case 'guarantor2':
                // Optional - always considered complete even if empty
                return true;
            case 'credit':
                return !!(formData.credit_limit && parseFloat(formData.credit_limit) >= 0);
            default:
                return false;
        }
    };

    // Check if all required tabs are complete
    const isRegistrationComplete = () => {
        return (
            isTabComplete('personal') &&
            isTabComplete('guarantor1') &&
            isTabComplete('credit')
        );
    };

    // Validate current tab
    const validateTab = (tabName) => {
        const errors = [];

        switch (tabName) {
            case 'personal':
                if (!formData.fullname) errors.push('Full name is required');
                if (!formData.phone_number) errors.push('Phone number is required');
                break;
            case 'guarantor1':
                if (!formData.guarantor1_name) errors.push('Guarantor name is required');
                if (!formData.guarantor1_phone) errors.push('Guarantor phone is required');
                if (!formData.guarantor1_relationship) errors.push('Relationship is required');
                break;
            case 'guarantor2':
                // Optional - no validation required
                break;
            case 'credit':
                if (!formData.credit_limit) errors.push('Credit limit is required');
                else if (parseFloat(formData.credit_limit) < 0) errors.push('Credit limit must be positive');
                break;
            default:
                break;
        }

        setTabErrors(prev => ({ ...prev, [tabName]: errors }));
        return errors.length === 0;
    };

    // Handle next tab navigation
    const handleNextTab = () => {
        if (validateTab(activeTab)) {
            const tabs = ['personal', 'guarantor1', 'guarantor2', 'credit'];
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1]);
            }
        }
    };

    // Handle previous tab navigation
    const handlePrevTab = () => {
        const tabs = ['personal', 'guarantor1', 'guarantor2', 'credit'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field when user starts typing
        if (tabErrors[activeTab].length > 0) {
            validateTab(activeTab);
        }
    };

    // Handle file uploads
    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast(<CustomToast id={`error-file-${Date.now()}`} type="error" message="Please upload an image file" />);
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast(<CustomToast id={`error-size-${Date.now()}`} type="error" message="File size must be less than 5MB" />);
            return;
        }

        setFormData(prev => ({ ...prev, [fieldName]: file }));

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviews(prev => ({ ...prev, [fieldName]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    // Remove image
    const removeImage = (fieldName) => {
        setFormData(prev => ({ ...prev, [fieldName]: null }));
        setImagePreviews(prev => ({ ...prev, [fieldName]: null }));
    };

    // Handle product price addition
    const handleAddProductPrice = () => {
        if (!selectedProduct || !productPrice) {
            toast(<CustomToast id={`error-product-${Date.now()}`} type="warning" message="Please select a product and enter a price" />);
            return;
        }

        const product = products.find(p => p.id === parseInt(selectedProduct));
        if (!product) return;

        const existingIndex = formData.product_prices.findIndex(
            pp => pp.product_id === parseInt(selectedProduct)
        );

        if (existingIndex >= 0) {
            // Update existing
            const updatedPrices = [...formData.product_prices];
            updatedPrices[existingIndex] = {
                product_id: parseInt(selectedProduct),
                product_name: product.name,
                price: parseFloat(productPrice)
            };
            setFormData(prev => ({ ...prev, product_prices: updatedPrices }));
        } else {
            // Add new
            setFormData(prev => ({
                ...prev,
                product_prices: [
                    ...prev.product_prices,
                    {
                        product_id: parseInt(selectedProduct),
                        product_name: product.name,
                        price: parseFloat(productPrice)
                    }
                ]
            }));
        }

        // Reset form
        setSelectedProduct('');
        setProductPrice('');
        setShowProductPriceForm(false);

        toast(<CustomToast id={`success-product-${Date.now()}`} type="success" message="Product price added" />);
    };

    // Remove product price
    const handleRemoveProductPrice = (productId) => {
        setFormData(prev => ({
            ...prev,
            product_prices: prev.product_prices.filter(pp => pp.product_id !== productId)
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all required tabs before submission
        const personalValid = validateTab('personal');
        const guarantor1Valid = validateTab('guarantor1');
        const creditValid = validateTab('credit');

        if (!personalValid || !guarantor1Valid || !creditValid) {
            // Switch to first tab with errors
            if (!personalValid) setActiveTab('personal');
            else if (!guarantor1Valid) setActiveTab('guarantor1');
            else if (!creditValid) setActiveTab('credit');

            toast(<CustomToast id={`error-validation-${Date.now()}`} type="error" message="Please fix the errors before submitting" />);
            return;
        }

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            // Create FormData for multipart upload
            const submitData = new FormData();

            // Append all text fields (only if they have values)
            if (formData.fullname) submitData.append('fullname', formData.fullname);
            if (formData.phone_number) submitData.append('phone_number', formData.phone_number);
            if (formData.email) submitData.append('email', formData.email);
            if (formData.address) submitData.append('address', formData.address);
            if (formData.date_of_birth) submitData.append('date_of_birth', formData.date_of_birth);
            if (formData.id_type) submitData.append('id_type', formData.id_type);
            if (formData.id_number) submitData.append('id_number', formData.id_number);

            // Guarantor 1 (required)
            if (formData.guarantor1_name) submitData.append('guarantor1_name', formData.guarantor1_name);
            if (formData.guarantor1_phone) submitData.append('guarantor1_phone', formData.guarantor1_phone);
            if (formData.guarantor1_address) submitData.append('guarantor1_address', formData.guarantor1_address);
            if (formData.guarantor1_relationship) submitData.append('guarantor1_relationship', formData.guarantor1_relationship);
            if (formData.guarantor1_id_type) submitData.append('guarantor1_id_type', formData.guarantor1_id_type);
            if (formData.guarantor1_id_number) submitData.append('guarantor1_id_number', formData.guarantor1_id_number);

            // Guarantor 2 (optional - only append if they have values)
            if (formData.guarantor2_name) submitData.append('guarantor2_name', formData.guarantor2_name);
            if (formData.guarantor2_phone) submitData.append('guarantor2_phone', formData.guarantor2_phone);
            if (formData.guarantor2_address) submitData.append('guarantor2_address', formData.guarantor2_address);
            if (formData.guarantor2_relationship) submitData.append('guarantor2_relationship', formData.guarantor2_relationship);
            if (formData.guarantor2_id_type) submitData.append('guarantor2_id_type', formData.guarantor2_id_type);
            if (formData.guarantor2_id_number) submitData.append('guarantor2_id_number', formData.guarantor2_id_number);

            // Credit info
            if (formData.credit_limit) submitData.append('credit_limit', formData.credit_limit);
            if (formData.payment_terms) submitData.append('payment_terms', formData.payment_terms);
            if (formData.default_payment_method) submitData.append('default_payment_method', formData.default_payment_method);
            if (formData.notes) submitData.append('notes', formData.notes);

            // Append product_prices as JSON string if there are any
            if (formData.product_prices && formData.product_prices.length > 0) {
                submitData.append('product_prices', JSON.stringify(formData.product_prices));
            }

            // Append image files only if they are File objects (new uploads)
            if (formData.profile_image instanceof File) {
                submitData.append('profile_image', formData.profile_image);
            }

            if (formData.id_image instanceof File) {
                submitData.append('id_image', formData.id_image);
            }

            if (formData.guarantor1_id_image instanceof File) {
                submitData.append('guarantor1_id_image', formData.guarantor1_id_image);
            }

            if (formData.guarantor2_id_image instanceof File) {
                submitData.append('guarantor2_id_image', formData.guarantor2_id_image);
            }

            // Log FormData contents for debugging
            console.log('Submitting FormData:');
            for (let pair of submitData.entries()) {
                console.log(pair[0] + ': ' + (pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]));
            }

            let response;
            if (id) {
                // Update existing rider
                // NOTE: Headers removed here to allow Axios to set the boundary automatically
                response = await api.put(`/riders/${id}`, submitData);
            } else {
                // Create new rider
                // NOTE: Headers removed here to allow Axios to set the boundary automatically
                response = await api.post('/riders', submitData);
            }

            setSuccess(`Rider ${id ? 'updated' : 'registered'} successfully!`);
            toast(<CustomToast id={`success-${Date.now()}`} type="success" message={`Rider ${id ? 'updated' : 'registered'} successfully`} />);

            // Redirect after success
            setTimeout(() => {
                navigate('/riders');
            }, 2000);

        } catch (err) {
            console.error('Error saving rider:', err);
            console.error('Error response:', err.response?.data);

            let errorMsg = 'Failed to save rider';

            if (err.response?.data?.details) {
                errorMsg = err.response.data.details;
            } else if (err.response?.data?.error) {
                errorMsg = err.response.data.error;
            } else if (err.message) {
                errorMsg = err.message;
            }

            setError(errorMsg);
            toast(<CustomToast id={`error-save-${Date.now()}`} type="error" message={errorMsg} />);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="register-rider-loading">
                <div className="spinner"></div>
                <p>Loading rider details...</p>
            </div>
        );
    }

    return (
        <div className="register-rider-page">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Header */}
            <div className="register-header">
                <button className="back-btn" onClick={() => navigate('/riders')}>
                    <FaArrowLeft />
                    Back to Riders
                </button>
                <div className="header-title">
                    <FaMotorcycle className="header-icon" />
                    <div>
                        <h1>{id ? 'Edit Rider' : 'Register New Rider'}</h1>
                        <p className="header-subtitle">
                            {id ? 'Update rider information' : 'Add a new delivery rider to the system'}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <FaExclamationTriangle />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="success-banner">
                    <FaCheckCircle />
                    <span>{success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="rider-form">
                {/* Tabs Navigation with Completion Indicators */}
                <div className="form-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'personal' ? 'active' : ''} ${isTabComplete('personal') ? 'completed' : ''}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <FaUser />
                        Personal Info
                        {isTabComplete('personal') && <FaCheckCircle className="tab-complete-icon" />}
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'guarantor1' ? 'active' : ''} ${isTabComplete('guarantor1') ? 'completed' : ''}`}
                        onClick={() => setActiveTab('guarantor1')}
                    >
                        <FaUser />
                        Guarantor 1 *
                        {isTabComplete('guarantor1') && <FaCheckCircle className="tab-complete-icon" />}
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'guarantor2' ? 'active' : ''} ${isTabComplete('guarantor2') ? 'completed' : ''}`}
                        onClick={() => setActiveTab('guarantor2')}
                    >
                        <FaUser />
                        Guarantor 2 (Optional)
                        {isTabComplete('guarantor2') && <FaCheckCircle className="tab-complete-icon" />}
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === 'credit' ? 'active' : ''} ${isTabComplete('credit') ? 'completed' : ''}`}
                        onClick={() => setActiveTab('credit')}
                    >
                        <FaCreditCard />
                        Credit & Pricing *
                        {isTabComplete('credit') && <FaCheckCircle className="tab-complete-icon" />}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* Personal Information Tab */}
                    {activeTab === 'personal' && (
                        <div className="tab-pane">
                            <div className="form-section">
                                <h3>Personal Information <span className="required-field">*</span></h3>

                                {tabErrors.personal.length > 0 && (
                                    <div className="validation-errors">
                                        {tabErrors.personal.map((err, idx) => (
                                            <div key={idx} className="error-message">
                                                <FaExclamationTriangle /> {err}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="form-grid">
                                    {/* Profile Image */}
                                    <div className="form-group full-width">
                                        <label>Profile Image</label>
                                        <div className="image-upload-container">
                                            {imagePreviews.profile_image ? (
                                                <div className="image-preview">
                                                    <img src={imagePreviews.profile_image} alt="Profile" />
                                                    <button
                                                        type="button"
                                                        className="remove-image"
                                                        onClick={() => removeImage('profile_image')}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="upload-placeholder">
                                                    <FaImage />
                                                    <span>Click to upload profile image</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(e, 'profile_image')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Full Name <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="fullname"
                                            value={formData.fullname}
                                            onChange={handleChange}
                                            placeholder="Enter rider's full name"
                                            className={tabErrors.personal.includes('Full name is required') ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Phone Number <span className="required">*</span></label>
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                            className={tabErrors.personal.includes('Phone number is required') ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter email address"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Enter full address"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            value={formData.date_of_birth}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>ID Type</label>
                                        <select
                                            name="id_type"
                                            value={formData.id_type}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="national_id">National ID</option>
                                            <option value="driver_license">Driver's License</option>
                                            <option value="passport">Passport</option>
                                            <option value="voters_card">Voter's Card</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>ID Number</label>
                                        <input
                                            type="text"
                                            name="id_number"
                                            value={formData.id_number}
                                            onChange={handleChange}
                                            placeholder="Enter ID number"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>ID Image</label>
                                        <div className="image-upload-container">
                                            {imagePreviews.id_image ? (
                                                <div className="image-preview small">
                                                    <img src={imagePreviews.id_image} alt="ID" />
                                                    <button
                                                        type="button"
                                                        className="remove-image"
                                                        onClick={() => removeImage('id_image')}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="upload-placeholder small">
                                                    <FaUpload />
                                                    <span>Upload ID</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(e, 'id_image')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guarantor 1 Tab */}
                    {activeTab === 'guarantor1' && (
                        <div className="tab-pane">
                            <div className="form-section">
                                <h3>First Guarantor Information <span className="required-field">*</span></h3>

                                {tabErrors.guarantor1.length > 0 && (
                                    <div className="validation-errors">
                                        {tabErrors.guarantor1.map((err, idx) => (
                                            <div key={idx} className="error-message">
                                                <FaExclamationTriangle /> {err}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Full Name <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="guarantor1_name"
                                            value={formData.guarantor1_name}
                                            onChange={handleChange}
                                            placeholder="Enter guarantor's full name"
                                            className={tabErrors.guarantor1.includes('Guarantor name is required') ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Phone Number <span className="required">*</span></label>
                                        <input
                                            type="tel"
                                            name="guarantor1_phone"
                                            value={formData.guarantor1_phone}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                            className={tabErrors.guarantor1.includes('Guarantor phone is required') ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Relationship <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="guarantor1_relationship"
                                            value={formData.guarantor1_relationship}
                                            onChange={handleChange}
                                            placeholder="e.g., Father, Brother, Friend"
                                            className={tabErrors.guarantor1.includes('Relationship is required') ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Address</label>
                                        <textarea
                                            name="guarantor1_address"
                                            value={formData.guarantor1_address}
                                            onChange={handleChange}
                                            placeholder="Enter full address"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>ID Type</label>
                                        <select
                                            name="guarantor1_id_type"
                                            value={formData.guarantor1_id_type}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="national_id">National ID</option>
                                            <option value="driver_license">Driver's License</option>
                                            <option value="passport">Passport</option>
                                            <option value="voters_card">Voter's Card</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>ID Number</label>
                                        <input
                                            type="text"
                                            name="guarantor1_id_number"
                                            value={formData.guarantor1_id_number}
                                            onChange={handleChange}
                                            placeholder="Enter ID number"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>ID Image</label>
                                        <div className="image-upload-container">
                                            {imagePreviews.guarantor1_id_image ? (
                                                <div className="image-preview small">
                                                    <img src={imagePreviews.guarantor1_id_image} alt="Guarantor ID" />
                                                    <button
                                                        type="button"
                                                        className="remove-image"
                                                        onClick={() => removeImage('guarantor1_id_image')}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="upload-placeholder small">
                                                    <FaUpload />
                                                    <span>Upload ID</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(e, 'guarantor1_id_image')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guarantor 2 Tab */}
                    {activeTab === 'guarantor2' && (
                        <div className="tab-pane">
                            <div className="form-section">
                                <h3>Second Guarantor Information <span className="optional-field">(Optional)</span></h3>

                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            name="guarantor2_name"
                                            value={formData.guarantor2_name}
                                            onChange={handleChange}
                                            placeholder="Enter guarantor's full name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="guarantor2_phone"
                                            value={formData.guarantor2_phone}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Relationship</label>
                                        <input
                                            type="text"
                                            name="guarantor2_relationship"
                                            value={formData.guarantor2_relationship}
                                            onChange={handleChange}
                                            placeholder="e.g., Mother, Sister, Friend"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Address</label>
                                        <textarea
                                            name="guarantor2_address"
                                            value={formData.guarantor2_address}
                                            onChange={handleChange}
                                            placeholder="Enter full address"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>ID Type</label>
                                        <select
                                            name="guarantor2_id_type"
                                            value={formData.guarantor2_id_type}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="national_id">National ID</option>
                                            <option value="driver_license">Driver's License</option>
                                            <option value="passport">Passport</option>
                                            <option value="voters_card">Voter's Card</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>ID Number</label>
                                        <input
                                            type="text"
                                            name="guarantor2_id_number"
                                            value={formData.guarantor2_id_number}
                                            onChange={handleChange}
                                            placeholder="Enter ID number"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>ID Image</label>
                                        <div className="image-upload-container">
                                            {imagePreviews.guarantor2_id_image ? (
                                                <div className="image-preview small">
                                                    <img src={imagePreviews.guarantor2_id_image} alt="Guarantor ID" />
                                                    <button
                                                        type="button"
                                                        className="remove-image"
                                                        onClick={() => removeImage('guarantor2_id_image')}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="upload-placeholder small">
                                                    <FaUpload />
                                                    <span>Upload ID</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(e, 'guarantor2_id_image')}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Credit & Pricing Tab */}
                    {activeTab === 'credit' && (
                        <div className="tab-pane">
                            <div className="form-section">
                                <h3>Credit Settings <span className="required-field">*</span></h3>

                                {tabErrors.credit.length > 0 && (
                                    <div className="validation-errors">
                                        {tabErrors.credit.map((err, idx) => (
                                            <div key={idx} className="error-message">
                                                <FaExclamationTriangle /> {err}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Credit Limit (₦) <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            name="credit_limit"
                                            value={formData.credit_limit}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className={tabErrors.credit.includes('Credit limit is required') || tabErrors.credit.includes('Credit limit must be positive') ? 'error' : ''}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Payment Terms</label>
                                        <select
                                            name="payment_terms"
                                            value={formData.payment_terms}
                                            onChange={handleChange}
                                        >
                                            <option value="weekly">Weekly</option>
                                            <option value="bi-weekly">Bi-Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="per_delivery">Per Delivery</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Default Payment Method</label>
                                        <select
                                            name="default_payment_method"
                                            value={formData.default_payment_method}
                                            onChange={handleChange}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Card">Card</option>
                                        </select>
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Notes</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            placeholder="Additional notes about the rider"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Product-Specific Pricing</h3>
                                <p className="section-note">
                                    Set custom prices for specific products for this rider. Leave blank to use default product prices.
                                </p>

                                {!showProductPriceForm ? (
                                    <button
                                        type="button"
                                        className="add-product-price-btn"
                                        onClick={() => setShowProductPriceForm(true)}
                                        disabled={availableProducts.length === 0}
                                    >
                                        <FaPlus />
                                        Add Product Price
                                        {availableProducts.length === 0 && ' (No more products available)'}
                                    </button>
                                ) : (
                                    <div className="product-price-form">
                                        <div className="form-group">
                                            <label>Select Product</label>
                                            <select
                                                value={selectedProduct}
                                                onChange={(e) => setSelectedProduct(e.target.value)}
                                            >
                                                <option value="">Choose a product</option>
                                                {availableProducts.map(product => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} (Default: ₦{Number(product.price).toFixed(2)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Custom Price (₦)</label>
                                            <input
                                                type="number"
                                                value={productPrice}
                                                onChange={(e) => setProductPrice(e.target.value)}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                type="button"
                                                className="cancel-btn"
                                                onClick={() => {
                                                    setShowProductPriceForm(false);
                                                    setSelectedProduct('');
                                                    setProductPrice('');
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="add-btn"
                                                onClick={handleAddProductPrice}
                                                disabled={!selectedProduct || !productPrice}
                                            >
                                                Add Price
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {formData.product_prices.length > 0 && (
                                    <div className="product-prices-list">
                                        <h4>Custom Prices Set</h4>
                                        <table className="prices-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Custom Price</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.product_prices.map((pp) => (
                                                    <tr key={pp.product_id}>
                                                        <td>{pp.product_name}</td>
                                                        <td>₦{Number(pp.price).toFixed(2)}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="remove-price-btn"
                                                                onClick={() => handleRemoveProductPrice(pp.product_id)}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation and Form Actions */}
                <div className="form-actions-bottom">
                    <div className="nav-buttons">
                        {activeTab !== 'personal' && (
                            <button
                                type="button"
                                className="nav-btn prev-btn"
                                onClick={handlePrevTab}
                            >
                                <FaArrowLeftIcon />
                                Previous
                            </button>
                        )}

                        {activeTab !== 'credit' ? (
                            <button
                                type="button"
                                className="nav-btn next-btn"
                                onClick={handleNextTab}
                                disabled={!isTabComplete(activeTab)}
                            >
                                Next
                                <FaArrowRight />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={submitting || !isRegistrationComplete()}
                            >
                                {submitting ? (
                                    <>
                                        <div className="spinner small"></div>
                                        {id ? 'Updating...' : 'Saving...'}
                                    </>
                                ) : (
                                    <>
                                        <FaSave />
                                        {id ? 'Update Rider' : 'Register Rider'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => navigate('/riders')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterRider;