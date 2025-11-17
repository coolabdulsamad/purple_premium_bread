// src/pages/SalaryManagementPage.jsx
import React, { useState, useEffect } from 'react';
// import axios from 'axios';
import api from '../api/axiosInstance';

import {
    FiUsers, FiDollarSign, FiCalendar, FiFileText, FiEdit, FiEye,
    FiPlus, FiTrendingUp, FiPieChart, FiCreditCard, FiFilter,
    FiChevronDown, FiChevronUp, FiSearch, FiX, FiSave, FiTrash2,
    FiAlertTriangle, FiCheckCircle, FiClock, FiArrowUp, FiArrowDown,
    FiPercent,
    FiList,
    FiUserPlus
} from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/salaryManagement.css';
import { FiPrinter } from 'react-icons/fi';
import { RiFileHistoryFill } from 'react-icons/ri';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const SalaryManagementPage = () => {
    const [activeTab, setActiveTab] = useState('all-staff');
    const [allStaff, setAllStaff] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loans, setLoans] = useState([]);
    const [companyDebts, setCompanyDebts] = useState([]);
    const [debtHistory, setDebtHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showDebtModal, setShowDebtModal] = useState(false);
    const [showDebtHistoryModal, setShowDebtHistoryModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [filterOptions, setFilterOptions] = useState({});
    const [staff, setStaff] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        totalCount: 0,
        totalPages: 0
    });

    const [loanData, setLoanData] = useState({
        user_id: null,
        loan_date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        reason: ''
    });

    const [outstandingLoans, setOutstandingLoans] = useState([]);
    const [otherDeductions, setOtherDeductions] = useState(0);

    // Confirmation Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [pendingFormData, setPendingFormData] = useState(null);

    // Staff filters
    const [staffFilters, setStaffFilters] = useState({
        role: '',
        search: '',
        salaryType: '',
        minSalary: '',
        maxSalary: '',
        isActive: 'true'
    });

    // Payment filters
    const [paymentFilters, setPaymentFilters] = useState({
        userId: '',
        staffRole: '',
        startDate: '',
        endDate: '',
        period: '',
        status: '',
        paymentMethod: '',
        minAmount: '',
        maxAmount: '',
        search: ''
    });

    // Loan filters
    const [loanFilters, setLoanFilters] = useState({
        userId: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    // // Form states
    // const [salaryForm, setSalaryForm] = useState({
    //     base_salary: '',
    //     allowances: '',
    //     deductions: '',
    //     salary_type: 'monthly',
    //     bank_name: '',
    //     account_number: '',
    //     tax_rate: '',
    //     pension_rate: ''
    // });

    // Form states
    const [staffForm, setStaffForm] = useState({
        fullname: '',
        phone_number: '',
        position: '',
        department: '',
        email: '',
        gender: '',
        date_of_birth: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        is_active: true
    });

    const [debtForm, setDebtForm] = useState({
        staff_id: '',
        staff_type: 'user',
        amount: '',
        reason: '',
        debt_type: 'owed_to_company', // or 'owed_by_company'
        status: 'pending'
    });

    // Update the salaryForm state
    const [salaryForm, setSalaryForm] = useState({
        base_salary: '',
        allowances: '',
        deductions: '',
        salary_type: 'monthly',
        bank_name: '',
        bank_account_name: '', // Add this field
        account_number: '',
        tax_rate: '',
        pension_rate: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        user_id: '',
        salary_period: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        base_salary: '',
        allowances: '',
        deductions: '0',
        tax_amount: '',
        pension_amount: '',
        net_amount: '',
        payment_method: 'Bank Transfer',
        reference_number: '',
        notes: '',
        loan_deduction: '0',
        loan_ids: []
    });

    const [taxRate, setTaxRate] = useState(0);
    const [pensionRate, setPensionRate] = useState(0);

    // Fetch filter options
    const fetchFilterOptions = async () => {
        try {
            const response = await api.get(`/salaries/filters/options`);
            setFilterOptions(response.data);
        } catch (error) {
            console.error('Error fetching filter options:', error);
            toast.error('Failed to fetch filter options.');
        }
    };

    // Fetch staff data with filters
    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/salaries/staff`, {
                params: staffFilters
            });
            setStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
            toast.error('Failed to fetch staff data.');
        } finally {
            setLoading(false);
        }
    };

    // Add new filter state for all staff
    const [allStaffFilters, setAllStaffFilters] = useState({
        role: '',
        search: '',
        salaryType: '',
        minSalary: '',
        maxSalary: '',
        isActive: 'true',
        staffType: '' // Add staff type filter
    });

    // Update fetchAllStaff to use filters
    const fetchAllStaff = async () => {
        setLoading(true);
        try {
            const response = await api.get('/salaries/all-staff', {
                params: allStaffFilters
            });
            setAllStaff(response.data);
        } catch (error) {
            console.error('Error fetching all staff:', error);
            toast.error('Failed to fetch staff data.');
        } finally {
            setLoading(false);
        }
    };

    // Add handler for all staff filters
    const handleAllStaffFilterChange = (key, value) => {
        setAllStaffFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear all staff filters
    const clearAllStaffFilters = () => {
        setAllStaffFilters({
            role: '',
            search: '',
            salaryType: '',
            minSalary: '',
            maxSalary: '',
            isActive: 'true',
            staffType: ''
        });
    };

    // Add filter state for company debts
    const [debtFilters, setDebtFilters] = useState({
        staffType: '',
        debtType: '',
        status: '',
        search: '',
        minAmount: '',
        maxAmount: '',
        startDate: '',
        endDate: ''
    });

    // Update fetchCompanyDebts to use filters
    const fetchCompanyDebts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/salaries/company-debts', {
                params: debtFilters
            });
            setCompanyDebts(response.data);
        } catch (error) {
            console.error('Error fetching company debts:', error);
            toast.error('Failed to fetch company debts.');
        } finally {
            setLoading(false);
        }
    };

    // Add handler for debt filters
    const handleDebtFilterChange = (key, value) => {
        setDebtFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear debt filters
    const clearDebtFilters = () => {
        setDebtFilters({
            staffType: '',
            debtType: '',
            status: '',
            search: '',
            minAmount: '',
            maxAmount: '',
            startDate: '',
            endDate: ''
        });
    };

    // Fetch debt history for a staff
    const fetchDebtHistory = async (staffId, staffType) => {
        try {
            const response = await api.get(`/salaries/company-debts/history/${staffType}/${staffId}`);
            setDebtHistory(response.data);
        } catch (error) {
            console.error('Error fetching debt history:', error);
        }
    };

    // Add new staff member
    const handleAddStaff = async () => {
        try {
            await api.post('/staffs/members', staffForm);
            toast.success('Staff member added successfully!');
            setShowStaffModal(false);
            setStaffForm({
                fullname: '',
                phone_number: '',
                position: '',
                department: '',
                email: '',
                gender: '',
                date_of_birth: '',
                address: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                is_active: true
            });
            fetchAllStaff();
        } catch (error) {
            console.error('Error adding staff member:', error);
            toast.error('Failed to add staff member.');
        }
    };

    // Add company debt
    const handleAddDebt = async () => {
        try {
            await api.post('/salaries/company-debts', debtForm);
            toast.success('Company debt recorded successfully!');
            setShowDebtModal(false);
            setDebtForm({
                staff_id: '',
                staff_type: 'user',
                amount: '',
                reason: '',
                debt_type: 'owed_to_company',
                status: 'pending'
            });
            fetchCompanyDebts();
        } catch (error) {
            console.error('Error adding company debt:', error);
            toast.error('Failed to record company debt.');
        }
    };

    // Add this new function to handle debt editing:
const handleEditDebt = (debt) => {
    console.log('Editing debt:', debt); // Debug log
    
    setSelectedDebt(debt);
    setDebtForm({
        staff_id: debt.staff_id,
        staff_type: debt.staff_type,
        amount: debt.amount,
        reason: debt.reason,
        debt_type: debt.debt_type,
        status: debt.status
    });
    setShowDebtModal(true);
};

    // Update company debt
    const handleUpdateDebt = async (debtId, updates) => {
        try {
            await api.put(`/salaries/company-debts/${debtId}`, updates);
            toast.success('Company debt updated successfully!');
            fetchCompanyDebts();
        } catch (error) {
            console.error('Error updating company debt:', error);
            toast.error('Failed to update company debt.');
        }
    };

    // Add debt history entry
    const handleAddDebtHistory = async (debtId, historyData) => {
        try {
            await api.post(`/salaries/company-debts/${debtId}/history`, historyData);
            toast.success('Debt history updated successfully!');
            if (selectedDebt) {
                fetchDebtHistory(selectedDebt.staff_id, selectedDebt.staff_type);
            }
        } catch (error) {
            console.error('Error adding debt history:', error);
            toast.error('Failed to update debt history.');
        }
    };

    // Update useEffect to include allStaffFilters
    useEffect(() => {
        if (activeTab === 'all-staff') {
            fetchAllStaff();
        } else if (activeTab === 'company-debts') {
            fetchCompanyDebts();
        }
    }, [activeTab, allStaffFilters]); // Add allStaffFilters dependency


    // Fetch payments data with filters
    const fetchPayments = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/salaries/payments`, {
                params: { ...paymentFilters, page, limit: 50 }
            });
            setPayments(response.data.payments);
            setPagination(response.data.pagination || {
                page: 1,
                limit: 50,
                totalCount: 0,
                totalPages: 0
            });
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to fetch payment history.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch loans data with filters
    // Fetch loans data with filters - ADD DEBUGGING
    const fetchLoans = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/salaries/loans`, {
                params: { ...loanFilters, page, limit: 50 }
            });

            // ADD DEBUGGING - Log what the API returns
            console.log('Loans API Response:', response.data);
            console.log('First loan object:', response.data.loans[0]);

            setLoans(response.data.loans);
            setPagination(response.data.pagination || {
                page: 1,
                limit: 50,
                totalCount: 0,
                totalPages: 0
            });
        } catch (error) {
            console.error('Error fetching loans:', error);
            toast.error('Failed to fetch loan records.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch outstanding loan details for a user
    const fetchOutstandingLoans = async (userId) => {
        try {
            const response = await api.get(`/salaries/loans/details/${userId}`);
            setOutstandingLoans(response.data);
        } catch (error) {
            console.error('Error fetching outstanding loan details:', error);
        }
    };

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        if (activeTab === 'staff') {
            fetchStaff();
        } else if (activeTab === 'payments') {
            fetchPayments();
        } else if (activeTab === 'loans') {
            fetchLoans();
        }
    }, [activeTab, staffFilters, paymentFilters, loanFilters]);

    const handleStaffFilterChange = (key, value) => {
        setStaffFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePaymentFilterChange = (key, value) => {
        setPaymentFilters(prev => ({
            ...prev,
            [key]: value,
            ...(key === 'period' && value ? { startDate: '', endDate: '' } : {}),
            ...((key === 'startDate' || key === 'endDate') && value ? { period: '' } : {})
        }));
    };

    const handleLoanFilterChange = (key, value) => {
        setLoanFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleLoanChange = (e) => {
        const { name, value } = e.target;
        setLoanData(prev => ({ ...prev, [name]: value }));
    };

    // Add new loan - UPDATED VERSION
    const handleAddLoan = async () => {
        if (!loanData.user_id || !loanData.amount || !loanData.loan_date) {
            toast.error('Please fill in all required loan fields.');
            return;
        }

        try {
            // Create loan payload with staff_type included
            const loanPayload = {
                ...loanData,
                staff_type: selectedStaff?.staff_type || 'user' // Add staff_type from selected staff
            };

            console.log('Sending loan data:', loanPayload); // Debug log

            await api.post('/salaries/loans', loanPayload);
            toast.success('Loan recorded successfully!');

            // Refresh data
            fetchAllStaff(); // Changed from fetchStaff() to fetchAllStaff()
            if (activeTab === 'loans') {
                fetchLoans();
            }

            // Close modal and reset state
            setShowLoanModal(false);
            setLoanData({
                user_id: null,
                loan_date: format(new Date(), 'yyyy-MM-dd'),
                amount: '',
                reason: ''
            });

        } catch (error) {
            console.error('Error recording loan:', error);
            const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to record loan.';
            toast.error(errorMessage);
        }
    };


    // Open loan modal - UPDATED VERSION
    const handleOpenLoanModal = (staff) => {
        setSelectedStaff(staff);
        setLoanData(prev => ({
            ...prev,
            user_id: staff.id,
            staff_type: staff.staff_type // ADD THIS LINE - include staff_type
        }));
        setShowLoanModal(true);
    };

    // Open payment modal
    const handleOpenPaymentModal = async (staff) => {
        setSelectedStaff(staff);
        await fetchOutstandingLoans(staff.id);

        const baseSalary = parseFloat(staff.base_salary || 0);
        const allowances = parseFloat(staff.allowances || 0);
        const otherDeductions = parseFloat(staff.deductions || 0);
        const loanDeduction = parseFloat(staff.outstanding_loan_amount) || 0;

        // Calculate tax and pension based on rates from salary structure
        const taxRate = parseFloat(staff.tax_rate || 0);
        const pensionRate = parseFloat(staff.pension_rate || 0);
        const gross = baseSalary + allowances;

        // Calculate tax and pension amounts (DEDUCTIONS)
        const taxAmount = (gross * taxRate / 100);
        const pensionAmount = (gross * pensionRate / 100);

        // TOTAL DEDUCTIONS = Tax + Pension + Other Deductions + Loan Deductions
        const totalDeductions = taxAmount + pensionAmount + otherDeductions + loanDeduction;

        // NET AMOUNT = Gross Salary - ALL Deductions
        const net = gross - totalDeductions;

        setPaymentForm({
            user_id: staff.id,
            salary_period: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            base_salary: baseSalary.toFixed(2),
            allowances: allowances.toFixed(2),
            deductions: otherDeductions.toFixed(2),
            tax_amount: taxAmount.toFixed(2),
            pension_amount: pensionAmount.toFixed(2),
            net_amount: net.toFixed(2),
            payment_method: 'Bank Transfer',
            reference_number: '',
            notes: '',
            loan_deduction: loanDeduction.toFixed(2),
            loan_ids: outstandingLoans.map(loan => loan.id)
        });

        setTaxRate(taxRate);
        setPensionRate(pensionRate);
        setOtherDeductions(otherDeductions);
        setShowPaymentModal(true);
    };


    // Handle payment form changes
    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({ ...prev, [name]: value }));
    };

    // Handle tax rate change
    const handleTaxRateChange = (e) => {
        const newTaxRate = parseFloat(e.target.value) || 0;
        setTaxRate(newTaxRate);
        recalculatePayment();
    };

    // Handle pension rate change
    const handlePensionRateChange = (e) => {
        const newPensionRate = parseFloat(e.target.value) || 0;
        setPensionRate(newPensionRate);
        recalculatePayment();
    };

    // Handle other deductions change
    const handleOtherDeductionsChange = (e) => {
        const newOtherDeductions = parseFloat(e.target.value) || 0;
        setOtherDeductions(newOtherDeductions);
        recalculatePayment();
    };

    // Recalculate payment when any value changes
    const recalculatePayment = () => {
        if (!selectedStaff) return;

        const baseSalary = parseFloat(paymentForm.base_salary || 0);
        const allowances = parseFloat(paymentForm.allowances || 0);
        const gross = baseSalary + allowances;

        // Calculate tax and pension amounts (these are DEDUCTIONS)
        const taxAmount = (gross * taxRate / 100);
        const pensionAmount = (gross * pensionRate / 100);
        const loanDeduction = parseFloat(selectedStaff.outstanding_loan_amount) || 0;

        // TOTAL DEDUCTIONS = Tax + Pension + Other Deductions + Loan Deductions
        const totalDeductions = taxAmount + pensionAmount + otherDeductions + loanDeduction;

        // NET AMOUNT = Gross Salary - ALL Deductions
        const net = gross - totalDeductions;

        setPaymentForm(prev => ({
            ...prev,
            tax_amount: taxAmount.toFixed(2),
            pension_amount: pensionAmount.toFixed(2),
            loan_deduction: loanDeduction.toFixed(2),
            net_amount: net.toFixed(2),
            loan_ids: outstandingLoans.map(loan => loan.id)
        }));
    };

    // Recalculate when dependencies change
    useEffect(() => {
        if (selectedStaff && showPaymentModal) {
            recalculatePayment();
        }
    }, [selectedStaff, taxRate, pensionRate, otherDeductions, outstandingLoans, showPaymentModal]);

    // Process payment
    const handleProcessPayment = async () => {
        try {
            // Calculate gross amount
            const gross_amount = parseFloat(paymentForm.base_salary || 0) + parseFloat(paymentForm.allowances || 0);

            // Prepare payment data with all fields
            const paymentData = {
                ...paymentForm,
                base_salary: parseFloat(paymentForm.base_salary),
                allowances: parseFloat(paymentForm.allowances || 0),
                deductions: parseFloat(otherDeductions), // This is "other deductions"
                tax_amount: parseFloat(paymentForm.tax_amount || 0),
                pension_amount: parseFloat(paymentForm.pension_amount || 0),
                net_amount: parseFloat(paymentForm.net_amount),
                gross_amount: gross_amount, // Send calculated gross amount
                loan_deduction: parseFloat(paymentForm.loan_deduction),
                loan_ids: outstandingLoans.map(loan => loan.id),
                user_id: selectedStaff.id,
                staff_type: selectedStaff.staff_type || 'user', // <--- IMPORTANT: Pass the type!
                // ... all other payment fields
            };

            console.log('Sending payment data:', paymentData);

            const response = await api.post(`/salaries/payments`, paymentData);
            toast.success('Salary payment processed successfully!');
            setShowPaymentModal(false);
            fetchPayments();
            fetchStaff(); // Refresh staff to update outstanding loans
        } catch (error) {
            console.error('Error processing payment:', error);
            const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to process payment.';
            toast.error(errorMessage);
        }
    };

    // Recalculate net amount when dependencies change
    useEffect(() => {
        if (selectedStaff && showPaymentModal) {
            const loanDeduction = parseFloat(selectedStaff.outstanding_loan_amount) || 0;
            const totalDeductions = otherDeductions + loanDeduction;
            const gross = parseFloat(selectedStaff.base_salary || 0) + parseFloat(selectedStaff.allowances || 0);
            const net = gross - totalDeductions;

            setPaymentForm(prev => ({
                ...prev,
                gross_amount: gross.toFixed(2),
                net_amount: net.toFixed(2),
                loan_deduction: loanDeduction.toFixed(2),
                loan_ids: outstandingLoans.map(loan => loan.id)
            }));
        }
    }, [selectedStaff, otherDeductions, outstandingLoans, showPaymentModal]);

    // Update the handleSaveSalary function with better error handling
    const handleSaveSalary = async () => {
        try {
            // Determine the staff type and prepare the endpoint
            const staffType = selectedStaff.staff_type || 'user';
            const endpoint = `/salaries/staff/${staffType}/${selectedStaff.id}/salary`;

            console.log('Saving salary data:', {
                endpoint,
                staffType,
                staffId: selectedStaff.id,
                formData: salaryForm
            });

            const response = await api.post(endpoint, salaryForm);
            toast.success('Salary structure updated successfully!');
            setShowSalaryModal(false);
            fetchAllStaff(); // Refresh the all staff list
        } catch (error) {
            console.error('Error updating salary:', error);
            console.error('Error response:', error.response);

            const errorMessage = error.response?.data?.details ||
                error.response?.data?.error ||
                'Failed to update salary structure.';
            toast.error(errorMessage);
        }
    };

    // Clear filters
    const clearStaffFilters = () => {
        setStaffFilters({
            role: '',
            search: '',
            salaryType: '',
            minSalary: '',
            maxSalary: '',
            isActive: 'true'
        });
    };

    const clearPaymentFilters = () => {
        setPaymentFilters({
            userId: '',
            staffRole: '',
            startDate: '',
            endDate: '',
            period: '',
            status: '',
            paymentMethod: '',
            minAmount: '',
            maxAmount: '',
            search: ''
        });
    };

    const clearLoanFilters = () => {
        setLoanFilters({
            userId: '',
            status: '',
            startDate: '',
            endDate: ''
        });
    };

    // Quick period filters
    const applyQuickPeriod = (period) => {
        const now = new Date();
        let startDate = '';
        let endDate = format(now, 'yyyy-MM-dd');

        switch (period) {
            case 'today':
                startDate = format(now, 'yyyy-MM-dd');
                break;
            case 'week':
                startDate = format(new Date(now.setDate(now.getDate() - 7)), 'yyyy-MM-dd');
                break;
            case 'month':
                startDate = format(startOfMonth(now), 'yyyy-MM-dd');
                break;
            case 'last_month':
                const lastMonth = subMonths(now, 1);
                startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                break;
            case 'year':
                startDate = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
                break;
        }

        setPaymentFilters(prev => ({
            ...prev,
            startDate,
            endDate,
            period: ''
        }));
    };

// Replace the existing handleEditSalary function with this:
const handleEditSalary = (staffMember) => {
    console.log('Editing staff member:', staffMember); // Debug log
    
    setSelectedStaff(staffMember);
    setSalaryForm({
        base_salary: staffMember.base_salary || '',
        allowances: staffMember.allowances || '',
        deductions: staffMember.deductions || '',
        salary_type: staffMember.salary_type || 'monthly',
        bank_name: staffMember.bank_name || '',
        bank_account_name: staffMember.bank_account_name || '',
        account_number: staffMember.account_number || '',
        tax_rate: staffMember.tax_rate || '',
        pension_rate: staffMember.pension_rate || ''
    });
    setShowSalaryModal(true);
};

    const handleViewPaymentDetails = async (payment) => {
        try {
            const response = await api.get(`/salaries/payments/${payment.id}`);
            setPaymentDetails(response.data);
            setShowPaymentDetails(true);
        } catch (error) {
            console.error('Error fetching payment details:', error);
            toast.error('Failed to fetch payment details.');
        }
    };

    const formatCurrency = (amount) => {
        return `₦${parseFloat(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: 'sm-danger',
            manager: 'sm-warning',
            accountant: 'sm-info',
            sales: 'sm-success',
            staff: 'sm-primary'
        };
        return colors[role] || 'sm-secondary';
    };

    const getStatusBadge = (status) => {
        const colors = {
            paid: 'sm-success',
            pending: 'sm-warning',
            failed: 'sm-danger'
        };
        return <span className={`sm-badge ${colors[status] || 'sm-secondary'}`}>{status?.toUpperCase()}</span>;
    };

    const getLoanStatusBadge = (isPaid) => {
        return isPaid ?
            <span className="sm-badge sm-success">PAID</span> :
            <span className="sm-badge sm-warning">UNPAID</span>;
    };

    const handleModalClose = () => {
        setShowSalaryModal(false);
        setShowPaymentModal(false);
        setShowLoanModal(false);
        setShowPaymentDetails(false);
        setSelectedStaff(null);
        setSelectedPayment(null);
        setPaymentDetails(null);
    };

    // Add this function to your component
    const handlePrintPayment = (payment) => {
        const printWindow = window.open('', '_blank');
        const printDate = format(new Date(), 'MMMM dd, yyyy hh:mm a');

        const grossAmount = parseFloat(payment.base_salary || 0) + parseFloat(payment.allowances || 0);
        const totalDeductions =
            parseFloat(payment.tax_amount || 0) +
            parseFloat(payment.pension_amount || 0) +
            parseFloat(payment.deductions || 0) +
            parseFloat(payment.loan_deduction || 0);

        printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Salary Payment Receipt - ${payment.staff_name}</title>
            <style>
                @media print {
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        color: #333;
                        line-height: 1.4;
                    }
                    .receipt-header { 
                        text-align: center; 
                        border-bottom: 2px solid #333; 
                        padding-bottom: 15px; 
                        margin-bottom: 20px;
                    }
                    .receipt-header h1 { 
                        color: #2c5aa0; 
                        margin: 0; 
                        font-size: 24px;
                    }
                    .receipt-header .subtitle { 
                        color: #666; 
                        font-size: 14px;
                        margin: 5px 0;
                    }
                    .company-info {
                        text-align: center;
                        margin-bottom: 20px;
                        color: #666;
                        font-size: 12px;
                    }
                    .payment-info { 
                        margin-bottom: 25px; 
                    }
                    .info-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 15px; 
                        margin-bottom: 20px;
                    }
                    .info-item { 
                        margin-bottom: 8px; 
                    }
                    .info-label { 
                        font-weight: bold; 
                        color: #555;
                        display: inline-block;
                        width: 140px;
                    }
                    .breakdown-section { 
                        margin: 25px 0; 
                    }
                    .breakdown-header { 
                        background: #f8f9fa; 
                        padding: 10px; 
                        font-weight: bold; 
                        border: 1px solid #ddd;
                    }
                    .breakdown-item { 
                        display: flex; 
                        justify-content: space-between; 
                        padding: 8px 10px; 
                        border-left: 1px solid #ddd;
                        border-right: 1px solid #ddd;
                        border-bottom: 1px solid #ddd;
                    }
                    .breakdown-item:last-child { 
                        border-bottom: 1px solid #ddd;
                    }
                    .positive { color: #28a745; }
                    .negative { color: #dc3545; }
                    .gross { 
                        background: #e9ecef; 
                        font-weight: bold; 
                        border-top: 2px solid #333;
                    }
                    .total-deductions { 
                        background: #fff3cd; 
                        font-weight: bold;
                        border-top: 2px solid #ffc107;
                    }
                    .net-amount { 
                        background: #d4edda; 
                        font-weight: bold; 
                        border-top: 2px solid #28a745;
                        border-bottom: 2px solid #28a745 !important;
                    }
                    .divider { 
                        border-top: 1px dashed #999; 
                        margin: 15px 0; 
                    }
                    .notes-section { 
                        margin-top: 25px; 
                        padding: 15px; 
                        background: #f8f9fa; 
                        border: 1px solid #ddd;
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 30px; 
                        color: #666; 
                        font-size: 12px;
                        border-top: 1px solid #ddd;
                        padding-top: 15px;
                    }
                    .badge {
                        display: inline-block;
                        padding: 3px 8px;
                        background: #28a745;
                        color: white;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: bold;
                    }
                    @page { margin: 0.5in; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h1>SALARY PAYMENT RECEIPT</h1>
                <div class="subtitle">Official Payment Document</div>
            </div>

            <div class="company-info">
                <strong>Purple Premium Bread Company</strong><br>
                Salary Management System<br>
                Generated on: ${printDate}
            </div>

            <div class="payment-info">
                <div class="info-grid">
                    <div>
                        <div class="info-item"><span class="info-label">Staff Name:</span> ${payment.staff_name}</div>
                        <div class="info-item"><span class="info-label">Role:</span> ${payment.staff_role}</div>
                        <div class="info-item"><span class="info-label">Salary Period:</span> ${payment.salary_period ? format(new Date(payment.salary_period), 'MMMM yyyy') : 'N/A'}</div>
                    </div>
                    <div>
                        <div class="info-item"><span class="info-label">Payment Date:</span> ${format(new Date(payment.payment_date), 'MMMM dd, yyyy')}</div>
                        <div class="info-item"><span class="info-label">Payment Method:</span> ${payment.payment_method}</div>
                        <div class="info-item"><span class="info-label">Status:</span> <span class="badge">${payment.status?.toUpperCase()}</span></div>
                    </div>
                </div>
                ${payment.payment_reference ? `<div class="info-item"><span class="info-label">Reference:</span> ${payment.payment_reference}</div>` : ''}
                ${payment.paid_by_name ? `<div class="info-item"><span class="info-label">Processed By:</span> ${payment.paid_by_name}</div>` : ''}
            </div>

            <div class="breakdown-section">
                <div class="breakdown-header">SALARY BREAKDOWN</div>
                
                <div class="breakdown-item">
                    <span>Base Salary:</span>
                    <span>${formatCurrency(payment.base_salary)}</span>
                </div>
                <div class="breakdown-item positive">
                    <span>Allowances:</span>
                    <span>+${formatCurrency(payment.allowances)}</span>
                </div>
                <div class="breakdown-item gross">
                    <span>Gross Salary:</span>
                    <span>${formatCurrency(grossAmount)}</span>
                </div>

                <div class="divider"></div>

                <div class="breakdown-header">DEDUCTIONS</div>
                
                <div class="breakdown-item negative">
                    <span>Tax Deduction:</span>
                    <span>-${formatCurrency(payment.tax_amount)}</span>
                </div>
                <div class="breakdown-item negative">
                    <span>Pension Deduction:</span>
                    <span>-${formatCurrency(payment.pension_amount)}</span>
                </div>
                <div class="breakdown-item negative">
                    <span>Other Deductions:</span>
                    <span>-${formatCurrency(payment.deductions)}</span>
                </div>
                <div class="breakdown-item negative">
                    <span>Loan Deductions:</span>
                    <span>-${formatCurrency(payment.loan_deduction)}</span>
                </div>
                <div class="breakdown-item total-deductions">
                    <span>Total Deductions:</span>
                    <span>-${formatCurrency(totalDeductions)}</span>
                </div>

                <div class="breakdown-item net-amount">
                    <span>NET AMOUNT PAID:</span>
                    <span><strong>${formatCurrency(payment.net_amount)}</strong></span>
                </div>
            </div>

            ${payment.notes ? `
            <div class="notes-section">
                <strong>Notes:</strong><br>
                ${payment.notes}
            </div>
            ` : ''}

            <div class="footer">
                This is an computer-generated receipt. No signature required.<br>
                For inquiries, please contact the HR department.
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                }
            </script>
        </body>
        </html>
    `);

        printWindow.document.close();
    };

    return (
        <div className="sm-page">
            <ToastContainer position="top-right" />

            {/* Header Section */}
            <div className="sm-header">
                <div className="sm-header-content">
                    <h1 className="sm-title">
                        <FiDollarSign className="sm-title-icon" />
                        Salary & Wages Management
                    </h1>
                    <p className="sm-subtitle">
                        Manage staff, salaries, loans, company debts and process payments
                    </p>
                </div>
                <button
                    className="sm-btn sm-btn--ghost sm-btn--icon"
                    onClick={() => setFiltersOpen(!filtersOpen)}
                >
                    <FiFilter className="sm-btn-icon" />
                    {filtersOpen ? 'Hide Filters' : 'Show Filters'}
                    {filtersOpen ? <FiChevronUp className="sm-btn-icon" /> : <FiChevronDown className="sm-btn-icon" />}
                </button>
            </div>

            {/* Tabs */}
            <div className="sm-tabs">

                <div className="sm-tabs__header">
                    <button
                        className={`sm-tabs__tab ${activeTab === 'all-staff' ? 'sm-tabs__tab--active' : ''}`}
                        onClick={() => setActiveTab('all-staff')}
                    >
                        <FiUsers className="sm-tabs__icon" />
                        All Staff
                    </button>
                    <button
                        className={`sm-tabs__tab ${activeTab === 'payments' ? 'sm-tabs__tab--active' : ''}`}
                        onClick={() => setActiveTab('payments')}
                    >
                        <FiCreditCard className="sm-tabs__icon" />
                        Payment History
                    </button>
                    <button
                        className={`sm-tabs__tab ${activeTab === 'loans' ? 'sm-tabs__tab--active' : ''}`}
                        onClick={() => setActiveTab('loans')}
                    >
                        <FiArrowUp className="sm-tabs__icon" />
                        Loan Records
                    </button>
                    <button
                        className={`sm-tabs__tab ${activeTab === 'company-debts' ? 'sm-tabs__tab--active' : ''}`}
                        onClick={() => setActiveTab('company-debts')}
                    >
                        <FiList className="sm-tabs__icon" />
                        Company Debts
                    </button>
                </div>

                {/* All Staff Tab */}
                {activeTab === 'all-staff' && (
                    <div className="sm-tab-content">
                        {/* All Staff Filters */}
                        {filtersOpen && (
                            <div className="sm-card">
                                <div className="sm-card__header">
                                    <div className="sm-card__title">
                                        <FiFilter />
                                        Staff Filters
                                    </div>
                                    <span className="sm-badge sm-badge--secondary">{allStaff.length} staff members</span>
                                </div>
                                <div className="sm-card__body">
                                    <div className="sm-filters-grid">
                                        <div className="sm-field">
                                            <label className="sm-label">Staff Type</label>
                                            <div className="sm-input">
                                                <select
                                                    value={allStaffFilters.staffType}
                                                    onChange={(e) => handleAllStaffFilterChange('staffType', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Types</option>
                                                    <option value="user">System Users</option>
                                                    <option value="staff_member">Staff Members</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Role</label>
                                            <div className="sm-input">
                                                <select
                                                    value={allStaffFilters.role}
                                                    onChange={(e) => handleAllStaffFilterChange('role', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Roles</option>
                                                    {filterOptions.roles?.map(role => (
                                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Salary Type</label>
                                            <div className="sm-input">
                                                <select
                                                    value={allStaffFilters.salaryType}
                                                    onChange={(e) => handleAllStaffFilterChange('salaryType', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Types</option>
                                                    {filterOptions.salaryTypes?.map(type => (
                                                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Min Salary (₦)</label>
                                            <div className="sm-input">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={allStaffFilters.minSalary}
                                                    onChange={(e) => handleAllStaffFilterChange('minSalary', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Max Salary (₦)</label>
                                            <div className="sm-input">
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={allStaffFilters.maxSalary}
                                                    onChange={(e) => handleAllStaffFilterChange('maxSalary', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field sm-field--full">
                                            <label className="sm-label">Search Staff</label>
                                            <div className="sm-input sm-input--icon">
                                                <FiSearch className="sm-input__icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name, email, or phone..."
                                                    value={allStaffFilters.search}
                                                    onChange={(e) => handleAllStaffFilterChange('search', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Status</label>
                                            <div className="sm-input">
                                                <select
                                                    value={allStaffFilters.isActive}
                                                    onChange={(e) => handleAllStaffFilterChange('isActive', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="true">Active Only</option>
                                                    <option value="false">Inactive Only</option>
                                                    <option value="">All Status</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field sm-field--actions">
                                            <button
                                                className="sm-btn sm-btn--ghost"
                                                onClick={clearAllStaffFilters}
                                            >
                                                <FiX />
                                                Clear Filters
                                            </button>
                                            <button
                                                className="sm-btn sm-btn--primary"
                                                onClick={fetchAllStaff}
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* All Staff Table */}
                        <div className="sm-card">
                            <div className="sm-card__header">
                                <div className="sm-card__title">
                                    <FiUsers />
                                    All Staff Members
                                </div>
                                <div className="sm-header-actions">
                                    <button
                                        className="sm-btn sm-btn--primary"
                                        onClick={() => setShowStaffModal(true)}
                                    >
                                        <FiUserPlus />
                                        Add Staff Member
                                    </button>
                                </div>
                            </div>
                            <div className="sm-card__body">
                                {loading ? (
                                    <div className="sm-loading">
                                        <div className="sm-spinner"></div>
                                        <div className="sm-loading-text">Loading staff data...</div>
                                    </div>
                                ) : allStaff.length === 0 ? (
                                    <div className="sm-empty-state">
                                        <FiUsers className="sm-empty-icon" />
                                        <h3>No Staff Members Found</h3>
                                        <p>No staff members found matching your filters.</p>
                                    </div>
                                ) : (
                                    <div className="sm-table-container">
                                        <table className="sm-table">
                                            <thead className="sm-table__head">
                                                <tr>
                                                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--index">S/N</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Name</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Type</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Role/Position</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Contact</th>
                                                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Base Salary</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Bank Details</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Status</th>
                                                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--actions">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="sm-table__body">
                                                {allStaff.map((staff, index) => (
                                                    <tr key={`${staff.staff_type}-${staff.id}`} className="sm-table__row">
                                                        <td className="sm-table__cell sm-table__cell--index">{index + 1}</td>
                                                        <td className="sm-table__cell sm-table__cell--staff">
                                                            <div className="sm-staff-info">
                                                                <strong>{staff.fullname}</strong>
                                                                {staff.staff_type === 'staff_member' && (
                                                                    <div className="sm-staff-badge">Non-User</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            <span className={`sm-badge ${staff.staff_type === 'user' ? 'sm-badge--primary' : 'sm-badge--secondary'
                                                                }`}>
                                                                {staff.staff_type === 'user' ? 'System User' : 'Staff Member'}
                                                            </span>
                                                        </td>
                                                        <td className="sm-table__cell">{staff.role}</td>
                                                        <td className="sm-table__cell">
                                                            <div className="sm-staff-info">
                                                                <div>{staff.email}</div>
                                                                <div className="sm-staff-meta">{staff.phone_number}</div>
                                                            </div>
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--amount">
                                                            {formatCurrency(staff.base_salary)}
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            <div className="sm-bank-details">
                                                                {staff.bank_name ? (
                                                                    <>
                                                                        <div><strong>Bank:</strong> {staff.bank_name}</div>
                                                                        <div><strong>Account Name:</strong> {staff.bank_account_name || 'Not set'}</div>
                                                                        <div><strong>Account No:</strong> {staff.account_number || 'Not set'}</div>
                                                                    </>
                                                                ) : (
                                                                    <span className="sm-text-muted">Not set</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            <span className={`sm-badge ${staff.is_active ? 'sm-badge--success' : 'sm-badge--danger'
                                                                }`}>
                                                                {staff.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--actions">
                                                            <div className="sm-actions">
{/* // In the actions column of the All Staff table, change the edit button to: */}
<button
    className="sm-action-btn sm-action-btn--edit"
    onClick={() => handleEditSalary(staff)}
    title="Edit Salary"
>
    <FiEdit />
</button>
                                                                <button
                                                                    className="sm-action-btn sm-action-btn--success"
                                                                    onClick={() => handleOpenPaymentModal(staff)}
                                                                    title="Process Payment"
                                                                >
                                                                    <FiDollarSign />
                                                                </button>
                                                                <button
                                                                    className="sm-action-btn sm-action-btn--warning"
                                                                    onClick={() => handleOpenLoanModal(staff)}
                                                                    title="Record Loan"
                                                                >
                                                                    <FiArrowUp />
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
                    </div>
                )}

                {/* Company Debts Tab */}
                {activeTab === 'company-debts' && (
                    <div className="sm-tab-content">
                        {/* Company Debts Filters */}
                        {filtersOpen && (
                            <div className="sm-card">
                                <div className="sm-card__header">
                                    <div className="sm-card__title">
                                        <FiFilter />
                                        Debt Filters
                                    </div>
                                    <span className="sm-badge sm-badge--secondary">{companyDebts.length} debt records</span>
                                </div>
                                <div className="sm-card__body">
                                    <div className="sm-filters-grid">
                                        <div className="sm-field">
                                            <label className="sm-label">Staff Type</label>
                                            <div className="sm-input">
                                                <select
                                                    value={debtFilters.staffType}
                                                    onChange={(e) => handleDebtFilterChange('staffType', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Types</option>
                                                    <option value="user">System Users</option>
                                                    <option value="staff_member">Staff Members</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Debt Type</label>
                                            <div className="sm-input">
                                                <select
                                                    value={debtFilters.debtType}
                                                    onChange={(e) => handleDebtFilterChange('debtType', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Types</option>
                                                    <option value="owed_to_company">Owed to Company</option>
                                                    <option value="owed_by_company">Owed by Company</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Status</label>
                                            <div className="sm-input">
                                                <select
                                                    value={debtFilters.status}
                                                    onChange={(e) => handleDebtFilterChange('status', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Status</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="partially_paid">Partially Paid</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="written_off">Written Off</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Min Amount (₦)</label>
                                            <div className="sm-input">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={debtFilters.minAmount}
                                                    onChange={(e) => handleDebtFilterChange('minAmount', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Max Amount (₦)</label>
                                            <div className="sm-input">
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={debtFilters.maxAmount}
                                                    onChange={(e) => handleDebtFilterChange('maxAmount', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">From Date</label>
                                            <div className="sm-input">
                                                <input
                                                    type="date"
                                                    value={debtFilters.startDate}
                                                    onChange={(e) => handleDebtFilterChange('startDate', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">To Date</label>
                                            <div className="sm-input">
                                                <input
                                                    type="date"
                                                    value={debtFilters.endDate}
                                                    onChange={(e) => handleDebtFilterChange('endDate', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field sm-field--full">
                                            <label className="sm-label">Search</label>
                                            <div className="sm-input sm-input--icon">
                                                <FiSearch className="sm-input__icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by staff name or reason..."
                                                    value={debtFilters.search}
                                                    onChange={(e) => handleDebtFilterChange('search', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field sm-field--actions">
                                            <button
                                                className="sm-btn sm-btn--ghost"
                                                onClick={clearDebtFilters}
                                            >
                                                <FiX />
                                                Clear Filters
                                            </button>
                                            <button
                                                className="sm-btn sm-btn--primary"
                                                onClick={fetchCompanyDebts}
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Company Debts Table */}
                        <div className="sm-card">
                            <div className="sm-card__header">
                                <div className="sm-card__title">
                                    <FiList />
                                    Company Debts Management
                                </div>
                                <div className="sm-header-actions">
                                    <button
                                        className="sm-btn sm-btn--primary"
                                        onClick={() => setShowDebtModal(true)}
                                    >
                                        <FiPlus />
                                        Add Debt Record
                                    </button>
                                </div>
                            </div>
                            <div className="sm-card__body">
                                {loading ? (
                                    <div className="sm-loading">
                                        <div className="sm-spinner"></div>
                                        <div className="sm-loading-text">Loading debt records...</div>
                                    </div>
                                ) : companyDebts.length === 0 ? (
                                    <div className="sm-empty-state">
                                        <FiList className="sm-empty-icon" />
                                        <h3>No Debt Records Found</h3>
                                        <p>No company debt records found matching your filters.</p>
                                    </div>
                                ) : (
                                    <div className="sm-table-container">
                                        <table className="sm-table">
                                            <thead className="sm-table__head">
                                                <tr>
                                                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--index">S/N</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Staff Member</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Type</th>
                                                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Amount</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Reason</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Status</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Date Recorded</th>
                                                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--actions">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="sm-table__body">
                                                {companyDebts.map((debt, index) => (
                                                    <tr key={debt.id} className="sm-table__row">
                                                        <td className="sm-table__cell sm-table__cell--index">{index + 1}</td>
                                                        <td className="sm-table__cell sm-table__cell--staff">
                                                            <div className="sm-staff-info">
                                                                <strong>{debt.staff_name}</strong>
                                                                <div className="sm-staff-meta">{debt.staff_type}</div>
                                                            </div>
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            <span className={`sm-badge ${debt.debt_type === 'owed_to_company' ? 'sm-badge--danger' : 'sm-badge--info'
                                                                }`}>
                                                                {debt.debt_type === 'owed_to_company' ? 'Owed to Company' : 'Owed by Company'}
                                                            </span>
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--amount">
                                                            {formatCurrency(debt.amount)}
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            {debt.reason}
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            <span className={`sm-badge ${debt.status === 'paid' ? 'sm-badge--success' :
                                                                debt.status === 'partially_paid' ? 'sm-badge--warning' : 'sm-badge--danger'
                                                                }`}>
                                                                {debt.status.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--date">
                                                            {format(new Date(debt.created_at), 'MMM dd, yyyy')}
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--actions">
                                                            <div className="sm-actions">
{/* // Replace the existing edit button in company debts with: */}
<button
    className="sm-action-btn sm-action-btn--edit"
    onClick={() => handleEditDebt(debt)}
    title="Edit Debt"
>
    <FiEdit />
</button>
                                                                <button
                                                                    className="sm-action-btn sm-action-btn--info"
                                                                    onClick={() => {
                                                                        setSelectedDebt(debt);
                                                                        fetchDebtHistory(debt.staff_id, debt.staff_type);
                                                                        setShowDebtHistoryModal(true);
                                                                    }}
                                                                    title="View History"
                                                                >
                                                                    <RiFileHistoryFill />
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
                    </div>
                )}

                {/* Payment History Tab */}
                {activeTab === 'payments' && (
                    <div className="sm-tab-content">
                        {/* Payment Filters */}
                        {filtersOpen && (
                            <div className="sm-card">
                                <div className="sm-card__header">
                                    <div className="sm-card__title">
                                        <FiFilter />
                                        Payment Filters
                                    </div>
                                    <span className="sm-badge sm-badge--secondary">{pagination.totalCount} payments</span>
                                </div>
                                <div className="sm-card__body">
                                    <div className="sm-filters-grid">
                                        <div className="sm-field">
                                            <label className="sm-label">Staff Role</label>
                                            <div className="sm-input">
                                                <select
                                                    value={paymentFilters.staffRole}
                                                    onChange={(e) => handlePaymentFilterChange('staffRole', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Roles</option>
                                                    {filterOptions.roles?.map(role => (
                                                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Status</label>
                                            <div className="sm-input">
                                                <select
                                                    value={paymentFilters.status}
                                                    onChange={(e) => handlePaymentFilterChange('status', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Status</option>
                                                    {filterOptions.statuses?.map(status => (
                                                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Payment Method</label>
                                            <div className="sm-input">
                                                <select
                                                    value={paymentFilters.paymentMethod}
                                                    onChange={(e) => handlePaymentFilterChange('paymentMethod', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Methods</option>
                                                    {filterOptions.paymentMethods?.map(method => (
                                                        <option key={method} value={method}>{method}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Quick Period</label>
                                            <div className="sm-input">
                                                <select
                                                    value={paymentFilters.period}
                                                    onChange={(e) => handlePaymentFilterChange('period', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">Custom Date Range</option>
                                                    <option value="today">Today</option>
                                                    <option value="week">Last 7 Days</option>
                                                    <option value="month">This Month</option>
                                                    <option value="last_month">Last Month</option>
                                                    <option value="year">This Year</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">From Date</label>
                                            <div className="sm-input">
                                                <input
                                                    type="date"
                                                    value={paymentFilters.startDate}
                                                    onChange={(e) => handlePaymentFilterChange('startDate', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">To Date</label>
                                            <div className="sm-input">
                                                <input
                                                    type="date"
                                                    value={paymentFilters.endDate}
                                                    onChange={(e) => handlePaymentFilterChange('endDate', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Min Amount (₦)</label>
                                            <div className="sm-input">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={paymentFilters.minAmount}
                                                    onChange={(e) => handlePaymentFilterChange('minAmount', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">Max Amount (₦)</label>
                                            <div className="sm-input">
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={paymentFilters.maxAmount}
                                                    onChange={(e) => handlePaymentFilterChange('maxAmount', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field sm-field--full">
                                            <label className="sm-label">Search</label>
                                            <div className="sm-input sm-input--icon">
                                                <FiSearch className="sm-input__icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name, email, or reference..."
                                                    value={paymentFilters.search}
                                                    onChange={(e) => handlePaymentFilterChange('search', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field sm-field--actions">
                                            <button
                                                className="sm-btn sm-btn--ghost"
                                                onClick={clearPaymentFilters}
                                            >
                                                <FiX />
                                                Clear Filters
                                            </button>
                                            <button
                                                className="sm-btn sm-btn--primary"
                                                onClick={() => fetchPayments(1)}
                                            >
                                                Apply Filters
                                            </button>
                                        </div>

                                        <div className="sm-field sm-field--full">
                                            <div className="sm-quick-periods">
                                                <button
                                                    className="sm-btn sm-btn--outline sm-btn--small"
                                                    onClick={() => applyQuickPeriod('today')}
                                                >
                                                    Today
                                                </button>
                                                <button
                                                    className="sm-btn sm-btn--outline sm-btn--small"
                                                    onClick={() => applyQuickPeriod('week')}
                                                >
                                                    Last 7 Days
                                                </button>
                                                <button
                                                    className="sm-btn sm-btn--outline sm-btn--small"
                                                    onClick={() => applyQuickPeriod('month')}
                                                >
                                                    This Month
                                                </button>
                                                <button
                                                    className="sm-btn sm-btn--outline sm-btn--small"
                                                    onClick={() => applyQuickPeriod('last_month')}
                                                >
                                                    Last Month
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Table */}
                        <div className="sm-card">
                            <div className="sm-card__header">
                                <div className="sm-card__title">
                                    <FiCreditCard />
                                    Salary Payment History
                                </div>
                                <div className="sm-header-badges">
                                    <span className="sm-badge sm-badge--success">{payments.length} Payments</span>
                                    <span className="sm-badge sm-badge--info">
                                        Total: {formatCurrency(payments.reduce((sum, payment) => sum + parseFloat(payment.net_amount || 0), 0))}
                                    </span>
                                </div>
                            </div>
                            <div className="sm-card__body">
                                {loading ? (
                                    <div className="sm-loading">
                                        <div className="sm-spinner"></div>
                                        <div className="sm-loading-text">Loading payment history...</div>
                                    </div>
                                ) : payments.length === 0 ? (
                                    <div className="sm-empty-state">
                                        <FiCreditCard className="sm-empty-icon" />
                                        <h3>No Salary Payments Found</h3>
                                        <p>No salary payments found for the selected filters.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Payment History Table */}
                                        <div className="sm-table-container">
                                            <table className="sm-table">
                                                <thead className="sm-table__head">
                                                    <tr>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--index">S/N</th>
                                                        <th className="sm-table__cell sm-table__cell--header">Payment Date</th>
                                                        <th className="sm-table__cell sm-table__cell--header">Staff Member</th>
                                                        <th className="sm-table__cell sm-table__cell--header">Role</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Base Salary</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Allowances</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Gross Amount</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Tax</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Pension</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Other Deductions</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Loan Deductions</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Total Deductions</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Net Amount</th>
                                                        <th className="sm-table__cell sm-table__cell--header">Payment Method</th>
                                                        <th className="sm-table__cell sm-table__cell--header">Status</th>
                                                        <th className="sm-table__cell sm-table__cell--header sm-table__cell--actions">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="sm-table__body">
                                                    {payments.map((payment, index) => {
                                                        const totalDeductions =
                                                            parseFloat(payment.tax_amount || 0) +
                                                            parseFloat(payment.pension_amount || 0) +
                                                            parseFloat(payment.deductions || 0) +
                                                            parseFloat(payment.loan_deduction || 0);

                                                        const grossAmount =
                                                            parseFloat(payment.base_salary || 0) +
                                                            parseFloat(payment.allowances || 0);

                                                        return (
                                                            <tr key={payment.id} className="sm-table__row">
                                                                <td className="sm-table__cell sm-table__cell--index">{index + 1}</td>
                                                                <td className="sm-table__cell sm-table__cell--date">
                                                                    {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--staff">
                                                                    <div className="sm-staff-info">
                                                                        <strong>{payment.staff_name}</strong>
                                                                        {payment.staff_email && (
                                                                            <div className="sm-staff-meta">{payment.staff_email}</div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--role">
                                                                    <span className={`sm-badge ${getRoleBadgeColor(payment.staff_role)}`}>
                                                                        {payment.staff_role?.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount">
                                                                    {formatCurrency(payment.base_salary)}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--positive">
                                                                    +{formatCurrency(payment.allowances)}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--gross">
                                                                    <strong>{formatCurrency(grossAmount)}</strong>
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--negative">
                                                                    -{formatCurrency(payment.tax_amount)}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--negative">
                                                                    -{formatCurrency(payment.pension_amount)}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--negative">
                                                                    -{formatCurrency(payment.deductions)}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--negative">
                                                                    -{formatCurrency(payment.loan_deduction)}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--negative">
                                                                    <strong>-{formatCurrency(totalDeductions)}</strong>
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--amount sm-table__cell--net">
                                                                    <strong>{formatCurrency(payment.net_amount)}</strong>
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--method">
                                                                    {payment.payment_method}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--status">
                                                                    {getStatusBadge(payment.status)}
                                                                </td>
                                                                <td className="sm-table__cell sm-table__cell--actions">
                                                                    <div className="sm-actions">
                                                                        <button
                                                                            className="sm-action-btn sm-action-btn--info"
                                                                            onClick={() => handleViewPaymentDetails(payment)}
                                                                            title="View payment details"
                                                                        >
                                                                            <FiEye />
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
                                        {pagination.totalPages > 1 && (
                                            <div className="sm-pagination">
                                                <button
                                                    className="sm-pagination-btn"
                                                    disabled={pagination.page === 1}
                                                    onClick={() => fetchPayments(pagination.page - 1)}
                                                >
                                                    Previous
                                                </button>

                                                <div className="sm-pagination-pages">
                                                    {[...Array(pagination.totalPages)].map((_, i) => (
                                                        <button
                                                            key={i + 1}
                                                            className={`sm-pagination-page ${i + 1 === pagination.page ? 'sm-pagination-page--active' : ''}`}
                                                            onClick={() => fetchPayments(i + 1)}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    className="sm-pagination-btn"
                                                    disabled={pagination.page === pagination.totalPages}
                                                    onClick={() => fetchPayments(pagination.page + 1)}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loan Records Tab */}
                {activeTab === 'loans' && (
                    <div className="sm-tab-content">
                        {/* Loan Filters */}
                        {filtersOpen && (
                            <div className="sm-card">
                                <div className="sm-card__header">
                                    <div className="sm-card__title">
                                        <FiFilter />
                                        Loan Filters
                                    </div>
                                    <span className="sm-badge sm-badge--secondary">{loans.length} loans</span>
                                </div>
                                <div className="sm-card__body">
                                    <div className="sm-filters-grid">
                                        <div className="sm-field">
                                            <label className="sm-label">Status</label>
                                            <div className="sm-input">
                                                <select
                                                    value={loanFilters.status}
                                                    onChange={(e) => handleLoanFilterChange('status', e.target.value)}
                                                    className="sm-input__field"
                                                >
                                                    <option value="">All Status</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="unpaid">Unpaid</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">From Date</label>
                                            <div className="sm-input">
                                                <input
                                                    type="date"
                                                    value={loanFilters.startDate}
                                                    onChange={(e) => handleLoanFilterChange('startDate', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field">
                                            <label className="sm-label">To Date</label>
                                            <div className="sm-input">
                                                <input
                                                    type="date"
                                                    value={loanFilters.endDate}
                                                    onChange={(e) => handleLoanFilterChange('endDate', e.target.value)}
                                                    className="sm-input__field"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm-field sm-field--actions">
                                            <button
                                                className="sm-btn sm-btn--ghost"
                                                onClick={clearLoanFilters}
                                            >
                                                <FiX />
                                                Clear Filters
                                            </button>
                                            <button
                                                className="sm-btn sm-btn--primary"
                                                onClick={() => fetchLoans(1)}
                                            >
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loans Table */}
                        {/* Loans Table - UPDATED WITH BETTER ERROR HANDLING */}
                        <div className="sm-card">
                            <div className="sm-card__header">
                                <div className="sm-card__title">
                                    <FiArrowUp />
                                    Loan Records
                                </div>
                                <span className="sm-badge sm-badge--total-loans">{loans.length} Total Loans</span>
                            </div>
                            <div className="sm-card__body">
                                {loading ? (
                                    <div className="sm-loading">
                                        <div className="sm-spinner"></div>
                                        <div className="sm-loading-text">Loading loan records...</div>
                                    </div>
                                ) : loans.length === 0 ? (
                                    <div className="sm-empty-state">
                                        <FiArrowUp className="sm-empty-icon" />
                                        <h3>No Loan Records Found</h3>
                                        <p>No loan records found matching your filters.</p>
                                    </div>
                                ) : (
                                    <div className="sm-table-container">
                                        <table className="sm-table">
                                            <thead className="sm-table__head">
                                                <tr>
                                                    <th className='sm-table__cell sm-table__cell--header'>S/N</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Staff Member</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Loan Date</th>
                                                    <th className="sm-table__cell sm-table__cell--header sm-table__cell--amount">Amount</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Reason</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Status</th>
                                                    <th className="sm-table__cell sm-table__cell--header">Deducted On</th>
                                                </tr>
                                            </thead>
                                            <tbody className="sm-table__body">
                                                {loans.map((loan, index) => (
                                                    <tr key={loan.id} className="sm-table__row">
                                                        <td className='sm-table__cell sm-table__cell--index'>{index + 1}</td>
                                                        <td className="sm-table__cell sm-table__cell--staff">
                                                            <div className="sm-staff-info">
                                                                <strong>{loan.borrower_name || loan.staff_name || 'Unknown Staff'}</strong>
                                                                <div className="sm-staff-meta">
                                                                    {loan.borrower_role || loan.staff_role || 'No role'}
                                                                    {loan.staff_type && (
                                                                        <span className="sm-staff-type"> ({loan.staff_type})</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--date">
                                                            {format(new Date(loan.loan_date), 'MMM dd, yyyy')}
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--amount">
                                                            <strong>{formatCurrency(loan.amount)}</strong>
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            {loan.reason || 'N/A'}
                                                        </td>
                                                        <td className="sm-table__cell">
                                                            {getLoanStatusBadge(loan.is_paid)}
                                                        </td>
                                                        <td className="sm-table__cell sm-table__cell--date">
                                                            {loan.deducted_date ? (
                                                                format(new Date(loan.deducted_date), 'MMM dd, yyyy')
                                                            ) : (
                                                                <span className="sm-not-available">Not deducted</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Salary Modal */}
            {showSalaryModal && (
                <div className="sm-modal">
                    <div className="sm-modal__content">
                        <div className="sm-modal__header">
                            <h3 className="sm-modal__title">
                                <FiEdit className="sm-modal__icon" />
                                Edit Salary Structure - {selectedStaff?.fullname || selectedStaff?.username}
                            </h3>
                            <button className="sm-modal__close" onClick={() => setShowSalaryModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="sm-modal__body">
                            <div className="sm-form-grid">
                                <div className="sm-field">
                                    <label className="sm-label">Base Salary (₦) *</label>
                                    <div className="sm-input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={salaryForm.base_salary}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, base_salary: e.target.value }))}
                                            className="sm-input__field"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Salary Type</label>
                                    <div className="sm-input">
                                        <select
                                            value={salaryForm.salary_type}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, salary_type: e.target.value }))}
                                            className="sm-input__field"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="daily">Daily</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Allowances (₦)</label>
                                    <div className="sm-input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={salaryForm.allowances}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, allowances: e.target.value }))}
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Deductions (₦)</label>
                                    <div className="sm-input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={salaryForm.deductions}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, deductions: e.target.value }))}
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Tax Rate (%)</label>
                                    <div className="sm-input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={salaryForm.tax_rate}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, tax_rate: e.target.value }))}
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Pension Rate (%)</label>
                                    <div className="sm-input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={salaryForm.pension_rate}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, pension_rate: e.target.value }))}
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Bank Name</label>
                                    <div className="sm-input">
                                        <input
                                            type="text"
                                            value={salaryForm.bank_name}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, bank_name: e.target.value }))}
                                            placeholder="e.g., First Bank, GTBank"
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>

                                {/* NEW BANK ACCOUNT NAME FIELD */}
                                <div className="sm-field">
                                    <label className="sm-label">Bank Account Name</label>
                                    <div className="sm-input">
                                        <input
                                            type="text"
                                            value={salaryForm.bank_account_name}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, bank_account_name: e.target.value }))}
                                            placeholder="Account holder's name as it appears in bank"
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Account Number</label>
                                    <div className="sm-input">
                                        <input
                                            type="text"
                                            value={salaryForm.account_number}
                                            onChange={(e) => setSalaryForm(prev => ({ ...prev, account_number: e.target.value }))}
                                            placeholder="10-digit account number"
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>

                                <div className="sm-field sm-field--full">
                                    <div className="sm-summary-card">
                                        <div className="sm-summary-card__header">
                                            <h6>Salary Summary</h6>
                                        </div>
                                        <div className="sm-summary-card__body">
                                            <div className="sm-summary-grid">
                                                <div className="sm-summary-item">
                                                    <span className="sm-summary-label">Base Salary:</span>
                                                    <span className="sm-summary-value">{formatCurrency(salaryForm.base_salary)}</span>
                                                </div>
                                                <div className="sm-summary-item">
                                                    <span className="sm-summary-label">Allowances:</span>
                                                    <span className="sm-summary-value sm-summary-value--positive">+{formatCurrency(salaryForm.allowances)}</span>
                                                </div>
                                                <div className="sm-summary-item">
                                                    <span className="sm-summary-label">Deductions:</span>
                                                    <span className="sm-summary-value sm-summary-value--negative">-{formatCurrency(salaryForm.deductions)}</span>
                                                </div>
                                                <div className="sm-summary-item sm-summary-item--total">
                                                    <span className="sm-summary-label">Net Salary:</span>
                                                    <span className="sm-summary-value sm-summary-value--net">
                                                        {formatCurrency(
                                                            (parseFloat(salaryForm.base_salary || 0) +
                                                                parseFloat(salaryForm.allowances || 0) -
                                                                parseFloat(salaryForm.deductions || 0))
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sm-modal__footer">
                            <button className="sm-btn sm-btn--ghost" onClick={() => setShowSalaryModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="sm-btn sm-btn--primary"
                                onClick={handleSaveSalary}
                            >
                                <FiSave />
                                Update Salary Structure
                            </button>
                        </div>
                    </div>
                </div>
            )}

{/* Payment Modal */}
{showPaymentModal && (
    <div className="sm-modal">
        <div className="sm-modal__content">
            <div className="sm-modal__header">
                <h3 className="sm-modal__title">
                    <FiDollarSign className="sm-modal__icon" />
                    Process Salary Payment - {selectedStaff?.fullname || selectedStaff?.username}
                </h3>
                <button className="sm-modal__close" onClick={() => setShowPaymentModal(false)}>
                    <FiX />
                </button>
            </div>
            <div className="sm-modal__body">
                <div className="sm-form-grid">
                    <div className="sm-field">
                        <label className="sm-label">Salary Period *</label>
                        <div className="sm-input">
                            <input
                                type="date"
                                name="salary_period"
                                value={paymentForm.salary_period}
                                onChange={handlePaymentChange}
                                className="sm-input__field"
                                required
                            />
                        </div>
                        <div className="sm-input-help">First day of the salary period</div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Payment Date *</label>
                        <div className="sm-input">
                            <input
                                type="date"
                                name="payment_date"
                                value={paymentForm.payment_date}
                                onChange={handlePaymentChange}
                                className="sm-input__field"
                                required
                            />
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Base Salary (₦) *</label>
                        <div className="sm-input">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="base_salary"
                                value={paymentForm.base_salary}
                                onChange={(e) => {
                                    handlePaymentChange(e);
                                    recalculatePayment();
                                }}
                                className="sm-input__field"
                                required
                            />
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Allowances (₦)</label>
                        <div className="sm-input">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="allowances"
                                value={paymentForm.allowances}
                                onChange={(e) => {
                                    handlePaymentChange(e);
                                    recalculatePayment();
                                }}
                                className="sm-input__field"
                            />
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Tax Rate (%)</label>
                        <div className="sm-input sm-input--icon">
                            <FiPercent className="sm-input__icon" />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={taxRate}
                                onChange={handleTaxRateChange}
                                className="sm-input__field"
                            />
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Pension Rate (%)</label>
                        <div className="sm-input sm-input--icon">
                            <FiPercent className="sm-input__icon" />
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={pensionRate}
                                onChange={handlePensionRateChange}
                                className="sm-input__field"
                            />
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Other Deductions (₦)</label>
                        <div className="sm-input">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={otherDeductions}
                                onChange={handleOtherDeductionsChange}
                                className="sm-input__field"
                            />
                        </div>
                        <div className="sm-input-help">Company debt, advances, etc.</div>
                    </div>

                    {outstandingLoans.length > 0 && (
                        <div className="sm-field sm-field--full">
                            <label className="sm-label">Loan Deductions</label>
                            <div className="sm-loan-deductions">
                                {outstandingLoans.map(loan => (
                                    <div key={loan.id} className="sm-loan-item">
                                        <span>{format(new Date(loan.loan_date), 'MMM dd, yyyy')} - {loan.reason || 'No reason provided'}</span>
                                        <span className="sm-loan-amount">{formatCurrency(loan.amount)}</span>
                                    </div>
                                ))}
                                <div className="sm-loan-total">
                                    Total Loan Deduction: {formatCurrency(selectedStaff?.outstanding_loan_amount || 0)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DEDUCTION BREAKDOWN */}
                    <div className="sm-field sm-field--full">
                        <div className="sm-deductions-breakdown">
                            <h5>Deduction Breakdown</h5>
                            <div className="sm-deduction-item">
                                <span>Tax Deduction:</span>
                                <span className="sm-deduction-amount">-{formatCurrency(paymentForm.tax_amount)}</span>
                            </div>
                            <div className="sm-deduction-item">
                                <span>Pension Deduction:</span>
                                <span className="sm-deduction-amount">-{formatCurrency(paymentForm.pension_amount)}</span>
                            </div>
                            <div className="sm-deduction-item">
                                <span>Other Deductions:</span>
                                <span className="sm-deduction-amount">-{formatCurrency(otherDeductions)}</span>
                            </div>
                            <div className="sm-deduction-item">
                                <span>Loan Deductions:</span>
                                <span className="sm-deduction-amount">-{formatCurrency(paymentForm.loan_deduction)}</span>
                            </div>
                            <div className="sm-deduction-total">
                                <span>Total Deductions:</span>
                                <span className="sm-deduction-amount">
                                    -{formatCurrency(
                                        parseFloat(paymentForm.tax_amount || 0) +
                                        parseFloat(paymentForm.pension_amount || 0) +
                                        parseFloat(otherDeductions || 0) +
                                        parseFloat(paymentForm.loan_deduction || 0)
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Gross Salary (₦)</label>
                        <div className="sm-input">
                            <input
                                type="number"
                                value={(
                                    parseFloat(paymentForm.base_salary || 0) +
                                    parseFloat(paymentForm.allowances || 0)
                                ).toFixed(2)}
                                readOnly
                                className="sm-input__field sm-input__field--readonly"
                            />
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Net Amount (₦)</label>
                        <div className="sm-input">
                            <input
                                type="number"
                                name="net_amount"
                                value={paymentForm.net_amount}
                                readOnly
                                className="sm-input__field sm-input__field--readonly"
                            />
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Payment Method *</label>
                        <div className="sm-input">
                            <select
                                name="payment_method"
                                value={paymentForm.payment_method}
                                onChange={handlePaymentChange}
                                className="sm-input__field"
                                required
                            >
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Mobile Money">Mobile Money</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm-field sm-field--full">
                        <label className="sm-label">Reference Number</label>
                        <div className="sm-input">
                            <input
                                type="text"
                                name="reference_number"
                                value={paymentForm.reference_number}
                                onChange={handlePaymentChange}
                                placeholder="Transaction reference"
                                className="sm-input__field"
                            />
                        </div>
                    </div>

                    <div className="sm-field sm-field--full">
                        <label className="sm-label">Notes</label>
                        <div className="sm-input">
                            <textarea
                                rows={3}
                                name="notes"
                                value={paymentForm.notes}
                                onChange={handlePaymentChange}
                                placeholder="Additional notes..."
                                className="sm-input__field"
                            />
                        </div>
                    </div>

                    <div className="sm-field sm-field--full">
                        <div className="sm-summary-card">
                            <div className="sm-summary-card__header">
                                <h6>Payment Summary</h6>
                            </div>
                            <div className="sm-summary-card__body">
                                <div className="sm-summary-grid">
                                    <div className="sm-summary-item">
                                        <span className="sm-summary-label">Base Salary:</span>
                                        <span className="sm-summary-value">{formatCurrency(paymentForm.base_salary)}</span>
                                    </div>
                                    <div className="sm-summary-item">
                                        <span className="sm-summary-label">Allowances:</span>
                                        <span className="sm-summary-value sm-summary-value--positive">+{formatCurrency(paymentForm.allowances)}</span>
                                    </div>
                                    <div className="sm-summary-item sm-summary-item--gross">
                                        <span className="sm-summary-label">Gross Salary:</span>
                                        <span className="sm-summary-value sm-summary-value--gross">
                                            {formatCurrency(
                                                parseFloat(paymentForm.base_salary || 0) +
                                                parseFloat(paymentForm.allowances || 0)
                                            )}
                                        </span>
                                    </div>

                                    <div className="sm-summary-item">
                                        <span className="sm-summary-label">Tax Deduction:</span>
                                        <span className="sm-summary-value sm-summary-value--negative">-{formatCurrency(paymentForm.tax_amount)}</span>
                                    </div>
                                    <div className="sm-summary-item">
                                        <span className="sm-summary-label">Pension Deduction:</span>
                                        <span className="sm-summary-value sm-summary-value--negative">-{formatCurrency(paymentForm.pension_amount)}</span>
                                    </div>
                                    <div className="sm-summary-item">
                                        <span className="sm-summary-label">Other Deductions:</span>
                                        <span className="sm-summary-value sm-summary-value--negative">-{formatCurrency(otherDeductions)}</span>
                                    </div>
                                    <div className="sm-summary-item">
                                        <span className="sm-summary-label">Loan Deductions:</span>
                                        <span className="sm-summary-value sm-summary-value--negative">-{formatCurrency(paymentForm.loan_deduction)}</span>
                                    </div>

                                    <div className="sm-summary-item sm-summary-item--total">
                                        <span className="sm-summary-label">Net Amount (Paid to Staff):</span>
                                        <span className="sm-summary-value sm-summary-value--net">{formatCurrency(paymentForm.net_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="sm-modal__footer">
                <button className="sm-btn sm-btn--ghost" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                </button>
                <button
                    className="sm-btn sm-btn--success"
                    onClick={handleProcessPayment}
                >
                    <FiDollarSign />
                    Process Payment
                </button>
            </div>
        </div>
    </div>
)}

            {/* Add Loan Modal */}
            {showLoanModal && (
                <div className="sm-modal">
                    <div className="sm-modal__content">
                        <div className="sm-modal__header">
                            <h3 className="sm-modal__title">
                                <FiArrowUp className="sm-modal__icon" />
                                Record Staff Loan - {selectedStaff?.fullname || selectedStaff?.username}
                            </h3>
                            <button className="sm-modal__close" onClick={() => setShowLoanModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="sm-modal__body">
                            <div className="sm-form-grid">
                                <div className="sm-field">
                                    <label className="sm-label">Loan Date *</label>
                                    <div className="sm-input">
                                        <input
                                            type="date"
                                            name="loan_date"
                                            value={loanData.loan_date}
                                            onChange={handleLoanChange}
                                            className="sm-input__field"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="sm-field">
                                    <label className="sm-label">Amount (₦) *</label>
                                    <div className="sm-input">
                                        <input
                                            type="number"
                                            name="amount"
                                            value={loanData.amount}
                                            onChange={handleLoanChange}
                                            placeholder="0.00"
                                            min="1"
                                            step="0.01"
                                            className="sm-input__field"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="sm-field sm-field--full">
                                    <label className="sm-label">Reason (Optional)</label>
                                    <div className="sm-input">
                                        <textarea
                                            rows={3}
                                            name="reason"
                                            value={loanData.reason}
                                            onChange={handleLoanChange}
                                            placeholder="Reason for the loan/advance"
                                            className="sm-input__field"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sm-modal__footer">
                            <button className="sm-btn sm-btn--ghost" onClick={() => setShowLoanModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="sm-btn sm-btn--primary"
                                onClick={handleAddLoan}
                                disabled={!loanData.amount || loanData.amount <= 0}
                            >
                                <FiSave />
                                Record Loan
                            </button>
                        </div>
                    </div>
                </div>
            )}

{/* Payment Details Modal */}
{showPaymentDetails && paymentDetails && (
    <div className="sm-modal">
        <div className="sm-modal__content sm-modal__content--large">
            <div className="sm-modal__header">
                <h3 className="sm-modal__title">
                    <FiFileText className="sm-modal__icon" />
                    Payment Details - {paymentDetails.staff_name}
                </h3>
                <div className="sm-modal-actions">
                    <button
                        className="sm-btn sm-btn--outline sm-btn--icon"
                        onClick={() => handlePrintPayment(paymentDetails)}
                        title="Print Payment Details"
                    >
                        <FiPrinter />
                        Print
                    </button>
                    <button className="sm-modal__close" onClick={() => setShowPaymentDetails(false)}>
                        <FiX />
                    </button>
                </div>
            </div>
            <div className="sm-modal__body">
                <div className="sm-details-grid">
                    <div className="sm-details-card">
                        <div className="sm-details-card__header">
                            <h6>Payment Information</h6>
                        </div>
                        <div className="sm-details-card__body">
                            <div className="sm-detail-item">
                                <span className="sm-detail-label">Staff Name:</span>
                                <span className="sm-detail-value">{paymentDetails.staff_name}</span>
                            </div>
                            <div className="sm-detail-item">
                                <span className="sm-detail-label">Role:</span>
                                <span className={`sm-badge ${getRoleBadgeColor(paymentDetails.staff_role)}`}>
                                    {paymentDetails.staff_role?.toUpperCase()}
                                </span>
                            </div>
                            <div className="sm-detail-item">
                                <span className="sm-detail-label">Salary Period:</span>
                                <span className="sm-detail-value">
                                    {paymentDetails.salary_period ?
                                        format(new Date(paymentDetails.salary_period), 'MMMM yyyy') :
                                        'N/A'
                                    }
                                </span>
                            </div>
                            <div className="sm-detail-item">
                                <span className="sm-detail-label">Payment Date:</span>
                                <span className="sm-detail-value">
                                    {format(new Date(paymentDetails.payment_date), 'MMMM dd, yyyy')}
                                </span>
                            </div>
                            <div className="sm-detail-item">
                                <span className="sm-detail-label">Payment Method:</span>
                                <span className="sm-detail-value">{paymentDetails.payment_method}</span>
                            </div>
                            <div className="sm-detail-item">
                                <span className="sm-detail-label">Status:</span>
                                {getStatusBadge(paymentDetails.status)}
                            </div>
                            {paymentDetails.payment_reference && (
                                <div className="sm-detail-item">
                                    <span className="sm-detail-label">Reference:</span>
                                    <span className="sm-detail-value">{paymentDetails.payment_reference}</span>
                                </div>
                            )}
                            {paymentDetails.paid_by_name && (
                                <div className="sm-detail-item">
                                    <span className="sm-detail-label">Processed By:</span>
                                    <span className="sm-detail-value">{paymentDetails.paid_by_name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sm-details-card">
                        <div className="sm-details-card__header">
                            <h6>Salary Breakdown</h6>
                        </div>
                        <div className="sm-details-card__body">
                            <div className="sm-breakdown-item">
                                <span className="sm-breakdown-label">Base Salary:</span>
                                <span className="sm-breakdown-value">{formatCurrency(paymentDetails.base_salary)}</span>
                            </div>
                            <div className="sm-breakdown-item sm-breakdown-item--positive">
                                <span className="sm-breakdown-label">Allowances:</span>
                                <span className="sm-breakdown-value">+{formatCurrency(paymentDetails.allowances)}</span>
                            </div>
                            <div className="sm-breakdown-item sm-breakdown-item--gross">
                                <span className="sm-breakdown-label">Gross Salary:</span>
                                <span className="sm-breakdown-value">
                                    {formatCurrency(
                                        parseFloat(paymentDetails.base_salary || 0) +
                                        parseFloat(paymentDetails.allowances || 0)
                                    )}
                                </span>
                            </div>

                            <div className="sm-breakdown-divider">Deductions</div>

                            <div className="sm-breakdown-item sm-breakdown-item--negative">
                                <span className="sm-breakdown-label">Tax Deduction:</span>
                                <span className="sm-breakdown-value">-{formatCurrency(paymentDetails.tax_amount)}</span>
                            </div>
                            <div className="sm-breakdown-item sm-breakdown-item--negative">
                                <span className="sm-breakdown-label">Pension Deduction:</span>
                                <span className="sm-breakdown-value">-{formatCurrency(paymentDetails.pension_amount)}</span>
                            </div>
                            <div className="sm-breakdown-item sm-breakdown-item--negative">
                                <span className="sm-breakdown-label">Other Deductions:</span>
                                <span className="sm-breakdown-value">-{formatCurrency(paymentDetails.deductions)}</span>
                            </div>
                            <div className="sm-breakdown-item sm-breakdown-item--negative">
                                <span className="sm-breakdown-label">Loan Deductions:</span>
                                <span className="sm-breakdown-value">-{formatCurrency(paymentDetails.loan_deduction)}</span>
                            </div>
                            <div className="sm-breakdown-item sm-breakdown-item--total-deductions">
                                <span className="sm-breakdown-label">Total Deductions:</span>
                                <span className="sm-breakdown-value">
                                    -{formatCurrency(
                                        parseFloat(paymentDetails.tax_amount || 0) +
                                        parseFloat(paymentDetails.pension_amount || 0) +
                                        parseFloat(paymentDetails.deductions || 0) +
                                        parseFloat(paymentDetails.loan_deduction || 0)
                                    )}
                                </span>
                            </div>
                            <div className="sm-breakdown-item sm-breakdown-item--net">
                                <span className="sm-breakdown-label">Net Amount (Paid):</span>
                                <span className="sm-breakdown-value">{formatCurrency(paymentDetails.net_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {paymentDetails.notes && (
                        <div className="sm-details-card sm-details-card--full">
                            <div className="sm-details-card__header">
                                <h6>Notes</h6>
                            </div>
                            <div className="sm-details-card__body">
                                <p className="sm-notes">{paymentDetails.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="sm-modal__footer">
                <button
                    className="sm-btn sm-btn--outline"
                    onClick={() => handlePrintPayment(paymentDetails)}
                >
                    <FiPrinter />
                    Print Details
                </button>
                <button className="sm-btn sm-btn--ghost" onClick={() => setShowPaymentDetails(false)}>
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{/* Add Staff Member Modal */}
{showStaffModal && (
    <div className="sm-modal">
        <div className="sm-modal__content">
            <div className="sm-modal__header">
                <h3 className="sm-modal__title">
                    <FiUserPlus className="sm-modal__icon" />
                    Add Staff Member
                </h3>
                <button className="sm-modal__close" onClick={() => setShowStaffModal(false)}>
                    <FiX />
                </button>
            </div>
            <div className="sm-modal__body">
                <div className="sm-form-grid">
                    <div className="sm-field">
                        <label className="sm-label">Full Name *</label>
                        <div className="sm-input">
                            <input
                                type="text"
                                value={staffForm.fullname}
                                onChange={(e) => setStaffForm({ ...staffForm, fullname: e.target.value })}
                                className="sm-input__field"
                                placeholder="Enter full name"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Phone Number</label>
                        <div className="sm-input">
                            <input
                                type="text"
                                value={staffForm.phone_number}
                                onChange={(e) => setStaffForm({ ...staffForm, phone_number: e.target.value })}
                                className="sm-input__field"
                                placeholder="Phone number"
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Position *</label>
                        <div className="sm-input">
                            <input
                                type="text"
                                value={staffForm.position}
                                onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                                className="sm-input__field"
                                placeholder="Job position"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Department</label>
                        <div className="sm-input">
                            <input
                                type="text"
                                value={staffForm.department}
                                onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                                className="sm-input__field"
                                placeholder="Department"
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Email</label>
                        <div className="sm-input">
                            <input
                                type="email"
                                value={staffForm.email}
                                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                className="sm-input__field"
                                placeholder="Email address"
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Gender</label>
                        <div className="sm-input">
                            <select
                                value={staffForm.gender}
                                onChange={(e) => setStaffForm({ ...staffForm, gender: e.target.value })}
                                className="sm-input__field"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Date of Birth</label>
                        <div className="sm-input">
                            <input
                                type="date"
                                value={staffForm.date_of_birth}
                                onChange={(e) => setStaffForm({ ...staffForm, date_of_birth: e.target.value })}
                                className="sm-input__field"
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field sm-field--full">
                        <label className="sm-label">Address</label>
                        <div className="sm-input">
                            <textarea
                                value={staffForm.address}
                                onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                                className="sm-input__field"
                                placeholder="Full address"
                                rows="3"
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Emergency Contact Name</label>
                        <div className="sm-input">
                            <input
                                type="text"
                                value={staffForm.emergency_contact_name}
                                onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_name: e.target.value })}
                                className="sm-input__field"
                                placeholder="Emergency contact name"
                            />
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Emergency Contact Phone</label>
                        <div className="sm-input">
                            <input
                                type="text"
                                value={staffForm.emergency_contact_phone}
                                onChange={(e) => setStaffForm({ ...staffForm, emergency_contact_phone: e.target.value })}
                                className="sm-input__field"
                                placeholder="Emergency contact phone"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="sm-modal__footer">
                <button className="sm-btn sm-btn--ghost cancle" onClick={() => setShowStaffModal(false)}>
                    <FiX />
                    Cancel
                </button>
                <button 
                    className="sm-btn sm-btn--primary" 
                    onClick={handleAddStaff}
                >
                    <FiUserPlus />
                    Add Staff Member
                </button>
            </div>
        </div>
    </div>
)}

{/* Company Debt Modal */}
{showDebtModal && (
    <div className="sm-modal">
        <div className="sm-modal__content">
            <div className="sm-modal__header">
                <h3 className="sm-modal__title">
                    <FiFileText className="sm-modal__icon" />
                    {selectedDebt ? `Edit Company Debt - ${selectedDebt.staff_name}` : 'Add Company Debt'}
                </h3>
                <button className="sm-modal__close" onClick={() => {
                    setShowDebtModal(false);
                    setSelectedDebt(null);
                    // Reset form when closing
                    setDebtForm({
                        staff_id: '',
                        staff_type: 'user',
                        amount: '',
                        reason: '',
                        debt_type: 'owed_to_company',
                        status: 'pending'
                    });
                }}>
                    <FiX />
                </button>
            </div>
            <div className="sm-modal__body">
                {/* Show current debt info when editing */}
                {selectedDebt && (
                    <div className="sm-field sm-field--full">
                        <div className="sm-info-card">
                            <div className="sm-info-row">
                                <strong>Staff Member:</strong> 
                                <span>{selectedDebt.staff_name}</span>
                            </div>
                            <div className="sm-info-row">
                                <strong>Current Amount:</strong> 
                                <span>{formatCurrency(selectedDebt.amount)}</span>
                            </div>
                            <div className="sm-info-row">
                                <strong>Current Status:</strong> 
                                <span className={`sm-badge ${selectedDebt.status === 'paid' ? 'sm-badge--success' :
                                    selectedDebt.status === 'partially_paid' ? 'sm-badge--warning' : 'sm-badge--danger'
                                    }`}>
                                    {selectedDebt.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="sm-info-row">
                                <strong>Debt Type:</strong> 
                                <span>{selectedDebt.debt_type === 'owed_to_company' ? 'Owed to Company' : 'Owed by Company'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="sm-form-grid">
                    <div className="sm-field">
                        <label className="sm-label">Staff Type</label>
                        <div className="sm-input">
                            <select
                                value={debtForm.staff_type}
                                onChange={(e) => {
                                    setDebtForm({ 
                                        ...debtForm, 
                                        staff_type: e.target.value,
                                        staff_id: '' // Reset staff selection when type changes
                                    });
                                }}
                                className="sm-input__field"
                                disabled={!!selectedDebt} // Disable when editing existing debt
                            >
                                <option value="user">System User</option>
                                <option value="staff_member">Staff Member</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="sm-field">
                        <label className="sm-label">Staff Member *</label>
                        <div className="sm-input">
                            <select
                                value={debtForm.staff_id}
                                onChange={(e) => setDebtForm({ ...debtForm, staff_id: e.target.value })}
                                className="sm-input__field"
                                required
                                disabled={!!selectedDebt} // Disable when editing existing debt
                            >
                                <option value="">Select Staff</option>
                                {allStaff
                                    .filter(staff => staff.staff_type === debtForm.staff_type)
                                    .map(staff => (
                                        <option key={`${staff.staff_type}-${staff.id}`} value={staff.id}>
                                            {staff.fullname} ({staff.role})
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        {selectedDebt && (
                            <div className="sm-input-help">
                                Staff member cannot be changed when editing existing debt
                            </div>
                        )}
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Debt Type</label>
                        <div className="sm-input">
                            <select
                                value={debtForm.debt_type}
                                onChange={(e) => setDebtForm({ ...debtForm, debt_type: e.target.value })}
                                className="sm-input__field"
                            >
                                <option value="owed_to_company">Owed to Company</option>
                                <option value="owed_by_company">Owed by Company</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Amount (₦) *</label>
                        <div className="sm-input">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={debtForm.amount}
                                onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                                className="sm-input__field"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        {selectedDebt && (
                            <div className="sm-input-help">
                                Original amount: {formatCurrency(selectedDebt.amount)}
                            </div>
                        )}
                    </div>

                    <div className="sm-field">
                        <label className="sm-label">Status</label>
                        <div className="sm-input">
                            <select
                                value={debtForm.status}
                                onChange={(e) => setDebtForm({ ...debtForm, status: e.target.value })}
                                className="sm-input__field"
                            >
                                <option value="pending">Pending</option>
                                <option value="partially_paid">Partially Paid</option>
                                <option value="paid">Paid</option>
                                <option value="written_off">Written Off</option>
                            </select>
                        </div>
                    </div>

                    <div className="sm-field sm-field--full">
                        <label className="sm-label">Reason *</label>
                        <div className="sm-input">
                            <textarea
                                value={debtForm.reason}
                                onChange={(e) => setDebtForm({ ...debtForm, reason: e.target.value })}
                                className="sm-input__field"
                                placeholder="Reason for the debt..."
                                required
                                rows="3"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="sm-modal__footer">
                <button className="sm-btn sm-btn--ghost" onClick={() => {
                    setShowDebtModal(false);
                    setSelectedDebt(null);
                    // Reset form when canceling
                    setDebtForm({
                        staff_id: '',
                        staff_type: 'user',
                        amount: '',
                        reason: '',
                        debt_type: 'owed_to_company',
                        status: 'pending'
                    });
                }}>
                    <FiX />
                    Cancel
                </button>
                <button 
                    className="sm-btn sm-btn--primary"
                    onClick={selectedDebt ? () => handleUpdateDebt(selectedDebt.id, debtForm) : handleAddDebt}
                    disabled={!debtForm.staff_id || !debtForm.amount || !debtForm.reason}
                >
                    <FiSave />
                    {selectedDebt ? 'Update Debt' : 'Add Debt'}
                </button>
            </div>
        </div>
    </div>
)}

{/* Debt History Modal */}
{showDebtHistoryModal && selectedDebt && (
    <div className="sm-modal">
        <div className="sm-modal__content">
            <div className="sm-modal__header">
                <h3 className="sm-modal__title">
                    Debt History - {selectedDebt.staff_name}
                </h3>
                <button className="sm-modal__close" onClick={() => setShowDebtHistoryModal(false)}>
                    <FiX />
                </button>
            </div>
            <div className="sm-modal__body">
                <div className="sm-history-section">
                    <div className="sm-current-debt">
                        <h4>Current Debt: {formatCurrency(selectedDebt.amount)}</h4>
                        <p>Reason: {selectedDebt.reason}</p>
                        <p>Status: <span className={`sm-badge ${selectedDebt.status === 'paid' ? 'sm-badge--success' :
                            selectedDebt.status === 'partially_paid' ? 'sm-badge--warning' : 'sm-badge--danger'
                            }`}>{selectedDebt.status.replace('_', ' ').toUpperCase()}</span></p>
                    </div>

                    <div className="sm-history-list">
                        <h5>Transaction History</h5>
                        {debtHistory.length === 0 ? (
                            <p className="sm-text-muted">No history recorded</p>
                        ) : (
                            debtHistory.map(history => (
                                <div key={history.id} className="sm-history-item">
                                    <div className="sm-history-date">
                                        {format(new Date(history.created_at), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                    <div className="sm-history-amount">
                                        {history.transaction_type === 'payment' ? '-' : '+'}
                                        {formatCurrency(history.amount)}
                                    </div>
                                    <div className="sm-history-reason">
                                        {history.reason}
                                    </div>
                                    <div className="sm-history-type">
                                        <span className={`sm-badge ${history.transaction_type === 'payment' ? 'sm-badge--success' : 'sm-badge--info'
                                            }`}>
                                            {history.transaction_type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="sm-add-history">
                        <h5>Add Transaction</h5>
                        <div className="sm-form-grid">
                            <div className="sm-field">
                                <label className="sm-label">Amount</label>
                                <div className="sm-input">
                                    <input
                                        type="number"
                                        step="0.01"
                                        id="historyAmount"
                                        placeholder="Enter amount"
                                        className="sm-input__field"
                                    />
                                </div>
                            </div>
                            <div className="sm-field">
                                <label className="sm-label">Type</label>
                                <div className="sm-input">
                                    <select id="historyType" className="sm-input__field">
                                        <option value="payment">Payment</option>
                                        <option value="adjustment">Adjustment</option>
                                        <option value="gift">Gift</option>
                                        <option value="additional_debt">Additional Debt</option>
                                    </select>
                                </div>
                            </div>
                            <div className="sm-field sm-field--full">
                                <label className="sm-label">Reason</label>
                                <div className="sm-input">
                                    <textarea
                                        id="historyReason"
                                        rows="2"
                                        placeholder="Reason for this transaction"
                                        className="sm-input__field"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            className="sm-btn sm-btn--primary"
                            onClick={() => {
                                const amount = document.getElementById('historyAmount').value;
                                const type = document.getElementById('historyType').value;
                                const reason = document.getElementById('historyReason').value;

                                if (amount && reason) {
                                    handleAddDebtHistory(selectedDebt.id, {
                                        amount: parseFloat(amount),
                                        transaction_type: type,
                                        reason: reason,
                                        notes: `Manual entry by admin`
                                    });

                                    // Clear fields
                                    document.getElementById('historyAmount').value = '';
                                    document.getElementById('historyReason').value = '';
                                }
                            }}
                        >
                            Add Transaction
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default SalaryManagementPage;









