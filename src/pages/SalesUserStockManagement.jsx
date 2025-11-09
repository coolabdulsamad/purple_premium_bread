import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { User, Package, RefreshCcw, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight, DollarSign, AlertTriangle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import CustomToast from '../components/CustomToast';
import { toast } from 'react-toastify';
import '../assets/styles/salesUserStockManagement.css';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const formatNaira = (n) => {
    if (n === undefined || n === null) return '₦0.00';
    return `₦${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

// ==========================================================
// SUB-COMPONENT: CONFIRMATION MODAL
// ==========================================================
const ConfirmationModal = ({ 
    show, 
    onHide, 
    onConfirm, 
    type, 
    user, 
    quantities, 
    productsMap 
}) => {
    if (!show) return null;

    const isIssue = type === 'issue';
    const title = isIssue ? 'Confirm Stock Issuance' : 'Confirm Stock Return';
    const iconColor = isIssue ? 'var(--susm-purple)' : 'var(--susm-success)';
    
    const totalItems = Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0);
    const itemsWithQuantities = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => ({
            productId,
            name: productsMap[productId] || `Product ${productId}`,
            quantity
        }));

    return (
        <div className="susm-modal">
            <div className="susm-modal__content">
                <div className="susm-modal__header">
                    <AlertTriangle className="susm-modal__icon" style={{ color: iconColor }} />
                    <h3>{title}</h3>
                </div>
                
                <div className="susm-modal__body">
                    <div className="susm-confirmation-details">
                        <div className="susm-confirmation-row">
                            <span className="susm-confirmation-label">User:</span>
                            <span className="susm-confirmation-value">{user?.fullname}</span>
                        </div>
                        
                        <div className="susm-confirmation-row">
                            <span className="susm-confirmation-label">Action:</span>
                            <span className="susm-confirmation-value">
                                {isIssue ? 'Issuing Stock' : 'Receiving Stock Return'}
                            </span>
                        </div>
                        
                        <div className="susm-confirmation-row">
                            <span className="susm-confirmation-label">Total Items:</span>
                            <span className="susm-confirmation-value susm-confirmation-value--highlight">
                                {totalItems} items
                            </span>
                        </div>

                        {itemsWithQuantities.length > 0 && (
                            <div className="susm-items-summary">
                                <h5>Items to {isIssue ? 'Issue' : 'Return'}:</h5>
                                {itemsWithQuantities.map((item, index) => (
                                    <div key={index} className="susm-item-summary">
                                        <span className="susm-item-summary-name">
                                            {item.name}
                                        </span>
                                        <span className="susm-item-summary-details">
                                            {item.quantity} units
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="susm-modal-note">
                        <AlertTriangle />
                        {isIssue 
                            ? 'This will transfer stock from main inventory to the user\'s allocated stock.'
                            : 'This will return stock from user\'s allocated stock back to main inventory.'
                        }
                    </div>
                </div>
                
                <div className="susm-modal__footer">
                    <button 
                        className="susm-btn susm-btn--ghost" 
                        onClick={onHide}
                    >
                        Cancel
                    </button>
                    <button 
                        className={`susm-btn ${isIssue ? 'susm-btn--primary' : 'susm-btn--success'}`} 
                        onClick={onConfirm}
                    >
                        {isIssue ? 'Confirm Issue' : 'Confirm Return'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==========================================================
// MAIN COMPONENT: SALES USER STOCK MANAGEMENT
// ==========================================================
const SalesUserStockManagement = () => {
    const [salesUsers, setSalesUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const { user } = useAuth();
    const adminId = user?.id;

    // Confirmation Modal State - MOVED TO MAIN COMPONENT
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [pendingUser, setPendingUser] = useState(null);
    const [pendingQuantities, setPendingQuantities] = useState({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersRes = await axios.get(`${API_BASE_URL}/users/sales-accounts`);
            const productsRes = await axios.get(`${API_BASE_URL}/inventory/detailed`);

            setSalesUsers(usersRes.data);
            setProducts(productsRes.data.map(p => ({
                id: p.product_id,
                name: p.product_name,
                category: p.product_category,
                price: p.price,
                quantity: p.quantity
            })));
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching sales management data:", error);
            toast(<CustomToast type="error" message="Failed to load management data." />, {
                toastId: 'fetch-error'
            });
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleDemoStock = async (userId, currentValue) => {
        const newValue = !currentValue;
        try {
            await axios.put(`${API_BASE_URL}/users/toggle-demo-stock/${userId}`, { load_from_demo_stock: newValue });
            setSalesUsers(prev => prev.map(user => 
                user.id === userId ? { ...user, load_from_demo_stock: newValue } : user
            ));
            toast(<CustomToast type="success" message={`User preference updated to: ${newValue ? 'Allocated Stock' : 'Main Inventory'}` } />, {
                toastId: 'toggle-success'
            });
        } catch (error) {
            console.error("Error toggling demo stock:", error);
            toast(<CustomToast type="error" message="Failed to update stock preference." />, {
                toastId: 'toggle-error'
            });
        }
    };

    // Confirmation handlers - MOVED TO MAIN COMPONENT
    const handleConfirmAction = async () => {
        setShowConfirmation(false);
        
        if (!adminId) {
            toast(<CustomToast type="error" message="Admin ID not found. Please re-login to proceed." />, { toastId: 'no-admin' });
            return;
        }

        const payload = {
            adminId,
            userId: pendingUser.id,
            type: pendingAction,
            products: pendingQuantities,
        };

        try {
            await axios.post(`${API_BASE_URL}/inventory/manage-user-stock`, payload);
            toast(<CustomToast type="success" message={`Stock ${pendingAction} successful for ${pendingUser.fullname}.` } />, {
                toastId: `${pendingAction}-success`
            });
            
            // Re-fetch data to show updated stock levels
            fetchData();
        } catch (error) {
            console.error(`Error processing stock ${pendingAction}:`, error.response?.data?.details || error.message);
            toast(<CustomToast type="error" message={`Failed to ${pendingAction} stock. ${error.response?.data?.error || ''}` } />, {
                toastId: `${pendingAction}-error`
            });
        }

        // Reset pending state
        setPendingAction(null);
        setPendingUser(null);
        setPendingQuantities({});
    };

    const handleCancelAction = () => {
        setShowConfirmation(false);
        setPendingAction(null);
        setPendingUser(null);
        setPendingQuantities({});
    };

    // Helper Component for each Sales User
    const SalesUserCard = ({ user, onStockAction }) => {
        const [issueQuantities, setIssueQuantities] = useState({});
        const [returnQuantities, setReturnQuantities] = useState({});
        const [activeForm, setActiveForm] = useState(null);
        const allocatedStockMap = new Map(user.allocated_stock.map(s => [s.product_id, s]));

        const handleStockActionClick = (type) => {
            const quantities = type === 'issue' ? issueQuantities : returnQuantities;
            const productsToUpdate = Object.keys(quantities)
                .filter(id => quantities[id] > 0)
                .reduce((acc, id) => ({ ...acc, [id]: quantities[id] }), {});

            if (Object.keys(productsToUpdate).length === 0) {
                toast(<CustomToast type="warn" message={`No quantity specified to ${type}.` } />, { toastId: 'no-qty' });
                return;
            }

            // Call parent handler to show confirmation modal
            onStockAction(type, user, productsToUpdate);

            // Clear the form
            if (type === 'issue') setIssueQuantities({});
            if (type === 'return') setReturnQuantities({});
            setActiveForm(null);
        };

        return (
            <div className="susm-card">
                <div className="susm-card__header">
                    <div className="susm-user-info">
                        <User className="susm-user-icon" />
                        <div className="susm-user-details">
                            <h3 className="susm-user-name">{user.fullname}</h3>
                            <span className="susm-username">@{user.username}</span>
                        </div>
                    </div>
                    <button 
                        className={`susm-toggle-btn ${user.load_from_demo_stock ? 'susm-toggle-btn--active' : ''}`}
                        onClick={() => handleToggleDemoStock(user.id, user.load_from_demo_stock)}
                        title="Toggle Stock Source"
                    >
                        {user.load_from_demo_stock ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        <span className="susm-toggle-text">
                            {user.load_from_demo_stock ? 'Allocated Stock' : 'Main Inventory'}
                        </span>
                    </button>
                </div>

                <div className="susm-card__body">
                    {/* Allocated Stock Section */}
                    <div className="susm-stock-section">
                        <div className="susm-section-title">
                            <Package className="susm-section-icon" />
                            <span>Allocated Stock</span>
                        </div>
                        {user.allocated_stock && user.allocated_stock.length > 0 ? (
                            <div className="susm-stock-grid">
                                {user.allocated_stock.map((s) => (
                                    <div key={s.product_id} className="susm-stock-item">
                                        <span className="susm-stock-name">{s.product_name}</span>
                                        <span className="susm-stock-quantity">{s.quantity} units</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="susm-alert susm-alert--info">
                                No stock currently allocated.
                            </div>
                        )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="susm-action-buttons">
                        <button 
                            className={`susm-action-btn susm-action-btn--issue ${activeForm === 'issue' ? 'susm-action-btn--active' : ''}`}
                            onClick={() => setActiveForm(activeForm === 'issue' ? null : 'issue')}
                        >
                            <ArrowRight className="susm-action-icon" />
                            Issue Stock
                        </button>
                        <button 
                            className={`susm-action-btn susm-action-btn--return ${activeForm === 'return' ? 'susm-action-btn--active' : ''}`}
                            onClick={() => setActiveForm(activeForm === 'return' ? null : 'return')}
                        >
                            <ArrowLeft className="susm-action-icon" />
                            Receive Return
                        </button>
                    </div>

                    {/* Issue Stock Form */}
                    {activeForm === 'issue' && (
                        <div className="susm-form-section">
                            <h4 className="susm-form-title">
                                <ArrowRight className="susm-form-icon" />
                                Issue Stock to User
                            </h4>
                            <div className="susm-form">
                                <div className="susm-form-grid">
                                    {products.map((p) => (
                                        <div key={p.id} className="susm-form-field">
                                            <label className="susm-form-label">
                                                {p.name}
                                                <span className="susm-stock-info">(Available: {p.quantity})</span>
                                            </label>
                                            <div className="susm-input-group">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={p.quantity}
                                                    placeholder="0"
                                                    value={issueQuantities[p.id] || ''}
                                                    onChange={(e) => setIssueQuantities(prev => ({
                                                        ...prev,
                                                        [p.id]: Math.min(parseInt(e.target.value) || 0, p.quantity || 0)
                                                    }))}
                                                    className="susm-input"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    type="button" 
                                    className="susm-submit-btn susm-submit-btn--primary"
                                    onClick={() => handleStockActionClick('issue')}
                                >
                                    Review & Issue Stock
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Return Stock Form */}
                    {activeForm === 'return' && (
                        <div className="susm-form-section">
                            <h4 className="susm-form-title">
                                <ArrowLeft className="susm-form-icon" />
                                Receive Stock Return
                            </h4>
                            <div className="susm-form">
                                <div className="susm-form-grid">
                                    {products.map((p) => {
                                        const allocated = allocatedStockMap.get(p.id)?.quantity || 0;
                                        if (allocated === 0) return null;
                                        return (
                                            <div key={p.id} className="susm-form-field">
                                                <label className="susm-form-label">
                                                    {p.name}
                                                    <span className="susm-stock-info">(User has: {allocated})</span>
                                                </label>
                                                <div className="susm-input-group">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={allocated}
                                                        placeholder="0"
                                                        value={returnQuantities[p.id] || ''}
                                                        onChange={(e) => setReturnQuantities(prev => ({ 
                                                            ...prev, 
                                                            [p.id]: Math.min(parseInt(e.target.value) || 0, allocated) 
                                                        }))}
                                                        className="susm-input"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button 
                                    type="button" 
                                    className="susm-submit-btn susm-submit-btn--success"
                                    onClick={() => handleStockActionClick('return')}
                                >
                                    Review & Receive Return
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Handler for stock actions from child components
    const handleStockActionRequest = (type, user, quantities) => {
        setPendingAction(type);
        setPendingUser(user);
        setPendingQuantities(quantities);
        setShowConfirmation(true);
    };

    // Create products map for confirmation modal
    const productsMap = products.reduce((acc, product) => {
        acc[product.id] = product.name;
        return acc;
    }, {});

    if (loading) return (
        <div className="susm-loading">
            <div className="susm-spinner"></div>
            <div className="susm-loading-text">Loading sales accounts...</div>
        </div>
    );

    return (
        <div className="susm-page">
            {/* Confirmation Modal */}
            <ConfirmationModal 
                show={showConfirmation}
                onHide={handleCancelAction}
                onConfirm={handleConfirmAction}
                type={pendingAction}
                user={pendingUser}
                quantities={pendingQuantities}
                productsMap={productsMap}
            />
            
            <div className="susm-header">
                <div className="susm-header-content">
                    <h1 className="susm-title">Sales Accounts Stock Management</h1>
                    <p className="susm-subtitle">
                        Admin/Manager: Issue and receive stock from sales users. Toggle between allocated stock and main inventory.
                    </p>
                </div>
                <button onClick={fetchData} className="susm-refresh-btn">
                    <RefreshCcw className="susm-refresh-icon" />
                    Refresh Data
                </button>
            </div>
            
            <div className="susm-content">
                {salesUsers.length > 0 ? (
                    <div className="susm-users-grid">
                        {salesUsers.map(user => (
                            <SalesUserCard 
                                key={user.id} 
                                user={user} 
                                onStockAction={handleStockActionRequest}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="susm-alert susm-alert--info susm-alert--center">
                        No sales accounts found with the role 'sales'.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesUserStockManagement;