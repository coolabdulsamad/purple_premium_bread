import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner, Alert } from 'react-bootstrap';
import {
    Search,
    Package,
    Layers,
    DollarSign,
    Calendar,
    FileText,
    Boxes
} from 'lucide-react';
import '../styles/inventory.css';

const API_BASE_URL = 'http://10.116.242.21:5000/api';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [productCategories, setProductCategories] = useState([]);

    const fetchInventory = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/inventory/detailed`);
            setInventory(response.data);

            const categories = [...new Set(response.data.map(item => item.product_category))];
            setProductCategories(['All', ...categories]);

            setLoading(false);
        } catch (err) {
            setError('Failed to load inventory.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.product_category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="inv-center"><Spinner animation="border" /> Loading inventory...</div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="inv-page">
            <div className="inv-card">
                <div className="inv-header">
                    <h2><Boxes /> Current Stock Levels</h2>
                    <div className="inv-controls">
                        <div className="inv-input">
                            <Search className="inv-input__icon" />
                            <input
                                type="text"
                                placeholder="Search by product name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="inv-input">
                            <Layers className="inv-input__icon" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                {productCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="inv-table-wrapper">
                    <table className="inv-table">
                        <thead>
                            <tr>
                                <th><Package /> Product</th>
                                <th><Layers /> Category</th>
                                <th><Boxes /> Stock</th>
                                <th><Calendar /> Updated</th>
                                <th><DollarSign /> Price</th>
                                <th><FileText /> Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.length > 0 ? (
                                filteredInventory.map(item => (
                                    <tr key={item.product_id} className={item.quantity < 5 ? 'low-stock' : ''}>
                                        <td>
                                            <div className="inv-product">
                                                <img
                                                    src={item.image_url || 'https://via.placeholder.com/50'}
                                                    alt={item.product_name}
                                                    className="inv-thumb"
                                                />
                                                <span>{item.product_name}</span>
                                            </div>
                                        </td>
                                        <td>{item.product_category}</td>
                                        <td>
                                            <span className={`inv-badge ${item.quantity < 5 ? 'danger' : 'ok'}`}>
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td>{new Date(item.last_updated).toLocaleDateString()}</td>
                                        <td>${Number(item.price).toFixed(2)}</td>
                                        <td>{item.description}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">No inventory data available or no results found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="inv-cards">
                    {filteredInventory.length > 0 ? (
                        filteredInventory.map(item => (
                            <div
                                className={`inv-card-row ${item.quantity < 5 ? 'low-stock' : ''}`}
                                key={item.product_id}
                            >
                                <div className="inv-card-row__head">
                                    <img
                                        src={item.image_url || 'https://via.placeholder.com/50'}
                                        alt={item.product_name}
                                        className="inv-thumb"
                                    />
                                    <div>
                                        <div className="inv-name">{item.product_name}</div>
                                        <div className="inv-muted">{item.product_category}</div>
                                    </div>
                                </div>
                                <div className="inv-card-row__body">
                                    <div>
                                        <Boxes /> Stock:{" "}
                                        <span
                                            className={`inv-badge ${item.quantity < 5 ? "danger" : "ok"}`}
                                        >
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div>
                                        <DollarSign /> ${Number(item.price).toFixed(2)}
                                    </div>
                                    <div>
                                        <Calendar /> {new Date(item.last_updated).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="inv-desc">
                                    <FileText /> {item.description}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="inv-empty">No inventory data available or no results found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryPage;
