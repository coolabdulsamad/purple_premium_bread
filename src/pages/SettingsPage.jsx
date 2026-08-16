// src/pages/SettingsPage.jsx — Admin-only system settings (app_settings table).
// Edits the exact dotted keys that the AI assistant and Telegram/WhatsApp backends read,
// so integrations can be activated from the UI without touching server env vars.
import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import '../assets/styles/settings.css';

// Field layout: group → fields (key in app_settings, label, secret?, hint)
const GROUPS = [
    {
        id: 'company',
        title: 'General',
        fields: [
            { key: 'company.currency', label: 'Currency code', hint: 'e.g. NGN' },
            { key: 'reports.tax_rate', label: 'Tax rate', hint: 'e.g. 0.30 for 30%' }
        ]
    },
    {
        id: 'ai',
        title: 'AI Assistant',
        fields: [
            { key: 'ai.mode', label: 'Mode', hint: 'offline or online' },
            { key: 'ai.provider', label: 'Provider', hint: 'e.g. openai' },
            { key: 'ai.model', label: 'Model', hint: 'e.g. gpt-4o-mini' },
            { key: 'ai.api_key', label: 'API key', secret: true }
        ]
    },
    {
        id: 'telegram',
        title: 'Telegram Integration',
        fields: [
            { key: 'telegram.enabled', label: 'Enabled', hint: 'true or false' },
            { key: 'telegram.bot_token', label: 'Bot token', secret: true, hint: 'Token from @BotFather on Telegram' }
        ]
    },
    {
        id: 'whatsapp',
        title: 'WhatsApp Integration (legacy)',
        fields: [
            { key: 'whatsapp.enabled', label: 'Enabled', hint: 'true or false' },
            { key: 'whatsapp.phone_number_id', label: 'Phone number ID', hint: 'Meta Cloud API phone number ID' },
            { key: 'whatsapp.api_token', label: 'API token', secret: true },
            { key: 'whatsapp.verify_token', label: 'Webhook verify token', secret: true }
        ]
    }
];

const SettingsPage = () => {
    const [values, setValues] = useState({});   // key -> current input value
    const [meta, setMeta] = useState({});       // key -> { is_secret, is_set }
    const [saving, setSaving] = useState({});
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/settings');
            const vals = {};
            const m = {};
            (res.data || []).forEach(s => {
                vals[s.setting_key] = s.setting_value;
                m[s.setting_key] = { is_secret: s.is_secret, is_set: s.is_set };
            });
            setValues(vals);
            setMeta(m);
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to load settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const save = async (key) => {
        setSaving(s => ({ ...s, [key]: true }));
        try {
            const res = await api.put(`/settings/${key}`, { value: values[key] ?? '' });
            toast.success(res.data?.message || 'Setting saved.');
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Failed to save setting.');
        } finally {
            setSaving(s => ({ ...s, [key]: false }));
        }
    };

    if (loading) return <div className="ppb-settings__loading">Loading settings...</div>;

    return (
        <div className="ppb-settings">
            <div className="ppb-settings__head">
                <h2>Settings</h2>
                <p>System configuration. Secret values are never displayed — leave a secret field empty to keep the current value.</p>
            </div>
            {GROUPS.map(group => (
                <div className="ppb-settings__card" key={group.id}>
                    <h3>{group.title}</h3>
                    {group.fields.map(f => {
                        const m = meta[f.key] || {};
                        const isSecret = f.secret || m.is_secret;
                        return (
                            <div className="ppb-settings__row" key={f.key}>
                                <label>
                                    {f.label}
                                    {f.hint && <small>{f.hint}</small>}
                                    {isSecret && m.is_set && <small className="ppb-settings__set">Currently set</small>}
                                </label>
                                <div className="ppb-settings__control">
                                    <input
                                        type={isSecret ? 'password' : 'text'}
                                        value={values[f.key] ?? ''}
                                        placeholder={isSecret ? (m.is_set ? '(unchanged)' : 'Not set') : ''}
                                        onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                                    />
                                    <button
                                        className="ppb-settings__save"
                                        disabled={!!saving[f.key]}
                                        onClick={() => save(f.key)}
                                    >
                                        {saving[f.key] ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default SettingsPage;
