// src/pages/EditCustomerPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Save, X } from "lucide-react";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";
import "../assets/styles/editCustomer.css";

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const EditCustomerPage = ({ customerId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        fullname: "",
        email: "",
        phone: "",
        gender: "",
        address: "",
        credit_limit: "",
        due_date: "",
        is_active: true,
    });


    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/customers/${customerId}`);
                const data = res.data || {};
                setForm({
                    fullname: data.fullname || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    gender: data.gender || "",
                    address: data.address || "",
                    credit_limit: data.credit_limit ?? "",
                    due_date: data.due_date ? data.due_date.split("T")[0] : "",
                    is_active: data.is_active ?? true,
                });
            } catch (e) {
                // toast(<CustomToast type="error" message="Failed to load customer." />);
                toast(<CustomToast id={`error-customer-${Date.now()}`} type="error" message="Failed to load customer." />, {
                    toastId: 'customer-error'
                });
            } finally {
                setLoading(false);
            }
        };
        if (customerId) load();
    }, [customerId]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_BASE_URL}/customers/${customerId}`, {
                ...form,
                credit_limit: Number(form.credit_limit || 0),
            });
            // toast(<CustomToast type="success" message="Customer updated successfully." />);
            toast(<CustomToast id={`success-update-${Date.now()}`} type="success" message="Customer updated successfully." />, {
                toastId: 'update-success'
            });
            if (onClose) onClose();
        } catch (e) {
            // toast(<CustomToast type="error" message="Update failed." />);
            toast(<CustomToast id={`error-update-${Date.now()}`} type="error" message="Update failed." />, {
                toastId: 'update-error'
            });
        }
    };

    if (loading) {
        return (
            <div className="ppb-center">
                <div className="ppb-spinner" />
                <div className="ppb-muted mt-8">Loading…</div>
            </div>
        );
    }

    return (
        <form className="ppb-form" onSubmit={onSubmit}>
            <label className="ppb-label">Full Name</label>
            <input
                className="ppb-input"
                name="fullname"
                value={form.fullname}
                onChange={onChange}
                required
            />

            <label className="ppb-label">Email</label>
            <input
                className="ppb-input"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
            />

            <label className="ppb-label">Phone</label>
            <input
                className="ppb-input"
                name="phone"
                value={form.phone}
                onChange={onChange}
            />

            <label className="ppb-label">Gender</label>
            <select
                className="ppb-input"
                name="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
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
                value={form.address}
                onChange={onChange}
            />

            <label className="ppb-label">Active Status</label>
            <select
                className="ppb-input"
                name="is_active"
                value={form.is_active ? "true" : "false"}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === "true" }))}
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
                        value={form.credit_limit}
                        onChange={onChange}
                    />
                </div>

                <div>
                    <label className="ppb-label">Due Date</label>
                    <input
                        className="ppb-input"
                        type="date"
                        name="due_date"
                        value={form.due_date}
                        onChange={onChange}
                    />
                </div>
            </div>

            <div className="ppb-actions">
                <button type="submit" className="ppb-btn ppb-btn--primary">
                    <Save size={16} />
                    Save
                </button>
                {onClose && (
                    <button type="button" className="ppb-btn ppb-btn--ghost" onClick={onClose}>
                        <X size={16} />
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default EditCustomerPage;
