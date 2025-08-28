import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form, FormControl, Table, Alert, Spinner, Tabs, Tab, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/product-management.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ProductManagementPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('products');

    // Filter states for Products
    const [filterName, setFilterName] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterMinPrice, setFilterMinPrice] = useState('');
    const [filterMaxPrice, setFilterMaxPrice] = useState('');
    const [filterMinStock, setFilterMinStock] = useState('');
    const [filterMaxStock, setFilterMaxStock] = useState('');
    const [filterIsActive, setFilterIsActive] = useState('');
    const [filterProductId, setFilterProductId] = useState('');

    // Filter state for Categories
    const [categorySearchTerm, setCategorySearchTerm] = useState('');

    // State for Add/Edit Product Form
    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        price: '',
        min_stock_level: '',
        category: '',
        image_file: null,
        image_url: '',
        is_active: true,
        units: [{ type: 'pcs', display: '1 pcs' }],
    });
    const [editingProduct, setEditingProduct] = useState(null);

    // State for Add/Edit Category Form
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        description: '',
    });
    const [editingCategory, setEditingCategory] = useState(null);

    // --- Data Fetching ---
    const fetchProducts = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (filterName) params.name = filterName;
            if (filterCategory) params.category = filterCategory;
            if (filterMinPrice) params.minPrice = filterMinPrice;
            if (filterMaxPrice) params.maxPrice = filterMaxPrice;
            if (filterMinStock) params.minStock = filterMinStock;
            if (filterMaxStock) params.maxStock = filterMaxStock;
            if (filterIsActive !== '') params.isActive = filterIsActive;
            if (filterProductId) params.productId = filterProductId;

            const response = await axios.get(`${API_BASE_URL}/products`, { params });
            setProducts(response.data);
        } catch (err) {
            setError('Failed to fetch products: ' + (err.response?.data?.details || err.message));
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setError('');
        try {
            const params = {};
            if (categorySearchTerm) params.searchTerm = categorySearchTerm;
            const response = await axios.get(`${API_BASE_URL}/products/categories`, { params });
            setCategories(response.data);
        } catch (err) {
            setError('Failed to fetch categories: ' + (err.response?.data?.details || err.message));
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        }
    }, [filterName, filterCategory, filterMinPrice, filterMaxPrice, filterMinStock, filterMaxStock, filterIsActive, filterProductId]);

    useEffect(() => {
        if (activeTab === 'categories') {
            fetchCategories();
        }
    }, [categorySearchTerm]);

    // --- Product Handlers ---
    const handleProductChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setProductFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'file' ? files[0] : value),
        }));
    };

    const handleUnitChange = (index, field, value) => {
        setProductFormData(prev => {
            const newUnits = [...prev.units];
            newUnits[index] = { ...newUnits[index], [field]: value };
            return { ...prev, units: newUnits };
        });
    };

    const addUnit = () => {
        setProductFormData(prev => ({
            ...prev,
            units: [...prev.units, { type: 'pcs', display: '' }]
        }));
    };

    const removeUnit = (indexToRemove) => {
        setProductFormData(prev => ({
            ...prev,
            units: prev.units.filter((_, index) => index !== indexToRemove)
        }));
    };


    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const dataToSubmit = { ...productFormData };

        if (dataToSubmit.units.length === 0) {
            setError('At least one unit is required for the product.');
            return;
        }

        const invalidUnit = dataToSubmit.units.some(unit => !unit.type || !unit.display.trim());
        if (invalidUnit) {
            setError('All unit types and display values must be filled.');
            return;
        }

        if (dataToSubmit.image_file) {
            const formData = new FormData();
            formData.append('productImage', dataToSubmit.image_file);
            try {
                const uploadRes = await axios.post(`${API_BASE_URL}/products/upload-image`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                dataToSubmit.image_url = uploadRes.data.url;
            } catch (err) {
                setError('Failed to upload image: ' + (err.response?.data?.details || err.message));
                console.error('Image upload error:', err);
                return;
            }
        }

        delete dataToSubmit.image_file;

        try {
            if (editingProduct) {
                await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, dataToSubmit);
                alert('Product updated successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/products`, dataToSubmit);
                alert('Product created successfully!');
            }
            fetchProducts();
            setEditingProduct(null);
            setProductFormData({
                name: '',
                description: '',
                price: '',
                min_stock_level: '',
                category: '',
                image_file: null,
                image_url: '',
                is_active: true,
                units: [{ type: 'pcs', display: '1 pcs' }],
            });
        } catch (err) {
            setError('Failed to save product: ' + (err.response?.data?.details || err.message));
            console.error('Product save error:', err);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            min_stock_level: product.min_stock_level,
            category: product.category,
            image_file: null,
            image_url: product.image_url,
            is_active: product.is_active,
            units: product.units && product.units.length > 0 ? product.units : [{ type: 'pcs', display: '1 pcs' }],
        });
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            setError('');
            try {
                await axios.delete(`${API_BASE_URL}/products/${productId}`);
                alert('Product deleted successfully!');
                fetchProducts();
            } catch (err) {
                setError('Failed to delete product: ' + (err.response?.data?.details || err.message));
                console.error('Product delete error:', err);
            }
        }
    };

    const cancelProductEdit = () => {
        setEditingProduct(null);
        setProductFormData({
            name: '', description: '', price: '', min_stock_level: '', category: '', image_file: null, image_url: '', is_active: true, units: [{ type: 'pcs', display: '1 pcs' }],
        });
    };

    // --- Category Handlers ---
    const handleCategoryChange = (e) => {
        const { name, value } = e.target;
        setCategoryFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingCategory) {
                await axios.put(`${API_BASE_URL}/products/categories/${editingCategory.id}`, categoryFormData);
                alert('Category updated successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/products/categories`, categoryFormData);
                alert('Category created successfully!');
            }
            fetchCategories();
            setEditingCategory(null);
            setCategoryFormData({ name: '', description: '' });
        } catch (err) {
            setError('Failed to save category: ' + (err.response?.data?.details || err.message));
            console.error('Category save error:', err);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryFormData({
            name: category.name,
            description: category.description,
        });
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone and may fail if products are linked.')) {
            setError('');
            try {
                await axios.delete(`${API_BASE_URL}/products/categories/${categoryId}`);
                alert('Category deleted successfully!');
                fetchCategories();
                fetchProducts();
            } catch (err) {
                setError('Failed to delete category: ' + (err.response?.data?.details || err.message));
                console.error('Category delete error:', err);
            }
        }
    };

    const cancelCategoryEdit = () => {
        setEditingCategory(null);
        setCategoryFormData({ name: '', description: '' });
    };

    // Helper for filter submission
    const handleProductFilterSubmit = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const handleCategoryFilterSubmit = (e) => {
        e.preventDefault();
        fetchCategories();
    };

    return (
        <div className="product-management-container">
            <h1 className="product-management-header">Product & Category Management</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}

            <Tabs activeKey={activeTab} onSelect={(k) => {
                setActiveTab(k);
                setFilterName('');
                setFilterCategory('');
                setFilterMinPrice('');
                setFilterMaxPrice('');
                setFilterMinStock('');
                setFilterMaxStock('');
                setFilterIsActive('');
                setFilterProductId('');
                setCategorySearchTerm('');
                setProductFormData({
                    name: '', description: '', price: '', min_stock_level: '', category: '', image_file: null, image_url: '', is_active: true, units: [{ type: 'pcs', display: '1 pcs' }],
                });
                setEditingProduct(null);
                setCategoryFormData({ name: '', description: '' });
                setEditingCategory(null);
            }} className="mb-3 custom-tabs">
                <Tab eventKey="products" title="Products">
                    {/* Product Add/Edit Form */}
                    <Card className="product-management-card form-card mb-4">
                        <h2 className="card-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                        <Form onSubmit={handleProductSubmit} className="product-form">
                            <Form.Group className="mb-3">
                                <Form.Label>Product Name</Form.Label>
                                <FormControl type="text" name="name" value={productFormData.name} onChange={handleProductChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Category</Form.Label>
                                <Form.Control as="select" name="category" value={productFormData.category} onChange={handleProductChange} required>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Price</Form.Label>
                                <FormControl type="number" name="price" value={productFormData.price} onChange={handleProductChange} step="0.01" required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Min_Stock_Level</Form.Label>
                                <FormControl type="number" name="min_stock_level" value={productFormData.min_stock_level} onChange={handleProductChange} step="0.01" required />
                            </Form.Group>

                            {/* Dynamic Unit Inputs */}
                            <Form.Label className="mt-3">Product Units:</Form.Label>
                            {productFormData.units.map((unit, index) => (
                                <Row key={index} className="mb-2 align-items-end">
                                    <Col md={5}>
                                        <Form.Group>
                                            <Form.Label>Unit Type</Form.Label>
                                            <Form.Control as="select" value={unit.type} onChange={(e) => handleUnitChange(index, 'type', e.target.value)} required>
                                                <option value="pcs">Pieces (pcs)</option>
                                                <option value="kg">Kilogram (kg)</option>
                                                <option value="meter">Meter (m)</option>
                                                <option value="liter">Liter (L)</option>
                                                <option value="dozen">Dozen</option>
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md={5}>
                                        <Form.Group>
                                            <Form.Label>Display Value</Form.Label>
                                            <FormControl type="text" placeholder="e.g., 0.5 kg, 15 pcs" value={unit.display} onChange={(e) => handleUnitChange(index, 'display', e.target.value)} required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        {productFormData.units.length > 1 && (
                                            <Button variant="danger" size="sm" onClick={() => removeUnit(index)}>
                                                <FaTimes />
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            ))}
                            <Button variant="outline-secondary" size="sm" onClick={addUnit} className="mb-3">
                                <FaPlus className="me-1" /> Add Another Unit
                            </Button>

                            <Form.Group className="mb-3">
                                <Form.Label>Product Image</Form.Label>
                                <FormControl type="file" name="image_file" onChange={handleProductChange} />
                                {productFormData.image_url && !productFormData.image_file && (
                                    <div className="mt-2">
                                        <p>Current Image:</p>
                                        <img src={productFormData.image_url} alt="Current Product" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/e0e0e0/000000?text=Img+Err'; }} />
                                    </div>
                                )}
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <FormControl as="textarea" name="description" placeholder="Product Description" value={productFormData.description} onChange={handleProductChange} rows="3"></FormControl>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Check type="checkbox" id="is_active_product" name="is_active" label="Is Active" checked={productFormData.is_active} onChange={handleProductChange} />
                            </Form.Group>
                            <Button variant="primary" type="submit" className="me-2">
                                {editingProduct ? 'Update Product' : 'Add Product'}
                            </Button>
                            {editingProduct && (
                                <Button variant="secondary" onClick={cancelProductEdit}>
                                    Cancel
                                </Button>
                            )}
                        </Form>
                    </Card>

                    {/* Products Filter Section */}
                    <Card className="product-management-card filter-card mb-4">
                        <h2 className="card-title">Filter Products</h2>
                        <Form onSubmit={handleProductFilterSubmit}>
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Product ID</Form.Label>
                                        <FormControl type="number" placeholder="Search by ID" value={filterProductId} onChange={e => setFilterProductId(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Product Name</Form.Label>
                                        <FormControl type="text" placeholder="Search by name" value={filterName} onChange={e => setFilterName(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Category</Form.Label>
                                        <Form.Control as="select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                            <option value="">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Min Price</Form.Label>
                                        <FormControl type="number" step="0.01" placeholder="Min Price" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Max Price</Form.Label>
                                        <FormControl type="number" step="0.01" placeholder="Max Price" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Min Stock</Form.Label>
                                        <FormControl type="number" placeholder="Min Stock" value={filterMinStock} onChange={e => setFilterMinStock(e.target.value)} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Max Stock</Form.Label>
                                        <FormControl type="number" placeholder="Max Stock" value={filterMaxStock} onChange={e => setFilterMaxStock(e.target.value)} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Status</Form.Label>
                                        <Form.Control as="select" value={filterIsActive} onChange={e => setFilterIsActive(e.target.value)}>
                                            <option value="">All Statuses</option>
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Button variant="primary" type="submit" className="mt-3">
                                <FaSearch className="me-2" /> Apply Filters
                            </Button>
                        </Form>
                    </Card>

                    {/* Products Table */}
                    <Card className="product-management-card table-card">
                        <h2 className="card-title">All Products</h2>
                        {loading ? (
                            <div className="text-center my-5"><Spinner animation="border" /><p>Loading products...</p></div>
                        ) : products.length === 0 ? (
                            <Alert variant="info">No products found for the applied filters.</Alert>
                        ) : (
                            <div className="table-responsive">
                                <Table striped bordered hover className="products-table">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Units</th>
                                            <th>Stock</th>
                                            <th>Min_Stock_Level</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(product => (
                                            <tr key={product.id}>
                                                <td>
                                                    <img src={product.image_url || 'https://placehold.co/50x50/e0e0e0/000000?text=No+Image'} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/e0e0e0/000000?text=Img+Err'; }} />
                                                </td>
                                                <td>{product.id}</td>
                                                <td>{product.name}</td>
                                                <td>{product.description || 'N/A'}</td>
                                                <td>{product.category}</td>
                                                <td>₦{Number(product.price).toFixed(2)}</td>
                                                <td>
                                                    {product.units && product.units.length > 0 ? (
                                                        product.units.map((unit, idx) => (
                                                            <div key={idx}>
                                                                {unit.display || 'N/A'} {unit.type ? `(${unit.type})` : ''}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </td>
                                                <td>{product.stock_level}</td>
                                                <td>{product.min_stock_level}</td>
                                                <td>
                                                    <span className={`badge ${product.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                        {product.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Button variant="info" size="sm" className="me-1" onClick={() => handleEditProduct(product)}>
                                                        <FaEdit /> Edit
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(product.id)}>
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
                </Tab>

                <Tab eventKey="categories" title="Categories">
                    {/* Category Add/Edit Form */}
                    <Card className="product-management-card form-card mb-4">
                        <h2 className="card-title">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                        <Form onSubmit={handleCategorySubmit} className="category-form">
                            <Form.Group className="mb-3">
                                <Form.Label>Category Name</Form.Label>
                                <FormControl type="text" name="name" value={categoryFormData.name} onChange={handleCategoryChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description (optional)</Form.Label>
                                <FormControl as="textarea" name="description" placeholder="Category Description" value={categoryFormData.description} onChange={handleCategoryChange} rows="2"></FormControl>
                            </Form.Group>
                            <Button variant="primary" type="submit" className="me-2">
                                {editingCategory ? 'Update Category' : 'Add Category'}
                            </Button>
                            {editingCategory && (
                                <Button variant="secondary" onClick={cancelCategoryEdit}>
                                    Cancel
                                </Button>
                            )}
                        </Form>
                    </Card>

                    {/* Category Search/Filter */}
                    <Card className="product-management-card filter-card mb-4">
                        <h2 className="card-title">Search Categories</h2>
                        <Form onSubmit={handleCategoryFilterSubmit}>
                            <InputGroup className="mb-3">
                                <FormControl
                                    type="text"
                                    placeholder="Search categories by name or description..."
                                    value={categorySearchTerm}
                                    onChange={e => setCategorySearchTerm(e.target.value)}
                                />
                                <Button variant="primary" type="submit">
                                    <FaSearch /> Search
                                </Button>
                            </InputGroup>
                        </Form>
                    </Card>

                    {/* Categories Table */}
                    <Card className="product-management-card table-card">
                        <h2 className="card-title">All Categories</h2>
                        {loading ? (
                            <div className="text-center my-5"><Spinner animation="border" /><p>Loading categories...</p></div>
                        ) : categories.length === 0 ? (
                            <Alert variant="info">No categories found. Add some above!</Alert>
                        ) : (
                            <div className="table-responsive">
                                <Table striped bordered hover className="categories-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map(category => (
                                            <tr key={category.id}>
                                                <td>{category.id}</td>
                                                <td>{category.name}</td>
                                                <td>{category.description || 'N/A'}</td>
                                                <td>
                                                    <Button variant="info" size="sm" className="me-1" onClick={() => handleEditCategory(category)}>
                                                        <FaEdit /> Edit
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteCategory(category.id)}>
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
                </Tab>
            </Tabs>
        </div>
    );
};

export default ProductManagementPage;
