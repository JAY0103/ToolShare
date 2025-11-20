// src/pages/Home.jsx - 
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsService } from '../services/api';
import Sidebar from '../components/Sidebar';

const Home = ({ searchTerm = '' }) => {  
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Tools');
  const navigate = useNavigate();

  // Fetch items on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await itemsService.getItems();
        setItems(data || []);
        setFilteredItems(data || []);
      } catch (err) {
        console.error('Failed to load items');
      }
    };
    loadItems();
  }, []);

  // Filter items when category or search term changes
  useEffect(() => {
    let result = items;

    if (selectedCategory !== 'All Tools') {
      result = result.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    }

    setFilteredItems(result);
  }, [selectedCategory, searchTerm, items]);

  return (
    <div className="d-flex">
      {/* Sidebar with Categories */}
      <Sidebar 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Content */}
      <div className="flex-grow-1" style={{ marginLeft: '260px', padding: '2rem' }}>
        <h2 className="mb-4 text-primary fw-bold fs-3">
          {selectedCategory} ({filteredItems.length})
        </h2>

        {filteredItems.length === 0 ? (
          <div className="text-center py-5">
            <div className="alert alert-light border" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <h5>No tools found</h5>
              <p className="text-muted mb-0">
                {searchTerm || selectedCategory !== 'All Tools' 
                  ? 'Try adjusting your search or category.' 
                  : 'No tools available yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {filteredItems.map(item => (
              <div key={item.item_id} className="col">
                <div className="card h-100 shadow-sm border-0 hover-lift">
                  <img
                    src={item.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}
                    className="card-img-top"
                    alt={item.name}
                    style={{ height: '220px', objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title text-primary fw-bold">{item.name}</h5>
                    <p className="card-text text-muted flex-grow-1">
                      {item.description ? item.description.substring(0, 120) + '...' : 'No description available'}
                    </p>
                    <small className="text-muted mb-2">Owner: {item.owner_name || 'Unknown'}</small>
                    <Link
                      to={`/book-item?item_id=${item.item_id}`}
                      className="btn btn-success mt-auto fw-bold"
                    >
                      Request to Borrow
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;