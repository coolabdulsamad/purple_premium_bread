import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Container, Table, Button, Form, Row, Col, Card, Alert, Spinner,
    Modal, Badge, InputGroup, Pagination
} from 'react-bootstrap';
import {
    FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiCalendar,
    FiDollarSign, FiFileText, FiPieChart, FiTrendingUp,
    FiRefreshCw, FiX, FiSave, FiAlertTriangle, FiEye, FiPrinter
} from 'react-icons/fi'; // Add new icons
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/operatingExpenses.css';
import api from '../api/axiosInstance';

// const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const OperatingExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [filters, setFilters] = useState({
        viewType: 'all',
        startDate: '',
        endDate: '',
        category: '',
        expenseType: '',
        paymentMethod: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0
    });
    const [summary, setSummary] = useState({});
    const [categories, setCategories] = useState([]);

    // Confirmation Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [pendingFormData, setPendingFormData] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        expense_type: '',
        description: '',
        amount: '',
        category: '',
        payment_method: 'Cash',
        reference_number: '',
        is_recurring: false,
        recurrence_pattern: ''
    });

    // Common expense categories and types
    const expenseCategories = [
        'Fuel', 'Utilities', 'Maintenance', 'Supplies', 'Salaries', 
        'Transport', 'Office', 'Marketing', 'Insurance', 'Taxes', 'Other'
    ];

    const paymentMethods = ['Cash', 'Bank Transfer', 'Card', 'Mobile Money'];

    const recurrencePatterns = ['', 'daily', 'weekly', 'monthly', 'yearly'];

