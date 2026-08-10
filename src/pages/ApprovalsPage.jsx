// src/pages/ApprovalsPage.jsx — Approval queue: review, approve, reject staged actions
import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
    FiCheck, FiX, FiEye, FiRefreshCw, FiClock, FiCheckCircle,
    FiXCircle, FiSlash, FiUser, FiTag, FiDollarSign, FiCalendar
} from 'react-icons/fi';
import api from '../api/axiosInstance';
import useAuth from '../hooks/useAuth';
import '../assets/styles/approvals.css';

const STATUS_META = {
    PENDING: { label: 'Pending', icon: <FiClock />, cls: 'apv-badge--pending' },
    APPROVED: { label: 'Approved', icon: <FiCheckCircle />, cls: 'apv-badge--approved' },
    REJECTED: { label: 'Rejected', icon: <FiXCircle />, cls: 'apv-badge--rejected' },
    CANCELLED: { label: 'Cancelled', icon: <FiSlash />, cls: 'apv-badge--cancelled' }
};

const formatNaira = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '—';
    return `₦${parseFloat(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const formatDate = (d) => {
    if (!d) return '—';
    try {
        return format(new Date(d), 'MMM dd, yyyy HH:mm');
    } catch {
        return String(d);
    }
};

const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] || STATUS_META.PENDING;
    return (
        <span className={`apv-badge ${meta.cls}`}>
            {meta.icon} {meta.label}
        </span>
    );
};

const ApprovalsPage = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('pending');
    const [pending, setPending] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selected, setSelected] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [note, setNote] = useState('');
    const [acting, setActing] = useState(false);

    const fetchPending = useCallback(async () => {
        try {
            const res = await api.get('/approvals');
            setPending(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load pending approvals.');
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await api.get('/approvals/history');
            setHistory(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load approval history.');
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchPending(), fetchHistory()]);
        setLoading(false);
    }, [fetchPending, fetchHistory]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const openDetail = async (id) => {
        setDetailLoading(true);
        setNote('');
        try {
            const res = await api.get(`/approvals/${id}`);
            setSelected(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load the request details.');
        } finally {
            setDetailLoading(false);
        }
    };

    const act = async (action) => {
        if (!selected) return;
        if (action === 'reject' && !note.trim()) {
            toast.warning('Please add a short note explaining the rejection.');
            return;
        }
        setActing(true);
        try {
            const res = await api.post(`/approvals/${selected.id}/${action}`, { note: note.trim() || undefined });
            toast.success(res.data?.message || `Request ${action}d.`);
            setSelected(null);
            refresh();
        } catch (err) {
            toast.error(err.response?.data?.error || `Failed to ${action} the request.`);
            if (err.response?.status === 409) {
                setSelected(null);
                refresh();
            }
        } finally {
            setActing(false);
        }
    };

    const isOwnRequest = selected && user && selected.requested_by === user.id;
    const canReview = selected && selected.status === 'PENDING' && !isOwnRequest;
    const canCancel = selected && selected.status === 'PENDING' && isOwnRequest;

    const rows = tab === 'pending' ? pending : history;

    return (
        <div className="apv-page">
            {/* Header */}
            <div className="apv-header">
                <div>
                    <h1 className="apv-title">Approvals</h1>
                    <p className="apv-subtitle">
                        Review staged actions — approving executes them immediately, rejecting discards them.
                    </p>
                </div>
                <button className="apv-btn apv-btn--ghost" onClick={refresh}>
                    <FiRefreshCw /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="apv-tabs">
                <button
                    className={`apv-tab ${tab === 'pending' ? 'apv-tab--active' : ''}`}
                    onClick={() => setTab('pending')}
                >
                    Pending
                    {pending.length > 0 && <span className="apv-count">{pending.length}</span>}
                </button>
                <button
                    className={`apv-tab ${tab === 'history' ? 'apv-tab--active' : ''}`}
                    onClick={() => setTab('history')}
                >
                    History
                </button>
            </div>

            {/* List */}
            <div className="apv-card">
                {loading ? (
                    <div className="apv-loading">
                        <div className="apv-spinner"></div>
                        <p>Loading approvals...</p>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="apv-empty">
                        <FiCheckCircle className="apv-empty-icon" />
                        <h3>{tab === 'pending' ? 'Nothing waiting for approval' : 'No history yet'}</h3>
                        <p>
                            {tab === 'pending'
                                ? 'When an action needs your approval, it will appear here.'
                                : 'Reviewed and cancelled requests will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="apv-table-wrap">
                        <table className="apv-table">
                            <thead>
                                <tr>
                                    <th>Request</th>
                                    <th>Type</th>
                                    <th className="apv-amount-col">Amount</th>
                                    <th>Requested by</th>
                                    <th>{tab === 'pending' ? 'Submitted' : 'Reviewed'}</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.id}>
                                        <td className="apv-title-cell">{r.title}</td>
                                        <td>
                                            <span className="apv-type">{r.feature_name || r.request_type}</span>
                                        </td>
                                        <td className="apv-amount-col apv-amount">{formatNaira(r.amount)}</td>
                                        <td>
                                            <div className="apv-requester">
                                                <FiUser />
                                                <div>
                                                    <div>{r.requested_by_name || 'Unknown'}</div>
                                                    {r.requested_by_role && (
                                                        <small>{r.requested_by_role}</small>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="apv-date">
                                            {tab === 'pending'
                                                ? formatDate(r.created_at)
                                                : formatDate(r.reviewed_at || r.created_at)}
                                        </td>
                                        <td>
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td>
                                            <button
                                                className="apv-btn apv-btn--mini apv-btn--primary"
                                                onClick={() => openDetail(r.id)}
                                            >
                                                <FiEye /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {(selected || detailLoading) && (
                <div className="apv-modal" onClick={() => !acting && setSelected(null)}>
                    <div className="apv-modal__content" onClick={(e) => e.stopPropagation()}>
                        {detailLoading || !selected ? (
                            <div className="apv-loading">
                                <div className="apv-spinner"></div>
                                <p>Loading details...</p>
                            </div>
                        ) : (
                            <>
                                <div className="apv-modal__header">
                                    <h3>{selected.title}</h3>
                                    <StatusBadge status={selected.status} />
                                </div>

                                <div className="apv-modal__meta">
                                    <div className="apv-meta-item">
                                        <FiTag />
                                        <div>
                                            <small>Type</small>
                                            <span>{selected.feature_name || selected.request_type}</span>
                                        </div>
                                    </div>
                                    <div className="apv-meta-item">
                                        <FiDollarSign />
                                        <div>
                                            <small>Amount</small>
                                            <span>{formatNaira(selected.amount)}</span>
                                        </div>
                                    </div>
                                    <div className="apv-meta-item">
                                        <FiUser />
                                        <div>
                                            <small>Requested by</small>
                                            <span>
                                                {selected.requested_by_name || 'Unknown'}
                                                {selected.requested_by_role ? ` (${selected.requested_by_role})` : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="apv-meta-item">
                                        <FiCalendar />
                                        <div>
                                            <small>Submitted</small>
                                            <span>{formatDate(selected.created_at)}</span>
                                        </div>
                                    </div>
                                    {selected.reviewed_by_name && (
                                        <div className="apv-meta-item">
                                            <FiCheckCircle />
                                            <div>
                                                <small>Reviewed by</small>
                                                <span>
                                                    {selected.reviewed_by_name} — {formatDate(selected.reviewed_at)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selected.review_note && (
                                    <div className="apv-note-view">
                                        <small>Review note</small>
                                        <p>{selected.review_note}</p>
                                    </div>
                                )}

                                {/* Staged payload */}
                                <div className="apv-payload">
                                    <small>
                                        Staged action: {selected.payload?.method}{' '}
                                        {selected.payload?.url}
                                    </small>
                                    <pre>{JSON.stringify(selected.payload?.body ?? {}, null, 2)}</pre>
                                </div>

                                {selected.status === 'APPROVED' && selected.execution_result && (
                                    <div className="apv-execution">
                                        <small>Execution result</small>
                                        <pre>{JSON.stringify(selected.execution_result, null, 2)}</pre>
                                    </div>
                                )}

                                {(canReview || canCancel) && (
                                    <div className="apv-review">
                                        <textarea
                                            placeholder={
                                                canReview
                                                    ? 'Add a note (required for rejection, optional for approval)...'
                                                    : 'Add a note (optional)...'
                                            }
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={2}
                                        />
                                        <div className="apv-review-actions">
                                            {canReview && (
                                                <>
                                                    <button
                                                        className="apv-btn apv-btn--danger"
                                                        disabled={acting}
                                                        onClick={() => act('reject')}
                                                    >
                                                        <FiX /> Reject
                                                    </button>
                                                    <button
                                                        className="apv-btn apv-btn--success"
                                                        disabled={acting}
                                                        onClick={() => act('approve')}
                                                    >
                                                        <FiCheck /> {acting ? 'Working...' : 'Approve & Execute'}
                                                    </button>
                                                </>
                                            )}
                                            {canCancel && (
                                                <button
                                                    className="apv-btn apv-btn--ghost"
                                                    disabled={acting}
                                                    onClick={() => act('cancel')}
                                                >
                                                    <FiSlash /> Cancel my request
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="apv-modal__footer">
                                    <button
                                        className="apv-btn apv-btn--ghost"
                                        onClick={() => setSelected(null)}
                                        disabled={acting}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalsPage;
