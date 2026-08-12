// src/pages/MoneyPage.jsx — Money management: cash/bank in & out, transfers, accounts, printing
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
    FiArrowDownCircle, FiArrowUpCircle, FiRepeat, FiPlus, FiPrinter,
    FiX, FiFilter, FiRefreshCw, FiSearch, FiCreditCard, FiDollarSign,
    FiTrendingUp, FiTrendingDown, FiEdit2
} from 'react-icons/fi';
import api from '../api/axiosInstance';
import '../assets/styles/money.css';

const fmt = (amount) =>
    `₦${parseFloat(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const fmtDate = (d) => {
    if (!d) return '—';
    try {
        return format(new Date(d), 'MMM dd, yyyy HH:mm');
    } catch {
        return String(d);
    }
};

const firstOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const today = () => format(new Date(), 'yyyy-MM-dd');

const MoneyPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState({ IN: [], OUT: [] });
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [totals, setTotals] = useState({ total_in: 0, total_out: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 50, totalCount: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        account_id: '',
        direction: '',
        category: '',
        startDate: firstOfMonth(),
        endDate: today(),
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Modals
    const [txnModal, setTxnModal] = useState(null); // { direction: 'IN' | 'OUT' }
    const [transferModal, setTransferModal] = useState(false);
    const [accountModal, setAccountModal] = useState(null); // {} for create, account for edit
    const [saving, setSaving] = useState(false);

    const [txnForm, setTxnForm] = useState({});
    const [transferForm, setTransferForm] = useState({});
    const [accountForm, setAccountForm] = useState({});

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await api.get('/money/accounts');
            setAccounts(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load accounts.');
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await api.get('/money/summary', {
                params: { startDate: filters.startDate, endDate: filters.endDate }
            });
            setSummary(res.data);
        } catch (err) {
            console.error('Summary error:', err);
        }
    }, [filters.startDate, filters.endDate]);

    const fetchTransactions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/money/transactions', {
                params: { ...filters, page, limit: pagination.limit }
            });
            setTransactions(res.data.transactions);
            setTotals(res.data.totals);
            setPagination(res.data.pagination);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load transactions.');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/money/categories');
                setCategories(res.data);
            } catch (err) {
                console.error('Categories error:', err);
            }
            fetchAccounts();
        })();
    }, [fetchAccounts]);

    useEffect(() => {
        fetchSummary();
        fetchTransactions(1);
    }, [filters, fetchSummary, fetchTransactions]);

    const categoryLabel = (direction, key) => {
        const found = (categories[direction] || []).find((c) => c.key === key);
        return found ? found.label : key;
    };

    // ---- Transaction modal ----
    const openTxnModal = (direction) => {
        setTxnForm({
            account_id: accounts[0]?.id || '',
            direction,
            amount: '',
            category: '',
            description: '',
            payment_method: 'Cash',
            transaction_date: today()
        });
        setTxnModal({ direction });
    };

    const submitTxn = async () => {
        if (!txnForm.account_id || !txnForm.amount || !txnForm.category) {
            toast.error('Account, category and amount are required.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/money/transactions', {
                ...txnForm,
                amount: parseFloat(txnForm.amount)
            });
            toast.success('Transaction recorded.');
            setTxnModal(null);
            fetchAccounts();
            fetchSummary();
            fetchTransactions(1);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to record the transaction.');
        } finally {
            setSaving(false);
        }
    };

    // ---- Transfer modal ----
    const openTransferModal = () => {
        setTransferForm({ from_account_id: '', to_account_id: '', amount: '', description: '', transaction_date: today() });
        setTransferModal(true);
    };

    const submitTransfer = async () => {
        if (!transferForm.from_account_id || !transferForm.to_account_id || !transferForm.amount) {
            toast.error('Both accounts and an amount are required.');
            return;
        }
        setSaving(true);
        try {
            await api.post('/money/transfer', {
                ...transferForm,
                amount: parseFloat(transferForm.amount)
            });
            toast.success('Transfer completed.');
            setTransferModal(false);
            fetchAccounts();
            fetchSummary();
            fetchTransactions(1);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Transfer failed.');
        } finally {
            setSaving(false);
        }
    };

    // ---- Account modal ----
    const openAccountModal = (account) => {
        setAccountForm(
            account
                ? { name: account.name, bank_name: account.bank_name || '', account_number: account.account_number || '', is_active: account.is_active }
                : { name: '', account_type: 'CASH', bank_name: '', account_number: '', opening_balance: '' }
        );
        setAccountModal(account || {});
    };

    const submitAccount = async () => {
        if (!accountForm.name) {
            toast.error('Account name is required.');
            return;
        }
        setSaving(true);
        try {
            if (accountModal?.id) {
                await api.put(`/money/accounts/${accountModal.id}`, accountForm);
                toast.success('Account updated.');
            } else {
                await api.post('/money/accounts', {
                    ...accountForm,
                    opening_balance: parseFloat(accountForm.opening_balance) || 0
                });
                toast.success('Account created.');
            }
            setAccountModal(null);
            fetchAccounts();
            fetchSummary();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save the account.');
        } finally {
            setSaving(false);
        }
    };

    // ---- Print statement ----
    const handlePrint = () => {
        const accountName = filters.account_id
            ? accounts.find((a) => a.id === parseInt(filters.account_id))?.name || 'Selected account'
            : 'All accounts';
        const rows = transactions
            .map(
                (t, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${fmtDate(t.transaction_date)}</td>
                <td>${t.account_name}</td>
                <td>${categoryLabel(t.direction, t.category)}</td>
                <td>${(t.description || '').replace(/</g, '&lt;')}</td>
                <td class="in">${t.direction === 'IN' ? fmt(t.amount) : ''}</td>
                <td class="out">${t.direction === 'OUT' ? fmt(t.amount) : ''}</td>
            </tr>`
            )
            .join('');

        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>Money Statement — Purple Premium Bread</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
                    h1 { font-size: 1.3rem; margin: 0; }
                    .meta { color: #666; font-size: 0.85rem; margin: 6px 0 18px; }
                    .totals { display: flex; gap: 24px; margin-bottom: 16px; font-size: 0.95rem; }
                    .totals b { display: block; font-size: 1.05rem; }
                    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
                    th { background: #f3eefc; }
                    td.in, td.out { text-align: right; white-space: nowrap; }
                    .in { color: #047857; } .out { color: #b91c1c; }
                    .footer { margin-top: 24px; color: #777; font-size: 0.8rem; text-align: center; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>Purple Premium Bread — Money Statement</h1>
                <div class="meta">
                    ${accountName} • ${filters.startDate} to ${filters.endDate}
                    ${filters.direction ? ` • ${filters.direction === 'IN' ? 'Money In only' : 'Money Out only'}` : ''}
                    ${filters.category ? ` • ${filters.category}` : ''}
                    ${filters.search ? ` • search: "${filters.search}"` : ''}
                </div>
                <div class="totals">
                    <span>Total In <b class="in">${fmt(totals.total_in)}</b></span>
                    <span>Total Out <b class="out">${fmt(totals.total_out)}</b></span>
                    <span>Net <b>${fmt(parseFloat(totals.total_in) - parseFloat(totals.total_out))}</b></span>
                    <span>Transactions <b>${pagination.totalCount}</b></span>
                </div>
                <table>
                    <thead>
                        <tr><th>S/N</th><th>Date</th><th>Account</th><th>Category</th><th>Description</th><th>In</th><th>Out</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="footer">Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm')} — Purple Premium Bread</div>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        win.print();
    };

    const clearFilters = () =>
        setFilters({ account_id: '', direction: '', category: '', startDate: firstOfMonth(), endDate: today(), search: '' });

    const filterCategories = useMemo(() => {
        if (!filters.direction) return [...(categories.IN || []), ...(categories.OUT || [])];
        return categories[filters.direction] || [];
    }, [filters.direction, categories]);

    return (
        <div className="money-page">
            {/* Header */}
            <div className="money-header">
                <div>
                    <h1 className="money-title">Money Management</h1>
                    <p className="money-subtitle">Cash & bank — every inflow and outflow in one ledger</p>
                </div>
                <div className="money-actions">
                    <button className="money-btn money-btn--in" onClick={() => openTxnModal('IN')}>
                        <FiArrowDownCircle /> Money In
                    </button>
                    <button className="money-btn money-btn--out" onClick={() => openTxnModal('OUT')}>
                        <FiArrowUpCircle /> Money Out
                    </button>
                    <button className="money-btn money-btn--ghost" onClick={openTransferModal}>
                        <FiRepeat /> Transfer
                    </button>
                    <button className="money-btn money-btn--ghost" onClick={() => openAccountModal(null)}>
                        <FiPlus /> Account
                    </button>
                </div>
            </div>

            {/* KPI cards */}
            <div className="money-kpis">
                <div className="money-kpi">
                    <div className="money-kpi-icon money-kpi-icon--cash"><FiDollarSign /></div>
                    <div>
                        <span className="money-kpi-label">Cash Balance</span>
                        <span className="money-kpi-value">
                            {fmt(accounts.filter((a) => a.account_type === 'CASH' && a.is_active)
                                .reduce((s, a) => s + parseFloat(a.current_balance || 0), 0))}
                        </span>
                    </div>
                </div>
                <div className="money-kpi">
                    <div className="money-kpi-icon money-kpi-icon--bank"><FiCreditCard /></div>
                    <div>
                        <span className="money-kpi-label">Bank Balance</span>
                        <span className="money-kpi-value">
                            {fmt(accounts.filter((a) => a.account_type === 'BANK' && a.is_active)
                                .reduce((s, a) => s + parseFloat(a.current_balance || 0), 0))}
                        </span>
                    </div>
                </div>
                <div className="money-kpi">
                    <div className="money-kpi-icon money-kpi-icon--in"><FiTrendingUp /></div>
                    <div>
                        <span className="money-kpi-label">Money In (period)</span>
                        <span className="money-kpi-value money-kpi-value--in">{fmt(summary?.total_in)}</span>
                    </div>
                </div>
                <div className="money-kpi">
                    <div className="money-kpi-icon money-kpi-icon--out"><FiTrendingDown /></div>
                    <div>
                        <span className="money-kpi-label">Money Out (period)</span>
                        <span className="money-kpi-value money-kpi-value--out">{fmt(summary?.total_out)}</span>
                    </div>
                </div>
            </div>

            {/* Account cards */}
            <div className="money-accounts">
                {accounts.map((a) => (
                    <div className={`money-account ${a.is_active ? '' : 'money-account--inactive'}`} key={a.id}>
                        <div className="money-account-top">
                            <span className={`money-account-type money-account-type--${a.account_type.toLowerCase()}`}>
                                {a.account_type}
                            </span>
                            <button className="money-account-edit" title="Edit account" onClick={() => openAccountModal(a)}>
                                <FiEdit2 />
                            </button>
                        </div>
                        <h3>{a.name}</h3>
                        {a.bank_name && <p className="money-account-bank">{a.bank_name} {a.account_number ? `• ${a.account_number}` : ''}</p>}
                        <span className="money-account-balance">{fmt(a.current_balance)}</span>
                        <span className="money-account-meta">
                            This month: <span className="in">+{fmt(a.period_in)}</span> / <span className="out">−{fmt(a.period_out)}</span>
                        </span>
                    </div>
                ))}
            </div>

            {/* Filter bar */}
            <div className="money-filterbar">
                <button className="money-btn money-btn--ghost" onClick={() => setShowFilters(!showFilters)}>
                    <FiFilter /> {showFilters ? 'Hide Filters' : 'Filters'}
                </button>
                <div className="money-daterange">
                    <input type="date" value={filters.startDate}
                        onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} />
                    <span>to</span>
                    <input type="date" value={filters.endDate}
                        onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} />
                </div>
                <button className="money-btn money-btn--ghost" onClick={() => fetchTransactions(pagination.page)}>
                    <FiRefreshCw /> Refresh
                </button>
                <button className="money-btn money-btn--primary" onClick={handlePrint}>
                    <FiPrinter /> Print Statement
                </button>
            </div>

            {showFilters && (
                <div className="money-filters">
                    <select value={filters.account_id}
                        onChange={(e) => setFilters((p) => ({ ...p, account_id: e.target.value }))}>
                        <option value="">All Accounts</option>
                        {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>
                        ))}
                    </select>
                    <select value={filters.direction}
                        onChange={(e) => setFilters((p) => ({ ...p, direction: e.target.value, category: '' }))}>
                        <option value="">In & Out</option>
                        <option value="IN">Money In</option>
                        <option value="OUT">Money Out</option>
                    </select>
                    <select value={filters.category}
                        onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                        <option value="">All Categories</option>
                        {filterCategories.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                    </select>
                    <div className="money-search">
                        <FiSearch />
                        <input type="text" placeholder="Search description..."
                            value={filters.search}
                            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
                    </div>
                    <button className="money-btn money-btn--ghost" onClick={clearFilters}>
                        <FiX /> Clear
                    </button>
                </div>
            )}

            {/* Transactions table */}
            <div className="money-card">
                <div className="money-card-head">
                    <h3>Transactions</h3>
                    <div className="money-card-totals">
                        <span className="in">In: {fmt(totals.total_in)}</span>
                        <span className="out">Out: {fmt(totals.total_out)}</span>
                        <span>{pagination.totalCount} records</span>
                    </div>
                </div>
                {loading ? (
                    <div className="money-loading"><div className="money-spinner"></div><p>Loading transactions...</p></div>
                ) : transactions.length === 0 ? (
                    <div className="money-empty">
                        <FiDollarSign className="money-empty-icon" />
                        <h3>No transactions in this period</h3>
                        <p>Use Money In / Money Out to record your first entry.</p>
                    </div>
                ) : (
                    <>
                        <div className="money-table-wrap">
                            <table className="money-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Account</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th>Recorded by</th>
                                        <th className="amt">In</th>
                                        <th className="amt">Out</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((t) => (
                                        <tr key={t.id}>
                                            <td className="money-date">{fmtDate(t.transaction_date)}</td>
                                            <td>{t.account_name}</td>
                                            <td>
                                                <span className={`money-cat money-cat--${t.direction.toLowerCase()}`}>
                                                    {categoryLabel(t.direction, t.category)}
                                                </span>
                                            </td>
                                            <td className="money-desc">{t.description || '—'}</td>
                                            <td>{t.recorded_by_name || 'System'}</td>
                                            <td className="amt in">{t.direction === 'IN' ? fmt(t.amount) : ''}</td>
                                            <td className="amt out">{t.direction === 'OUT' ? fmt(t.amount) : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination.totalPages > 1 && (
                            <div className="money-pagination">
                                <button disabled={pagination.page === 1}
                                    onClick={() => fetchTransactions(pagination.page - 1)}>Previous</button>
                                <span>Page {pagination.page} of {pagination.totalPages}</span>
                                <button disabled={pagination.page === pagination.totalPages}
                                    onClick={() => fetchTransactions(pagination.page + 1)}>Next</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Transaction modal */}
            {txnModal && (
                <div className="money-modal" onClick={() => !saving && setTxnModal(null)}>
                    <div className="money-modal__content" onClick={(e) => e.stopPropagation()}>
                        <div className="money-modal__header">
                            <h3>{txnModal.direction === 'IN' ? 'Record Money In' : 'Record Money Out'}</h3>
                            <button className="money-modal__close" onClick={() => setTxnModal(null)}><FiX /></button>
                        </div>
                        <div className="money-modal__body">
                            <div className="money-field">
                                <label>Account *</label>
                                <select value={txnForm.account_id}
                                    onChange={(e) => setTxnForm((p) => ({ ...p, account_id: e.target.value }))}>
                                    {accounts.filter((a) => a.is_active).map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.account_type}) — {fmt(a.current_balance)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="money-field">
                                <label>Category *</label>
                                <select value={txnForm.category}
                                    onChange={(e) => setTxnForm((p) => ({ ...p, category: e.target.value }))}>
                                    <option value="">Select category</option>
                                    {(categories[txnModal.direction] || []).map((c) => (
                                        <option key={c.key} value={c.key}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="money-field">
                                <label>Amount (₦) *</label>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                    value={txnForm.amount}
                                    onChange={(e) => setTxnForm((p) => ({ ...p, amount: e.target.value }))} />
                            </div>
                            <div className="money-field">
                                <label>Date</label>
                                <input type="date" value={txnForm.transaction_date}
                                    onChange={(e) => setTxnForm((p) => ({ ...p, transaction_date: e.target.value }))} />
                            </div>
                            <div className="money-field">
                                <label>Payment Method</label>
                                <select value={txnForm.payment_method}
                                    onChange={(e) => setTxnForm((p) => ({ ...p, payment_method: e.target.value }))}>
                                    <option>Cash</option>
                                    <option>Bank Transfer</option>
                                    <option>POS</option>
                                    <option>Mobile Money</option>
                                </select>
                            </div>
                            <div className="money-field money-field--full">
                                <label>Description</label>
                                <textarea rows={2} placeholder="What is this for?"
                                    value={txnForm.description}
                                    onChange={(e) => setTxnForm((p) => ({ ...p, description: e.target.value }))} />
                            </div>
                        </div>
                        <div className="money-modal__footer">
                            <button className="money-btn money-btn--ghost" onClick={() => setTxnModal(null)} disabled={saving}>Cancel</button>
                            <button className={`money-btn ${txnModal.direction === 'IN' ? 'money-btn--in' : 'money-btn--out'}`}
                                onClick={submitTxn} disabled={saving}>
                                {saving ? 'Saving...' : txnModal.direction === 'IN' ? 'Record In' : 'Record Out'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer modal */}
            {transferModal && (
                <div className="money-modal" onClick={() => !saving && setTransferModal(false)}>
                    <div className="money-modal__content" onClick={(e) => e.stopPropagation()}>
                        <div className="money-modal__header">
                            <h3>Transfer Between Accounts</h3>
                            <button className="money-modal__close" onClick={() => setTransferModal(false)}><FiX /></button>
                        </div>
                        <div className="money-modal__body">
                            <div className="money-field">
                                <label>From *</label>
                                <select value={transferForm.from_account_id}
                                    onChange={(e) => setTransferForm((p) => ({ ...p, from_account_id: e.target.value }))}>
                                    <option value="">Select source</option>
                                    {accounts.filter((a) => a.is_active).map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} — {fmt(a.current_balance)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="money-field">
                                <label>To *</label>
                                <select value={transferForm.to_account_id}
                                    onChange={(e) => setTransferForm((p) => ({ ...p, to_account_id: e.target.value }))}>
                                    <option value="">Select destination</option>
                                    {accounts.filter((a) => a.is_active && a.id !== parseInt(transferForm.from_account_id)).map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} — {fmt(a.current_balance)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="money-field">
                                <label>Amount (₦) *</label>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                    value={transferForm.amount}
                                    onChange={(e) => setTransferForm((p) => ({ ...p, amount: e.target.value }))} />
                            </div>
                            <div className="money-field">
                                <label>Date</label>
                                <input type="date" value={transferForm.transaction_date}
                                    onChange={(e) => setTransferForm((p) => ({ ...p, transaction_date: e.target.value }))} />
                            </div>
                            <div className="money-field money-field--full">
                                <label>Description</label>
                                <textarea rows={2} placeholder="Optional note"
                                    value={transferForm.description}
                                    onChange={(e) => setTransferForm((p) => ({ ...p, description: e.target.value }))} />
                            </div>
                        </div>
                        <div className="money-modal__footer">
                            <button className="money-btn money-btn--ghost" onClick={() => setTransferModal(false)} disabled={saving}>Cancel</button>
                            <button className="money-btn money-btn--primary" onClick={submitTransfer} disabled={saving}>
                                <FiRepeat /> {saving ? 'Working...' : 'Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Account modal */}
            {accountModal && (
                <div className="money-modal" onClick={() => !saving && setAccountModal(null)}>
                    <div className="money-modal__content" onClick={(e) => e.stopPropagation()}>
                        <div className="money-modal__header">
                            <h3>{accountModal.id ? 'Edit Account' : 'New Account'}</h3>
                            <button className="money-modal__close" onClick={() => setAccountModal(null)}><FiX /></button>
                        </div>
                        <div className="money-modal__body">
                            <div className="money-field">
                                <label>Name *</label>
                                <input type="text" placeholder="e.g. Main Cash, GTBank Current"
                                    value={accountForm.name}
                                    onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} />
                            </div>
                            {!accountModal.id && (
                                <div className="money-field">
                                    <label>Type *</label>
                                    <select value={accountForm.account_type}
                                        onChange={(e) => setAccountForm((p) => ({ ...p, account_type: e.target.value }))}>
                                        <option value="CASH">Cash</option>
                                        <option value="BANK">Bank</option>
                                    </select>
                                </div>
                            )}
                            {(accountModal.id ? accountModal.account_type === 'BANK' : accountForm.account_type === 'BANK') && (
                                <>
                                    <div className="money-field">
                                        <label>Bank Name</label>
                                        <input type="text" value={accountForm.bank_name}
                                            onChange={(e) => setAccountForm((p) => ({ ...p, bank_name: e.target.value }))} />
                                    </div>
                                    <div className="money-field">
                                        <label>Account Number</label>
                                        <input type="text" value={accountForm.account_number}
                                            onChange={(e) => setAccountForm((p) => ({ ...p, account_number: e.target.value }))} />
                                    </div>
                                </>
                            )}
                            {!accountModal.id && (
                                <div className="money-field">
                                    <label>Opening Balance (₦)</label>
                                    <input type="number" min="0" step="0.01" placeholder="0.00"
                                        value={accountForm.opening_balance}
                                        onChange={(e) => setAccountForm((p) => ({ ...p, opening_balance: e.target.value }))} />
                                </div>
                            )}
                            {accountModal.id && (
                                <div className="money-field">
                                    <label>Status</label>
                                    <select value={accountForm.is_active ? 'active' : 'inactive'}
                                        onChange={(e) => setAccountForm((p) => ({ ...p, is_active: e.target.value === 'active' }))}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="money-modal__footer">
                            <button className="money-btn money-btn--ghost" onClick={() => setAccountModal(null)} disabled={saving}>Cancel</button>
                            <button className="money-btn money-btn--primary" onClick={submitAccount} disabled={saving}>
                                {saving ? 'Saving...' : accountModal.id ? 'Save Changes' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoneyPage;
