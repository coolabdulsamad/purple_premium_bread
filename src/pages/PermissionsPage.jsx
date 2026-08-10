// src/pages/PermissionsPage.jsx — Role permissions & workflow configuration (admin only)
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    FiShield, FiGitBranch, FiSave, FiRefreshCw, FiInfo, FiCheck
} from 'react-icons/fi';
import api from '../api/axiosInstance';
import '../assets/styles/permissions.css';

const ROLE_LABELS = {
    admin: 'Admin',
    manager: 'Manager',
    sales: 'Sales',
    baker: 'Baker',
    accountant: 'Accountant'
};

const ACTION_LABELS = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve'
};

const FEATURE_LABELS = {
    sales: 'Sales',
    exchanges: 'Exchanges',
    products: 'Products',
    categories: 'Categories',
    inventory: 'Inventory & Stock',
    production: 'Production',
    raw_materials: 'Raw Materials',
    recipes: 'Recipes',
    customers: 'Customers',
    riders: 'Riders',
    payments: 'Payments',
    debts: 'Company Debts',
    salaries: 'Salaries & Loans',
    staff: 'Staff Members',
    expenses: 'Operating Expenses',
    reports: 'Reports',
    analysis: 'Analysis',
    users: 'User Accounts',
    branches: 'Branches',
    services: 'Services',
    settings: 'Settings',
    approvals: 'Approvals',
    audit_logs: 'Audit Logs',
    money: 'Money Management',
    wallets: 'Advance Wallets',
    returns: 'Sales Returns',
    chat: 'Internal Chat',
    ai_assistant: 'AI Assistant',
    dashboard: 'Dashboard',
    company: 'Company Profile'
};

