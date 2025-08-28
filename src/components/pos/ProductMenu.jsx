import React from 'react';
import { FaPlus } from 'react-icons/fa';

// Dummy data for our products
const products = [
  { id: 1, name: 'Sourdough Loaf', price: 5.50, image: 'sourdough.jpg' },
  { id: 2, name: 'Ciabatta', price: 3.25, image: 'ciabatta.jpg' },
  { id: 3, name: 'Multigrain Roll', price: 2.75, image: 'multigrain.jpg' },
  { id: 4, name: 'Rye Bread', price: 4.00, image: 'rye.jpg' },
  { id: 5, name: 'Croissant', price: 2.00, image: 'croissant.jpg' },
  { id: 6, name: 'Baguette', price: 3.50, image: 'baguette.jpg' },
];

const ProductMenu = ({ addToCart }) => {
  return (
    <div className="product-menu">
      <div className="menu-header">
        <h2 className="menu-title">Bread Selection</h2>
        <input type="text" placeholder="Search products..." className="search-input" />
      </div>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
            <div className="product-image-container">
              {/* We can use a placeholder image for now */}
              <div className="product-image-placeholder"></div>
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-price">${product.price.toFixed(2)}</p>
            </div>
            <button className="add-to-cart-btn"><FaPlus /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductMenu;