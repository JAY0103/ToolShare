// src/pages/Home.jsx - FINAL 100% WORKING (NO MORE WHITE SCREEN!)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsService } from '../services/api';
import Sidebar from '../components/Sidebar';

const Home = ({ searchTerm = '' }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Tools');
  const navigate = useNavigate();

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await itemsService.getItems();
        const data = response.items || [];  // ← THIS WAS MISSING!
        setItems(data);
        setFilteredItems(data);
      } catch (err) {
        console.error('Failed to load items');
        setItems([]);
        setFilteredItems([]);
      }
    };
    loadItems();
  }, []);

  useEffect(() => {
    if (!Array.isArray(items)) return;

    let result = [...items];  // ← Always work with array

    if (selectedCategory !== 'All Tools') {
      result = result.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    setFilteredItems(result);
  }, [selectedCategory, searchTerm, items]);

  return (
    <div className="d-flex min-vh-100">
      <Sidebar 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div 
        className="flex-grow-1 bg-light"
        style={{ marginLeft: '260px', paddingTop: '140px', padding: '2rem' }}
      >
        <div className="container-fluid">
          <h2 className="text-primary fw-bold mb-4">
            {selectedCategory} ({filteredItems.length})
          </h2>

          {filteredItems.length === 0 ? (
            <div className="text-center py-5">
              <div className="alert alert-info d-inline-block">
                No tools found in this category.
              </div>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {filteredItems.map(item => (
                <div key={item.item_id} className="col">
                  <div className="card h-100 shadow-sm border-0">
                    <img
                      src={item.image_url || 'https://via.placeholder.com/300x200/007847/white?text=No+Image'}
                      className="card-img-top"
                      alt={item.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-primary">{item.name}</h5>
                      <p className="card-text text-muted flex-grow-1">
                        {item.description?.substring(0, 100) || 'No description'}
                      </p>
                      <small className="text-muted">Owner: {item.owner_name}</small>
                      <Link
                        to={`/book-item?item_id=${item.item_id}`}
                        className="btn btn-success mt-3"
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
    </div>
  );
};

export default Home;