const PermissionsPage = () => {
    const [activeTab, setActiveTab] = useState('roles');
    const [loading, setLoading] = useState(true);
    const [catalog, setCatalog] = useState({ roles: [], features: {} });
    const [selectedRole, setSelectedRole] = useState('manager');
    const [draft, setDraft] = useState({});
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const [workflows, setWorkflows] = useState([]);
    const [wfDraft, setWfDraft] = useState({});
    const [wfDirty, setWfDirty] = useState({});

    const fetchCatalog = async () => {
        try {
            const res = await api.get('/permissions/catalog');
            setCatalog(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load the permissions catalog.');
        }
    };

    const fetchWorkflows = async () => {
        try {
            const res = await api.get('/permissions/workflow');
            setWorkflows(res.data);
            const next = {};
            res.data.forEach((w) => {
                next[w.feature] = {
                    requires_approval: !!w.requires_approval,
                    approval_threshold: w.approval_threshold ?? 0,
                    approver_roles: Array.isArray(w.approver_roles) ? w.approver_roles : ['admin', 'manager'],
                    is_enabled: w.is_enabled !== false
                };
            });
            setWfDraft(next);
            setWfDirty({});
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to load workflow settings.');
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await Promise.all([fetchCatalog(), fetchWorkflows()]);
            setLoading(false);
        })();
    }, []);

    // Rebuild the checkbox draft whenever the role or catalog changes
    useEffect(() => {
        const next = {};
        Object.values(catalog.features).flat().forEach((p) => {
            next[p.permission_key] =
                selectedRole === 'admin' ? true : !!(p.grants && p.grants[selectedRole]);
        });
        setDraft(next);
        setDirty(false);
    }, [selectedRole, catalog]);

    const allRoles = useMemo(
        () => ['admin', ...(catalog.roles || []).filter((r) => r !== 'admin')],
        [catalog.roles]
    );

    const toggle = (key) => {
        if (selectedRole === 'admin') return;
        setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
        setDirty(true);
    };

    const setFeatureAll = (feature, value) => {
        if (selectedRole === 'admin') return;
        const perms = catalog.features[feature] || [];
        setDraft((prev) => {
            const next = { ...prev };
            perms.forEach((p) => { next[p.permission_key] = value; });
            return next;
        });
        setDirty(true);
    };

    const saveRole = async () => {
        setSaving(true);
        try {
            const grants = Object.entries(draft).map(([permission_key, is_allowed]) => ({
                permission_key,
                is_allowed
            }));
            await api.put(`/permissions/role/${selectedRole}`, { grants });
            toast.success(`Permissions updated for ${ROLE_LABELS[selectedRole] || selectedRole}.`);
            setDirty(false);
            fetchCatalog();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save permissions.');
        } finally {
            setSaving(false);
        }
    };

    const updateWf = (feature, patch) => {
        setWfDraft((prev) => ({ ...prev, [feature]: { ...prev[feature], ...patch } }));
        setWfDirty((prev) => ({ ...prev, [feature]: true }));
    };

    const toggleApproverRole = (feature, role) => {
        const current = wfDraft[feature]?.approver_roles || [];
        const next = current.includes(role)
            ? current.filter((r) => r !== role)
            : [...current, role];
        if (next.length === 0) {
            toast.warning('At least one approver role is required.');
            return;
        }
        updateWf(feature, { approver_roles: next });
    };

    const saveWorkflow = async (feature) => {
        try {
            const d = wfDraft[feature];
            await api.put(`/permissions/workflow/${feature}`, {
                requires_approval: d.requires_approval,
                approval_threshold: parseFloat(d.approval_threshold) || 0,
                approver_roles: d.approver_roles,
                is_enabled: d.is_enabled
            });
            toast.success('Workflow setting updated.');
            setWfDirty((prev) => ({ ...prev, [feature]: false }));
            fetchWorkflows();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update workflow.');
        }
    };

    const grantedCount = Object.values(draft).filter(Boolean).length;
    const totalCount = Object.keys(draft).length;

    if (loading) {
        return (
            <div className="perm-page">
                <div className="perm-loading">
                    <div className="perm-spinner"></div>
                    <p>Loading permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="perm-page">
            {/* Header */}
            <div className="perm-header">
                <div>
                    <h1 className="perm-title">
                        <FiShield /> Permissions & Workflows
                    </h1>
                    <p className="perm-subtitle">
                        Control what each role can do, and which actions require approval before they take effect.
                    </p>
                </div>
                {activeTab === 'roles' && dirty && (
                    <button className="perm-btn perm-btn--primary" onClick={saveRole} disabled={saving}>
                        <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="perm-tabs">
                <button
                    className={`perm-tab ${activeTab === 'roles' ? 'perm-tab--active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <FiShield /> Role Permissions
                </button>
                <button
                    className={`perm-tab ${activeTab === 'workflows' ? 'perm-tab--active' : ''}`}
                    onClick={() => setActiveTab('workflows')}
                >
                    <FiGitBranch /> Approval Workflows
                </button>
            </div>

            {activeTab === 'roles' && (
                <>
                    {/* Role selector */}
                    <div className="perm-role-tabs">
                        {allRoles.map((role) => (
                            <button
                                key={role}
                                className={`perm-role-tab ${selectedRole === role ? 'perm-role-tab--active' : ''}`}
                                onClick={() => setSelectedRole(role)}
                            >
                                {ROLE_LABELS[role] || role}
                                {role === 'admin' && <span className="perm-role-badge">Full access</span>}
                            </button>
                        ))}
                    </div>

                    {selectedRole === 'admin' && (
                        <div className="perm-note">
                            <FiInfo /> The Admin role always has every permission and bypasses all approval
                            workflows. Its permissions cannot be edited.
                        </div>
                    )}

                    {selectedRole !== 'admin' && (
                        <div className="perm-note perm-note--count">
                            <FiInfo />
                            {grantedCount} of {totalCount} permissions granted to{' '}
                            <strong>{ROLE_LABELS[selectedRole] || selectedRole}</strong>
                            {dirty && <span className="perm-unsaved"> — unsaved changes</span>}
                        </div>
                    )}

                    {/* Feature matrix */}
                    <div className="perm-features">
                        {Object.entries(catalog.features).map(([feature, perms]) => {
                            const granted = perms.filter((p) => draft[p.permission_key]).length;
                            return (
                                <div className="perm-feature-card" key={feature}>
                                    <div className="perm-feature-head">
                                        <div>
                                            <h3 className="perm-feature-name">
                                                {FEATURE_LABELS[feature] || feature.replace(/_/g, ' ')}
                                            </h3>
                                            <span className="perm-feature-count">
                                                {granted}/{perms.length} granted
                                            </span>
                                        </div>
                                        {selectedRole !== 'admin' && (
                                            <div className="perm-feature-actions">
                                                <button
                                                    className="perm-btn perm-btn--mini"
                                                    onClick={() => setFeatureAll(feature, true)}
                                                >
                                                    All
                                                </button>
                                                <button
                                                    className="perm-btn perm-btn--mini perm-btn--ghost"
                                                    onClick={() => setFeatureAll(feature, false)}
                                                >
                                                    None
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="perm-grid">
                                        {perms.map((p) => (
                                            <label
                                                key={p.permission_key}
                                                className={`perm-item ${draft[p.permission_key] ? 'perm-item--on' : ''} ${selectedRole === 'admin' ? 'perm-item--locked' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!draft[p.permission_key]}
                                                    disabled={selectedRole === 'admin'}
                                                    onChange={() => toggle(p.permission_key)}
                                                />
                                                <span className="perm-item-box">
                                                    {draft[p.permission_key] && <FiCheck />}
                                                </span>
                                                <span className="perm-item-text">
                                                    <span className="perm-item-action">
                                                        {ACTION_LABELS[p.action] || p.action}
                                                    </span>
                                                    <span className="perm-item-desc">{p.description}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {selectedRole !== 'admin' && dirty && (
                        <div className="perm-savebar">
                            <span>You have unsaved changes.</span>
                            <button className="perm-btn perm-btn--primary" onClick={saveRole} disabled={saving}>
                                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'workflows' && (
                <>
                    <div className="perm-note">
                        <FiInfo /> When a workflow requires approval, the action is staged and nothing changes in
                        the records until an approver confirms it on the Approvals page. A threshold of ₦0 means
                        every action needs approval; a higher threshold means only amounts at or above it do.
                    </div>
                    <div className="perm-workflows">
                        {workflows.map((w) => {
                            const d = wfDraft[w.feature] || {};
                            return (
                                <div className="perm-wf-card" key={w.feature}>
                                    <div className="perm-wf-head">
                                        <div>
                                            <h3 className="perm-wf-name">{w.display_name || w.feature}</h3>
                                            <p className="perm-wf-desc">{w.description}</p>
                                        </div>
                                        <label className="perm-switch">
                                            <input
                                                type="checkbox"
                                                checked={!!d.requires_approval}
                                                onChange={(e) =>
                                                    updateWf(w.feature, { requires_approval: e.target.checked })
                                                }
                                            />
                                            <span className="perm-switch-slider"></span>
                                            <span className="perm-switch-label">
                                                {d.requires_approval ? 'Approval ON' : 'Approval OFF'}
                                            </span>
                                        </label>
                                    </div>

                                    {d.requires_approval && (
                                        <div className="perm-wf-body">
                                            <div className="perm-wf-field">
                                                <label>Amount threshold (₦)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={d.approval_threshold}
                                                    onChange={(e) =>
                                                        updateWf(w.feature, { approval_threshold: e.target.value })
                                                    }
                                                />
                                                <small>
                                                    {parseFloat(d.approval_threshold) > 0
                                                        ? `Only amounts ≥ ₦${Number(d.approval_threshold).toLocaleString()} need approval`
                                                        : 'Every action needs approval'}
                                                </small>
                                            </div>
                                            <div className="perm-wf-field">
                                                <label>Who can approve</label>
                                                <div className="perm-chips">
                                                    {allRoles.map((role) => (
                                                        <button
                                                            key={role}
                                                            type="button"
                                                            className={`perm-chip ${(d.approver_roles || []).includes(role) ? 'perm-chip--on' : ''}`}
                                                            onClick={() => toggleApproverRole(w.feature, role)}
                                                        >
                                                            {ROLE_LABELS[role] || role}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="perm-wf-foot">
                                        {w.updated_by_name && (
                                            <span className="perm-wf-meta">
                                                Last updated by {w.updated_by_name}
                                            </span>
                                        )}
                                        {wfDirty[w.feature] && (
                                            <button
                                                className="perm-btn perm-btn--primary perm-btn--mini"
                                                onClick={() => saveWorkflow(w.feature)}
                                            >
                                                <FiSave /> Save
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default PermissionsPage;
