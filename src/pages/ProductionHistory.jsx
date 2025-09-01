import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Row, Col, Spinner } from 'react-bootstrap';
import { Calendar, Package, User, Filter } from "lucide-react";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";
import "../assets/styles/productionHistory.css";

const API_BASE_URL = 'http://10.116.242.21:5000/api';

const ProductionHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [batches, setBatches] = useState([]);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        productId: "",
        userId: "",
        shift: "",
        batchNumber: "",
    });

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const res = await axios.get(`${API_BASE_URL}/production/history?${queryParams}`);
            setLogs(res.data);
        } catch (err) {
            toast.error(<CustomToast message="Failed to fetch production history." type="error" />);
        } finally {
            setLoading(false);
        }
    };

    const fetchFiltersData = async () => {
        try {
            const usersRes = await axios.get(`${API_BASE_URL}/users`);
            setUsers(usersRes.data.filter((u) => u.role === "baker"));

            const productsRes = await axios.get(`${API_BASE_URL}/products`);
            setProducts(productsRes.data);

            const batchesRes = await axios.get(`${API_BASE_URL}/production/batches`);
            setBatches(batchesRes.data);
        } catch (err) {
            toast.error(<CustomToast message="Failed to fetch filter data." type="error" />);
        }
    };

    useEffect(() => {
        fetchFiltersData();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <Card className="history-card">
            <h2 className="history-title">Production History</h2>

            {/* Filters */}
            <Form className="filter-form">
                <Row className="g-3">
                    <Col>
                        <Form.Group>
                            <Form.Label><Calendar size={16} /> Start Date</Form.Label>
                            <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label><Calendar size={16} /> End Date</Form.Label>
                            <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label><Package size={16} /> Product</Form.Label>
                            <Form.Control as="select" name="productId" value={filters.productId} onChange={handleFilterChange}>
                                <option value="">All Products</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label><User size={16} /> Baker</Form.Label>
                            <Form.Control as="select" name="userId" value={filters.userId} onChange={handleFilterChange}>
                                <option value="">All Bakers</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.fullname}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label><Filter size={16} /> Shift</Form.Label>
                            <Form.Control as="select" name="shift" value={filters.shift} onChange={handleFilterChange}>
                                <option value="">All Shifts</option>
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                                <option value="Night">Night</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label><Filter size={16} /> Batch</Form.Label>
                            <Form.Control as="select" name="batchNumber" value={filters.batchNumber} onChange={handleFilterChange}>
                                <option value="">All Batches</option>
                                {batches.map((batch) => (
                                    <option key={batch} value={batch}>{batch}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>
            </Form>

            {/* Table or Cards */}
            {loading ? (
                <div className="loading-state">
                    <Spinner animation="border" />
                    <p>Loading history...</p>
                </div>
            ) : logs.length === 0 ? (
                <p className="no-results">No production logs found matching the filters.</p>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="table-wrapper desktop-only">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>S/N</th>
                                    <th>Image</th>
                                    <th>Log ID</th>
                                    <th>Date</th>
                                    <th>Batch</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Units</th>
                                    <th>Produced</th>
                                    <th>Waste</th>
                                    <th>Shift</th>
                                    <th>Logged By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => (
                                    <tr key={log.id}>
                                        <td>{index + 1}</td>
                                        <td><img src={log.image_url || 'https://placehold.co/60'} alt={log.product_name} className="log-img" /></td>
                                        <td>{log.id}</td>
                                        <td>{new Date(log.production_date).toLocaleDateString()}</td>
                                        <td>{log.batch_number || 'N/A'}</td>
                                        <td>{log.product_name}</td>
                                        <td>{log.category || 'N/A'}</td>
                                        <td>{log.units?.length ? log.units.map((u, i) => <div key={i}>{u.display}</div>) : 'N/A'}</td>
                                        <td>{log.quantity_produced}</td>
                                        <td>{log.waste_quantity}</td>
                                        <td>{log.shift}</td>
                                        <td>{log.logged_by}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="mobile-only">
                        {logs.map((log) => (
                            <div className="history-card-item" key={log.id}>
                                <div className="card-header">
                                    <img src={log.image_url || 'https://placehold.co/80'} alt={log.product_name} className="log-img" />
                                    <div>
                                        <h4>{log.product_name}</h4>
                                        <p>{new Date(log.production_date).toLocaleDateString()} • Batch {log.batch_number || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="card-row"><span>Log ID:</span> <strong>{log.id}</strong></div>
                                    <div className="card-row"><span>Category:</span> <strong>{log.category || "N/A"}</strong></div>
                                    <div className="card-row">
                                        <span>Units:</span>
                                        <div className="unit-group">
                                            {log.units?.length ? log.units.map((u, i) => (
                                                <span key={i} className="unit-pill">{u.display}</span>
                                            )) : "N/A"}
                                        </div>
                                    </div>
                                    <div className="card-row"><span>Produced:</span> <strong>{log.quantity_produced}</strong></div>
                                    <div className="card-row"><span>Waste:</span> <strong>{log.waste_quantity}</strong></div>
                                    <div className="card-row"><span>Shift:</span> <span className={`shift-badge shift-${log.shift?.toLowerCase()}`}>{log.shift}</span></div>
                                    <div className="card-row"><span>Logged By:</span> <strong>{log.logged_by}</strong></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Card>
    );
};

export default ProductionHistory;
