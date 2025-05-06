import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Catalog from './components/Catalog';
import UserPreferences from './components/UserPreferences';
import Recommendations from './components/Recommendations';
import BrowsingHistory from './components/BrowsingHistory';
import { fetchProducts, getRecommendations } from './services/api';

function App() {
  // State for products catalog
  const [products, setProducts] = useState([]);
  
  // State for user preferences
  const [userPreferences, setUserPreferences] = useState({
    priceRange: 'all',
    categories: [],
    brands: []
  });
  
  const [filters, setFilters] = useState({
    category: 'all',
    brand: 'all',
    sortBy: 'default',
  });
  // State for browsing history
  const [browsingHistory, setBrowsingHistory] = useState([]);
  
  // State for recommendations
  const [recommendations, setRecommendations] = useState([]);
  
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    loadProducts();
  }, []);
  
  // Handle product click to add to browsing history
  const handleProductClick = (productId) => {
    // Avoid duplicates in browsing history
    if (!browsingHistory.includes(productId)) {
      setBrowsingHistory([...browsingHistory, productId]);
    }
  };
  
  // Update user preferences
  const handlePreferencesChange = (newPreferences) => {
    setUserPreferences(prevPreferences => ({
      ...prevPreferences,
      ...newPreferences
    }));
  };
  
  // Get recommendations based on preferences and browsing history
  const handleGetRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await getRecommendations(userPreferences, browsingHistory);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear browsing history
  const handleClearHistory = () => {
    setBrowsingHistory([]);
  };

  const getFilteredProducts = () => {
    let filtered = [...products];
  
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }
  
    if (filters.brand !== 'all') {
      filtered = filtered.filter(p => p.brand === filters.brand);
    }
  
    if (filters.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }
  
    return filtered;
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>AI-Powered Product Recommendation Engine</h1>
      </header>
      
      <main className="app-content">
        <div className="user-section">
          <UserPreferences 
            preferences={userPreferences}
            products={products}
            onPreferencesChange={handlePreferencesChange}
          />
          
          <BrowsingHistory 
            history={browsingHistory}
            products={products}
            onClearHistory={handleClearHistory}
          />
          
          <button 
            className="get-recommendations-btn"
            onClick={handleGetRecommendations}
            disabled={isLoading}
          >
            {isLoading ? 'Getting Recommendations...' : 'Get Personalized Recommendations'}
          </button>
        </div>
        
        <div className="catalog-section">
        <h2>Product Catalog</h2>

{/* 🔽 Inline Filtering UI */}
<div style={{ marginBottom: '1rem' }}>
  <label>
    Category:&nbsp;
    <select
      value={filters.category}
      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
    >
      <option value="all">All</option>
      {[...new Set(products.map(p => p.category))].map((cat) => (
        <option key={cat} value={cat}>{cat}</option>
      ))}
    </select>
  </label>

  <label style={{ marginLeft: '1rem' }}>
    Brand:&nbsp;
    <select
      value={filters.brand}
      onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
    >
      <option value="all">All</option>
      {[...new Set(products.map(p => p.brand))].map((brand) => (
        <option key={brand} value={brand}>{brand}</option>
      ))}
    </select>
  </label>

  <label style={{ marginLeft: '1rem' }}>
    Sort By:&nbsp;
    <select
      value={filters.sortBy}
      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
    >
      <option value="default">Default</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="rating">Rating</option>
    </select>
  </label>
</div>

<Catalog 
  products={getFilteredProducts()}
  onProductClick={handleProductClick}
  browsingHistory={browsingHistory}
/>
        </div>
        
        <div className="recommendations-section">
          <h2>Your Recommendations</h2>
          <Recommendations 
            recommendations={recommendations}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}

export default App;