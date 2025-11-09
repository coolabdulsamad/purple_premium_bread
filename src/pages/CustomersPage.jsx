// src/pages/CustomersPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    User,
    Phone,
    Mail,
    Edit,
    Trash2,
    Search,
    PlusCircle
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomToast from "../components/CustomToast";
import EditCustomerPage from "./EditCustomerPage";
import "../assets/styles/customers.css";
import { IoIosTransgender } from "react-icons/io";

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const DeleteConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    customerName
}) => {
    if (!isOpen) return null;

    return (
        <div className="ppb-dialog__overlay" onClick={onClose}>
            <div className="ppb-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="ppb-dialog__header">
                    <h3 className="ppb-dialog__title">Confirm Delete</h3>
                </div>
                <div className="ppb-dialog__body">
                    <p>Are you sure you want to delete customer <strong>"{customerName}"</strong>? This action cannot be undone.</p>
                </div>
                <div className="ppb-dialog__footer">
                    <button
                        className="ppb-btn ppb-btn--ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="ppb-btn ppb-btn--danger"
                        onClick={onConfirm}
                    >
                        Delete Customer
                    </button>
                </div>
            </div>
        </div>
    );
};

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [gender, setGender] = useState('');

    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        customerId: null,
        customerName: ""
    });

    // search
    const [searchTerm, setSearchTerm] = useState("");

    // add modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        fullname: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        credit_limit: 0,
        due_date: "",
        is_active: true,   // default true
    });

    // edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editCustomerId, setEditCustomerId] = useState(null);

    const fetchCustomers = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setErr("");
        try {
            const res = await axios.get(`${API_BASE_URL}/customers`);
            setCustomers(Array.isArray(res.data) ? res.data : []);
            if (!silent)
                // toast(<CustomToast type="success" message="Customers loaded." />);
                toast(<CustomToast id={`success-customer-${Date.now()}`} type="success" message="Customers loaded." />, {
                    toastId: 'customer-success'
                });
        } catch (e) {
            setErr("Failed to load customers.");
            // toast(<CustomToast type="error" message="Failed to load customers." />);
            toast(<CustomToast id={`error-customer-${Date.now()}`} type="error" message="Failed to load customers." />, {
                toastId: 'customer-error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers({ silent: true });
    }, []);

    const handleAddInput = (e) => {
        const { name, value } = e.target;
        setNewCustomer((p) => ({ ...p, [name]: value }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/customers`, {
                ...newCustomer,
                credit_limit: Number(newCustomer.credit_limit || 0),
            });
            // toast(<CustomToast type="success" message="Customer added successfully." />);
            toast(<CustomToast id={`success-add-${Date.now()}`} type="success" message="Customer added successfully." />, {
                toastId: 'add-success'
            });
            setShowAddModal(false);
            setNewCustomer({
                fullname: "",
                email: "",
                phone: "",
                gender: "",
                address: "",
                credit_limit: 0,
                due_date: "",
            });
            fetchCustomers({ silent: true });
        } catch (e) {
            // toast(<CustomToast type="error" message="Failed to add customer." />);
            toast(<CustomToast id={`error-add-${Date.now()}`} type="error" message="Failed to add customer." />, {
                toastId: 'add-error'
            });
        }
    };

    const handleDelete = async (id, name) => {
        try {
            await axios.delete(`${API_BASE_URL}/customers/${id}`);
            toast(<CustomToast id={`success-delete-${Date.now()}`} type="success" message="Customer deleted." />, {
                toastId: 'delete-success'
            });
            fetchCustomers({ silent: true });
        } catch (e) {
            toast(<CustomToast id={`error-delete-${Date.now()}`} type="error" message="Delete failed." />, {
                toastId: 'delete-error'
            });
        } finally {
            // Close the dialog
            setDeleteDialog({
                isOpen: false,
                customerId: null,
                customerName: ""
            });
        }
    };

    const openEdit = (c) => {
        setEditCustomerId(c.id);
        setShowEditModal(true);
    };

    // filter safe: guard against undefined
    const filtered = customers.filter((c) => {
        const q = (searchTerm || "").trim().toLowerCase();
        if (!q) return true;
        const fields = [
            (c.fullname || "").toLowerCase(),
            (c.email || "").toLowerCase(),
            (c.phone || "").toLowerCase(),
            (c.address || "").toLowerCase(),
        ];
        return fields.some((f) => f.includes(q));
    });

    return (
        <div className="custs-page">
            {/* Toasts for this page */}
            <ToastContainer position="top-right" autoClose={3000} icon={false} />

            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({
                    isOpen: false,
                    customerId: null,
                    customerName: ""
                })}
                onConfirm={() => handleDelete(deleteDialog.customerId, deleteDialog.customerName)}
                customerName={deleteDialog.customerName}
            />

            <header className="customer-main-header">
                <h1>🍞 Purple Premium Customers</h1>
            </header>

            <div className="custs-header">
                <h2 className="custs-title">
                    <User size={20} />
                    Customers
                </h2>
                <button className="ppb-btn ppb-btn--primary" onClick={() => setShowAddModal(true)}>
                    <PlusCircle size={16} />
                    Add Customer
                </button>
            </div>

            <div className="custs-search">
                <Search size={16} className="custs-search__icon" />
                <input
                    type="text"
                    placeholder="Search by name, email, phone, address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Desktop Table */}
            <div className="custs-tablewrap">
                {loading ? (
                    <div className="ppb-center">
                        <div className="ppb-spinner" />
                        <div className="ppb-muted mt-8">Loading customers…</div>
                    </div>
                ) : filtered.length ? (
                    <table className="custs-table">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Name</th>
                                <th className="th-hide-sm">Email</th>
                                <th>Phone</th>
                                <th>Gender</th>
                                <th className="th-hide-sm">Address</th>
                                <th>Credit Limit</th>
                                <th className="th-hide-sm">Balance</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th className="th-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, index) => (
                                <tr key={c.id}>
                                    <td>{index + 1}</td> {/* 👈 This adds S/N */}
                                    <td>{c.fullname || "—"}</td>
                                    <td className="td-hide-sm">{c.email || "—"}</td>
                                    <td>{c.phone || "—"}</td>
                                    <td>{c.gender || "—"}</td>
                                    <td className="td-hide-sm">{c.address || "—"}</td>
                                    <td>&#8358;{Number(c.credit_limit || 0).toFixed(2)}</td>
                                    <td className="td-hide-sm">&#8358;{Number(c.balance || 0).toFixed(2)}</td>
                                    <td>
                                        <span className={`custs-status ${c.is_active ? "active" : "inactive"}`}>
                                            {c.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>{c.due_date ? new Date(c.due_date).toLocaleDateString() : "N/A"}</td>
                                    <td className="td-actions">
                                        <button className="ppb-iconbtn ppb-iconbtn--edit" onClick={() => openEdit(c)}>
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            className="ppb-iconbtn ppb-iconbtn--danger"
                                            onClick={() => setDeleteDialog({
                                                isOpen: true,
                                                customerId: c.id,
                                                customerName: c.fullname || "this customer"
                                            })}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="ppb-empty">No customers found.</div>
                )}
            </div>

            {/* Mobile Cards */}
            {!loading && (
                <div className="custs-cards">
                    {filtered.length ? (
                        filtered.map((c) => (
                            <div className="custs-card" key={`card-${c.id}`}>
                                <div className="custs-card__head">
                                    <User size={16} />
                                    <span className="custs-card__name">{c.fullname || "—"}</span>
                                </div>
                                <div className="custs-card__body">
                                    <div className="custs-line">
                                        <Mail size={14} />
                                        <span>{c.email || "—"}</span>
                                    </div>
                                    <div className="custs-line">
                                        <Phone size={14} />
                                        <span>{c.phone || "—"}</span>
                                    </div>
                                    <div className="custs-line">
                                        <IoIosTransgender size={14} />
                                        <span>{c.gender || "—"}</span>
                                    </div>
                                    {c.address ? (
                                        <div className="custs-line">
                                            <span className="custs-muted">{c.address}</span>
                                        </div>
                                    ) : null}
                                    <div className="custs-grid2">
                                        <div className="custs-pill">Limit: &#8358;{Number(c.credit_limit || 0).toFixed(2)}</div>
                                        <div className="custs-pill custs-pill--dark">
                                            Bal: &#8358;{Number(c.balance || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className={`custs-status-badge ${c.is_active ? "active" : "inactive"}`}>
                                        {c.is_active ? "Active" : "Inactive"}
                                    </div>

                                </div>
                                <div className="custs-card__actions">
                                    <button className="ppb-iconbtn ppb-iconbtn--edit" onClick={() => openEdit(c)}>
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        className="ppb-iconbtn ppb-iconbtn--danger"
                                        onClick={() => setDeleteDialog({
                                            isOpen: true,
                                            customerId: c.id,
                                            customerName: c.fullname || "this customer"
                                        })}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="ppb-empty">No customers found.</div>
                    )}
                </div>
            )}

            {/* ADD MODAL (Centered Front Dialog) */}
            {showAddModal && (
                <div
                    className="ppb-modal__overlay"
                    onClick={() => setShowAddModal(false)}
                >
                    <div className="ppb-modal__content" onClick={(e) => e.stopPropagation()}>
                        <button className="ppb-modal__close" onClick={() => setShowAddModal(false)}>
                            ×
                        </button>
                        <h3 className="ppb-modal__title">Add Customer</h3>
                        <form className="ppb-form" onSubmit={handleAddSubmit}>
                            <label className="ppb-label">Full Name</label>
                            <input
                                className="ppb-input"
                                name="fullname"
                                value={newCustomer.fullname}
                                onChange={handleAddInput}
                                required
                            />

                            <label className="ppb-label">Email</label>
                            <input
                                className="ppb-input"
                                type="email"
                                name="email"
                                value={newCustomer.email}
                                onChange={handleAddInput}
                            />

                            <label className="ppb-label">Phone</label>
                            <input
                                className="ppb-input"
                                name="phone"
                                value={newCustomer.phone}
                                onChange={handleAddInput}
                            />
                            <label className="ppb-label">Gender</label>
                            <select
                                className="ppb-input"
                                name="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>

                            <label className="ppb-label">Address</label>
                            <input
                                className="ppb-input"
                                name="address"
                                value={newCustomer.address}
                                onChange={handleAddInput}
                            />

                            <label className="ppb-label">Active Status</label>
                            <select
                                className="ppb-input"
                                name="is_active"
                                value={newCustomer.is_active ? "true" : "false"}
                                onChange={(e) => setNewCustomer((p) => ({ ...p, is_active: e.target.value === "true" }))}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>

                            <div className="ppb-grid2">
                                <div>
                                    <label className="ppb-label">Credit Limit</label>
                                    <input
                                        className="ppb-input"
                                        type="number"
                                        name="credit_limit"
                                        value={newCustomer.credit_limit}
                                        onChange={handleAddInput}
                                    />
                                </div>
                                <div>
                                    <label className="ppb-label">Due Date</label>
                                    <input
                                        className="ppb-input"
                                        type="date"
                                        name="due_date"
                                        value={newCustomer.due_date}
                                        onChange={handleAddInput}
                                    />
                                </div>
                            </div>

                            <div className="ppb-actions">
                                <button type="submit" className="ppb-btn ppb-btn--primary">Save</button>
                                <button
                                    type="button"
                                    className="ppb-btn ppb-btn--ghost"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL (Centered Front Dialog) */}
            {showEditModal && (
                <div
                    className="ppb-modal__overlay"
                    onClick={() => setShowEditModal(false)}
                >
                    <div className="ppb-modal__content" onClick={(e) => e.stopPropagation()}>
                        <button className="ppb-modal__close" onClick={() => setShowEditModal(false)}>
                            ×
                        </button>
                        <h3 className="ppb-modal__title">Edit Customer</h3>
                        <EditCustomerPage
                            customerId={editCustomerId}
                            onClose={() => {
                                setShowEditModal(false);
                                fetchCustomers({ silent: true });
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersPage;
