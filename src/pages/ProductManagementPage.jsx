import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form, FormControl, Table, Alert, Spinner, Card, Row, Col, InputGroup, Nav } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaBox, FaTags, FaFilter, FaImage } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/product-management.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = process.env.REACT_APP_API_URL;

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
            // toast.success(`Loaded ${response.data.length} products successfully`);
            // toast(<CustomToast id="tab-switched" type="success" message={`Loaded ${response.data.length} products successfully`} />);
            toast(<CustomToast id={`success-tab-${Date.now()}`} type="success" message={`Loaded ${response.data.length} products successfully`} />, {
                toastId: 'tab-success'
            });
        } catch (err) {
            const errorMsg = 'Failed to fetch products: ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-tab-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'tab-error'
            });
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
            const errorMsg = 'Failed to fetch categories: ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
        } else if (activeTab === 'categories') {
            fetchCategories();
        }
    }, [activeTab]);

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
            const errorMsg = 'At least one unit is required for the product.';
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-tab-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'tab-error'
            });
            return;
        }

        const invalidUnit = dataToSubmit.units.some(unit => !unit.type || !unit.display.trim());
        if (invalidUnit) {
            const errorMsg = 'All unit types and display values must be filled.';
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-tab-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'tab-error'
            });
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
                // toast.success('Image uploaded successfully');
                // toast(<CustomToast id="tab-switched" type="success" message="Image uploaded successfully" />);
                toast(<CustomToast id={`success-image-${Date.now()}`} type="success" message="Image uploaded successfully" />, {
                    toastId: 'image-success'
                });
            } catch (err) {
                const errorMsg = 'Failed to upload image: ' + (err.response?.data?.details || err.message);
                setError(errorMsg);
                // toast.error(errorMsg);
                // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
                toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                    toastId: 'error-e'
                });
                console.error('Image upload error:', err);
                return;
            }
        }

        delete dataToSubmit.image_file;

        try {
            if (editingProduct) {
                await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, dataToSubmit);
                // toast.success('Product updated successfully!');
                // toast(<CustomToast id="tab-switched" type="success" message="Product updated successfully!" />);
                toast(<CustomToast id={`success-update-${Date.now()}`} type="success" message="Product updated successfully!" />, {
                    toastId: 'update-success'
                });
            } else {
                await axios.post(`${API_BASE_URL}/products`, dataToSubmit);
                // toast.success('Product created successfully!');
                // toast(<CustomToast id="tab-switched" type="error" message="Product created successfully" />);
                toast(<CustomToast id={`error-created-${Date.now()}`} type="error" message="Product created successfully" />, {
                    toastId: 'created-error'
                });
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
            const errorMsg = 'Failed to save product: ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
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
        // toast.info('Editing product: ' + product.name);
        // toast(<CustomToast id="tab-switched" type="info" message={'Editing product: ' + product.name} />);
        toast(<CustomToast id={`info-product-${Date.now()}`} type="info" message={`Editing product: ` + product.name} />, {
            toastId: 'product-info'
        });
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            setError('');
            try {
                await axios.delete(`${API_BASE_URL}/products/${productId}`);
                // toast.success('Product deleted successfully!');
                // toast(<CustomToast id="tab-switched" type="success" message='Product deleted successfully!' />);
                toast(<CustomToast id={`success-delete-${Date.now()}`} type="success" message="Product deleted successfully!" />, {
                    toastId: 'delete-success'
                });
                fetchProducts();
            } catch (err) {
                const errorMsg = 'Failed to delete product: ' + (err.response?.data?.details || err.message);
                setError(errorMsg);
                // toast.error(errorMsg);
                // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
                toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                    toastId: 'e-error'
                });
                console.error('Product delete error:', err);
            }
        }
    };

    const cancelProductEdit = () => {
        setEditingProduct(null);
        setProductFormData({
            name: '', description: '', price: '', min_stock_level: '', category: '', image_file: null, image_url: '', is_active: true, units: [{ type: 'pcs', display: '1 pcs' }],
        });
        // toast.info('Cancelled product editing');
        // toast(<CustomToast id="tab-switched" type="info" message='Cancelled product editing' />);
        toast(<CustomToast id={`info-edit-${Date.now()}`} type="info" message="Cancelled product editing" />, {
            toastId: 'edit-info'
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
                // toast.success('Category updated successfully!');
                // toast(<CustomToast id="tab-switched" type="success" message='Category updated successfully!' />);
                toast(<CustomToast id={`success-updated-${Date.now()}`} type="success" message="Category updated successfully!" />, {
                    toastId: 'updated-success'
                });
            } else {
                await axios.post(`${API_BASE_URL}/products/categories`, categoryFormData);
                // toast.success('Category created successfully!');
                // toast(<CustomToast id="tab-switched" type="success" message='Category created successfully!' />);
                toast(<CustomToast id={`success-created-${Date.now()}`} type="success" message="Category created successfully!" />, {
                    toastId: 'created-success'
                });
            }
            fetchCategories();
            setEditingCategory(null);
            setCategoryFormData({ name: '', description: '' });
        } catch (err) {
            const errorMsg = 'Failed to save category: ' + (err.response?.data?.details || err.message);
            setError(errorMsg);
            // toast.error(errorMsg);
            // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
            toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                toastId: 'e-error'
            });
            console.error('Category save error:', err);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryFormData({
            name: category.name,
            description: category.description,
        });
        // toast.info('Editing category: ' + category.name);
        // toast(<CustomToast id="tab-switched" type="success" message={'Editing category: ' + category.name} />);
        toast(<CustomToast id={`success-edit-${Date.now()}`} type="success" message={`Editing category: ` + category.name} />, {
            toastId: 'edit-success'
        });
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone and may fail if products are linked.')) {
            setError('');
            try {
                await axios.delete(`${API_BASE_URL}/products/categories/${categoryId}`);
                // toast.success('Category deleted successfully!');
                // toast(<CustomToast id="tab-switched" type="success" message='Category deleted successfully!' />);
                toast(<CustomToast id={`success-delete-${Date.now()}`} type="success" message="Category deleted successfully!" />, {
                    toastId: 'delete-success'
                });
                fetchCategories();
            } catch (err) {
                const errorMsg = 'Failed to delete category: ' + (err.response?.data?.details || err.message);
                setError(errorMsg);
                // toast.error(errorMsg);
                // toast(<CustomToast id="tab-switched" type="error" message={errorMsg} />);
                toast(<CustomToast id={`error-e-${Date.now()}`} type="error" message={errorMsg} />, {
                    toastId: 'e-error'
                });
                console.error('Category delete error:', err);
            }
        }
    };

    const cancelCategoryEdit = () => {
        setEditingCategory(null);
        setCategoryFormData({ name: '', description: '' });
        // toast.info('Cancelled category editing');
        // toast(<CustomToast id="tab-switched" type="info" message='Cancelled category editing' />);
        toast(<CustomToast id={`info-cancelled-${Date.now()}`} type="info" message="Cancelled category editing" />, {
            toastId: 'cancelled-info'
        });
    };

    // Helper for filter submission
    const handleProductFilterSubmit = (e) => {
        e.preventDefault();
        fetchProducts();
        // toast.info('Applying product filters...');
        // toast(<CustomToast id="tab-switched" type="info" message='Applying product filters...' />);
        toast(<CustomToast id={`info-apply-${Date.now()}`} type="info" message="Applying product filters..." />, {
            toastId: 'apply-info'
        });
    };

    const handleCategoryFilterSubmit = (e) => {
        e.preventDefault();
        fetchCategories();
        // toast.info('Searching categories...');
        // toast(<CustomToast id="tab-switched" type="info" message='Searching categories...' />);
        toast(<CustomToast id={`info-search-${Date.now()}`} type="info" message="Searching categories..." />, {
            toastId: 'search-info'
        });
    };

    return (
        <div className="product-management-container">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                id="tab-switched"
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <div className="product-management-header">
                <h1>
                    <FaBox className="me-2" /> Product & Category Management
                </h1>
                <p>Manage products and categories efficiently</p>
            </div>

            {error && <Alert variant="danger" className="alert-message">{error}</Alert>}

            {/* Custom Tab Navigation */}
            <div className="custom-tabs-container">
                <Nav variant="pills" className="custom-tabs-nav" activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav.Item>
                        <Nav.Link eventKey="products" className={activeTab === 'products' ? 'active' : ''}>
                            <FaBox className="me-1" /> Products
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="categories" className={activeTab === 'categories' ? 'active' : ''}>
                            <FaTags className="me-1" /> Categories
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                {/* Tab Content */}
                <div className="tab-content">
                    {/* Products Tab */}
                    {activeTab === 'products' && (
                        <div className="tab-pane active">
                            {/* Product Add/Edit Form */}
                            <Card className="product-management-card">
                                <div className="card-titles">
                                    <FaPlus /> {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </div>
                                <Form onSubmit={handleProductSubmit} className="product-form">
                                    <Row>
                                        <Col md={6} lg={4}>
                                            <Form.Group>
                                                <Form.Label>Product Name</Form.Label>
                                                <FormControl type="text" name="name" value={productFormData.name} onChange={handleProductChange} required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Form.Group>
                                                <Form.Label>Category</Form.Label>
                                                <Form.Control as="select" name="category" value={productFormData.category} onChange={handleProductChange} required>
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Form.Group>
                                                <Form.Label>Price</Form.Label>
                                                <FormControl type="number" name="price" value={productFormData.price} onChange={handleProductChange} step="0.01" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Form.Group>
                                                <Form.Label>Min Stock Level</Form.Label>
                                                <FormControl type="number" name="min_stock_level" value={productFormData.min_stock_level} onChange={handleProductChange} step="0.01" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Form.Group>
                                                <Form.Label>Product Image</Form.Label>
                                                <FormControl type="file" name="image_file" onChange={handleProductChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6} lg={4}>
                                            <Form.Group>
                                                <Form.Label>Status</Form.Label>
                                                <Form.Check
                                                    type="checkbox"
                                                    name="is_active"
                                                    label="Active"
                                                    checked={productFormData.is_active}
                                                    onChange={handleProductChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

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
                                                    <Button variant="outline-secondary" size="sm" onClick={() => removeUnit(index)}>
                                                        <FaTimes />
                                                    </Button>
                                                )}
                                            </Col>
                                        </Row>
                                    ))}
                                    <Button variant="outline-secondary" size="sm" onClick={addUnit} className="mb-3">
                                        <FaPlus className="me-1" /> Add Another Unit
                                    </Button>

                                    {productFormData.image_url && !productFormData.image_file && (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Current Image</Form.Label>
                                            <div className="mt-2">
                                                <img src={productFormData.image_url} alt="Current Product" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/e0e0e0/000000?text=Img+Err'; }} />
                                            </div>
                                        </Form.Group>
                                    )}

                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <FormControl as="textarea" name="description" placeholder="Product Description" value={productFormData.description} onChange={handleProductChange} rows="3"></FormControl>
                                    </Form.Group>

                                    <div className="form-actions">
                                        {editingProduct && (
                                            <Button variant="outline-secondary" onClick={cancelProductEdit}>
                                                <FaTimes className="me-1" /> Cancel
                                            </Button>
                                        )}
                                        <Button variant="add-primary" className='add-primary' type="submit">
                                            {editingProduct ? <><FaEdit /> Update Product</> : <><FaPlus /> Add Product</>}
                                        </Button>
                                    </div>
                                </Form>
                            </Card>

                            {/* Products Filter Section */}
                            <Card className="product-management-card">
                                <div className="card-titles">
                                    <FaFilter /> Filter Products
                                </div>
                                <Form onSubmit={handleProductFilterSubmit} className="filter-form">
                                    <div className="filter-grid">
                                        <div className="filter-item">
                                            <Form.Label>Product ID</Form.Label>
                                            <FormControl type="number" placeholder="Search by ID" value={filterProductId} onChange={e => setFilterProductId(e.target.value)} />
                                        </div>
                                        <div className="filter-item">
                                            <Form.Label>Product Name</Form.Label>
                                            <FormControl type="text" placeholder="Search by name" value={filterName} onChange={e => setFilterName(e.target.value)} />
                                        </div>
                                        <div className="filter-item">
                                            <Form.Label>Category</Form.Label>
                                            <Form.Control as="select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                                                <option value="">All Categories</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </Form.Control>
                                        </div>
                                        <div className="filter-item">
                                            <Form.Label>Status</Form.Label>
                                            <Form.Control as="select" value={filterIsActive} onChange={e => setFilterIsActive(e.target.value)}>
                                                <option value="">All Statuses</option>
                                                <option value="true">Active</option>
                                                <option value="false">Inactive</option>
                                            </Form.Control>
                                        </div>
                                        <div className="filter-item">
                                            <Form.Label>Min Price</Form.Label>
                                            <FormControl type="number" step="0.01" placeholder="Min Price" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} />
                                        </div>
                                        <div className="filter-item">
                                            <Form.Label>Max Price</Form.Label>
                                            <FormControl type="number" step="0.01" placeholder="Max Price" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} />
                                        </div>
                                        <div className="filter-item">
                                            <Form.Label>Min Stock</Form.Label>
                                            <FormControl type="number" placeholder="Min Stock" value={filterMinStock} onChange={e => setFilterMinStock(e.target.value)} />
                                        </div>
                                        <div className="filter-item">
                                            <Form.Label>Max Stock</Form.Label>
                                            <FormControl type="number" placeholder="Max Stock" value={filterMaxStock} onChange={e => setFilterMaxStock(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="filter-actions">
                                        <Button variant="add-primary" type="submit" className="filter-apply-btn">
                                            <FaSearch className="me-2" /> Apply Filters
                                        </Button>
                                    </div>
                                </Form>
                            </Card>

                            {/* Products Table */}
                            <Card className="product-management-card">
                                <div className="card-titles">
                                    <FaBox /> All Products
                                </div>
                                {loading ? (
                                    <div className="text-center my-5">
                                        <Spinner animation="border" variant="primary" />
                                        <p className="mt-2">Loading products...</p>
                                    </div>
                                ) : products.length === 0 ? (
                                    <Alert variant="info" className="m-3">
                                        No products found for the applied filters.
                                    </Alert>
                                ) : (
                                    <div className="table-container">
                                        <Table striped bordered hover className="products-table">
                                            <thead>
                                                <tr>
                                                    <th>S/N</th>
                                                    <th>Image</th>
                                                    <th>Name</th>
                                                    <th>Category</th>
                                                    <th>Price</th>
                                                    <th>Units</th>
                                                    <th>Stock</th>
                                                    <th>Min Stock</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td className="serial-number">{index + 1}</td>
                                                        <td className="product-images">
                                                            <img src={product.image_url || 'https://placehold.co/50x50/e0e0e0/000000?text=No+Image'} alt={product.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/e0e0e0/000000?text=Img+Err'; }} />
                                                        </td>
                                                        <td className="product-names">{product.name}</td>
                                                        <td className="product-categorys">{product.category}</td>
                                                        <td className="product-prices">₦{Number(product.price).toFixed(2)}</td>
                                                        <td className="product-unitss">
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
                                                        <td className="product-stock">{product.stock_level}</td>
                                                        <td className="product-min-stock">{product.min_stock_level}</td>
                                                        <td className="product-status">
                                                            <span className={`badge ${product.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                                {product.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="product-actions">
                                                            <div className="action-buttons">
                                                                <Button variant='outline-primary' className="btn-action edit" onClick={() => handleEditProduct(product)} title="Edit">
                                                                    <FaEdit />
                                                                </Button>
                                                                <Button className="btn-action delete" onClick={() => handleDeleteProduct(product.id)} title="Delete">
                                                                    <FaTrash />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                        <div className="tab-pane active">
                            {/* Category Add/Edit Form */}
                            <Card className="product-management-card">
                                <div className="card-titles">
                                    <FaPlus /> {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </div>
                                <Form onSubmit={handleCategorySubmit} className="category-form">
                                    <Row>
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label>Category Name</Form.Label>
                                                <FormControl type="text" name="name" value={categoryFormData.name} onChange={handleCategoryChange} required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="d-flex align-items-end h-100">
                                                <div className="form-actions w-100">
                                                    {editingCategory && (
                                                        <Button variant="outline-secondary" onClick={cancelCategoryEdit} className="me-2">
                                                            <FaTimes className="me-1" /> Cancel
                                                        </Button>
                                                    )}
                                                    <Button variant="add-primary" type="submit" className="add-primary">
                                                        {editingCategory ? <><FaEdit /> Update</> : <><FaPlus /> Add</>}
                                                    </Button>
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group>
                                        <Form.Label>Description (optional)</Form.Label>
                                        <FormControl as="textarea" name="description" placeholder="Category Description" value={categoryFormData.description} onChange={handleCategoryChange} rows="2"></FormControl>
                                    </Form.Group>
                                </Form>
                            </Card>

                            {/* Category Search/Filter */}
                            <Card className="product-management-card">
                                <div className="card-titles">
                                    <FaSearch /> Search Categories
                                </div>
                                <Form onSubmit={handleCategoryFilterSubmit}>
                                    <InputGroup>
                                        <FormControl
                                            type="text"
                                            placeholder="Search categories by name or description..."
                                            value={categorySearchTerm}
                                            onChange={e => setCategorySearchTerm(e.target.value)}
                                        />
                                        <Button variant="add-primary" className='add-primary' type="submit">
                                            <FaSearch /> Search
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </Card>

                            {/* Categories Table */}
                            <Card className="product-management-card">
                                <div className="card-titles">
                                    <FaTags /> All Categories
                                </div>
                                {loading ? (
                                    <div className="text-center my-5">
                                        <Spinner animation="border" variant="primary" />
                                        <p className="mt-2">Loading categories...</p>
                                    </div>
                                ) : categories.length === 0 ? (
                                    <Alert variant="info" className="m-3">
                                        No categories found. Add some above!
                                    </Alert>
                                ) : (
                                    <div className="table-container">
                                        <Table striped bordered hover className="categories-table">
                                            <thead>
                                                <tr>
                                                    <th>S/N</th>
                                                    <th>Name</th>
                                                    <th>Description</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categories.map((category, index) => (
                                                    <tr key={category.id}>
                                                        <td className="serial-number">{index + 1}</td>
                                                        <td className="category-name">{category.name}</td>
                                                        <td className="category-description">{category.description || 'N/A'}</td>
                                                        <td className="category-actions">
                                                            <div className="action-buttons">
                                                                <Button variant='outline-primary' className="btn-action edit" onClick={() => handleEditCategory(category)} title="Edit">
                                                                    <FaEdit />
                                                                </Button>
                                                                <Button className="btn-action delete" onClick={() => handleDeleteCategory(category.id)} title="Delete">
                                                                    <FaTrash />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductManagementPage;