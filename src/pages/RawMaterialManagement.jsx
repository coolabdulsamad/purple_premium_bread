import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaRedo, FaFilter, FaBoxOpen, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import "../assets/styles/raw-inventory.css";
import CustomToast from '../components/CustomToast';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    materialName
}) => {
    if (!isOpen) return null;

    return (
        <div className="ppb-dialog__overlay" onClick={onClose}>
            <div className="ppb-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="ppb-dialog__header">
                    <h3 className="ppb-dialog__title">Confirm Raw Material Deletion</h3>
                </div>
                <div className="ppb-dialog__body">
                    <p>Are you sure you want to delete the raw material <strong>"{materialName}"</strong>?</p>
                    <p className="ppb-dialog__warning">This action cannot be undone and may affect existing recipes.</p>
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
                        Delete Material
                    </button>
                </div>
            </div>
        </div>
    );
};

const RawMaterialManagement = () => {
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        unit: 'kg',
        current_stock: 0,
        min_stock_level: 0,
        supplier_info: '',
        restock_price_per_unit: 0.00,
        last_restock_date: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterMinStock, setFilterMinStock] = useState('');
    const [filterMaxStock, setFilterMaxStock] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        materialId: null,
        materialName: ""
    });

    const units = ['kg', 'g', 'pcs', 'liter', 'ml', 'bags', 'rolls', 'boxes'];

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
            toast(<CustomToast id={`success-material-${Date.now()}`} type="success" message="Materials loaded successfully" />, {
                toastId: 'material-success'
            });
        } catch (err) {
            const errorMsg = 'Failed to load raw materials. ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRawMaterials();
    }, [searchTerm, filterUnit, filterMinStock, filterMaxStock]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'current_stock' || name === 'min_stock_level' || name === 'restock_price_per_unit' ? 
                   parseFloat(value) || 0 : value,
        }));
    };

    // Helper function to handle decimal input with high precision
    const handleDecimalInput = (e, fieldName) => {
        const value = e.target.value;
        // Allow empty input or valid decimal numbers
        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
            setFormData(prev => ({
                ...prev,
                [fieldName]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            // Ensure proper precision for decimal fields
            const submitData = {
                ...formData,
                current_stock: parseFloat(parseFloat(formData.current_stock).toFixed(6)),
                min_stock_level: parseFloat(parseFloat(formData.min_stock_level).toFixed(6)),
                restock_price_per_unit: parseFloat(parseFloat(formData.restock_price_per_unit).toFixed(6))
            };

            if (isEditing) {
                const response = await axios.put(`${API_BASE_URL}/raw-materials/${formData.id}`, submitData);
                const successMsg = `Raw material "${response.data.name}" updated successfully!`;
                setSuccessMessage(successMsg);
                toast(<CustomToast id={`success-s-${Date.now()}`} type="success" message={successMsg} />, {
                    toastId: 's-success'
                });
            } else {
                const response = await axios.post(`${API_BASE_URL}/raw-materials`, submitData);
                const successMsg = `Raw material "${response.data.name}" created successfully!`;
                setSuccessMessage(successMsg);
                toast(<CustomToast id={`success-s-${Date.now()}`} type="success" message={successMsg} />, {
                    toastId: 's-success'
                });
            }
            fetchRawMaterials();
            handleCancelEdit();
        } catch (err) {
            const errorMsg = 'Failed to save raw material. ' + (err.response?.data?.error || err.message);
            setError(errorMsg);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
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
            last_restock_date: material.last_restock_date ? material.last_restock_date.split('T')[0] : '',
        });
        setIsEditing(true);
        setError('');
        setSuccessMessage('');
        toast(<CustomToast id={`info-edit-${Date.now()}`} type="success" message={`Editing ${material.name}`} />, {
            toastId: 'edit-info'
        });
    };

    const handleDelete = async (materialId, materialName) => {
        try {
            await axios.delete(`${API_BASE_URL}/raw-materials/${materialId}`);
            const successMsg = `Raw material "${materialName}" deleted successfully!`;
            setSuccessMessage(successMsg);
            toast(<CustomToast id={`success-s-${Date.now()}`} type="success" message={successMsg} />, {
                toastId: 's-success'
            });
            fetchRawMaterials();
        } catch (err) {
            const errorMsg = 'Failed to delete raw material. ' + (err.response?.data?.error || err.message);
            setError(errorMsg);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
        } finally {
            // Close the dialog
            setDeleteDialog({
                isOpen: false,
                materialId: null,
                materialName: ""
            });
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
        toast(<CustomToast id={`info-edit-${Date.now()}`} type="info" message="Edit cancelled" />, {
            toastId: 'edit-info'
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterUnit('');
        setFilterMinStock('');
        setFilterMaxStock('');
        toast(<CustomToast id={`info-clear-${Date.now()}`} type="info" message="Filters cleared" />, {
            toastId: 'clear-info'
        });
    };

    const getStockStatus = (current, min) => {
        if (current <= 0) return 'out-of-stock';
        if (current <= min) return 'low-stock';
        return 'in-stock';
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
    };

    const sortedMaterials = [...rawMaterials].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    return (
        <div className="raw-material-management-container">
            <div className="section-header">
                <FaBoxOpen className="section-icon" />
                <h2>Raw Material Management</h2>
            </div>

            {error && <Alert variant="danger" className="alert-message">{error}</Alert>}
            {successMessage && <Alert variant="success" className="alert-message">{successMessage}</Alert>}

            {/* Add/Edit Form */}
            <Card className="form-card">
                <Card.Header className="form-card-header">
                    <h3>{isEditing ? 'Edit Raw Material' : 'Add New Raw Material'}</h3>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col md={12} lg={6}>
                                <Form.Group>
                                    <Form.Label>Material Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter material name"
                                        className="full-width-input"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12} lg={6}>
                                <Form.Group>
                                    <Form.Label>Unit of Measure *</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        required
                                        className="full-width-input"
                                    >
                                        {units.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={12} lg={4}>
                                <Form.Group>
                                    <Form.Label>Current Stock *</Form.Label>
                                    <Form.Control
                                        type="text"  // Changed from "number" to "text" for better decimal handling
                                        name="current_stock"
                                        value={formData.current_stock}
                                        onChange={(e) => handleDecimalInput(e, 'current_stock')}
                                        onBlur={(e) => {
                                            // Format to 6 decimal places on blur
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    current_stock: parseFloat(value.toFixed(6))
                                                }));
                                            }
                                        }}
                                        required
                                        placeholder="0.000000"
                                        className="full-width-input"
                                        pattern="^-?\d*\.?\d*$"
                                        title="Enter a decimal number with up to 6 decimal places"
                                    />
                                    <Form.Text className="text-muted">
                                        Enter stock quantity with up to 6 decimal places
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={12} lg={4}>
                                <Form.Group>
                                    <Form.Label>Min Stock Level *</Form.Label>
                                    <Form.Control
                                        type="text"  // Changed from "number" to "text" for better decimal handling
                                        name="min_stock_level"
                                        value={formData.min_stock_level}
                                        onChange={(e) => handleDecimalInput(e, 'min_stock_level')}
                                        onBlur={(e) => {
                                            // Format to 6 decimal places on blur
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    min_stock_level: parseFloat(value.toFixed(6))
                                                }));
                                            }
                                        }}
                                        required
                                        placeholder="0.000000"
                                        className="full-width-input"
                                        pattern="^-?\d*\.?\d*$"
                                        title="Enter a decimal number with up to 6 decimal places"
                                    />
                                    <Form.Text className="text-muted">
                                        Enter minimum stock level with up to 6 decimal places
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={12} lg={4}>
                                <Form.Group>
                                    <Form.Label>Price/Unit (₦) *</Form.Label>
                                    <Form.Control
                                        type="text"  // Changed from "number" to "text" for better decimal handling
                                        name="restock_price_per_unit"
                                        value={formData.restock_price_per_unit}
                                        onChange={(e) => handleDecimalInput(e, 'restock_price_per_unit')}
                                        onBlur={(e) => {
                                            // Format to 6 decimal places on blur
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    restock_price_per_unit: parseFloat(value.toFixed(6))
                                                }));
                                            }
                                        }}
                                        required
                                        placeholder="0.000000"
                                        className="full-width-input"
                                        pattern="^-?\d*\.?\d*$"
                                        title="Enter a price with up to 6 decimal places"
                                    />
                                    <Form.Text className="text-muted">
                                        Enter price per unit with up to 6 decimal places
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Supplier Information</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="supplier_info"
                                        value={formData.supplier_info}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Supplier name, contact details, etc."
                                        className="full-width-input"
                                    />
                                </Form.Group>
                            </Col>
                            {isEditing && (
                                <Col md={12} lg={6}>
                                    <Form.Group>
                                        <Form.Label>Last Restock Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="last_restock_date"
                                            value={formData.last_restock_date}
                                            onChange={handleChange}
                                            className="full-width-input"
                                        />
                                    </Form.Group>
                                </Col>
                            )}
                        </Row>
                        <div className="form-actions">
                            {isEditing && (
                                <Button variant="outline-secondary" onClick={handleCancelEdit}>
                                    <FaTimes className="me-1" /> Cancel Edit
                                </Button>
                            )}
                            <Button variant="outline-primary" className='' type="submit">
                                <FaPlus className="me-1" /> {isEditing ? 'Update Material' : 'Add Material'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Filters */}
            <Card className="filter-card">
                <Card.Header className="filter-card-header">
                    <h3>
                        <FaFilter className="me-2" />
                        Filter Raw Materials
                    </h3>
                    <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
                        <FaRedo className="me-1" /> Clear Filters
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={12} lg={5}>
                            <Form.Group>
                                <Form.Label>Search</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Name or supplier"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="full-width-input"
                                    />
                                    {searchTerm && (
                                        <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                            <FaTimes />
                                        </Button>
                                    )}
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Unit</Form.Label>
                                <Form.Control
                                    as="select"
                                    value={filterUnit}
                                    onChange={e => setFilterUnit(e.target.value)}
                                    className="full-width-input"
                                >
                                    <option value="">All Units</option>
                                    {units.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Min Stock</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Min"
                                    value={filterMinStock}
                                    onChange={e => setFilterMinStock(e.target.value)}
                                    className="full-width-input"
                                    pattern="^-?\d*\.?\d*$"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={2}>
                            <Form.Group>
                                <Form.Label>Max Stock</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Max"
                                    value={filterMaxStock}
                                    onChange={e => setFilterMaxStock(e.target.value)}
                                    className="full-width-input"
                                    pattern="^-?\d*\.?\d*$"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12} lg={1}>
                            <Button variant="outline-primary" onClick={fetchRawMaterials} className="w-100 filter-apply-btn">
                                <FaSearch className="me-1" /> Apply
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Materials Table */}
            <Card className="materials-table-card">
                <Card.Header className="table-card-header">
                    <h3>Raw Materials Inventory</h3>
                    <Badge bg="secondary" pill>
                        {rawMaterials.length} items
                    </Badge>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="loading-container">
                            <Spinner animation="border" variant="primary" />
                            <p>Loading raw materials...</p>
                        </div>
                    ) : rawMaterials.length === 0 ? (
                        <div className="empty-state">
                            <FaBoxOpen size={48} />
                            <h4>No raw materials found</h4>
                            <p>Try adjusting your filters or add new materials above</p>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ overflowX: 'auto' }}>
                            <Table hover className="materials-table" style={{ minWidth: '100px' }}>
                                <thead>
                                    <tr>
                                        <th className="sortable" onClick={() => handleSort('id')}>
                                            <div className="th-content">
                                                S/N {getSortIcon('id')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('name')}>
                                            <div className="th-content">
                                                Name {getSortIcon('name')}
                                            </div>
                                        </th>
                                        <th>Unit</th>
                                        <th className="sortable" onClick={() => handleSort('current_stock')}>
                                            <div className="th-content">
                                                Current Stock {getSortIcon('current_stock')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('min_stock_level')}>
                                            <div className="th-content">
                                                Min Level {getSortIcon('min_stock_level')}
                                            </div>
                                        </th>
                                        <th className="sortable" onClick={() => handleSort('restock_price_per_unit')}>
                                            <div className="th-content">
                                                Price/Unit {getSortIcon('restock_price_per_unit')}
                                            </div>
                                        </th>
                                        <th>Status</th>
                                        <th>Supplier</th>
                                        <th className="sortable" onClick={() => handleSort('last_restock_date')}>
                                            <div className="th-content">
                                                Last Restock {getSortIcon('last_restock_date')}
                                            </div>
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedMaterials.map((material, index) => {
                                        const status = getStockStatus(material.current_stock, material.min_stock_level);
                                        const statusClass = `stock-status ${status}`;
                                        const statusText = status === 'out-of-stock' ? 'Out of Stock' :
                                            status === 'low-stock' ? 'Low Stock' : 'In Stock';
                                        return (
                                            <tr key={material.id} className={statusClass}>
                                                <td className="fw-bold serial-number">{index + 1}</td>
                                                <td className="fw-semibold material-name">{material.name}</td>
                                                <td><Badge bg="light" text="dark" className="unit-badge">{material.unit}</Badge></td>
                                                <td className="stock-amount">{Number(material.current_stock).toFixed(6)}</td> {/* Updated to 6 decimal places */}
                                                <td className="min-stock">{Number(material.min_stock_level).toFixed(6)}</td> {/* Updated to 6 decimal places */}
                                                <td className="price fw-bold">₦{Number(material.restock_price_per_unit).toFixed(6)}</td> {/* Updated to 6 decimal places */}
                                                <td>
                                                    <Badge bg={status === 'out-of-stock' ? 'danger' :
                                                        status === 'low-stock' ? 'warning' : 'success'}
                                                        className="status-badge">
                                                        {statusText}
                                                    </Badge>
                                                </td>
                                                <td className="supplier-info">{material.supplier_info || 'N/A'}</td>
                                                <td className="restock-date">{material.last_restock_date ? new Date(material.last_restock_date).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(material)} title="Edit">
                                                            <FaEdit />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => setDeleteDialog({
                                                                isOpen: true,
                                                                materialId: material.id,
                                                                materialName: material.name
                                                            })}
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({
                    isOpen: false,
                    materialId: null,
                    materialName: ""
                })}
                onConfirm={() => handleDelete(deleteDialog.materialId, deleteDialog.materialName)}
                materialName={deleteDialog.materialName}
            />
        </div>
    );
};

export default RawMaterialManagement;