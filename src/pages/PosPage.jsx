import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import useAuth from '../hooks/useAuth';
import '../assets/styles/pos.css';
import { FaShoppingCart, FaPlus, FaMinus } from 'react-icons/fa';

const API_BASE_URL = "https://purple-premium-bread-backend.onrender.com/api";

const POSPage = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            setProducts(response.data.filter(p => p.is_active)); // Only show active products
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        } else {
            fetchProducts();
        }
    }, [isAuthenticated, navigate]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateCartItem = (itemId, newQuantity) => {
        setCart(prevCart => {
            const updatedCart = prevCart.map(item =>
                item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
            );
            return updatedCart.filter(item => item.quantity > 0);
        });
    };

    const getTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.08; // 8% tax rate
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to process a sale.');
            return;
        }
        const decoded = jwtDecode(token);
        const cashierId = decoded.id;

        try {
            await axios.post(`${API_BASE_URL}/sales/process`, {
                cart,
                paymentMethod: 'Card', // Hardcoded for now, can be a form input
                cashierId
            });
            alert('Sale processed successfully!');
            setCart([]); // Clear the cart
        } catch (err) {
            console.error('Error processing sale:', err);
            alert('Failed to process sale. Please try again.');
        }
    };

    if (loading) return <div className="loading-message">Loading products...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const { subtotal, tax, total } = getTotals();

    return (
        <div className="pos-container">
            <div className="product-list-panel">
                <h2 className="panel-title">Available Products</h2>
                <div className="product-grid">
                    {products.map(product => (
                        <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                            <img src={product.image_url || 'https://via.placeholder.com/150'} alt={product.name} />
                            <div className="product-details">
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-price">${Number(product.price).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cart-panel">
                <h2 className="panel-title">
                    <FaShoppingCart /> Cart
                </h2>
                <div className="cart-items-list">
                    {cart.length > 0 ? (
                        cart.map(item => (
                            <div key={item.id} className="cart-item">
                                <span className="item-name">{item.name}</span>
                                <div className="item-controls">
                                    <button onClick={(e) => { e.stopPropagation(); updateCartItem(item.id, item.quantity - 1); }}>
                                        <FaMinus />
                                    </button>
                                    <span className="item-quantity">{item.quantity}</span>
                                    <button onClick={(e) => { e.stopPropagation(); updateCartItem(item.id, item.quantity + 1); }}>
                                        <FaPlus />
                                    </button>
                                </div>
                                <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="empty-cart-message">Cart is empty.</p>
                    )}
                </div>

                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (8%):</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="summary-total">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <button className="checkout-btn" onClick={handleCheckout}>
                        Complete Sale
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSPage;