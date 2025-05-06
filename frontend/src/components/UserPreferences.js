import React from 'react';

const getUniqueValues = (products, key) =>
  [...new Set(products.map((p) => p[key]))].sort();

const UserPreferences = ({ preferences, products, onPreferencesChange }) => {
  const categories = getUniqueValues(products, 'category');
  const brands = getUniqueValues(products, 'brand');
  const priceRanges = ['0-50', '50-100', '100-200', '200+'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      const current = preferences[name] || [];
      const updated = checked
        ? [...current, value]
        : current.filter((v) => v !== value);
      onPreferencesChange({ ...preferences, [name]: updated });
    } else {
      onPreferencesChange({ ...preferences, [name]: value });
    }
  };

  return (
    <div className="preferences-container">
      <h3>Your Preferences</h3>

      {/* Categories */}
      <div className="preference-group">
        <label><strong>Categories:</strong></label>
        {categories.map((category) => (
          <div key={category}>
            <label>
              <input
                type="checkbox"
                name="categories"
                value={category}
                checked={preferences.categories?.includes(category)}
                onChange={handleChange}
              />
              {category}
            </label>
          </div>
        ))}
      </div>

      {/* Brands */}
      <div className="preference-group">
        <label><strong>Brands:</strong></label>
        {brands.map((brand) => (
          <div key={brand}>
            <label>
              <input
                type="checkbox"
                name="brands"
                value={brand}
                checked={preferences.brands?.includes(brand)}
                onChange={handleChange}
              />
              {brand}
            </label>
          </div>
        ))}
      </div>

      {/* Price Range */}
      <div className="preference-group">
        <label><strong>Price Range:</strong></label>
        <select
          name="priceRange"
          value={preferences.priceRange || ''}
          onChange={handleChange}
        >
          <option value="all">Any</option>
          {priceRanges.map((range) => (
            <option key={range} value={range}>${range}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default UserPreferences;
