import React from 'react';

const Recommendations = ({ recommendations, isLoading }) => {
  // TODO: Implement a display for recommended products
  // This component should:
  // - Display recommended products with explanations
  // - Show a loading state when recommendations are being generated
  // - Handle cases where no recommendations are available
  
  return (
    <div className="recommendations-container">
      <h3>Recommended for You</h3>
      {isLoading ? (
        <p>Loading recommendations...</p>
      ) : recommendations.length > 0 ? (
        <ul>
          {recommendations.map((rec, index) => (
            <li key={index}>
              <strong>{rec.product.name}</strong> (${rec.product.price})  
              <div>
                <em>{rec.explanation}</em>
              </div>
              <small>Confidence: {rec.confidence_score}/10</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recommendations yet. Set your preferences and browse some products!</p>
      )}
    </div>
  );
};

export default Recommendations;
