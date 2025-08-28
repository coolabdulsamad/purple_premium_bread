import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/forms.css'; // You might want to create/update this CSS for general form/table styling

const API_BASE_URL = 'http://localhost:5000/api';

const RawMaterialManagement = () => {
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        id: null, // For editing
        name: '',
        unit: 'kg', // Default unit
        current_stock: 0,
        min_stock_level: 0,
        supplier_info: '',
        restock_price_per_unit: 0.00,
        last_restock_date: '', // Will be updated automatically on restock
    });

    const [isEditing, setIsEditing] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterMinStock, setFilterMinStock] = useState('');
    const [filterMaxStock, setFilterMaxStock] = useState('');

    const units = ['kg', 'g', 'pcs', 'liter', 'ml', 'bags', 'rolls', 'boxes']; // Common units

    // --- Data Fetching ---
    const fetchRawMaterials = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (searchTerm) params.searchTerm = searchTerm;
            if (filterUnit) params.unit = filterUnit;
            if (filterMinStock) params.minStock = filterMinStock;
            if (filterMaxStock) params.maxStock = filterMaxStock;

            const response = await axios.get(`${API_BASE_URL}/raw-materials`, { params });
            setRawMaterials(response.data);
        } catch (err) {
            console.error('Error fetching raw materials:', err.response?.data || err.message);
            setError('Failed to load raw materials. ' + (err.response?.data?.details || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRawMaterials();
    }, [searchTerm, filterUnit, filterMinStock, filterMaxStock]); // Re-fetch on filter change

    // --- Form Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'current_stock' || name === 'min_stock_level' || name === 'restock_price_per_unit' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            if (isEditing) {
                const response = await axios.put(`${API_BASE_URL}/raw-materials/${formData.id}`, formData);
                setSuccessMessage(`Raw material "${response.data.name}" updated successfully!`);
            } else {
                const response = await axios.post(`${API_BASE_URL}/raw-materials`, formData);
                setSuccessMessage(`Raw material "${response.data.name}" created successfully!`);
            }
            fetchRawMaterials(); // Refresh list
            handleCancelEdit(); // Clear form
        } catch (err) {
            console.error('Error submitting raw material data:', err.response?.data || err.message);
            setError('Failed to save raw material. ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEdit = (material) => {
        setFormData({
            id: material.id,
            name: material.name,
            unit: material.unit,
            current_stock: material.current_stock,
            min_stock_level: material.min_stock_level,
            supplier_info: material.supplier_info || '',
            restock_price_per_unit: material.restock_price_per_unit,
            last_restock_date: material.last_restock_date ? material.last_restock_date.split('T')[0] : '', // Format date for input type="date"
        });
        setIsEditing(true);
        setError('');
        setSuccessMessage('');
    };

    const handleDelete = async (materialId, materialName) => {
        if (window.confirm(`Are you sure you want to delete raw material "${materialName}"? This action cannot be undone.`)) {
            setError('');
            setSuccessMessage('');
            try {
                await axios.delete(`${API_BASE_URL}/raw-materials/${materialId}`);
                setSuccessMessage(`Raw material "${materialName}" deleted successfully!`);
                fetchRawMaterials();
            } catch (err) {
                console.error('Error deleting raw material:', err.response?.data || err.message);
                setError('Failed to delete raw material. ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            id: null,
            name: '',
            unit: 'kg',
            current_stock: 0,
            min_stock_level: 0,
            supplier_info: '',
            restock_price_per_unit: 0.00,
            last_restock_date: '',
        });
        setIsEditing(false);
        setError('');
        setSuccessMessage('');
    };

    return (
        <div className="raw-material-management-container">
            <h1 className="main-header">Raw Material Management</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* Raw Material Add/Edit Form */}
            <Card className="form-card mb-4">
                <h2 className="card-title">{isEditing ? 'Edit Raw Material' : 'Add New Raw Material'}</h2>
                <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Material Name</Form.Label>
                                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Unit of Measure</Form.Label>
                                <Form.Control as="select" name="unit" value={formData.unit} onChange={handleChange} required>
                                    {units.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Current Stock</Form.Label>
                                <Form.Control type="number" name="current_stock" value={formData.current_stock} onChange={handleChange} min="0" step="0.01" required />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Minimum Stock Level</Form.Label>
                                <Form.Control type="number" name="min_stock_level" value={formData.min_stock_level} onChange={handleChange} min="0" step="0.01" required />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Restock Price Per Unit</Form.Label>
                                <Form.Control type="number" name="restock_price_per_unit" value={formData.restock_price_per_unit} onChange={handleChange} min="0" step="0.01" required />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Supplier Information</Form.Label>
                                <Form.Control as="textarea" name="supplier_info" value={formData.supplier_info} onChange={handleChange} rows="2" placeholder="e.g., Supplier name, contact details"></Form.Control>
                            </Form.Group>
                        </Col>
                        {isEditing && (
                             <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Last Restock Date</Form.Label>
                                    <Form.Control type="date" name="last_restock_date" value={formData.last_restock_date} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                    <div className="d-flex justify-content-end mt-4">
                        {isEditing && (
                            <Button variant="secondary" onClick={handleCancelEdit} className="me-2">
                                <FaTimes className="me-1" /> Cancel Edit
                            </Button>
                        )}
                        <Button variant="primary" type="submit">
                            <FaPlus className="me-1" /> {isEditing ? 'Update Material' : 'Add Material'}
                        </Button>
                    </div>
                </Form>
            </Card>

            {/* Raw Material Search and Filter */}
            <Card className="filter-card mb-4">
                <h2 className="card-title">Filter Raw Materials</h2>
                <Form>
                    <Row className="g-3 align-items-end">
                        <Col md={5}>
                            <Form.Group>
                                <Form.Label>Search Term</Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Name or Supplier"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                        <FaTimes />
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Unit</Form.Label>
                                <Form.Control as="select" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
                                    <option value="">All Units</option>
                                    {units.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Min Stock</Form.Label>
                                <Form.Control type="number" placeholder="Min" value={filterMinStock} onChange={e => setFilterMinStock(e.target.value)} step="0.01" />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Max Stock</Form.Label>
                                <Form.Control type="number" placeholder="Max" value={filterMaxStock} onChange={e => setFilterMaxStock(e.target.value)} step="0.01" />
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Raw Material Table */}
            <Card className="table-card">
                <h2 className="card-title">All Raw Materials</h2>
                {loading ? (
                    <div className="text-center my-5"><Spinner animation="border" /><p>Loading raw materials...</p></div>
                ) : rawMaterials.length === 0 ? (
                    <Alert variant="info">No raw materials found matching the filters. Add some above!</Alert>
                ) : (
                    <div className="table-responsive">
                        <Table striped bordered hover className="raw-materials-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Unit</th>
                                    <th>Current Stock</th>
                                    <th>Min Stock Level</th>
                                    <th>Restock Price/Unit</th>
                                    <th>Supplier Info</th>
                                    <th>Last Restock</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rawMaterials.map(material => (
                                    <tr key={material.id}>
                                        <td>{material.id}</td>
                                        <td>{material.name}</td>
                                        <td>{material.unit}</td>
                                        <td>{Number(material.current_stock).toFixed(2)}</td>
                                        <td>{Number(material.min_stock_level).toFixed(2)}</td>
                                        <td>₦{Number(material.restock_price_per_unit).toFixed(2)}</td>
                                        <td>{material.supplier_info || 'N/A'}</td>
                                        <td>{material.last_restock_date ? new Date(material.last_restock_date).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <Button variant="info" size="sm" className="me-1" onClick={() => handleEdit(material)}>
                                                <FaEdit /> Edit
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(material.id, material.name)}>
                                                <FaTrash /> Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default RawMaterialManagement;
