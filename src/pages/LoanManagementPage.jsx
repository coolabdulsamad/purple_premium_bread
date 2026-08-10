import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaPlus, FaEdit, FaMoneyBillWave, FaHandHoldingUsd, FaCheckCircle, FaTimes, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api/axiosInstance';
import '../assets/styles/loans.css';

const formatNaira = (value) =>
    `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const today = () => new Date().toISOString().split('T')[0];

const LoanManagementPage = () => {
    const [loans, setLoans] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showRepay, setShowRepay] = useState(false);
    const [activeLoan, setActiveLoan] = useState(null);
    const [saving, setSaving] = useState(false);

    const [createForm, setCreateForm] = useState({
        borrower_key: '',
        amount: '',
        loan_date: today(),
        repayment_months: '',
        start_date: today(),
        reason: '',
        payment_method: 'Cash'
    });

    const [editForm, setEditForm] = useState({
        repayment_months: '',
        start_date: '',
        due_date: '',
        is_paid: false
    });

    const [repayForm, setRepayForm] = useState({
        amount: '',
        payment_date: today(),
        payment_method: 'Cash',
        notes: ''
    });

    const fetchLoans = useCallback(async () => {
        try {
            const res = await api.get('/salaries/loans', { params: { limit: 200 } });
            setLoans(res.data.loans || res.data || []);
        } catch (err) {
            toast.error('Failed to load loans: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStaff = useCallback(async () => {
        try {
            const res = await api.get('/salaries/all-staff');
            setStaff(res.data || []);
        } catch (err) {
            // non-blocking
        }
    }, []);

    useEffect(() => {
        fetchLoans();
        fetchStaff();
    }, [fetchLoans, fetchStaff]);

    const stats = useMemo(() => {
        const active = loans.filter(l => !l.is_paid);
        const outstanding = active.reduce((s, l) => s + Number(l.remaining_balance ?? l.amount), 0);
        const monthly = active.reduce((s, l) => s + Math.min(Number(l.monthly_deduction ?? l.amount), Number(l.remaining_balance ?? l.amount)), 0);
        return { active: active.length, completed: loans.length - active.length, outstanding, monthly };
    }, [loans]);

    const filteredLoans = useMemo(() => {
        let list = loans;
        if (statusFilter === 'active') list = list.filter(l => !l.is_paid);
        if (statusFilter === 'completed') list = list.filter(l => l.is_paid);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(l =>
                (l.borrower_name || '').toLowerCase().includes(q) ||
                (l.reason || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [loans, statusFilter, search]);

    const monthlyPreview = useMemo(() => {
        const amt = parseFloat(createForm.amount);
        const months = parseInt(createForm.repayment_months);
        if (amt > 0 && months > 0) return amt / months;
        return null;
    }, [createForm.amount, createForm.repayment_months]);

    const dueDatePreview = useMemo(() => {
        const months = parseInt(createForm.repayment_months);
        if (months > 0 && createForm.start_date) {
            const d = new Date(createForm.start_date);
            d.setMonth(d.getMonth() + months);
            return d.toISOString().split('T')[0];
        }
        return null;
    }, [createForm.repayment_months, createForm.start_date]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.borrower_key || !(parseFloat(createForm.amount) > 0)) {
            toast.error('Select a staff member and enter a valid amount.');
            return;
        }
        const [staffType, id] = createForm.borrower_key.split(':');
        setSaving(true);
        try {
            await api.post('/salaries/loans', {
                user_id: parseInt(id),
                staff_type: staffType,
                amount: parseFloat(createForm.amount),
                loan_date: createForm.loan_date,
                reason: createForm.reason,
                repayment_months: createForm.repayment_months ? parseInt(createForm.repayment_months) : undefined,
                start_date: createForm.start_date,
                due_date: dueDatePreview || undefined,
                payment_method: createForm.payment_method
            });
            toast.success('Loan recorded successfully.');
            setShowCreate(false);
            setCreateForm({ borrower_key: '', amount: '', loan_date: today(), repayment_months: '', start_date: today(), reason: '', payment_method: 'Cash' });
            fetchLoans();
        } catch (err) {
            if (!err.response || err.response.status !== 202) {
                toast.error('Failed to record loan: ' + (err.response?.data?.error || err.response?.data?.details || err.message));
            }
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (loan) => {
        setActiveLoan(loan);
        setEditForm({
            repayment_months: loan.repayment_months || '',
            start_date: loan.start_date ? String(loan.start_date).split('T')[0] : (loan.loan_date ? String(loan.loan_date).split('T')[0] : today()),
            due_date: loan.due_date ? String(loan.due_date).split('T')[0] : '',
            is_paid: !!loan.is_paid
        });
        setShowEdit(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/salaries/loans/${activeLoan.id}`, {
                repayment_months: editForm.repayment_months ? parseInt(editForm.repayment_months) : null,
                start_date: editForm.start_date || undefined,
                due_date: editForm.due_date || null,
                is_paid: editForm.is_paid
            });
            toast.success('Loan updated.');
            setShowEdit(false);
            fetchLoans();
        } catch (err) {
            toast.error('Failed to update loan: ' + (err.response?.data?.error || err.response?.data?.details || err.message));
        } finally {
            setSaving(false);
        }
    };

    const openRepay = (loan) => {
        setActiveLoan(loan);
        const remaining = Number(loan.remaining_balance ?? loan.amount);
        const monthly = Number(loan.monthly_deduction ?? remaining);
        setRepayForm({
            amount: Math.min(monthly, remaining).toFixed(2),
            payment_date: today(),
            payment_method: 'Cash',
            notes: ''
        });
        setShowRepay(true);
    };

    const handleRepay = async (e) => {
        e.preventDefault();
        if (!(parseFloat(repayForm.amount) > 0)) {
            toast.error('Enter a valid repayment amount.');
            return;
        }
        setSaving(true);
        try {
            const res = await api.post(`/salaries/loans/${activeLoan.id}/repay`, {
                amount: parseFloat(repayForm.amount),
                payment_date: repayForm.payment_date,
                payment_method: repayForm.payment_method,
                notes: repayForm.notes
            });
            toast.success(res.data?.message || 'Repayment recorded.');
            setShowRepay(false);
            fetchLoans();
        } catch (err) {
            toast.error('Failed to record repayment: ' + (err.response?.data?.error || err.response?.data?.details || err.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="loans-page">
            <div className="loans-header">
                <div>
                    <h1><FaHandHoldingUsd /> Staff Loans</h1>
                    <p>Track staff loans, repayment schedules and salary deductions</p>
                </div>
                <button className="loans-btn primary" onClick={() => setShowCreate(true)}>
                    <FaPlus /> New Loan
                </button>
            </div>

            <div className="loans-kpis">
                <div className="loans-kpi">
                    <span className="kpi-label">Active Loans</span>
                    <span className="kpi-value">{stats.active}</span>
                </div>
                <div className="loans-kpi">
                    <span className="kpi-label">Total Outstanding</span>
                    <span className="kpi-value danger">{formatNaira(stats.outstanding)}</span>
                </div>
                <div className="loans-kpi">
                    <span className="kpi-label">Monthly Installments Due</span>
                    <span className="kpi-value">{formatNaira(stats.monthly)}</span>
                </div>
                <div className="loans-kpi">
                    <span className="kpi-label">Completed</span>
                    <span className="kpi-value success">{stats.completed}</span>
                </div>
            </div>

            <div className="loans-toolbar">
                <input
                    type="text"
                    placeholder="Search borrower or reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="loans-search"
                />
                <div className="loans-filters">
                    {['all', 'active', 'completed'].map(f => (
                        <button
                            key={f}
                            className={`loans-chip ${statusFilter === f ? 'active' : ''}`}
                            onClick={() => setStatusFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="loans-table-wrap">
                {loading ? (
                    <div className="loans-empty">Loading loans...</div>
                ) : filteredLoans.length === 0 ? (
                    <div className="loans-empty">
                        <FaHandHoldingUsd size={40} />
                        <p>No loans found.</p>
                    </div>
                ) : (
                    <table className="loans-table">
                        <thead>
                            <tr>
                                <th>Borrower</th>
                                <th>Amount</th>
                                <th>Remaining</th>
                                <th>Schedule</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLoans.map(loan => {
                                const amount = Number(loan.amount);
                                const remaining = Number(loan.remaining_balance ?? loan.amount);
                                const repaid = Math.max(0, amount - remaining);
                                const pct = amount > 0 ? Math.min(100, (repaid / amount) * 100) : 0;
                                return (
                                    <tr key={loan.id}>
                                        <td>
                                            <div className="loan-borrower">
                                                <FaUser className="borrower-icon" />
                                                <div>
                                                    <strong>{loan.borrower_name}</strong>
                                                    <small>{loan.borrower_role} · {loan.staff_type === 'staff_member' ? 'Staff' : 'User'}</small>
                                                </div>
                                            </div>
                                            {loan.reason && <small className="loan-reason">{loan.reason}</small>}
                                        </td>
                                        <td className="num">{formatNaira(amount)}</td>
                                        <td className="num danger">{loan.is_paid ? '—' : formatNaira(remaining)}</td>
                                        <td>
                                            {loan.repayment_months ? (
                                                <div className="loan-schedule">
                                                    <FaCalendarAlt />
                                                    <span>{loan.repayment_months} mo × {formatNaira(loan.monthly_deduction)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">One-off</span>
                                            )}
                                        </td>
                                        <td className="loan-progress-cell">
                                            <div className="loan-progress">
                                                <div className="loan-progress-bar" style={{ width: `${pct}%` }} />
                                            </div>
                                            <small>{pct.toFixed(0)}% repaid</small>
                                        </td>
                                        <td>
                                            {loan.is_paid ? (
                                                <span className="loan-badge completed"><FaCheckCircle /> Completed</span>
                                            ) : (
                                                <span className="loan-badge active">Active</span>
                                            )}
                                        </td>
                                        <td className="loan-actions">
                                            {!loan.is_paid && (
                                                <button className="loans-btn small" onClick={() => openRepay(loan)} title="Record repayment">
                                                    <FaMoneyBillWave /> Repay
                                                </button>
                                            )}
                                            <button className="loans-btn small ghost" onClick={() => openEdit(loan)} title="Edit schedule">
                                                <FaEdit />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Loan Modal */}
            {showCreate && (
                <div className="loans-modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="loans-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="loans-modal-header">
                            <h3><FaPlus /> New Staff Loan</h3>
                            <button className="loans-modal-close" onClick={() => setShowCreate(false)}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleCreate} className="loans-form">
                            <label>
                                Staff Member *
                                <select
                                    value={createForm.borrower_key}
                                    onChange={(e) => setCreateForm(p => ({ ...p, borrower_key: e.target.value }))}
                                    required
                                >
                                    <option value="">-- Select staff --</option>
                                    {staff.map(s => (
                                        <option key={`${s.staff_type}:${s.id}`} value={`${s.staff_type}:${s.id}`}>
                                            {s.fullname} ({s.role})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="loans-form-row">
                                <label>
                                    Amount (₦) *
                                    <input
                                        type="number" min="0.01" step="0.01" required
                                        value={createForm.amount}
                                        onChange={(e) => setCreateForm(p => ({ ...p, amount: e.target.value }))}
                                    />
                                </label>
                                <label>
                                    Loan Date *
                                    <input
                                        type="date" required
                                        value={createForm.loan_date}
                                        onChange={(e) => setCreateForm(p => ({ ...p, loan_date: e.target.value }))}
                                    />
                                </label>
                            </div>
                            <div className="loans-form-row">
                                <label>
                                    Repayment (months)
                                    <input
                                        type="number" min="1" step="1" placeholder="e.g. 6"
                                        value={createForm.repayment_months}
                                        onChange={(e) => setCreateForm(p => ({ ...p, repayment_months: e.target.value }))}
                                    />
                                </label>
                                <label>
                                    Deductions Start
                                    <input
                                        type="date"
                                        value={createForm.start_date}
                                        onChange={(e) => setCreateForm(p => ({ ...p, start_date: e.target.value }))}
                                    />
                                </label>
                            </div>
                            {monthlyPreview !== null && (
                                <div className="loans-hint">
                                    Monthly deduction: <strong>{formatNaira(monthlyPreview)}</strong>
                                    {dueDatePreview && <> · fully repaid by <strong>{new Date(dueDatePreview).toLocaleDateString()}</strong></>}
                                </div>
                            )}
                            <label>
                                Disbursed Via
                                <select
                                    value={createForm.payment_method}
                                    onChange={(e) => setCreateForm(p => ({ ...p, payment_method: e.target.value }))}
                                >
                                    <option>Cash</option>
                                    <option>Bank Transfer</option>
                                    <option>POS</option>
                                </select>
                            </label>
                            <label>
                                Reason
                                <textarea
                                    rows="2"
                                    value={createForm.reason}
                                    onChange={(e) => setCreateForm(p => ({ ...p, reason: e.target.value }))}
                                    placeholder="Purpose of the loan..."
                                />
                            </label>
                            <div className="loans-modal-actions">
                                <button type="button" className="loans-btn ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="loans-btn primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Record Loan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Schedule Modal */}
            {showEdit && activeLoan && (
                <div className="loans-modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="loans-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="loans-modal-header">
                            <h3><FaEdit /> Edit Loan — {activeLoan.borrower_name}</h3>
                            <button className="loans-modal-close" onClick={() => setShowEdit(false)}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleEdit} className="loans-form">
                            <div className="loans-hint">
                                Amount: <strong>{formatNaira(activeLoan.amount)}</strong> ·
                                Remaining: <strong>{formatNaira(activeLoan.remaining_balance ?? activeLoan.amount)}</strong>
                            </div>
                            <div className="loans-form-row">
                                <label>
                                    Repayment (months)
                                    <input
                                        type="number" min="1" step="1"
                                        value={editForm.repayment_months}
                                        onChange={(e) => setEditForm(p => ({ ...p, repayment_months: e.target.value }))}
                                    />
                                </label>
                                <label>
                                    Deductions Start
                                    <input
                                        type="date"
                                        value={editForm.start_date}
                                        onChange={(e) => setEditForm(p => ({ ...p, start_date: e.target.value }))}
                                    />
                                </label>
                            </div>
                            <label>
                                Due Date
                                <input
                                    type="date"
                                    value={editForm.due_date}
                                    onChange={(e) => setEditForm(p => ({ ...p, due_date: e.target.value }))}
                                />
                            </label>
                            <label className="loans-check">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_paid}
                                    onChange={(e) => setEditForm(p => ({ ...p, is_paid: e.target.checked }))}
                                />
                                Mark as fully repaid
                            </label>
                            <div className="loans-modal-actions">
                                <button type="button" className="loans-btn ghost" onClick={() => setShowEdit(false)}>Cancel</button>
                                <button type="submit" className="loans-btn primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Repay Modal */}
            {showRepay && activeLoan && (
                <div className="loans-modal-overlay" onClick={() => setShowRepay(false)}>
                    <div className="loans-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="loans-modal-header">
                            <h3><FaMoneyBillWave /> Repay — {activeLoan.borrower_name}</h3>
                            <button className="loans-modal-close" onClick={() => setShowRepay(false)}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleRepay} className="loans-form">
                            <div className="loans-hint">
                                Outstanding: <strong>{formatNaira(activeLoan.remaining_balance ?? activeLoan.amount)}</strong>
                                {activeLoan.monthly_deduction && <> · Installment: <strong>{formatNaira(activeLoan.monthly_deduction)}</strong></>}
                            </div>
                            <div className="loans-form-row">
                                <label>
                                    Amount (₦) *
                                    <input
                                        type="number" min="0.01" step="0.01" required
                                        value={repayForm.amount}
                                        onChange={(e) => setRepayForm(p => ({ ...p, amount: e.target.value }))}
                                    />
                                </label>
                                <label>
                                    Date
                                    <input
                                        type="date"
                                        value={repayForm.payment_date}
                                        onChange={(e) => setRepayForm(p => ({ ...p, payment_date: e.target.value }))}
                                    />
                                </label>
                            </div>
                            <label>
                                Received Via
                                <select
                                    value={repayForm.payment_method}
                                    onChange={(e) => setRepayForm(p => ({ ...p, payment_method: e.target.value }))}
                                >
                                    <option>Cash</option>
                                    <option>Bank Transfer</option>
                                    <option>POS</option>
                                </select>
                            </label>
                            <label>
                                Notes
                                <textarea
                                    rows="2"
                                    value={repayForm.notes}
                                    onChange={(e) => setRepayForm(p => ({ ...p, notes: e.target.value }))}
                                />
                            </label>
                            <div className="loans-modal-actions">
                                <button type="button" className="loans-btn ghost" onClick={() => setShowRepay(false)}>Cancel</button>
                                <button type="submit" className="loans-btn primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Record Repayment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanManagementPage;
