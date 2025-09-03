import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, Badge } from 'react-bootstrap';
import { FaTrash, FaPlus, FaTimes, FaBox, FaTag, FaMoneyBill, FaChartLine, FaInfoCircle } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/styles/recipe-management.css';
import CustomToast from '../components/CustomToast';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const RecipeManagement = () => {
    const [products, setProducts] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [batchSize, setBatchSize] = useState(1);
    const [tempIngredients, setTempIngredients] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [quantity, setQuantity] = useState('');

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            setProducts(response.data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products.');
            // toast.error('Failed to load products');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Failed to load products"
            //     />
            // );
            toast(<CustomToast id={`error-product-${Date.now()}`} type="error" message="Failed to load products" />, {
                toastId: 'product-error'
            });
        }
    };

    const fetchRawMaterials = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/raw-materials`);
            setRawMaterials(response.data);
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            setError('Failed to load raw materials.');
            // toast.error('Failed to load raw materials');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Failed to load raw materials"
            //     />
            // );
            toast(<CustomToast id={`error-material-${Date.now()}`} type="error" message="Failed to load raw materials" />, {
                toastId: 'material-error'
            });
        }
    };

    const fetchRecipes = useCallback(async () => {
        if (!selectedProductId) {
            setRecipes([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/recipes`, {
                params: { productId: selectedProductId }
            });
            setRecipes(response.data);
        } catch (err) {
            console.error('Error fetching recipes:', err.response?.data || err.message);
            setError('Failed to load recipes for selected product.');
        } finally {
            setLoading(false);
        }
    }, [selectedProductId]);

    useEffect(() => {
        fetchProducts();
        fetchRawMaterials();
    }, []);

    useEffect(() => {
        fetchRecipes();
    }, [selectedProductId, fetchRecipes]);

    const addIngredientToTempList = () => {
        if (!selectedMaterial || !quantity || quantity <= 0) {
            // toast.error('Please select a raw material and enter a valid quantity');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Please select a raw material and enter a valid quantity"
            //     />
            // );
            toast(<CustomToast id={`error-quantity-${Date.now()}`} type="error" message="Please select a raw material and enter a valid quantity" />, {
                toastId: 'quantity-error'
            });
            return;
        }

        const material = rawMaterials.find(rm => rm.id === parseInt(selectedMaterial));
        if (!material) {
            // toast.error('Selected material not found');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Selected material not found"
            //     />
            // );
            toast(<CustomToast id={`error-select-${Date.now()}`} type="error" message="Selected material not found" />, {
                toastId: 'select-error'
            });
            return;
        }

        // Check if already in temp list
        if (tempIngredients.some(item => item.raw_material_id === selectedMaterial)) {
            // toast.error('This material is already in your list');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="This material is already in your list"
            //     />
            // );
            toast(<CustomToast id={`error-list-${Date.now()}`} type="error" message="This material is already in your list" />, {
                toastId: 'list-error'
            });
            return;
        }

        // Check if already in existing recipes
        if (recipes.some(item => item.raw_material_id === parseInt(selectedMaterial))) {
            // toast.error('This material is already in the recipe');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="This material is already in the recipe"
            //     />
            // );
            toast(<CustomToast id={`error-recipe-${Date.now()}`} type="error" message="This material is already in the recipe" />, {
                toastId: 'recipe-error'
            });
            return;
        }

        setTempIngredients(prev => [...prev, {
            raw_material_id: selectedMaterial,
            totalQuantityUsedInBatch: parseFloat(quantity),
            raw_material_name: material.name,
            raw_material_unit: material.unit
        }]);

        setSelectedMaterial('');
        setQuantity('');
        // toast.info('Ingredient added to list');
        // toast(
        //     <CustomToast
        //         type="info"
        //         message="Ingredient added to list"
        //     />
        // );
        toast(<CustomToast id={`info-add-${Date.now()}`} type="info" message="Ingredient added to list" />, {
            toastId: 'add-info'
        });
    };

    const removeIngredientFromTempList = (indexToRemove) => {
        setTempIngredients(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleBatchRecipeSubmit = async (e) => {
        e.preventDefault();

        if (!selectedProductId) {
            // toast.error('Please select a product first');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Please select a product first"
            //     />
            // );
            toast(<CustomToast id={`error-product-${Date.now()}`} type="error" message="Please select a product first" />, {
                toastId: 'product-error'
            });
            return;
        }

        if (tempIngredients.length === 0) {
            // toast.error('Please add at least one ingredient to the list');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Please add at least one ingredient to the list"
            //     />
            // );
            toast(<CustomToast id={`error-add-${Date.now()}`} type="error" message="Please add at least one ingredient to the list" />, {
                toastId: 'add-error'
            });
            return;
        }

        if (batchSize <= 0) {
            // toast.error('Batch size must be greater than 0');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Batch size must be greater than 0"
            //     />
            // );
            toast(<CustomToast id={`error-batch-${Date.now()}`} type="error" message="Batch size must be greater than 0" />, {
                toastId: 'batch-error'
            });
            return;
        }

        try {
            for (const item of tempIngredients) {
                const quantity_required_per_product = item.totalQuantityUsedInBatch / batchSize;
                const payload = {
                    product_id: selectedProductId,
                    raw_material_id: item.raw_material_id,
                    quantity_required: quantity_required_per_product,
                };
                await axios.post(`${API_BASE_URL}/recipes`, payload);
            }

            // toast.success(`Recipe saved successfully!`);
            // toast(
            //     <CustomToast
            //         type="success"
            //         message="Recipe saved successfully!"
            //     />
            // );
            toast(<CustomToast id={`success-recipe-${Date.now()}`} type="success" message="Recipe saved successfully!" />, {
                toastId: 'recipe-success'
            });
            setTempIngredients([]);
            setBatchSize(1);
            fetchRecipes();
        } catch (err) {
            console.error('Error saving recipe:', err);
            // toast.error('Failed to save recipe');
            // toast(
            //     <CustomToast
            //         type="error"
            //         message="Failed to save recipe"
            //     />
            // );
            toast(<CustomToast id={`error-recipe-${Date.now()}`} type="error" message="Failed to save recipe" />, {
                toastId: 'recipe-error'
            });
        }
    };

    const handleDeleteRecipeItem = async (rawMaterialId, rawMaterialName) => {
        if (!selectedProductId) return;

        if (window.confirm(`Remove "${rawMaterialName}" from recipe?`)) {
            try {
                await axios.delete(`${API_BASE_URL}/recipes/${selectedProductId}/${rawMaterialId}`);
                // toast.success(`"${rawMaterialName}" removed from recipe`);
                // toast(
                //     <CustomToast
                //         type="success"
                //         message={`"${rawMaterialName}" removed from recipe`}
                //     />
                // );
                toast(<CustomToast id={`success-recipe-${Date.now()}`} type="success" message="removed from recipe" />, {
                    toastId: 'recipe-success'
                });
                fetchRecipes();
            } catch (err) {
                console.error('Error deleting recipe item:', err);
                // toast.error('Failed to remove ingredient');
                // toast(
                //     <CustomToast
                //         type="error"
                //         message="Failed to remove ingredient"
                //     />
                // );
                toast(<CustomToast id={`error-remove-${Date.now()}`} type="error" message="Failed to remove ingredient" />, {
                    toastId: 'remove-error'
                });
            }
        }
    };

    const calculateTotalCogs = () => {
        return recipes.reduce((total, item) => {
            const cost = parseFloat(item.raw_material_cost_per_unit || 0);
            return total + (cost * item.quantity_required);
        }, 0);
    };

    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
    const totalCogs = calculateTotalCogs();

    const availableRawMaterials = rawMaterials.filter(rm =>
        !tempIngredients.some(item => item.raw_material_id === rm.id.toString()) &&
        !recipes.some(item => item.raw_material_id === rm.id)
    );

    return (
        <div className="recipe-management-container">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <h1 className="main-header">Recipe Management</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* Product Selection */}
            <Card className="form-card mb-4">
                <div className="card-title">Select Product</div>
                <div className="card-body">
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm="3">Choose Product:</Form.Label>
                        <Col sm="9">
                            <Form.Control as="select" value={selectedProductId} onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setTempIngredients([]);
                            }}>
                                <option value="">-- Select a Product --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Form.Control>
                        </Col>
                    </Form.Group>

                    {selectedProduct && (
                        <Card className="mt-3 product-info-card">
                            <div className="product-grid">
                                <div className="product-image-container">
                                    <img
                                        src={selectedProduct.image_url || 'https://placehold.co/100x100/e0e0e0/000000?text=No+Image'}
                                        alt={selectedProduct.name}
                                        className="product-image"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/e0e0e0/000000?text=Img+Err'; }}
                                    />
                                </div>

                                <div className="product-details">
                                    <h3 className="product-name">{selectedProduct.name}</h3>

                                    <div className="product-category">
                                        <FaTag className="info-icon" />
                                        Category: {selectedProduct.category}
                                    </div>

                                    <div className="product-price">
                                        <FaMoneyBill className="info-icon" />
                                        Price: ₦{Number(selectedProduct.price).toFixed(2)}
                                    </div>

                                    {selectedProduct.units && selectedProduct.units.length > 0 && (
                                        <div className="product-units">
                                            <FaBox className="info-icon" />
                                            Available Units:
                                            {selectedProduct.units.map((u, index) => (
                                                <Badge key={index} className="units-badge" bg="primary">
                                                    {u.display} ({u.type})
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="divider"></div>

                            <div className="cogs-info">
                                <h6 className="text-accent mb-3">
                                    <FaChartLine className="info-icon" />
                                    Cost Analysis (Per Unit)
                                </h6>

                                <div className="cogs-item">
                                    <span className="cogs-label">Selling Price:</span>
                                    <span className="cogs-value">₦{Number(selectedProduct.price).toFixed(2)}</span>
                                </div>

                                <div className="cogs-item">
                                    <span className="cogs-label">Total COGS:</span>
                                    <span className="cogs-value">₦{totalCogs.toFixed(2)}</span>
                                </div>

                                <div className="cogs-item">
                                    <span className="cogs-label">Gross Profit:</span>
                                    <span className={`cogs-value ${(Number(selectedProduct.price) - totalCogs) >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                        ₦{(Number(selectedProduct.price) - totalCogs).toFixed(2)}
                                    </span>
                                </div>

                                <div className="cogs-item">
                                    <span className="cogs-label">Profit Margin:</span>
                                    <span className={`cogs-value ${(Number(selectedProduct.price) - totalCogs) >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                                        {((Number(selectedProduct.price) - totalCogs) / Number(selectedProduct.price) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </Card>

            {/* Add Recipe Form */}
            {selectedProductId && (
                <Card className="form-card mb-4">
                    <div className="card-title">Add Recipe Ingredients</div>
                    <div className="card-body">
                        <Form onSubmit={handleBatchRecipeSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Batch Size (Number of Products)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    required
                                />
                            </Form.Group>

                            <h6 className="mt-4 mb-3">Add Ingredients:</h6>
                            <Row className="g-3 align-items-end mb-3">
                                <Col md={5}>
                                    <Form.Group className='form-group'>
                                        <Form.Label>Raw Material</Form.Label>
                                        <Form.Control
                                            as="select"
                                            value={selectedMaterial}
                                            onChange={(e) => setSelectedMaterial(e.target.value)}
                                        >
                                            <option value="">-- Select Material --</option>
                                            {availableRawMaterials.map(rm => (
                                                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group className='form-group'>
                                        <Form.Label>Total Quantity for Batch</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            min="0.01"
                                            step="0.01"
                                            placeholder="Enter quantity"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Button
                                        variant="outline-primary"
                                        onClick={addIngredientToTempList}
                                        className="w-100"
                                        disabled={!selectedMaterial || !quantity}
                                    >
                                        <FaPlus /> Add
                                    </Button>
                                </Col>
                            </Row>

                            {tempIngredients.length > 0 && (
                                <div className="mb-4 p-3 temp-ingredients-list">
                                    <h6 className="mb-2">Ingredients to be added:</h6>
                                    <ul className="list-unstyled mb-0">
                                        {tempIngredients.map((item, index) => (
                                            <li key={index} className="d-flex justify-content-between align-items-center py-2">
                                                <span>
                                                    {item.raw_material_name}: {item.totalQuantityUsedInBatch} {item.raw_material_unit}
                                                </span>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => removeIngredientFromTempList(index)}
                                                >
                                                    <FaTimes />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="d-flex justify-content-end">
                                <Button
                                    variant="outline-primary"
                                    type="submit"
                                    disabled={tempIngredients.length === 0}
                                // className="new-secondary"
                                >
                                    Save Recipe
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Card>
            )}

            {/* Recipes Table */}
            {selectedProductId && (
                <Card className="table-card mb-4">
                    <div className="card-title">Current Recipe for {selectedProduct?.name}</div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center my-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">Loading recipes...</p>
                            </div>
                        ) : recipes.length === 0 ? (
                            <Alert variant="info" className="text-center">
                                No recipe ingredients found. Add ingredients above.
                            </Alert>
                        ) : (
                            <div className="table-responsive">
                                <Table striped bordered hover className="recipes-table">
                                    <thead>
                                        <tr>
                                            <th className="serial-number">S/N</th>
                                            <th>Raw Material</th>
                                            <th>Quantity per Unit</th>
                                            <th>Unit</th>
                                            <th>Cost (₦)</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipes.map((item, index) => (
                                            <tr key={index}>
                                                <td className="serial-number">{index + 1}</td>
                                                <td>{item.raw_material_name}</td>
                                                <td>{Number(item.quantity_required).toFixed(3)}</td>
                                                <td>{item.raw_material_unit}</td>
                                                <td>₦{(Number(item.quantity_required) * Number(item.raw_material_cost_per_unit || 0)).toFixed(2)}</td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleDeleteRecipeItem(item.raw_material_id, item.raw_material_name)}
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default RecipeManagement;