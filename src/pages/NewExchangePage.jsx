// src/pages/NewExchangePage.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FaBoxOpen,
    FaRedo,
    FaUser,
    FaSearch,
    FaPlus,
    FaMinus,
    FaTrashAlt,
    FaCheckCircle,
    FaListUl,
    FaExchangeAlt,
    FaInfoCircle,
} from "react-icons/fa";
import {
    Button,
    Form,
    Card,
    Spinner,
    InputGroup,
    FormControl,
    Alert,
    ListGroup,
    Modal,
} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import CustomToast from "../components/CustomToast";
import useAuth from "../hooks/useAuth";
import "../assets/styles/newExchange.css";

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const formatNaira = (n) => {
    if (n === undefined || n === null) return "₦0.00";
    return `₦${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

// ==========================================================
// SUB-COMPONENT: APPROVED CONFIRMATION LIST
// ==========================================================
const ApprovedConfirmationList = ({ productsMap, fetchProductData }) => {
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        if (Object.keys(productsMap).length === 0) fetchProductData(); 
        fetchApprovedRequests();
    }, []);

    const fetchApprovedRequests = async () => {
        setListLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/exchange/approved-pending-confirmation`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, 
                }
            });
            setApprovedRequests(response.data);
        } catch (error) {
            toast(<CustomToast type="error" message="Failed to load approved requests." />);
        } finally {
            setListLoading(false);
        }
    };

    const handleConfirmClick = (request) => {
        setSelectedRequest(request);
        setShowConfirmDialog(true);
    };

    const handleConfirmReceipt = async () => {
        if (!selectedRequest) return;
        
        setConfirmingId(selectedRequest.id);
        setShowConfirmDialog(false);
        
        try {
            await axios.patch(`${API_BASE_URL}/exchange/confirm/${selectedRequest.id}`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, 
                }
            });

            toast(<CustomToast type="success" message={`Exchange ${selectedRequest.id} confirmed! Stock recorded.`} />);
            setApprovedRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        } catch (error) {
            console.error('Confirmation error:', error);
            toast(<CustomToast type="error" message={error.response?.data?.error || "Failed to confirm exchange."} />);
        } finally {
            setConfirmingId(null);
            setSelectedRequest(null);
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmDialog(false);
        setSelectedRequest(null);
    };

    // Confirmation Dialog Component
    const ConfirmationDialog = () => {
        if (!showConfirmDialog || !selectedRequest) return null;

        return (
            <div className="nex-modal">
                <div className="nex-modal__content nex-modal__content--medium">
                    <div className="nex-modal__header">
                        <FaCheckCircle className="nex-modal__icon nex-modal__icon--success" />
                        <h3>Confirm Receipt of Returned Items</h3>
                    </div>
                    
                    <div className="nex-modal__body">
                        <div className="nex-confirmation-details">
                            <div className="nex-alert nex-alert--warning">
                                <FaInfoCircle />
                                <strong>Important:</strong> Confirm only when you have physically received the items and they are now in your stock.
                            </div>

                            <div className="nex-request-summary">
                                <div className="nex-summary-row">
                                    <span className="nex-summary-label">Request ID:</span>
                                    <span className="nex-summary-value">{selectedRequest.id}</span>
                                </div>
                                
                                <div className="nex-summary-row">
                                    <span className="nex-summary-label">Customer:</span>
                                    <span className="nex-summary-value">{selectedRequest.customer_name}</span>
                                </div>
                                
                                <div className="nex-summary-row">
                                    <span className="nex-summary-label">Approved By:</span>
                                    <span className="nex-summary-value">{selectedRequest.approved_by_user_name}</span>
                                </div>
                                
                                <div className="nex-summary-row">
                                    <span className="nex-summary-label">Reason:</span>
                                    <span className="nex-summary-value">{selectedRequest.reason}</span>
                                </div>

                                <div className="nex-items-summary">
                                    <h5>Items to be Credited to Stock:</h5>
                                    {selectedRequest.items_requested_jsonb.map((item, index) => (
                                        <div key={index} className="nex-item-summary">
                                            <span className="nex-item-summary-name">
                                                {productsMap[item.product_id] || `Product ID: ${item.product_id}`}
                                            </span>
                                            <span className="nex-item-summary-quantity">
                                                Quantity: {item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="nex-confirmation-note">
                                <FaInfoCircle />
                                This action will finalize the exchange and add the returned items back to your available stock.
                            </div>
                        </div>
                    </div>
                    
                    <div className="nex-modal__footer">
                        <button 
                            className="nex-btn nex-btn--ghost" 
                            onClick={handleCancelConfirm}
                            disabled={confirmingId}
                        >
                            Cancel
                        </button>
                        <button 
                            className="nex-btn nex-btn--success" 
                            onClick={handleConfirmReceipt}
                            disabled={confirmingId}
                        >
                            {confirmingId ? (
                                <>
                                    <div className="nex-spinner nex-spinner--small"></div>
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <FaCheckCircle />
                                    Confirm Receipt & Finalize Stock
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (listLoading) return (
        <div className="nex-center">
            <div className="nex-spinner"></div>
            <div className="nex-muted">Loading approved requests...</div>
        </div>
    );

    return (
        <>
            {/* Confirmation Dialog */}
            <ConfirmationDialog />
            
            <div className="nex-card">
                <div className="nex-card__header">
                    <div className="nex-title">
                        <FaCheckCircle className="nex-icon-success" />
                        <h2>Approved Exchanges Awaiting Confirmation ({approvedRequests.length})</h2>
                    </div>
                </div>
                <div className="nex-card__body">
                    <p className="nex-muted">These returns have been approved by the manager, and the stock is credited to your account. Click 'Confirm Receipt' when you physically receive the items.</p>
                    
                    <button onClick={fetchApprovedRequests} className="nex-btn nex-btn--ghost nex-btn--icon">
                        <FaRedo />
                        Refresh List
                    </button>

                    {approvedRequests.length === 0 ? (
                        <div className="nex-alert nex-alert--info">
                            🎉 No approved exchanges awaiting your confirmation.
                        </div>
                    ) : (
                        <div className="nex-requests-list">
                            {approvedRequests.map(request => (
                                <div key={request.id} className="nex-request-card nex-request-card--approved">
                                    <div className="nex-request-card__body">
                                        <div className="nex-request-meta">
                                            <span className="nex-badge">Request ID: {request.id}</span>
                                            <span className="nex-muted">Approved By: {request.approved_by_user_name}</span>
                                        </div>
                                        
                                        <div className="nex-customer-info">
                                            <FaUser />
                                            <strong>{request.customer_name}</strong>
                                        </div>
                                        
                                        <p className="nex-reason"><strong>Reason:</strong> {request.reason}</p>
                                        
                                        <div className="nex-items-list">
                                            {request.items_requested_jsonb.map((item, index) => (
                                                <div key={index} className="nex-item">
                                                    <span className="nex-item-name">
                                                        {productsMap[item.product_id] || `Product ID: ${item.product_id}`}
                                                    </span>
                                                    <span className="nex-item-quantity">Qty: {item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button 
                                            className="nex-btn nex-btn--success nex-btn--block"
                                            onClick={() => handleConfirmClick(request)}
                                            disabled={confirmingId === request.id}
                                        >
                                            {confirmingId === request.id ? (
                                                <div className="nex-spinner nex-spinner--small"></div>
                                            ) : (
                                                <FaCheckCircle />
                                            )}
                                            Confirm Receipt & Finalize Stock
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// ==========================================================
// SUB-COMPONENT: CONFIRMATION MODAL
// ==========================================================
const ConfirmationModal = ({ show, onHide, onConfirm, exchangeData, customers, productsMap }) => {
    if (!show || !exchangeData) return null;

    const customer = customers.find(c => c.id === parseInt(exchangeData.customerId));
    const totalItems = exchangeData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = exchangeData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="nex-modal">
            <div className="nex-modal__content">
                <div className="nex-modal__header">
                    <FaInfoCircle className="nex-modal__icon" />
                    <h3>Confirm Exchange Request</h3>
                </div>
                
                <div className="nex-modal__body">
                    <div className="nex-confirmation-details">
                        <div className="nex-confirmation-row">
                            <span className="nex-confirmation-label">Customer:</span>
                            <span className="nex-confirmation-value">{customer?.fullname || 'Unknown Customer'}</span>
                        </div>
                        
                        <div className="nex-confirmation-row">
                            <span className="nex-confirmation-label">Total Items:</span>
                            <span className="nex-confirmation-value">{totalItems} items</span>
                        </div>
                        
                        <div className="nex-confirmation-row">
                            <span className="nex-confirmation-label">Total Credit Value:</span>
                            <span className="nex-confirmation-value nex-confirmation-value--highlight">
                                {formatNaira(totalValue)}
                            </span>
                        </div>
                        
                        <div className="nex-confirmation-row">
                            <span className="nex-confirmation-label">Reason:</span>
                            <span className="nex-confirmation-value">{exchangeData.reason}</span>
                        </div>

                        {exchangeData.originalSaleId && (
                            <div className="nex-confirmation-row">
                                <span className="nex-confirmation-label">Original Sale ID:</span>
                                <span className="nex-confirmation-value">{exchangeData.originalSaleId}</span>
                            </div>
                        )}

                        <div className="nex-items-summary">
                            <h5>Items to Return:</h5>
                            {exchangeData.items.map((item, index) => (
                                <div key={index} className="nex-item-summary">
                                    <span className="nex-item-summary-name">
                                        {productsMap[item.product_id] || item.name}
                                    </span>
                                    <span className="nex-item-summary-details">
                                        {item.quantity} × {formatNaira(item.price)} = {formatNaira(item.quantity * item.price)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="nex-modal-note">
                        <FaInfoCircle />
                        This request will be sent to the manager for approval before the stock is credited back to your inventory.
                    </div>
                </div>
                
                <div className="nex-modal__footer">
                    <button 
                        className="nex-btn nex-btn--ghost" 
                        onClick={onHide}
                    >
                        Cancel
                    </button>
                    <button 
                        className="nex-btn nex-btn--primary" 
                        onClick={onConfirm}
                    >
                        <FaCheckCircle />
                        Confirm & Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==========================================================
// MAIN COMPONENT: NEW EXCHANGE PAGE
// ==========================================================

const NewExchangePage = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Exchange State
    const [exchangeItems, setExchangeItems] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [originalSaleId, setOriginalSaleId] = useState("");
    const [exchangeReason, setExchangeReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // View State
    const [activeView, setActiveView] = useState('request');
    const [productsMap, setProductsMap] = useState({});

    // Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingSubmission, setPendingSubmission] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const productsRes = await axios.get(`${API_BASE_URL}/products`);
            setProducts(productsRes.data);

            const customersRes = await axios.get(`${API_BASE_URL}/customers`);
            setCustomers(customersRes.data);
            
            const map = productsRes.data.reduce((acc, product) => {
                acc[product.id] = product.name;
                return acc;
            }, {});
            setProductsMap(map);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast(<CustomToast type="error" message="Failed to load products/customers." />);
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addItemToExchange = (product) => {
        const existingItem = exchangeItems.find((item) => item.product_id === product.id);

        if (existingItem) {
            setExchangeItems(
                exchangeItems.map((item) =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            setExchangeItems([
                ...exchangeItems,
                {
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                },
            ]);
        }
    };

    const updateItemQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setExchangeItems(
            exchangeItems.map((item) =>
                item.product_id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const removeItem = (productId) => {
        setExchangeItems(exchangeItems.filter((item) => item.product_id !== productId));
    };

    const clearExchange = () => {
        setExchangeItems([]);
        setExchangeReason("");
        setSelectedCustomerId(null);
        setOriginalSaleId("");
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();

        if (!selectedCustomerId || exchangeItems.length === 0 || !exchangeReason.trim()) {
            toast(<CustomToast type="warning" message="Please select a customer, add items, and provide a reason." />);
            return;
        }

        // Prepare data for confirmation modal
        const submissionData = {
            customerId: selectedCustomerId,
            items: exchangeItems,
            reason: exchangeReason.trim(),
            originalSaleId: originalSaleId || null,
        };

        setPendingSubmission(submissionData);
        setShowConfirmation(true);
    };

    const handleConfirmSubmission = async () => {
        setShowConfirmation(false);
        setIsSubmitting(true);

        try {
            const itemsPayload = pendingSubmission.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
            }));

            const payload = {
                customer_id: pendingSubmission.customerId,
                original_sale_id: pendingSubmission.originalSaleId,
                items_requested_jsonb: itemsPayload,
                reason: pendingSubmission.reason,
            };

            await axios.post(`${API_BASE_URL}/exchange/request`, payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, 
                }
            });

            toast(<CustomToast type="success" message="Exchange request submitted! Awaiting manager approval." />);
            clearExchange();
            setPendingSubmission(null);
            
        } catch (error) {
            console.error("Exchange submission error:", error);
            toast(<CustomToast type="error" message={error.response?.data?.error || "Failed to submit request."} />);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelSubmission = () => {
        setShowConfirmation(false);
        setPendingSubmission(null);
    };

    if (loading) return (
        <div className="nex-center">
            <div className="nex-spinner"></div>
            <div className="nex-muted">Loading exchange data...</div>
        </div>
    );

    return (
        <div className="nex-page">
            <ToastContainer position="top-right" autoClose={3000} icon={false} />
            
            {/* Confirmation Modal */}
            <ConfirmationModal 
                show={showConfirmation}
                onHide={handleCancelSubmission}
                onConfirm={handleConfirmSubmission}
                exchangeData={pendingSubmission}
                customers={customers}
                productsMap={productsMap}
            />
            
            {/* View Selector */}
            <div className="nex-view-selector">
                <button 
                    className={`nex-view-btn ${activeView === 'request' ? 'nex-view-btn--active' : ''}`}
                    onClick={() => setActiveView('request')}
                >
                    <FaExchangeAlt />
                    New Exchange Request
                </button>
                <button 
                    className={`nex-view-btn ${activeView === 'confirm' ? 'nex-view-btn--active' : ''}`}
                    onClick={() => setActiveView('confirm')}
                >
                    <FaCheckCircle />
                    Awaiting Confirmation
                </button>
            </div>

            {/* VIEW 1: EXCHANGE REQUEST SUBMISSION */}
            {activeView === 'request' && (
                <div className="nex-content-grid">
                    {/* Transaction Section */}
                    <div className="nex-main-section">
                        <div className="nex-card">
                            <div className="nex-card__header">
                                <div className="nex-title">
                                    <FaExchangeAlt />
                                    <h2>Customer Bread Exchange Request</h2>
                                </div>
                                <button 
                                    className="nex-btn nex-btn--danger nex-btn--icon" 
                                    onClick={clearExchange} 
                                    disabled={exchangeItems.length === 0 || isSubmitting}
                                >
                                    <FaTrashAlt />
                                    Clear Request
                                </button>
                            </div>
                            <div className="nex-card__body">
                                <form onSubmit={handleSubmitClick}>
                                    {/* Customer Selector */}
                                    <div className="nex-field">
                                        <label className="nex-label">
                                            <FaUser />
                                            Customer
                                        </label>
                                        <div className="nex-input">
                                            <select
                                                value={selectedCustomerId || ""}
                                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                                required
                                            >
                                                <option value="">Select a Customer</option>
                                                {customers.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.fullname} (ID: {c.id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Original Sale ID */}
                                    <div className="nex-field">
                                        <label className="nex-label">Original Sale ID (Optional)</label>
                                        <div className="nex-input">
                                            <input
                                                type="text"
                                                placeholder="Enter original sales transaction ID"
                                                value={originalSaleId}
                                                onChange={(e) => setOriginalSaleId(e.target.value)}
                                            />
                                        </div>
                                        <div className="nex-hint">Helps the manager reference the initial purchase.</div>
                                    </div>

                                    {/* Items Being Returned */}
                                    <div className="nex-section-title">
                                        <FaListUl />
                                        Items for Exchange/Return ({exchangeItems.length})
                                    </div>
                                    
                                    <div className="nex-items-container">
                                        {exchangeItems.length === 0 ? (
                                            <div className="nex-alert nex-alert--info">
                                                No products added yet. Select products to return.
                                            </div>
                                        ) : (
                                            exchangeItems.map((item) => (
                                                <div key={item.product_id} className="nex-exchange-item">
                                                    <div className="nex-exchange-item__info">
                                                        <div className="nex-exchange-item__name">{item.name}</div>
                                                        <div className="nex-exchange-item__price">{formatNaira(item.price)} per unit</div>
                                                    </div>
                                                    <div className="nex-exchange-item__controls">
                                                        <div className="nex-quantity-controls">
                                                            <button
                                                                className="nex-quantity-btn"
                                                                onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                                                            >
                                                                <FaMinus />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItemQuantity(item.product_id, parseInt(e.target.value) || 0)}
                                                                min="1"
                                                                className="nex-quantity-input"
                                                            />
                                                            <button
                                                                className="nex-quantity-btn"
                                                                onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                                                            >
                                                                <FaPlus />
                                                            </button>
                                                        </div>
                                                        <button 
                                                            className="nex-btn nex-btn--danger nex-btn--icon"
                                                            onClick={() => removeItem(item.product_id)}
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Reason */}
                                    <div className="nex-field">
                                        <label className="nex-label">Reason for Exchange/Return (Required)</label>
                                        <div className="nex-input">
                                            <textarea
                                                rows={3}
                                                placeholder="E.g., Customer complained bread was stale, wrong product delivered, or sizing issue."
                                                value={exchangeReason}
                                                onChange={(e) => setExchangeReason(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        className="nex-btn nex-btn--primary nex-btn--block"
                                        disabled={isSubmitting || exchangeItems.length === 0 || !selectedCustomerId || !exchangeReason.trim()}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="nex-spinner nex-spinner--small"></div>
                                                Submitting Request...
                                            </>
                                        ) : (
                                            <>
                                                <FaExchangeAlt />
                                                Review & Submit Request
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Product Selection Section */}
                    <div className="nex-sidebar-section">
                        <div className="nex-card">
                            <div className="nex-card__header">
                                <div className="nex-title">
                                    <FaBoxOpen />
                                    <h3>Select Products</h3>
                                </div>
                            </div>
                            <div className="nex-card__body">
                                <div className="nex-input nex-input--icon">
                                    <FaSearch className="nex-input__icon" />
                                    <input
                                        type="text"
                                        placeholder="Search for bread or product name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <div className="nex-product-grid">
                                    {filteredProducts.map((p) => (
                                        <div
                                            key={p.id}
                                            className="nex-product-card"
                                            onClick={() => addItemToExchange(p)}
                                        >
                                            <div className="nex-product-card__image">
                                                <img
                                                    src={p.image_url || "https://via.placeholder.com/220x150"}
                                                    alt={p.name}
                                                />
                                            </div>
                                            <div className="nex-product-card__content">
                                                <div className="nex-product-card__name" title={p.name}>
                                                    {p.name}
                                                </div>
                                                <div className="nex-product-card__meta">
                                                    <span className="nex-tag">
                                                        {p.category || "General"}
                                                    </span>
                                                    <span className="nex-product-card__price">Credit: {formatNaira(p.price)}</span>
                                                </div>
                                                <button
                                                    className="nex-btn nex-btn--primary nex-btn--block nex-btn--icon"
                                                    onClick={(e) => { e.stopPropagation(); addItemToExchange(p); }}
                                                >
                                                    <FaPlus />
                                                    Add to Return List
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: AWAITING CONFIRMATION LIST */}
            {activeView === 'confirm' && (
                <div className="nex-confirmation-section">
                    <ApprovedConfirmationList productsMap={productsMap} fetchProductData={fetchData} />
                </div>
            )}
        </div>
    );
};

export default NewExchangePage;