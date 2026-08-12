// src/pages/AuditLogsPage.jsx — Audit trail viewer (admin & manager, view-only).
// Filterable, paginated list; clicking a row opens the full detail modal.
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import '../assets/styles/settings.css';

const EMPTY_FILTERS = { user: '', action: '', entity_type: '', channel: '', startDate: '', endDate: '', search: '' };

const AuditLogsPage = () => {
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [options, setOptions] = useState({ actions: [], entity_types: [], channels: [] });
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const load = useCallback(async (p = page, f = filters) => {
        setLoading(true);
        try {
            const params = { page: p, limit: 30 };
            Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
            const res = await api.get('/audit-logs', { params });
            setLogs(res.data.logs || []);
            setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        api.get('/audit-logs/filters')
            .then(res => setOptions(res.data))
            .catch(() => {});
    }, []);

    const applyFilters = () => { setPage(1); load(1, filters); };
    const resetFilters = () => { setFilters(EMPTY_FILTERS); setPage(1); load(1, EMPTY_FILTERS); };

    const openDetail = async (id) => {
        setDetailLoading(true);
        setDetail({ id });
        try {
            const res = await api.get(`/audit-logs/${id}`);
            setDetail(res.data);
        } catch (e) {
            toast.error('Failed to load log detail.');
            setDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const fmtJson = (v) => {
        if (v === null || v === undefined) return '—';
        try { return JSON.stringify(typeof v === 'string' ? JSON.parse(v) : v, null, 2); }
        catch { return String(v); }
    };

    return (
        <div className="ppb-audit">
            <div className="ppb-audit__head">
                <h2>Audit Log</h2>
                <p>Every action performed in the system, who did it, and when. Click a row for full details.</p>
            </div>

            <div className="ppb-audit__filters">
                <input placeholder="User" value={filters.user}
                    onChange={e => setFilters(f => ({ ...f, user: e.target.value }))} />
                <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
                    <option value="">All actions</option>
                    {options.actions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filters.entity_type} onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}>
                    <option value="">All entities</option>
                    {options.entity_types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filters.channel} onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}>
                    <option value="">All channels</option>
                    {options.channels.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" value={filters.startDate}
                    onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
                <input type="date" value={filters.endDate}
                    onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
                <input placeholder="Search description" value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                <button className="ppb-audit__btn" onClick={applyFilters}>Apply</button>
                <button className="ppb-audit__btn ppb-audit__btn--ghost" onClick={resetFilters}>Reset</button>
            </div>

            {loading ? (
                <div className="ppb-audit__loading">Loading...</div>
            ) : (
                <div className="ppb-audit__table-wrap">
                    <table className="ppb-audit__table">
                        <thead>
                            <tr>
                                <th>Time</th><th>User</th><th>Role</th><th>Channel</th>
                                <th>Action</th><th>Entity</th><th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 && (
                                <tr><td colSpan="7" className="ppb-audit__empty">No audit entries found.</td></tr>
                            )}
                            {logs.map(log => (
                                <tr key={log.id} onClick={() => openDetail(log.id)}>
                                    <td>{new Date(log.created_at).toLocaleString()}</td>
                                    <td>{log.user_name || '—'}</td>
                                    <td>{log.user_role || '—'}</td>
                                    <td><span className="ppb-audit__chip">{log.channel || 'web'}</span></td>
                                    <td><span className={`ppb-audit__chip ppb-audit__chip--${(log.action || '').toLowerCase()}`}>{log.action}</span></td>
                                    <td>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
                                    <td className="ppb-audit__desc">{log.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="ppb-audit__pager">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>

            {detail && (
                <div className="ppb-audit__modal-backdrop" onClick={() => setDetail(null)}>
                    <div className="ppb-audit__modal" onClick={e => e.stopPropagation()}>
                        <div className="ppb-audit__modal-head">
                            <h3>Audit entry {detail.id}</h3>
                            <button onClick={() => setDetail(null)}>×</button>
                        </div>
                        {detailLoading ? <p>Loading...</p> : (
                            <div className="ppb-audit__modal-body">
                                <div className="ppb-audit__kv"><b>Time</b><span>{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span></div>
                                <div className="ppb-audit__kv"><b>User</b><span>{detail.user_name || '—'} ({detail.user_role || '—'})</span></div>
                                <div className="ppb-audit__kv"><b>Channel</b><span>{detail.channel || 'web'}</span></div>
                                <div className="ppb-audit__kv"><b>Action</b><span>{detail.action}</span></div>
                                <div className="ppb-audit__kv"><b>Entity</b><span>{detail.entity_type || '—'}{detail.entity_id ? ` #${detail.entity_id}` : ''}</span></div>
                                <div className="ppb-audit__kv"><b>IP address</b><span>{detail.ip_address || '—'}</span></div>
                                <div className="ppb-audit__kv"><b>Description</b><span>{detail.description || '—'}</span></div>
                                <h4>Old values</h4>
                                <pre>{fmtJson(detail.old_values)}</pre>
                                <h4>New values</h4>
                                <pre>{fmtJson(detail.new_values)}</pre>
                                <h4>Metadata</h4>
                                <pre>{fmtJson(detail.metadata)}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
