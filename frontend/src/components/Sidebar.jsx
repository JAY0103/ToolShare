// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ categories = ['All Tools'], selectedCategory, setSelectedCategory }) => {
  const location = useLocation();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isFaculty = user && user.user_type && user.user_type.toLowerCase() === 'faculty';

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Categories</h3>
      </div>
      
      <nav className="sidebar-nav">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      {isFaculty && (
        <div className="sidebar-footer">
          <Link to="/add-item" className="add-item-btn">
             Add New Item
          </Link>
          <Link to="/requested-bookings" className="requests-btn">
             Incoming Requests
          </Link>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
