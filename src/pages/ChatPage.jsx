// src/pages/ChatPage.jsx — Internal team chat: direct + group conversations
// with references to business records (products, sales, payments, customers, riders).
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
    FaComments, FaPaperPlane, FaPlus, FaUsers, FaBoxOpen, FaShoppingCart,
    FaCreditCard, FaUser, FaMotorcycle, FaTimes, FaLink, FaSignOutAlt, FaUserPlus, FaTelegram
} from 'react-icons/fa';
import api from '../api/axiosInstance';
import CustomToast from '../components/CustomToast';
import useAuth from '../hooks/useAuth';
import '../assets/styles/chat.css';

const REF_TYPES = [
    { key: 'product', label: 'Product', icon: <FaBoxOpen /> },
    { key: 'sale', label: 'Sale', icon: <FaShoppingCart /> },
    { key: 'payment', label: 'Payment', icon: <FaCreditCard /> },
    { key: 'customer', label: 'Customer', icon: <FaUser /> },
    { key: 'rider', label: 'Rider', icon: <FaMotorcycle /> },
];

const REFERENCE_ICON_MAP = {
    product: <FaBoxOpen />,
    sale: <FaShoppingCart />,
    payment: <FaCreditCard />,
    customer: <FaUser />,
    rider: <FaMotorcycle />,
};

const refIcon = (type) => (REFERENCE_ICON_MAP[type] || <FaLink />);

const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay
        ? d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) + ' ' +
          d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
};

const ChatPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const myId = user?.id;

    const [conversations, setConversations] = useState([]);
    const [active, setActive] = useState(null); // conversation summary object
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState([]);
    const [input, setInput] = useState('');
    const [attachedRef, setAttachedRef] = useState(null);
    const [sending, setSending] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    const [showNewChat, setShowNewChat] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [showRefPicker, setShowRefPicker] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showTelegram, setShowTelegram] = useState(false);
    const [tgStatus, setTgStatus] = useState({ linked: false });
    const [tgCode, setTgCode] = useState(null);
    const [tgBusy, setTgBusy] = useState(false);

    const [users, setUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);
    const [addMemberIds, setAddMemberIds] = useState([]);

    const [refType, setRefType] = useState('product');
    const [refQuery, setRefQuery] = useState('');
    const [refResults, setRefResults] = useState([]);
    const [refSearching, setRefSearching] = useState(false);

    const messagesEndRef = useRef(null);
    const activeRef = useRef(null);
    activeRef.current = active;

    const notify = (type, message) =>
        toast(<CustomToast id={`chat-${Date.now()}`} type={type} message={message} />, { toastId: `chat-${type}` });

    // ---------- data loading ----------
    const loadConversations = useCallback(async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch { /* silent on poll */ } finally {
            setLoadingConvs(false);
        }
    }, []);

    const loadMessages = useCallback(async (convId, markRead = true) => {
        try {
            const res = await api.get(`/chat/conversations/${convId}/messages`);
            setMessages(res.data);
            if (markRead) {
                await api.post(`/chat/conversations/${convId}/read`);
            }
        } catch { /* silent on poll */ }
    }, []);

    const openConversation = useCallback(async (conv) => {
        setActive(conv);
        setMessages([]);
        setLoadingMsgs(true);
        try {
            const res = await api.get(`/chat/conversations/${conv.id}`);
            setMembers(res.data.members || []);
            await loadMessages(conv.id);
            loadConversations(); // refresh unread badges
        } catch {
            notify('error', 'Could not open this conversation');
        } finally {
            setLoadingMsgs(false);
        }
    }, [loadConversations, loadMessages]);

    // initial load + polling
    useEffect(() => {
        loadConversations();
        api.get('/chat/users').then(r => setUsers(r.data)).catch(() => {});
        const convTimer = setInterval(loadConversations, 6000);
        const msgTimer = setInterval(() => {
            if (activeRef.current) loadMessages(activeRef.current.id);
        }, 4000);
        return () => { clearInterval(convTimer); clearInterval(msgTimer); };
    }, [loadConversations, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ---------- actions ----------
    const startDirect = async (userId) => {
        try {
            const res = await api.post('/chat/conversations', { type: 'direct', user_id: userId });
            setShowNewChat(false);
            await loadConversations();
            openConversation({ id: res.data.id, type: 'direct', display_name: res.data.display_name });
        } catch (err) {
            notify('error', err.response?.data?.error || 'Could not start chat');
        }
    };

    const createGroup = async () => {
        if (!groupName.trim() || groupMembers.length === 0) {
            notify('warning', 'Enter a group name and pick at least one member');
            return;
        }
        try {
            const res = await api.post('/chat/conversations', {
                type: 'group', name: groupName.trim(), member_ids: groupMembers
            });
            setShowNewGroup(false);
            setGroupName('');
            setGroupMembers([]);
            await loadConversations();
            openConversation({ id: res.data.id, type: 'group', display_name: res.data.display_name });
            notify('success', 'Group created');
        } catch (err) {
            notify('error', err.response?.data?.error || 'Could not create group');
        }
    };

    const addMembers = async () => {
        if (!addMemberIds.length) return;
        try {
            await api.post(`/chat/conversations/${active.id}/members`, { member_ids: addMemberIds });
            setShowAddMember(false);
            setAddMemberIds([]);
            const res = await api.get(`/chat/conversations/${active.id}`);
            setMembers(res.data.members || []);
            notify('success', 'Member(s) added');
        } catch (err) {
            notify('error', err.response?.data?.error || 'Could not add members');
        }
    };

    const leaveGroup = async () => {
        try {
            await api.post(`/chat/conversations/${active.id}/leave`);
            setActive(null);
            setMessages([]);
            loadConversations();
            notify('info', 'You left the group');
        } catch (err) {
            notify('error', err.response?.data?.error || 'Could not leave group');
        }
    };

    // ---------- Telegram linking ----------
    const openTelegramModal = async () => {
        setShowTelegram(true);
        setTgCode(null);
        try {
            const res = await api.get('/telegram/link-status');
            setTgStatus(res.data);
        } catch {
            setTgStatus({ linked: false });
        }
    };

    const generateTgCode = async () => {
        setTgBusy(true);
        try {
            const res = await api.post('/telegram/link-code');
            setTgCode(res.data);
        } catch (err) {
            notify('error', err.response?.data?.error || 'Could not generate a code');
        } finally {
            setTgBusy(false);
        }
    };

    const unlinkTelegram = async () => {
        setTgBusy(true);
        try {
            await api.post('/telegram/unlink');
            setTgStatus({ linked: false });
            setTgCode(null);
            notify('info', 'Telegram unlinked');
        } catch (err) {
            notify('error', err.response?.data?.error || 'Could not unlink');
        } finally {
            setTgBusy(false);
        }
    };

    const searchRefs = useCallback(async (type, q) => {
        setRefSearching(true);
        try {
            const res = await api.get('/chat/references/search', { params: { type, q } });
            setRefResults(res.data);
        } catch {
            setRefResults([]);
        } finally {
            setRefSearching(false);
        }
    }, []);

    useEffect(() => {
        if (showRefPicker) {
            const t = setTimeout(() => searchRefs(refType, refQuery), 250);
            return () => clearTimeout(t);
        }
    }, [showRefPicker, refType, refQuery, searchRefs]);

    const sendMessage = async () => {
        const text = input.trim();
        if ((!text && !attachedRef) || !active || sending) return;
        setSending(true);
        try {
            const payload = { message_text: text };
            if (attachedRef) payload.reference = { type: attachedRef.type, id: attachedRef.id };
            await api.post(`/chat/conversations/${active.id}/messages`, payload);
            setInput('');
            setAttachedRef(null);
            await loadMessages(active.id, false);
            loadConversations();
        } catch (err) {
            notify('error', err.response?.data?.error || 'Message failed to send');
        } finally {
            setSending(false);
        }
    };

    const toggleId = (list, setList, id) =>
        setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

    const nonMembers = users.filter(u => !members.some(m => m.id === u.id));

    // ---------- render ----------
    return (
        <div className="ppb-chat">
            <div className="page-header">
                <h1 className="main-headers"><FaComments className="me-2" /> Team Chat</h1>
            </div>

            <div className="ppb-chat__layout">
                {/* ===== Left: conversation list ===== */}
                <aside className={`ppb-chat__sidebar ${active ? 'ppb-chat__sidebar--hidden-mobile' : ''}`}>
                    <div className="ppb-chat__sidebar-head">
                        <button className="ppb-chat__new-btn" onClick={() => setShowNewChat(true)}>
                            <FaPlus /> New Chat
                        </button>
                        <button className="ppb-chat__new-btn ppb-chat__new-btn--group" onClick={() => setShowNewGroup(true)}>
                            <FaUsers /> New Group
                        </button>
                        <button className="ppb-chat__new-btn ppb-chat__new-btn--wa" title="Link your Telegram" onClick={openTelegramModal}>
                            <FaTelegram />
                        </button>
                    </div>

                    <div className="ppb-chat__conv-list">
                        {loadingConvs && <div className="ppb-chat__loading"><Spinner animation="border" size="sm" /> Loading…</div>}
                        {!loadingConvs && conversations.length === 0 && (
                            <div className="ppb-chat__empty-list">
                                No conversations yet.<br />Start a new chat above.
                            </div>
                        )}
                        {conversations.map(c => (
                            <button
                                key={c.id}
                                className={`ppb-chat__conv ${active?.id === c.id ? 'ppb-chat__conv--active' : ''}`}
                                onClick={() => openConversation(c)}
                            >
                                <span className="ppb-chat__conv-icon">
                                    {c.type === 'group' ? <FaUsers /> : <FaUser />}
                                </span>
                                <span className="ppb-chat__conv-main">
                                    <span className="ppb-chat__conv-name">{c.display_name || 'Conversation'}</span>
                                    <span className="ppb-chat__conv-preview">
                                        {c.last_message
                                            ? `${c.last_message.sender_name}: ${c.last_message.text || `[${c.last_message.reference_type}]`}`
                                            : 'No messages yet'}
                                    </span>
                                </span>
                                {Number(c.unread_count) > 0 && (
                                    <span className="ppb-chat__unread">{c.unread_count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ===== Right: active conversation ===== */}
                <section className="ppb-chat__main">
                    {!active && (
                        <div className="ppb-chat__placeholder">
                            <FaComments className="ppb-chat__placeholder-icon" />
                            <h4>Select a conversation</h4>
                            <p>Or start a new chat / group to begin messaging your team.</p>
                        </div>
                    )}

                    {active && (
                        <>
                            <div className="ppb-chat__conv-header">
                                <button className="ppb-chat__back" onClick={() => setActive(null)}>←</button>
                                <div className="ppb-chat__conv-title">
                                    <strong>{active.display_name || members.map(m => m.fullname).join(', ')}</strong>
                                    {active.type === 'group' && (
                                        <span className="ppb-chat__conv-sub">{members.length} members</span>
                                    )}
                                </div>
                                {active.type === 'group' && (
                                    <div className="ppb-chat__conv-actions">
                                        <button className="ppb-chat__icon-btn" title="Add member" onClick={() => setShowAddMember(true)}>
                                            <FaUserPlus />
                                        </button>
                                        <button className="ppb-chat__icon-btn ppb-chat__icon-btn--danger" title="Leave group" onClick={leaveGroup}>
                                            <FaSignOutAlt />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="ppb-chat__messages">
                                {loadingMsgs && <div className="ppb-chat__loading"><Spinner animation="border" size="sm" /> Loading messages…</div>}
                                {!loadingMsgs && messages.length === 0 && (
                                    <div className="ppb-chat__empty-list">No messages yet — say hello! 👋</div>
                                )}
                                {messages.map(m => {
                                    const mine = m.sender_id === myId;
                                    return (
                                        <div key={m.id} className={`ppb-chat__msg ${mine ? 'ppb-chat__msg--mine' : ''}`}>
                                            <div className="ppb-chat__bubble">
                                                {!mine && active.type === 'group' && (
                                                    <div className="ppb-chat__sender">{m.sender_name}</div>
                                                )}
                                                {m.reference_snapshot && (
                                                    <button
                                                        className="ppb-chat__refcard"
                                                        onClick={() => m.reference_snapshot.path && navigate(m.reference_snapshot.path)}
                                                        title="Open this record"
                                                    >
                                                        <span className="ppb-chat__refcard-icon">{refIcon(m.reference_snapshot.type)}</span>
                                                        <span className="ppb-chat__refcard-body">
                                                            <span className="ppb-chat__refcard-title">{m.reference_snapshot.title}</span>
                                                            <span className="ppb-chat__refcard-sub">{m.reference_snapshot.subtitle}</span>
                                                        </span>
                                                    </button>
                                                )}
                                                {m.message_text && <div className="ppb-chat__text">{m.message_text}</div>}
                                                <div className="ppb-chat__time">{fmtTime(m.created_at)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="ppb-chat__composer">
                                {attachedRef && (
                                    <div className="ppb-chat__attached">
                                        <span className="ppb-chat__refcard-icon">{refIcon(attachedRef.type)}</span>
                                        <span className="ppb-chat__attached-text">
                                            <strong>{attachedRef.title}</strong>
                                            <small>{attachedRef.subtitle}</small>
                                        </span>
                                        <button className="ppb-chat__attached-x" onClick={() => setAttachedRef(null)}><FaTimes /></button>
                                    </div>
                                )}
                                <div className="ppb-chat__input-row">
                                    <button
                                        className="ppb-chat__attach-btn"
                                        title="Reference a product, sale, payment, customer or rider"
                                        onClick={() => { setShowRefPicker(true); setRefQuery(''); }}
                                    >
                                        <FaLink />
                                    </button>
                                    <input
                                        type="text"
                                        className="ppb-chat__input"
                                        placeholder={attachedRef ? 'Add a caption…' : 'Type a message…'}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        maxLength={2000}
                                    />
                                    <button
                                        className="ppb-chat__send-btn"
                                        onClick={sendMessage}
                                        disabled={sending || (!input.trim() && !attachedRef)}
                                    >
                                        {sending ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {/* ===== New direct chat modal ===== */}
            <Modal show={showNewChat} onHide={() => setShowNewChat(false)} centered>
                <Modal.Header closeButton><Modal.Title>Start a new chat</Modal.Title></Modal.Header>
                <Modal.Body>
                    {users.length === 0 && <div className="ppb-chat__loading"><Spinner animation="border" size="sm" /> Loading staff…</div>}
                    <div className="ppb-chat__user-list">
                        {users.map(u => (
                            <button key={u.id} className="ppb-chat__user-row" onClick={() => startDirect(u.id)}>
                                <FaUser className="me-2" /> {u.fullname}
                                <span className="ppb-chat__user-role">{u.role}</span>
                            </button>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>

            {/* ===== New group modal ===== */}
            <Modal show={showNewGroup} onHide={() => setShowNewGroup(false)} centered>
                <Modal.Header closeButton><Modal.Title>Create a group</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Group name</Form.Label>
                        <Form.Control
                            type="text"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="e.g. Morning Shift, Sales Team"
                            maxLength={80}
                        />
                    </Form.Group>
                    <Form.Label>Members</Form.Label>
                    <div className="ppb-chat__user-list">
                        {users.map(u => (
                            <label key={u.id} className="ppb-chat__user-row ppb-chat__user-row--check">
                                <input
                                    type="checkbox"
                                    checked={groupMembers.includes(u.id)}
                                    onChange={() => toggleId(groupMembers, setGroupMembers, u.id)}
                                />
                                <span>{u.fullname} <span className="ppb-chat__user-role">{u.role}</span></span>
                            </label>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowNewGroup(false)}>Cancel</Button>
                    <Button variant="primary" onClick={createGroup}>Create Group</Button>
                </Modal.Footer>
            </Modal>

            {/* ===== Add member modal ===== */}
            <Modal show={showAddMember} onHide={() => setShowAddMember(false)} centered>
                <Modal.Header closeButton><Modal.Title>Add members</Modal.Title></Modal.Header>
                <Modal.Body>
                    {nonMembers.length === 0 && <p className="text-muted">Everyone is already in this group.</p>}
                    <div className="ppb-chat__user-list">
                        {nonMembers.map(u => (
                            <label key={u.id} className="ppb-chat__user-row ppb-chat__user-row--check">
                                <input
                                    type="checkbox"
                                    checked={addMemberIds.includes(u.id)}
                                    onChange={() => toggleId(addMemberIds, setAddMemberIds, u.id)}
                                />
                                <span>{u.fullname} <span className="ppb-chat__user-role">{u.role}</span></span>
                            </label>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button>
                    <Button variant="primary" onClick={addMembers} disabled={!addMemberIds.length}>Add</Button>
                </Modal.Footer>
            </Modal>

            {/* ===== Reference picker modal ===== */}
            <Modal show={showRefPicker} onHide={() => setShowRefPicker(false)} centered>
                <Modal.Header closeButton><Modal.Title>Reference a record</Modal.Title></Modal.Header>
                <Modal.Body>
                    <div className="ppb-chat__ref-types">
                        {REF_TYPES.map(t => (
                            <button
                                key={t.key}
                                className={`ppb-chat__ref-type ${refType === t.key ? 'ppb-chat__ref-type--active' : ''}`}
                                onClick={() => setRefType(t.key)}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    <Form.Control
                        type="text"
                        className="mt-2 mb-2"
                        placeholder={`Search ${REF_TYPES.find(t => t.key === refType)?.label.toLowerCase()}s…`}
                        value={refQuery}
                        onChange={e => setRefQuery(e.target.value)}
                        autoFocus
                    />
                    {refSearching && <div className="ppb-chat__loading"><Spinner animation="border" size="sm" /> Searching…</div>}
                    <div className="ppb-chat__ref-results">
                        {!refSearching && refResults.length === 0 && <p className="text-muted">No matches found.</p>}
                        {refResults.map(r => (
                            <button
                                key={`${r.type}-${r.id}`}
                                className="ppb-chat__ref-result"
                                onClick={() => { setAttachedRef(r); setShowRefPicker(false); }}
                            >
                                <span className="ppb-chat__refcard-icon">{refIcon(r.type)}</span>
                                <span>
                                    <strong>{r.title}</strong><br />
                                    <small className="text-muted">{r.subtitle}</small>
                                </span>
                            </button>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>

            {/* ===== Telegram linking modal ===== */}
            <Modal show={showTelegram} onHide={() => setShowTelegram(false)} centered>
                <Modal.Header closeButton><Modal.Title><FaTelegram className="me-2" />Link your Telegram</Modal.Title></Modal.Header>
                <Modal.Body>
                    {tgStatus.linked ? (
                        <>
                            <p>Your Telegram is linked to chat ID <strong>{tgStatus.chat_id}</strong>.</p>
                            <p className="text-muted" style={{ fontSize: 13 }}>
                                Send <strong>hi</strong> to the company Telegram bot to use the system from Telegram —
                                check sales, record payments, expenses and more, step by step.
                            </p>
                        </>
                    ) : (
                        <>
                            <p>Link this account to your Telegram:</p>
                            <ol style={{ fontSize: 14 }}>
                                <li>Tap <strong>Generate code</strong> below</li>
                                <li>Open Telegram and message the company bot</li>
                                <li>Send the 6-digit code within 10 minutes</li>
                            </ol>
                            {tgCode && (
                                <div className="ppb-chat__wa-code">
                                    {tgCode.code}
                                    <small>expires in {tgCode.ttl_minutes} minutes</small>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {tgStatus.linked ? (
                        <Button variant="danger" onClick={unlinkTelegram} disabled={tgBusy}>
                            {tgBusy ? 'Working…' : 'Unlink Telegram'}
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={generateTgCode} disabled={tgBusy}>
                            {tgBusy ? 'Generating…' : tgCode ? 'Generate new code' : 'Generate code'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ChatPage;