// Fetch expenses
    const fetchExpenses = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page,
                limit: pagination.limit
            };

            const response = await api.get('/operating-expenses', { params });
            setExpenses(response.data.expenses);
            setPagination(response.data.pagination);
            setSummary(response.data.summary || {});
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to fetch expenses.');
        } finally {
            setLoading(false);
        }
    };


    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await api.get('/operating-expenses/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            ...(key === 'viewType' && value !== 'custom' ? { startDate: '', endDate: '' } : {})
        }));
    };

    // Add new state for view modal
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const printRef = useRef();

    // View expense details
    const handleViewExpense = (expense) => {
        setSelectedExpense(expense);
        setShowViewModal(true);
    };

    // Print expense details
    const handlePrintExpense = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Expense Receipt - ${selectedExpense.expense_type}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .receipt-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .receipt-details { margin: 20px 0; }
                        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .detail-label { font-weight: bold; color: #555; }
                        .detail-value { text-align: right; }
                        .amount { font-weight: bold; font-size: 1.2em; color: #e74c3c; }
                        .footer { margin-top: 30px; text-align: center; color: #777; font-size: 0.9em; }
                        @media print { 
                            body { margin: 0; } 
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.afterprint = () => printWindow.close();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.expense_type || !formData.amount || !formData.category) {
            toast.error('Please fill in all required fields.');
            return;
        }

        // Store form data and show confirmation
        setPendingFormData({ ...formData });
        setConfirmAction(editingExpense ? 'update' : 'create');
        setShowConfirmModal(true);
    };

 const handleConfirmSubmit = async () => {
        try {
            const payload = {
                ...pendingFormData,
                amount: parseFloat(pendingFormData.amount)
                // Remove recorded_by - backend will use authenticated user from JWT
            };

            if (editingExpense) {
                await api.put(`/operating-expenses/${editingExpense.id}`, payload);
                toast.success('Expense updated successfully!');
            } else {
                await api.post('/operating-expenses', payload);
                toast.success('Expense added successfully!');
            }

            setShowConfirmModal(false);
            setShowModal(false);
            resetForm();
            fetchExpenses();
        } catch (error) {
            console.error('Error saving expense:', error);
            toast.error('Failed to save expense.');
            setShowConfirmModal(false);
        }
    };

    // const handleEdit = (expense) => {
    //     setEditingExpense(expense);
    //     setFormData({
    //         expense_date: format(new Date(expense.expense_date), 'yyyy-MM-dd'),
    //         expense_type: expense.expense_type,
    //         description: expense.description,
    //         amount: expense.amount,
    //         category: expense.category,
    //         payment_method: expense.payment_method,
    //         reference_number: expense.reference_number || '',
    //         is_recurring: expense.is_recurring,
    //         recurrence_pattern: expense.recurrence_pattern || ''
    //     });
    //     setShowModal(true);
    // };

    // const handleDeleteClick = (expense) => {
    //     setExpenseToDelete(expense);
    //     setConfirmAction('delete');
    //     setShowConfirmModal(true);
    // };

    const renderTableActions = (expense) => (
        <div className="oe-actions">
            <button
                className="oe-action-btn oe-action-btn--view"
                onClick={() => handleViewExpense(expense)}
                title="View expense details"
            >
                <FiEye />
            </button>
            {/* Remove edit and delete buttons */}
        </div>
    );

const handleConfirmDelete = async () => {
        if (!expenseToDelete) return;

        try {
            await api.delete(`/operating-expenses/${expenseToDelete.id}`);
            toast.success('Expense deleted successfully!');
            setShowConfirmModal(false);
            fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Failed to delete expense.');
            setShowConfirmModal(false);
        } finally {
            setExpenseToDelete(null);
        }
    };

    const resetForm = () => {
        setFormData({
            expense_date: format(new Date(), 'yyyy-MM-dd'),
            expense_type: '',
            description: '',
            amount: '',
            category: '',
            payment_method: 'Cash',
            reference_number: '',
            is_recurring: false,
            recurrence_pattern: ''
        });
        setEditingExpense(null);
        setPendingFormData(null);
    };

    const handleModalClose = () => {
        setShowModal(false);
        resetForm();
    };

    const clearFilters = () => {
        setFilters({
            viewType: 'all',
            startDate: '',
            endDate: '',
            category: '',
            expenseType: '',
            paymentMethod: ''
        });
    };

    const handleCancelAction = () => {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setExpenseToDelete(null);
        setPendingFormData(null);
    };

    const formatCurrency = (amount) => {
        return `₦${parseFloat(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const getCategoryColor = (category) => {
        const colors = {
            Fuel: 'oe-fuel',
            Utilities: 'oe-utilities',
            Maintenance: 'oe-maintenance',
            Supplies: 'oe-supplies',
            Salaries: 'oe-salaries',
            Transport: 'oe-transport',
            Office: 'oe-office',
            Marketing: 'oe-marketing',
            Insurance: 'oe-insurance',
            Taxes: 'oe-taxes',
            Other: 'oe-other'
        };
        return colors[category] || 'oe-other';
    };

    const getConfirmModalContent = () => {
        const data = pendingFormData || expenseToDelete;
        
        switch (confirmAction) {
            case 'create':
                return {
                    title: 'Confirm New Expense',
                    message: 'Are you sure you want to add this new expense?',
                    details: `Expense Type: ${data?.expense_type}\nAmount: ${formatCurrency(data?.amount)}\nCategory: ${data?.category}`,
                    confirmText: 'Add Expense',
                    confirmVariant: 'success',
                    icon: 'plus'
                };
            case 'update':
                return {
                    title: 'Confirm Expense Update',
                    message: 'Are you sure you want to update this expense?',
                    details: `Expense Type: ${data?.expense_type}\nAmount: ${formatCurrency(data?.amount)}\nCategory: ${data?.category}`,
                    confirmText: 'Update Expense',
                    confirmVariant: 'primary',
                    icon: 'save'
                };
            case 'delete':
                return {
                    title: 'Confirm Expense Deletion',
                    message: 'Are you sure you want to delete this expense?',
                    details: `Expense Type: ${data?.expense_type}\nAmount: ${formatCurrency(data?.amount)}\nCategory: ${data?.category}`,
                    confirmText: 'Delete Expense',
                    confirmVariant: 'danger',
                    icon: 'trash'
                };
            default:
                return {
                    title: 'Confirm Action',
                    message: 'Are you sure you want to proceed?',
                    details: '',
                    confirmText: 'Confirm',
                    confirmVariant: 'primary',
                    icon: 'alert'
                };
        }
    };

    const confirmContent = getConfirmModalContent();

    const getActionIcon = () => {
        switch (confirmContent.icon) {
            case 'plus': return <FiPlus />;
            case 'save': return <FiSave />;
            case 'trash': return <FiTrash2 />;
            default: return <FiAlertTriangle />;
        }
    };

    return (
        <div className="oe-page">
            <ToastContainer position="top-right" />
            
            {/* Confirmation Modal - HIGHEST Z-INDEX */}
            {showConfirmModal && (
                <div className="oe-modal oe-modal--confirm">
                    <div className="oe-modal__content oe-modal__content--confirm">
                        <div className="oe-modal__header">
                            <FiAlertTriangle className="oe-modal__icon oe-modal__icon--warning" />
                            <h3 className="oe-modal__title">{confirmContent.title}</h3>
                        </div>
                        <div className="oe-modal__body">
                            <div className="oe-confirm-content">
                                <p className="oe-confirm-message">{confirmContent.message}</p>
                                {confirmContent.details && (
                                    <div className="oe-confirm-details">
                                        <pre>{confirmContent.details}</pre>
                                    </div>
                                )}
                                <div className="oe-confirm-note">
                                    <FiAlertTriangle />
                                    This action cannot be undone.
                                </div>
                            </div>
                        </div>
                        <div className="oe-modal__footer">
                            <button className="oe-btn oe-btn--ghost" onClick={handleCancelAction}>
                                Cancel
                            </button>
                            <button 
                                className={`oe-btn oe-btn--${confirmContent.confirmVariant}`}
                                onClick={confirmAction === 'delete' ? handleConfirmDelete : handleConfirmSubmit}
                            >
                                {getActionIcon()}
                                {confirmContent.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Expense Modal */}
            {showViewModal && selectedExpense && (
                <div className="oe-modal oe-modal--view">
                    <div className="oe-modal__content">
                        <div className="oe-modal__header">
                            <h3 className="oe-modal__title">
                                <FiFileText />
                                Expense Details
                            </h3>
                            <button 
                                className="oe-modal__close" 
                                onClick={() => setShowViewModal(false)}
                            >
                                <FiX />
                            </button>
                        </div>
                        
                        <div className="oe-modal__body" ref={printRef}>
                            <div className="oe-expense-details">
                                {/* Printable content */}
                                <div className="receipt-header">
                                    <h2>Expense Receipt</h2>
                                    <p>Company Name • {format(new Date(), 'MMMM dd, yyyy')}</p>
                                </div>
                                
                                <div className="receipt-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Expense Type:</span>
                                        <span className="detail-value">{selectedExpense.expense_type}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Date:</span>
                                        <span className="detail-value">
                                            {format(new Date(selectedExpense.expense_date), 'MMMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Category:</span>
                                        <span className="detail-value">
                                            <span className={`oe-category-badge ${getCategoryColor(selectedExpense.category)}`}>
                                                {selectedExpense.category}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Amount:</span>
                                        <span className="detail-value amount">
                                            {formatCurrency(selectedExpense.amount)}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Payment Method:</span>
                                        <span className="detail-value">{selectedExpense.payment_method}</span>
                                    </div>
                                    {selectedExpense.reference_number && (
                                        <div className="detail-row">
                                            <span className="detail-label">Reference No:</span>
                                            <span className="detail-value">{selectedExpense.reference_number}</span>
                                        </div>
                                    )}
                                    {selectedExpense.description && (
                                        <div className="detail-row">
                                            <span className="detail-label">Description:</span>
                                            <span className="detail-value" style={{textAlign: 'left'}}>
                                                {selectedExpense.description}
                                            </span>
                                        </div>
                                    )}
                                    <div className="detail-row">
                                        <span className="detail-label">Recorded By:</span>
                                        <span className="detail-value">
                                            {selectedExpense.recorded_by_name || selectedExpense.recorded_by_username || 'System'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Recorded On:</span>
                                        <span className="detail-value">
                                            {format(new Date(selectedExpense.created_at), 'MMMM dd, yyyy HH:mm')}
                                        </span>
                                    </div>
                                    {selectedExpense.is_recurring && (
                                        <div className="detail-row">
                                            <span className="detail-label">Recurring:</span>
                                            <span className="detail-value">
                                                Yes ({selectedExpense.recurrence_pattern})
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="footer">
                                    <p>This is an official expense record</p>
                                    <p>Generated on: {format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="oe-modal__footer">
                            <button 
                                className="oe-btn oe-btn--primary oe-btn--icon"
                                onClick={handlePrintExpense}
                            >
                                <FiPrinter />
                                Print Receipt
                            </button>
                            <button 
                                className="oe-btn oe-btn--ghost"
                                onClick={() => setShowViewModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Expense Modal - LOWER Z-INDEX */}
            {showModal && (
                <div className="oe-modal oe-modal--form">
                    <div className="oe-modal__content">
                        <div className="oe-modal__header">
                            <h3 className="oe-modal__title">
                                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                            </h3>
                            <button className="oe-modal__close" onClick={handleModalClose}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="oe-modal__body">
                            <div className="oe-form-grid">
                                <div className="oe-field">
                                    <label className="oe-label">Expense Date *</label>
                                    <div className="oe-input">
                                        <input
                                            type="date"
                                            value={formData.expense_date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Category *</label>
                                    <div className="oe-input">
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        >
                                            <option value="">Select Category</option>
                                            {expenseCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="oe-field oe-field--full">
                                    <label className="oe-label">Expense Type *</label>
                                    <div className="oe-input">
                                        <input
                                            type="text"
                                            placeholder="e.g., Diesel for Generator, Electricity Bill, etc."
                                            value={formData.expense_type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expense_type: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field oe-field--full">
                                    <label className="oe-label">Description</label>
                                    <div className="oe-input">
                                        <textarea
                                            rows={3}
                                            placeholder="Detailed description of the expense..."
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Amount (₦) *</label>
                                    <div className="oe-input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Payment Method *</label>
                                    <div className="oe-input">
                                        <select
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        >
                                            {paymentMethods.map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Reference Number</label>
                                    <div className="oe-input">
                                        <input
                                            type="text"
                                            placeholder="Transaction reference, receipt number, etc."
                                            value={formData.reference_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Recurrence</label>
                                    <div className="oe-recurrence">
                                        <label className="oe-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_recurring}
                                                onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                                            />
                                            <span className="oe-checkbox__label">Recurring Expense</span>
                                        </label>
                                        {formData.is_recurring && (
                                            <div className="oe-input">
                                                <select
                                                    value={formData.recurrence_pattern}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, recurrence_pattern: e.target.value }))}
                                                    className="oe-input__field"
                                                >
                                                    <option value="">Select Pattern</option>
                                                    {recurrencePatterns.filter(p => p).map(pattern => (
                                                        <option key={pattern} value={pattern}>
                                                            {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div className="oe-modal__footer">
                            <button className="oe-btn oe-btn--ghost" onClick={handleModalClose}>
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="oe-btn oe-btn--primary"
                                onClick={handleSubmit}
                            >
                                <FiSave />
                                {editingExpense ? 'Update Expense' : 'Add Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="oe-header">
                <div className="oe-header-content">
                    <h1 className="oe-title">Operating Expenses</h1>
                    <p className="oe-subtitle">Manage and track all business operating costs</p>
                </div>
                <div className="oe-header-actions">
                    <button 
                        className="oe-btn oe-btn--secondary oe-btn--icon"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FiFilter />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <button 
                        className="oe-btn oe-btn--primary oe-btn--icon"
                        onClick={() => setShowModal(true)}
                    >
                        <FiPlus />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="oe-summary">
                <div className="oe-summary-item">
                    <div className="oe-summary-icon oe-summary-icon--total">
                        <FiDollarSign />
                    </div>
                    <div className="oe-summary-content">
                        <span className="oe-summary-label">Total Expenses</span>
                        <span className="oe-summary-value">{formatCurrency(summary.total_amount)}</span>
                        <span className="oe-summary-meta">{summary.total_expenses} transactions</span>
                    </div>
                </div>
                <div className="oe-summary-item">
                    <div className="oe-summary-icon oe-summary-icon--average">
                        <FiTrendingUp />
                    </div>
                    <div className="oe-summary-content">
                        <span className="oe-summary-label">Average Expense</span>
                        <span className="oe-summary-value">{formatCurrency(summary.average_amount)}</span>
                        <span className="oe-summary-meta">Per transaction</span>
                    </div>
                </div>
                <div className="oe-summary-item">
                    <div className="oe-summary-icon oe-summary-icon--highest">
                        <FiPieChart />
                    </div>
                    <div className="oe-summary-content">
                        <span className="oe-summary-label">Highest Expense</span>
                        <span className="oe-summary-value">{formatCurrency(summary.max_amount)}</span>
                        <span className="oe-summary-meta">Maximum single expense</span>
                    </div>
                </div>
                <div className="oe-summary-item">
                    <div className="oe-summary-icon oe-summary-icon--lowest">
                        <FiFileText />
                    </div>
                    <div className="oe-summary-content">
                        <span className="oe-summary-label">Lowest Expense</span>
                        <span className="oe-summary-value">{formatCurrency(summary.min_amount)}</span>
                        <span className="oe-summary-meta">Minimum single expense</span>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            {showFilters && (
                <div className="oe-card">
                    <div className="oe-card__body">
                        <div className="oe-filters">
                            <div className="oe-filters-grid">
                                <div className="oe-field">
                                    <label className="oe-label">
                                        <FiFilter />
                                        View Type
                                    </label>
                                    <div className="oe-input">
                                        <select
                                            value={filters.viewType}
                                            onChange={(e) => handleFilterChange('viewType', e.target.value)}
                                            className="oe-input__field"
                                        >
                                            <option value="all">All Time</option>
                                            <option value="today">Today</option>
                                            <option value="weekly">This Week</option>
                                            <option value="monthly">This Month</option>
                                            <option value="custom">Custom Date Range</option>
                                        </select>
                                    </div>
                                </div>

                                {filters.viewType === 'custom' && (
                                    <>
                                        <div className="oe-field">
                                            <label className="oe-label">
                                                <FiCalendar />
                                                Start Date
                                            </label>
                                            <div className="oe-input">
                                                <input
                                                    type="date"
                                                    value={filters.startDate}
                                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                                    className="oe-input__field"
                                                />
                                            </div>
                                        </div>
                                        <div className="oe-field">
                                            <label className="oe-label">
                                                <FiCalendar />
                                                End Date
                                            </label>
                                            <div className="oe-input">
                                                <input
                                                    type="date"
                                                    value={filters.endDate}
                                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                                    className="oe-input__field"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="oe-field">
                                    <label className="oe-label">Category</label>
                                    <div className="oe-input">
                                        <select
                                            value={filters.category}
                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                            className="oe-input__field"
                                        >
                                            <option value="">All Categories</option>
                                            {expenseCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Payment Method</label>
                                    <div className="oe-input">
                                        <select
                                            value={filters.paymentMethod}
                                            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                                            className="oe-input__field"
                                        >
                                            <option value="">All Methods</option>
                                            {paymentMethods.map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">
                                        <FiSearch />
                                        Search Expense Type
                                    </label>
                                    <div className="oe-input oe-input--icon">
                                        <FiSearch className="oe-input__icon" />
                                        <input
                                            type="text"
                                            placeholder="Search expense type..."
                                            value={filters.expenseType}
                                            onChange={(e) => handleFilterChange('expenseType', e.target.value)}
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="oe-filters-actions">
                                <button 
                                    className="oe-btn oe-btn--ghost"
                                    onClick={clearFilters}
                                >
                                    <FiX />
                                    Clear Filters
                                </button>
                                <button 
                                    className="oe-btn oe-btn--primary"
                                    onClick={fetchExpenses}
                                >
                                    <FiRefreshCw />
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Expenses Table */}
            <div className="oe-card">
                <div className="oe-card__header">
                    <div className="oe-card__title">
                        <FiFileText />
                        Expense Records
                    </div>
                    <div className="oe-badge">
                        {pagination.totalCount} records found
                    </div>
                </div>
                <div className="oe-card__body">
                    {loading ? (
                        <div className="oe-loading">
                            <div className="oe-spinner"></div>
                            <div className="oe-loading-text">Loading expenses...</div>
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="oe-empty-state">
                            <FiFileText className="oe-empty-icon" />
                            <h3>No Expenses Found</h3>
                            <p>No expenses found for the selected criteria.</p>
                            <button 
                                className="oe-btn oe-btn--primary"
                                onClick={() => setShowModal(true)}
                            >
                                <FiPlus />
                                Add Your First Expense
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="oe-table-container">
                                <table className="oe-table">
                                    <thead className="oe-table__head">
                                        <tr>
                                            <th className="oe-table__cell oe-table__cell--header">S/N</th>
                                            <th className="oe-table__cell oe-table__cell--header">Date</th>
                                            <th className="oe-table__cell oe-table__cell--header">Expense Type</th>
                                            <th className="oe-table__cell oe-table__cell--header">Description</th>
                                            <th className="oe-table__cell oe-table__cell--header">Category</th>
                                            <th className="oe-table__cell oe-table__cell--header">Payment Method</th>
                                            <th className="oe-table__cell oe-table__cell--header oe-table__cell--amount">Amount</th>
                                            <th className="oe-table__cell oe-table__cell--header oe-table__cell--actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="oe-table__body">
                                        {expenses.map((expense, index) => (
                                            <tr key={expense.id} className="oe-table__row">
                                                <td className="oe-table__cell oe-table__cell--number">{index + 1}</td>
                                                <td className="oe-table__cell oe-table__cell--date">
                                                    {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="oe-table__cell oe-table__cell--type">
                                                    <div className="oe-expense-type">
                                                        <strong>{expense.expense_type}</strong>
                                                        {expense.reference_number && (
                                                            <div className="oe-reference">Ref: {expense.reference_number}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="oe-table__cell oe-table__cell--description">
                                                    {expense.description || '-'}
                                                </td>
                                                <td className="oe-table__cell oe-table__cell--category">
                                                    <span className={`oe-category-badge ${getCategoryColor(expense.category)}`}>
                                                        {expense.category}
                                                        {expense.is_recurring && (
                                                            <span className="oe-recurring-badge" title="Recurring expense">R</span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="oe-table__cell oe-table__cell--method">
                                                    {expense.payment_method}
                                                </td>
                                                <td className="oe-table__cell oe-table__cell--amount">
                                                    <span className="oe-amount">{formatCurrency(expense.amount)}</span>
                                                </td>
                                                <td className="oe-table__cell oe-table__cell--actions">
{renderTableActions(expense)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="oe-pagination">
                                    <button 
                                        className="oe-pagination-btn"
                                        disabled={pagination.page === 1}
                                        onClick={() => fetchExpenses(pagination.page - 1)}
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="oe-pagination-pages">
                                        {[...Array(pagination.totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                className={`oe-pagination-page ${i + 1 === pagination.page ? 'oe-pagination-page--active' : ''}`}
                                                onClick={() => fetchExpenses(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button 
                                        className="oe-pagination-btn"
                                        disabled={pagination.page === pagination.totalPages}
                                        onClick={() => fetchExpenses(pagination.page + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Expense Modal */}
            {showModal && (
                <div className="oe-modal">
                    <div className="oe-modal__content">
                        <div className="oe-modal__header">
                            <h3 className="oe-modal__title">
                                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                            </h3>
                            <button className="oe-modal__close" onClick={handleModalClose}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="oe-modal__body">
                            <div className="oe-form-grid">
                                <div className="oe-field">
                                    <label className="oe-label">Expense Date *</label>
                                    <div className="oe-input">
                                        <input
                                            type="date"
                                            value={formData.expense_date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Category *</label>
                                    <div className="oe-input">
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        >
                                            <option value="">Select Category</option>
                                            {expenseCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="oe-field oe-field--full">
                                    <label className="oe-label">Expense Type *</label>
                                    <div className="oe-input">
                                        <input
                                            type="text"
                                            placeholder="e.g., Diesel for Generator, Electricity Bill, etc."
                                            value={formData.expense_type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, expense_type: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field oe-field--full">
                                    <label className="oe-label">Description</label>
                                    <div className="oe-input">
                                        <textarea
                                            rows={3}
                                            placeholder="Detailed description of the expense..."
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Amount (₦) *</label>
                                    <div className="oe-input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Payment Method *</label>
                                    <div className="oe-input">
                                        <select
                                            value={formData.payment_method}
                                            onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                                            required
                                            className="oe-input__field"
                                        >
                                            {paymentMethods.map(method => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Reference Number</label>
                                    <div className="oe-input">
                                        <input
                                            type="text"
                                            placeholder="Transaction reference, receipt number, etc."
                                            value={formData.reference_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                                            className="oe-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="oe-field">
                                    <label className="oe-label">Recurrence</label>
                                    <div className="oe-recurrence">
                                        <label className="oe-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_recurring}
                                                onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                                            />
                                            <span className="oe-checkbox__label">Recurring Expense</span>
                                        </label>
                                        {formData.is_recurring && (
                                            <div className="oe-input">
                                                <select
                                                    value={formData.recurrence_pattern}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, recurrence_pattern: e.target.value }))}
                                                    className="oe-input__field"
                                                >
                                                    <option value="">Select Pattern</option>
                                                    {recurrencePatterns.filter(p => p).map(pattern => (
                                                        <option key={pattern} value={pattern}>
                                                            {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div className="oe-modal__footer">
                            <button className="oe-btn oe-btn--ghost" onClick={handleModalClose}>
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="oe-btn oe-btn--primary"
                                onClick={handleSubmit}
                            >
                                <FiSave />
                                {editingExpense ? 'Update Expense' : 'Add Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatingExpensesPage;