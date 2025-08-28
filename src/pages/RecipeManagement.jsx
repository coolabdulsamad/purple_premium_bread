import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, Table, Alert, Spinner, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import '../styles/forms.css'; // Reusing forms.css for general styling

const API_BASE_URL = 'http://localhost:5000/api';

const RecipeManagement = () => {
    const [products, setProducts] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [recipes, setRecipes] = useState([]); // Stores per-product-unit recipes
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form data for adding/editing recipe items (for a batch)
    const [batchRecipeFormData, setBatchRecipeFormData] = useState({
        batchSize: 1, // Number of finished products this batch makes
        tempIngredients: [], // Array to hold multiple ingredients before submission
    });

    // Individual ingredient form for adding to tempIngredients
    const [currentIngredientForm, setCurrentIngredientForm] = useState({
        raw_material_id: '',
        totalQuantityUsedInBatch: 0,
    });

    const [isEditingRecipeItem, setIsEditingRecipeItem] = useState(false);
    const [editingRawMaterialId, setEditingRawMaterialId] = useState(null); // Used to identify the item being edited

    // --- Data Fetching ---
    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            setProducts(response.data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products.');
        }
    };

    const fetchRawMaterials = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/raw-materials`);
            setRawMaterials(response.data);
        } catch (err) {
            console.error('Error fetching raw materials:', err);
            setError('Failed to load raw materials.');
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
            setError('Failed to load recipes for selected product. ' + (err.response?.data?.details || err.message));
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

    // --- Form Handlers for Batch Recipe Input ---
    const handleBatchSizeChange = (e) => {
        const newSize = Math.max(1, parseInt(e.target.value) || 1);
        setBatchRecipeFormData(prev => ({ ...prev, batchSize: newSize }));
    };

    const handleCurrentIngredientChange = (e) => {
        const { name, value } = e.target;
        setCurrentIngredientForm(prev => ({
            ...prev,
            [name]: name === 'totalQuantityUsedInBatch' ? parseFloat(value) : value,
        }));
    };

    const addIngredientToTempList = () => {
        setError('');
        if (!currentIngredientForm.raw_material_id || currentIngredientForm.totalQuantityUsedInBatch <= 0) {
            setError('Please select a raw material and enter a valid total quantity used for the batch.');
            return;
        }

        // Check for duplicates in the temporary list
        const isDuplicateTemp = batchRecipeFormData.tempIngredients.some(
            item => item.raw_material_id === currentIngredientForm.raw_material_id
        );
        if (isDuplicateTemp) {
            setError('This raw material is already in your temporary list. Please edit or remove it there.');
            return;
        }

        // Check for duplicates in the *existing* recipe
        const isDuplicateExisting = recipes.some(
            item => item.raw_material_id === currentIngredientForm.raw_material_id
        );
        if (isDuplicateExisting) {
            setError('This raw material is already in the existing recipe for this product. Please use the "Edit" button below.');
            return;
        }

        const selectedMaterial = rawMaterials.find(rm => rm.id === parseInt(currentIngredientForm.raw_material_id));

        setBatchRecipeFormData(prev => ({
            ...prev,
            tempIngredients: [...prev.tempIngredients, { ...currentIngredientForm, raw_material_name: selectedMaterial?.name, raw_material_unit: selectedMaterial?.unit }]
        }));
        setCurrentIngredientForm({ raw_material_id: '', totalQuantityUsedInBatch: 0 }); // Reset individual ingredient form
    };

    const removeIngredientFromTempList = (indexToRemove) => {
        setBatchRecipeFormData(prev => ({
            ...prev,
            tempIngredients: prev.tempIngredients.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleBatchRecipeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!selectedProductId) {
            setError('Please select a product first.');
            return;
        }
        if (batchRecipeFormData.batchSize <= 0) {
            setError('Batch size must be greater than 0.');
            return;
        }
        if (batchRecipeFormData.tempIngredients.length === 0) {
            setError('Please add at least one raw material to the batch recipe.');
            return;
        }

        try {
            // Process each ingredient in the temporary list
            const submissionPromises = batchRecipeFormData.tempIngredients.map(async (item) => {
                const quantity_required_per_product = item.totalQuantityUsedInBatch / batchRecipeFormData.batchSize;
                const payload = {
                    product_id: selectedProductId,
                    raw_material_id: item.raw_material_id,
                    quantity_required: quantity_required_per_product,
                };
                await axios.post(`${API_BASE_URL}/recipes`, payload);
            });

            await Promise.all(submissionPromises); // Send all requests concurrently
            setSuccessMessage(`Recipe for ${selectedProduct?.name} updated successfully with batch-based calculations!`);
            fetchRecipes(); // Refresh the recipe list
            resetBatchForm();
        } catch (err) {
            console.error('Error saving batch recipe items:', err.response?.data || err.message);
            setError('Failed to save batch recipe items. ' + (err.response?.data?.error || err.message));
        }
    };

    const resetBatchForm = () => {
        setBatchRecipeFormData({
            batchSize: 1,
            tempIngredients: [],
        });
        setCurrentIngredientForm({ raw_material_id: '', totalQuantityUsedInBatch: 0 });
        setIsEditingRecipeItem(false);
        setEditingRawMaterialId(null);
    };

    // --- Handlers for Editing/Deleting Existing Per-Unit Recipe Items ---
    const handleEditExistingRecipeItem = (recipeItem) => {
        // When editing an *existing* recipe item (which is already per-unit)
        // we directly set the per-unit quantity.
        setRecipeItemFormData({
            raw_material_id: recipeItem.raw_material_id,
            quantity_required: recipeItem.quantity_required,
        });
        setEditingRawMaterialId(recipeItem.raw_material_id);
        setIsEditingRecipeItem(true);
        setError('');
        setSuccessMessage('');

        // Clear batch form if we switch to editing a single item
        resetBatchForm();
    };


    const handleUpdateExistingRecipeItem = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!selectedProductId || !editingRawMaterialId || recipeItemFormData.quantity_required <= 0) {
            setError('Invalid product, raw material, or quantity for update.');
            return;
        }

        const payload = {
            quantity_required: recipeItemFormData.quantity_required,
        };

        try {
            await axios.put(`${API_BASE_URL}/recipes/${selectedProductId}/${editingRawMaterialId}`, payload);
            setSuccessMessage('Recipe item updated successfully!');
            fetchRecipes();
            handleCancelRecipeItemEdit();
        } catch (err) {
            console.error('Error updating recipe item:', err.response?.data || err.message);
            setError('Failed to update recipe item. ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteRecipeItem = async (rawMaterialId, rawMaterialName) => {
        if (!selectedProductId) {
            setError('Please select a product first.');
            return;
        }
        if (window.confirm(`Are you sure you want to remove "${rawMaterialName}" from this product's recipe?`)) {
            setError('');
            setSuccessMessage('');
            try {
                await axios.delete(`${API_BASE_URL}/recipes/${selectedProductId}/${rawMaterialId}`);
                setSuccessMessage(`"${rawMaterialName}" removed from recipe successfully!`);
                fetchRecipes();
            } catch (err) {
                console.error('Error deleting recipe item:', err.response?.data || err.message);
                setError('Failed to remove recipe item. ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const handleCancelRecipeItemEdit = () => {
        setRecipeItemFormData({
            raw_material_id: '',
            quantity_required: 0,
        });
        setIsEditingRecipeItem(false);
        setEditingRawMaterialId(null);
        setError('');
        setSuccessMessage('');
    };


    // Calculate total COGS for the selected product (from per-product-unit recipes)
    const calculateTotalCogs = () => {
        return recipes.reduce((total, item) => {
            const cost = parseFloat(item.raw_material_cost_per_unit || 0);
            return total + (cost * item.quantity_required);
        }, 0);
    };

    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
    const totalCogs = calculateTotalCogs();

    const availableRawMaterials = rawMaterials.filter(rm =>
        // Exclude raw materials already in the temporary list AND not the one being edited
        !batchRecipeFormData.tempIngredients.some(item => item.raw_material_id === rm.id) &&
        !recipes.some(item => item.raw_material_id === rm.id && item.raw_material_id !== editingRawMaterialId)
    );

    return (
        <div className="recipe-management-container">
            <h1 className="main-header">Recipe Management</h1>

            {error && <Alert variant="danger" className="my-3">{error}</Alert>}
            {successMessage && <Alert variant="success" className="my-3">{successMessage}</Alert>}

            {/* Product Selection */}
            <Card className="form-card mb-4">
                <h2 className="card-title">Select Product</h2>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="3">Choose Product:</Form.Label>
                    <Col sm="9">
                        <Form.Control as="select" value={selectedProductId} onChange={(e) => {
                            setSelectedProductId(e.target.value);
                            resetBatchForm(); // Clear batch form on product change
                            handleCancelRecipeItemEdit(); // Clear single edit form
                        }}>
                            <option value="">-- Select a Product --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Form.Control>
                    </Col>
                </Form.Group>

                {selectedProduct && (
                    <Card className="mt-3 p-3 bg-light">
                        <Row>
                            <Col md={2} className="text-center">
                                <img
                                    src={selectedProduct.image_url || 'https://placehold.co/80x80/e0e0e0/000000?text=No+Image'}
                                    alt={selectedProduct.name}
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/e0e0e0/000000?text=Img+Err'; }}
                                />
                            </Col>
                            <Col md={10}>
                                <h5>{selectedProduct.name}</h5>
                                <p className="mb-1">Category: {selectedProduct.category}</p>
                                <p className="mb-1">Price: ₦{Number(selectedProduct.price).toFixed(2)}</p>
                                {selectedProduct.units && selectedProduct.units.length > 0 && (
                                    <p className="mb-1">Units: {selectedProduct.units.map(u => `${u.display} (${u.type})`).join(', ')}</p>
                                )}
                                <h4 className="mt-2">Estimated COGS Per Unit: ₦{totalCogs.toFixed(2)}</h4>
                                <h4 className="mt-2">Estimated Profit Per Unit: ₦{(Number(selectedProduct.price) - totalCogs).toFixed(2)}</h4>
                            </Col>
                        </Row>
                    </Card>
                )}
            </Card>

            {/* Add Recipe Item Form (Batch-based or Single Edit) */}
            {selectedProductId && (
                <Card className="form-card mb-4">
                    <h2 className="card-title">
                        {isEditingRecipeItem ? 'Edit Existing Raw Material Quantity (Per Product Unit)' : 'Add New Raw Materials (Batch-based Calculation)'}
                    </h2>
                    {isEditingRecipeItem ? (
                        <Form onSubmit={handleUpdateExistingRecipeItem}>
                             <Row className="g-3 align-items-end">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Raw Material</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="raw_material_id"
                                            value={recipeItemFormData.raw_material_id}
                                            disabled
                                        >
                                            <option value="">-- Select Raw Material --</option>
                                            {rawMaterials.map(rm => (
                                                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Quantity Required (Per Product Unit)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="quantity_required"
                                            value={recipeItemFormData.quantity_required}
                                            onChange={(e) => setRecipeItemFormData(prev => ({ ...prev, quantity_required: parseFloat(e.target.value) }))}
                                            min="0.001"
                                            step="0.001"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Button variant="primary" type="submit" className="w-100">
                                        Update
                                    </Button>
                                    <Button variant="secondary" onClick={handleCancelRecipeItemEdit} className="w-100 mt-2">
                                        Cancel
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    ) : (
                        <Form onSubmit={handleBatchRecipeSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Number of Finished Products in this Batch</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={batchRecipeFormData.batchSize}
                                    onChange={handleBatchSizeChange}
                                    min="1"
                                    required
                                />
                            </Form.Group>

                            <h5 className="mt-4 mb-3">Add Ingredients for this Batch:</h5>
                            <Row className="g-3 align-items-end mb-3">
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label>Raw Material</Form.Label>
                                        <Form.Control as="select" name="raw_material_id" value={currentIngredientForm.raw_material_id} onChange={handleCurrentIngredientChange} required>
                                            <option value="">-- Select Raw Material --</option>
                                            {availableRawMaterials.map(rm => (
                                                <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group>
                                        <Form.Label>Total Quantity Used in Batch</Form.Label>
                                        <Form.Control type="number" name="totalQuantityUsedInBatch" value={currentIngredientForm.totalQuantityUsedInBatch} onChange={handleCurrentIngredientChange} min="0.01" step="0.01" required />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Button variant="outline-primary" onClick={addIngredientToTempList} className="w-100">
                                        <FaPlus /> Add to List
                                    </Button>
                                </Col>
                            </Row>

                            {/* Temporary Ingredients List */}
                            {batchRecipeFormData.tempIngredients.length > 0 && (
                                <div className="mb-4 p-3 border rounded bg-light">
                                    <h6>Ingredients for current batch submission:</h6>
                                    <ul className="list-unstyled">
                                        {batchRecipeFormData.tempIngredients.map((item, index) => (
                                            <li key={item.raw_material_id} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                                                <span>{item.raw_material_name}: {item.totalQuantityUsedInBatch} {item.raw_material_unit} (for {batchRecipeFormData.batchSize} products)</span>
                                                <Button variant="outline-danger" size="sm" onClick={() => removeIngredientFromTempList(index)}>
                                                    <FaTimes />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="d-flex justify-content-end mt-3">
                                <Button variant="primary" type="submit" disabled={batchRecipeFormData.tempIngredients.length === 0}>
                                    <FaPlus className="me-1" /> Save Recipe (Calculate Per Product Unit)
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card>
            )}

            {/* Recipes Table (Existing Per-Product-Unit Recipes) */}
            {selectedProductId && (
                <Card className="table-card mb-4">
                    <h2 className="card-title">Recipe Details for {selectedProduct?.name} (Per Product Unit)</h2>
                    {loading ? (
                        <div className="text-center my-5"><Spinner animation="border" /><p>Loading recipes...</p></div>
                    ) : recipes.length === 0 ? (
                        <Alert variant="info">No raw materials defined for this product's recipe. Add some above using the batch calculator.</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="recipes-table">
                                <thead>
                                    <tr>
                                        <th>Raw Material</th>
                                        <th>Required Quantity (Per Product Unit)</th>
                                        <th>Unit</th>
                                        <th>Current Cost Contribution (₦)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipes.map(item => (
                                        <tr key={`${item.product_id}-${item.raw_material_id}`}>
                                            <td>{item.raw_material_name}</td>
                                            <td>{Number(item.quantity_required).toFixed(3)}</td> {/* More precision */}
                                            <td>{item.raw_material_unit}</td>
                                            <td>₦{(Number(item.quantity_required) * Number(item.raw_material_cost_per_unit || 0)).toFixed(2)}</td>
                                            <td>
                                                <Button variant="info" size="sm" className="me-1" onClick={() => handleEditExistingRecipeItem(item)}>
                                                    <FaEdit /> Edit
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteRecipeItem(item.raw_material_id, item.raw_material_name)}>
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
            )}
        </div>
    );
};

export default RecipeManagement;
