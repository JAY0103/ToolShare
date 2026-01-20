import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemsService } from '../services/api';
import Sidebar from '../components/Sidebar';

const user = JSON.parse(localStorage.getItem('user'));

const Home = ({ searchTerm = '' }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Tools');

  const navigate = useNavigate();

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

  useEffect(() => {
    let result = items;

    if (selectedCategory !== 'All Tools') {
      result = result.filter(
        item => item.category === selectedCategory
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(term) ||
          (item.description &&
            item.description.toLowerCase().includes(term))
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

      setItems(prev =>
        prev.filter(item => item.item_id !== item_id)
      );
      setFilteredItems(prev =>
        prev.filter(item => item.item_id !== item_id)
      );

      alert('Item deleted successfully');
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <div className="content">
        <h1>Available Tools</h1>

        {filteredItems.length === 0 ? (
          <p>No items found matching your filter.</p>
        ) : (
          <div className="items-grid">
            {filteredItems.map(item => (
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

                {item.category_name && (
                  <p>Category: {item.category_name}</p>
                )}

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
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white'
                      }}
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
Home;