// src/components/Sidebar.jsx 
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const categories = [
  'All Tools',
  'Camera-Digital SLR',
  'Audio-Digital Recorders',
  'Electronics',
  'Video Monitors',
  'Laptops',
  'Lenses',
  'Others'
];

const Sidebar = ({ selectedCategory, onCategoryChange }) => {
  const location = useLocation();

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // CASE-INSENSITIVE CHECK FOR FACULTY
  const isFaculty = user && 
    user.user_type && 
    user.user_type.toLowerCase() === 'faculty';

  return (
    <div 
      className="bg-white border-end shadow-sm"
      style={{
        position: 'fixed',
        top: '130px',           
        left: 0,
        width: '280px',
        height: 'calc(100vh - 130px)',  
        padding: '2rem 1rem',
        overflowY: 'auto',
        zIndex: 1000
      }}
    >
      <h5 className="text-primary fw-bold mb-4">Categories</h5>
      <div className="d-flex flex-column gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`btn text-start fw-medium py-2 px-3 rounded-pill ${
              selectedCategory === cat 
                ? 'btn-primary text-white' 
                : 'btn-outline-primary'
            }`}
            style={{ borderRadius: '30px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Faculty Only Links */}
      {isFaculty && (
        <div className="mt-5 pt-4 border-top">
          <Link 
            to="/add-item" 
            className="btn btn-success w-100 mb-3 fw-bold shadow-sm"
          >
            + Add New Tool
          </Link>
          <Link 
            to="/requested-bookings" 
            className="btn btn-warning w-100 text-dark fw-bold shadow-sm"
          >
            Incoming Requests
          </Link>
        </div>
      )}
    </div>
  );
};

export default Sidebar;