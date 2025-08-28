import React from 'react';
import { FaTrashAlt, FaMinus, FaPlus } from 'react-icons/fa';

const Cart = ({ cart, updateQuantity, removeFromCart, clearCart }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className="cart-container">
      <h2 className="cart-title">Order Summary</h2>
      <div className="cart-items">
        {cart.length === 0 ? (
          <p className="empty-cart-message">Cart is empty</p>
        ) : (
          cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-details">
                <p className="item-name">{item.name}</p>
                <p className="item-price">${item.price.toFixed(2)}</p>
              </div>
              <div className="item-controls">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="control-btn"><FaMinus /></button>
                <span className="item-quantity">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="control-btn"><FaPlus /></button>
              </div>
              <div className="item-subtotal">
                <p>${(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeFromCart(item.id)} className="remove-btn"><FaTrashAlt /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax ({taxRate * 100}%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="summary-row total-row">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button className="checkout-btn" onClick={() => alert('Checkout functionality coming soon!')}>Checkout</button>
        <button className="clear-cart-btn" onClick={clearCart}>Clear Cart</button>
      </div>
    </div>
  );
};

export default Cart;