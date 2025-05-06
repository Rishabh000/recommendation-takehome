import React from 'react';

const Catalog = ({ products, onProductClick, browsingHistory }) => {
  // TODO: Implement a product catalog display
  // This component should display a grid of products from the catalog
  // Each product should be clickable to add to browsing history
  
  return (
    <div className="catalog-container">
      <h3>Product Catalog</h3>
      <div className="product-grid">
        {products.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => onProductClick(product.id)}
          >
            <h4>{product.name}</h4>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Brand:</strong> {product.brand}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalog;