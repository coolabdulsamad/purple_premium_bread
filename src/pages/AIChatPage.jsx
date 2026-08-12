// src/pages/AIChatPage.jsx — AI business assistant chat (online AI + offline self-answer modes)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaRobot, FaPaperPlane, FaUserCircle, FaBolt, FaGlobe, FaSync, FaTrashAlt } from 'react-icons/fa';
import api from '../api/axiosInstance';
import CustomToast from '../components/CustomToast';
import '../assets/styles/aichat.css';

const QUICK_QUESTIONS = [
    'Sales today',
    'Profit this month',
    'Who owes us?',
    'Product stock levels',
    'Expenses this month',
    'Cash and bank balances',
    'Which raw materials are low?',
    'Advance wallet balances',
    'Payments this week',
    'Production today',
];

// --- Lightweight markdown renderer (###, **bold**, *italic*, - bullets, | tables |) ---
const inlineFormat = (text) => {
    const parts = [];
    let rest = text;
    let key = 0;
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/;
    while (rest.length) {
        const m = rest.match(re);
        if (!m) { parts.push(rest); break; }
        if (m.index > 0) parts.push(rest.slice(0, m.index));
        const token = m[0];
        if (token.startsWith('**')) parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
        else parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
        rest = rest.slice(m.index + token.length);
    }
    return parts;
};

const MarkdownMessage = ({ text }) => {
    const lines = String(text || '').split('\n');
    const blocks = [];
    let i = 0;
    let key = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith('| ')) {
            const tableLines = [];
            while (i < lines.length && lines[i].startsWith('|')) { tableLines.push(lines[i]); i++; }
            const rows = tableLines
                .filter(l => !/^\|\s*-+/.test(l))
                .map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
            const header = rows.length ? rows[0] : [];
            const body = rows.slice(1);
            blocks.push(
                <div className="ai-md-table-wrap" key={key++}>
                    <table className="ai-md-table">
                        <thead><tr>{header.map((h, j) => <th key={j}>{inlineFormat(h)}</th>)}</tr></thead>
                        <tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inlineFormat(c)}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            );
            continue;
        }
        if (line.startsWith('### ')) { blocks.push(<h4 className="ai-md-h" key={key++}>{inlineFormat(line.slice(4))}</h4>); i++; continue; }
        if (line.startsWith('## ')) { blocks.push(<h3 className="ai-md-h" key={key++}>{inlineFormat(line.slice(3))}</h3>); i++; continue; }
        if (line.startsWith('- ')) {
            const items = [];
            while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++; }
            blocks.push(<ul className="ai-md-list" key={key++}>{items.map((it, j) => <li key={j}>{inlineFormat(it)}</li>)}</ul>);
            continue;
        }
        if (line.trim() === '') { i++; continue; }
        blocks.push(<p className="ai-md-p" key={key++}>{inlineFormat(line)}</p>);
        i++;
    }
    return <div className="ai-md">{blocks}</div>;
};

const AIChatPage = () => {
    const [mode, setMode] = useState(() => localStorage.getItem('ai_chat_mode') || 'offline');
    const [status, setStatus] = useState(null);
    const [messages, setMessages] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ai_chat_history') || '[]'); } catch { return []; }
    });
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/ai/status');
                setStatus(res.data);
            } catch { setStatus(null); }
        };
        fetchStatus();
    }, []);

    useEffect(() => {
        localStorage.setItem('ai_chat_mode', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('ai_chat_history', JSON.stringify(messages.slice(-100)));
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async (text) => {
        const question = (text ?? input).trim();
        if (!question || sending) return;
        setInput('');
        setSending(true);
        setMessages(prev => [...prev, { role: 'user', content: question, at: Date.now() }]);
        try {
            const res = await api.post('/ai/chat', { message: question, mode });
            const { answer, mode_used, fallback, notice, model } = res.data;
            setMessages(prev => [...prev, {
                role: 'assistant', content: answer, at: Date.now(),
                modeUsed: mode_used, fallback, notice, model,
            }]);
        } catch (err) {
            const msg = err.response?.data?.error || 'The assistant is unreachable right now. Please try again.';
            setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}`, at: Date.now(), isError: true }]);
            toast(<CustomToast id={`ai-err-${Date.now()}`} type="error" message="AI request failed" />, { toastId: 'ai-error' });
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }, [input, mode, sending]);

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem('ai_chat_history');
        toast(<CustomToast id={`ai-clear-${Date.now()}`} type="info" message="Chat cleared" />, { toastId: 'ai-clear' });
    };

    const onlineConfigured = status?.online?.configured;

    return (
        <div className="ai-chat-page">
            <div className="page-header">
                <h1 className="main-headers"><FaRobot className="me-2" /> AI Assistant</h1>
            </div>

            <div className="ai-toolbar">
                <div className="ai-mode-toggle" role="group" aria-label="Assistant mode">
                    <button
                        className={`ai-mode-btn ${mode === 'offline' ? 'active' : ''}`}
                        onClick={() => setMode('offline')}
                    >
                        <FaBolt className="me-1" /> Offline (built-in)
                    </button>
                    <button
                        className={`ai-mode-btn ${mode === 'online' ? 'active' : ''}`}
                        onClick={() => setMode('online')}
                    >
                        <FaGlobe className="me-1" /> Online AI
                    </button>
                </div>
                <div className="ai-toolbar-right">
                    <span className={`ai-status-badge ${mode === 'online' ? (onlineConfigured ? 'ok' : 'warn') : 'ok'}`}>
                        {mode === 'online'
                            ? (status === null ? 'Checking online AI…' : onlineConfigured ? `Online ready · ${status.online.model}` : 'No API key — will auto-fallback to offline')
                            : 'Offline engine ready'}
                    </span>
                    <button className="ai-clear-btn" onClick={clearChat} title="Clear chat">
                        <FaTrashAlt />
                    </button>
                </div>
            </div>

            <div className="ai-chat-window">
                {messages.length === 0 && (
                    <div className="ai-empty-state">
                        <FaRobot className="ai-empty-icon" />
                        <h3>Ask me anything about the business</h3>
                        <p>I read live data from your system — sales, profit, customers, credit, stock, expenses, payments, production, salaries, returns and wallets.</p>
                        <div className="ai-quick-grid">
                            {QUICK_QUESTIONS.map(q => (
                                <button key={q} className="ai-quick-chip" onClick={() => sendMessage(q)}>{q}</button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, idx) => (
                    <div key={idx} className={`ai-msg ${m.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`}>
                        <div className="ai-msg-avatar">
                            {m.role === 'user' ? <FaUserCircle /> : <FaRobot />}
                        </div>
                        <div className="ai-msg-body">
                            {m.role === 'user' ? <p>{m.content}</p> : <MarkdownMessage text={m.content} />}
                            {m.role === 'assistant' && m.modeUsed && (
                                <div className="ai-msg-meta">
                                    {m.modeUsed === 'online' ? `Answered by online AI${m.model ? ` · ${m.model}` : ''}` : 'Answered by offline engine'}
                                </div>
                            )}
                            {m.notice && <div className="ai-msg-notice">{m.notice}</div>}
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="ai-msg ai-msg-bot">
                        <div className="ai-msg-avatar"><FaRobot /></div>
                        <div className="ai-msg-body ai-typing">
                            <Spinner animation="grow" size="sm" /> <span>Thinking…</span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="ai-input-bar">
                <input
                    ref={inputRef}
                    type="text"
                    className="ai-input"
                    placeholder={mode === 'online' ? 'Ask in plain English (online AI)…' : 'Ask e.g. "sales today", "who owes us"…'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    disabled={sending}
                    maxLength={1000}
                />
                <button className="ai-send-btn" onClick={() => sendMessage()} disabled={sending || !input.trim()}>
                    <FaPaperPlane />
                </button>
            </div>
        </div>
    );
};

export default AIChatPage;
