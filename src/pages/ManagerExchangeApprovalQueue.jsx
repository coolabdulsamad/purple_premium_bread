import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaRedo, FaCalendarAlt, FaBoxes, FaUser, FaClipboardList, FaExchangeAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CustomToast from '../components/CustomToast';
import useAuth from '../hooks/useAuth';
import '../assets/styles/exchangeApproval.css';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const formatNaira = (n) => {
    if (n === undefined || n === null) return '₦0.00';
    return `₦${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const ManagerExchangeApprovalQueue = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [productsMap, setProductsMap] = useState({}); 
    const { userRole } = useAuth();

    // Confirmation Modal State
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchProductData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products`); 
            const products = response.data;
            
            const map = products.reduce((acc, product) => {
                acc[product.id] = product.name;
                return acc;
            }, {});
            setProductsMap(map);
        } catch (error) {
            console.error('Error fetching product list for mapping:', error);
            toast(<CustomToast type="warning" message="Could not load all product names for display." />);
        }
    };
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/manager/exchange/pending`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, 
                }
            });
            setPendingRequests(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pending exchange requests:', error);
            toast(<CustomToast type="error" message="Failed to fetch approval queue." />);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (['admin', 'manager'].includes(userRole)) {
            fetchProductData();
            fetchData();
        }
    }, [userRole]);

    const handleApproveClick = (request) => {
        setSelectedRequest(request);
        setShowApproveModal(true);
    };

    const handleRejectClick = (request) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
    };

    const handleApproveConfirm = async () => {
        if (!selectedRequest) return;

        setApprovingId(selectedRequest.id);
        setShowApproveModal(false);
        
        try {
            await axios.patch(`${API_BASE_URL}/manager/exchange/approve/${selectedRequest.id}`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, 
                }
            });

            toast(<CustomToast type="success" message={`Request ${selectedRequest.id} approved and stock updated!`} />);
            setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        } catch (error) {
            console.error('Error approving request:', error);
            toast(<CustomToast type="error" message={error.response?.data?.error || "Approval failed. Check server logs."} />);
        } finally {
            setApprovingId(null);
            setSelectedRequest(null);
        }
    };

    const handleRejectConfirm = async () => {
        if (!selectedRequest) return;

        setRejectingId(selectedRequest.id);
        setShowRejectModal(false);
        
        try {
            await axios.patch(`${API_BASE_URL}/manager/exchange/reject/${selectedRequest.id}`, {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, 
                }
            });

            toast(<CustomToast type="success" message={`Request ${selectedRequest.id} has been rejected.`} />);
            setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast(<CustomToast type="error" message={error.response?.data?.error || "Rejection failed. Check server logs."} />);
        } finally {
            setRejectingId(null);
            setSelectedRequest(null);
        }
    };

    const handleCancelAction = () => {
        setShowApproveModal(false);
        setShowRejectModal(false);
        setSelectedRequest(null);
    };

    if (loading) return (
        <div className="mea-loading">
            <div className="mea-spinner"></div>
            <div className="mea-loading-text">Loading approval queue...</div>
        </div>
    );

    return (
        <div className="mea-page">
            {/* Confirmation Modals */}
            {showApproveModal && selectedRequest && (
                <div className="mea-modal">
                    <div className="mea-modal__content">
                        <div className="mea-modal__header">
                            <FaCheckCircle className="mea-modal__icon mea-modal__icon--success" />
                            <h3>Approve Exchange Request</h3>
                        </div>
                        <div className="mea-modal__body">
                            <p>Are you sure you want to approve this exchange request?</p>
                            <div className="mea-modal-details">
                                <div className="mea-modal-row">
                                    <span>Request ID:</span>
                                    <strong>#{selectedRequest.id}</strong>
                                </div>
                                <div className="mea-modal-row">
                                    <span>Customer:</span>
                                    <span>{selectedRequest.customer_name}</span>
                                </div>
                                <div className="mea-modal-row">
                                    <span>Items:</span>
                                    <span>{selectedRequest.items_requested_jsonb.length} products</span>
                                </div>
                            </div>
                            <div className="mea-modal-note">
                                ✅ This will update inventory stock and credit the returned items.
                            </div>
                        </div>
                        <div className="mea-modal__footer">
                            <button className="mea-btn mea-btn--ghost" onClick={handleCancelAction}>
                                Cancel
                            </button>
                            <button className="mea-btn mea-btn--success" onClick={handleApproveConfirm}>
                                <FaCheckCircle />
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && selectedRequest && (
                <div className="mea-modal">
                    <div className="mea-modal__content">
                        <div className="mea-modal__header">
                            <FaTimesCircle className="mea-modal__icon mea-modal__icon--danger" />
                            <h3>Reject Exchange Request</h3>
                        </div>
                        <div className="mea-modal__body">
                            <p>Are you sure you want to reject this exchange request?</p>
                            <div className="mea-modal-details">
                                <div className="mea-modal-row">
                                    <span>Request ID:</span>
                                    <strong>#{selectedRequest.id}</strong>
                                </div>
                                <div className="mea-modal-row">
                                    <span>Customer:</span>
                                    <span>{selectedRequest.customer_name}</span>
                                </div>
                                <div className="mea-modal-row">
                                    <span>Reason:</span>
                                    <span className="mea-reason-text">{selectedRequest.reason}</span>
                                </div>
                            </div>
                            <div className="mea-modal-note">
                                ❌ This will permanently reject the request and notify the sales user.
                            </div>
                        </div>
                        <div className="mea-modal__footer">
                            <button className="mea-btn mea-btn--ghost" onClick={handleCancelAction}>
                                Cancel
                            </button>
                            <button className="mea-btn mea-btn--danger" onClick={handleRejectConfirm}>
                                <FaTimesCircle />
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="mea-header">
                <div className="mea-header-content">
                    <h1 className="mea-title">
                        <FaExchangeAlt className="mea-title-icon" />
                        Exchange Approval Queue
                    </h1>
                    <p className="mea-subtitle">
                        Review customer exchange requests submitted by sales users. Approval automatically updates stock.
                    </p>
                </div>
                <button onClick={fetchData} className="mea-btn mea-btn--primary mea-btn--icon">
                    <FaRedo className="mea-btn-icon" />
                    Refresh Queue
                </button>
            </div>

            {/* Summary Card */}
            <div className="mea-summary">
                <div className="mea-summary-item">
                    <span className="mea-summary-label">Pending Requests</span>
                    <span className="mea-summary-value">{pendingRequests.length}</span>
                </div>
                <div className="mea-summary-item">
                    <span className="mea-summary-label">Requires Action</span>
                    <span className="mea-summary-value mea-summary-value--warning">
                        {pendingRequests.length}
                    </span>
                </div>
            </div>

            {/* Requests List */}
            <div className="mea-content">
                {pendingRequests.length === 0 ? (
                    <div className="mea-card">
                        <div className="mea-card__body mea-empty-state">
                            <FaCheckCircle className="mea-empty-icon" />
                            <h3>All Caught Up!</h3>
                            <p>No pending exchange requests requiring approval.</p>
                        </div>
                    </div>
                ) : (
                    <div className="mea-requests-grid">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="mea-request-card">
                                <div className="mea-request-card__header">
                                    <div className="mea-request-id">
                                        <FaClipboardList className="mea-request-icon" />
                                        Request #{request.id}
                                    </div>
                                    <div className="mea-request-date">
                                        <FaCalendarAlt className="mea-date-icon" />
                                        {new Date(request.created_at).toLocaleString()}
                                    </div>
                                </div>

                                <div className="mea-request-card__body">
                                    <div className="mea-request-details">
                                        <div className="mea-detail-row">
                                            <FaUser className="mea-detail-icon" />
                                            <div className="mea-detail-content">
                                                <span className="mea-detail-label">Requested By</span>
                                                <span className="mea-detail-value">{request.requested_by_user_name}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mea-detail-row">
                                            <FaUser className="mea-detail-icon" />
                                            <div className="mea-detail-content">
                                                <span className="mea-detail-label">Customer</span>
                                                <span className="mea-detail-value">{request.customer_name}</span>
                                            </div>
                                        </div>

                                        <div className="mea-detail-row mea-detail-row--reason">
                                            <div className="mea-detail-content">
                                                <span className="mea-detail-label">Reason for Exchange</span>
                                                <p className="mea-reason">{request.reason}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mea-items-section">
                                        <div className="mea-section-title">
                                            <FaBoxes className="mea-section-icon" />
                                            Items to be Returned
                                        </div>
                                        <div className="mea-items-list">
                                            {request.items_requested_jsonb.map((item, index) => (
                                                <div key={index} className="mea-item">
                                                    <div className="mea-item-info">
                                                        <span className="mea-item-name">
                                                            {productsMap[item.product_id] || `Product ID: ${item.product_id}`}
                                                        </span>
                                                        <span className="mea-item-quantity">
                                                            {item.quantity} units
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mea-actions">
                                        <button 
                                            className="mea-btn mea-btn--success mea-btn--icon"
                                            onClick={() => handleApproveClick(request)}
                                            disabled={approvingId === request.id || rejectingId === request.id}
                                        >
                                            {approvingId === request.id ? (
                                                <div className="mea-spinner mea-spinner--small"></div>
                                            ) : (
                                                <FaCheckCircle />
                                            )}
                                            Approve Exchange
                                        </button>
                                        <button 
                                            className="mea-btn mea-btn--danger mea-btn--icon"
                                            onClick={() => handleRejectClick(request)}
                                            disabled={approvingId === request.id || rejectingId === request.id}
                                        >
                                            {rejectingId === request.id ? (
                                                <div className="mea-spinner mea-spinner--small"></div>
                                            ) : (
                                                <FaTimesCircle />
                                            )}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerExchangeApprovalQueue;