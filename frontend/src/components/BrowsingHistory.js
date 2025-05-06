import React from 'react';

const BrowsingHistory = ({ history, products, onClearHistory }) => {
  // TODO: Implement a browsing history display
  // This component should:
  // - Show products the user has clicked on
  // - Allow clearing the browsing history
  const historyProducts = products.filter((p) => history.includes(p.id));
  return (
    <div className="history-container">
      <h3>Your Browsing History</h3>
      {historyProducts.length === 0 ? (
        <p>No products viewed yet.</p>
      ) : (
        <ul>
          {historyProducts.map((product) => (
            <li key={product.id}>
              {product.name} – ${product.price} ({product.category})
            </li>
          ))}
        </ul>
      )}
      <button onClick={onClearHistory}>Clear History</button>
    </div>
  );
};

export default BrowsingHistory;