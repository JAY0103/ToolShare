// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsService } from '../services/api';
import Sidebar from '../components/Sidebar';

const Home = ({ searchTerm = '' }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(['All Tools']);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Tools');
  const navigate = useNavigate();

  // Get current user for delete permission
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await itemsService.getItems();
        const data = response.items || [];
        const catList = response.categories || [];
        setItems(data);
        setCategories(['All Tools', ...catList]);
        setFilteredItems(data);
      } catch (err) {
        console.error('Failed to load items');
        setItems([]);
        setCategories(['All Tools']);
        setFilteredItems([]);
      }
    };
    loadItems();
  }, []);

  useEffect(() => {
    if (!Array.isArray(items)) return;

    let result = [...items];

    // Filter by actual category_name from database
    if (selectedCategory !== 'All Tools') {
      result = result.filter(
        (item) => item.category_name === selectedCategory
      );
    }

    // Search by name or description
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
      );
    }

    setFilteredItems(result);
  }, [selectedCategory, searchTerm, items]);

  const handleRequest = (item_id) => {
    navigate(`/book-item?item_id=${item_id}`);
  };

  const handleDelete = async (item_id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await itemsService.deleteItem(item_id);
      setFilteredItems(prev => prev.filter(i => i.item_id !== item_id));
      setItems(prev => prev.filter(i => i.item_id !== item_id));
      alert('Item deleted successfully');
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <div className="content">
        <h1>Available Tools</h1>

        {filteredItems.length === 0 ? (
          <p>No items found matching your filter.</p>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item) => (
              <div key={item.item_id} className="item-card">
                {item.image_url && (
                  <img
                    src={`http://localhost:3000${item.image_url}`}
                    alt={item.name}
                    className="item-image"
                  />
                )}

                <h3>{item.name}</h3>
                <p>
                  {item.description?.substring(0, 100) ||
                    'No description'}
                </p>
                <p>Owner: {item.owner_name}</p>
                {item.category_name && <p>Category: {item.category_name}</p>}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="primary-button"
                    onClick={() => handleRequest(item.item_id)}
                  >
                    Request to Borrow
                  </button>
                  
                  {user?.user_type === 'Faculty' && (
                    <button
                      className="primary-button"
                      style={{ backgroundColor: '#dc3545', color: 'white' }}
                      onClick={() => handleDelete(item.item_id)}
                    >
                      Delete
                    </button>
                  )}
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
