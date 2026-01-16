// src/pages/BookItem.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { itemsService } from '../services/api';
import Sidebar from '../components/Sidebar';

const BookItem = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    item_id: itemId,
    requested_start: '',
    requested_end: '',
    reason: '',
  });

  useEffect(() => {
    if (!itemId) {
      alert('No item selected');
      navigate('/home');
      return;
    }

    const fetchItem = async () => {
      try {
        const response = await itemsService.getItems();
        const items = response.items || response || [];
        const foundItem = items.find(
          (i) => i.item_id === parseInt(itemId)
        );
        if (foundItem) {
          setItem(foundItem);
        } else {
          alert('Item not found or no longer available');
          navigate('/home');
        }
      } catch (err) {
        console.error('Failed to load item:', err);
        alert('Failed to load item details');
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        'http://localhost:3000/api/borrow-requests',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          alert('Session expired. Please login again.');
          navigate('/login');
        } else {
          alert(data.error || 'Request failed');
        }
        return;
      }

      alert('Borrow request sent successfully!');
      navigate('/my-bookings');
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <p>Loading item...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content">
        <h1>Request to Borrow</h1>

        <div className="item-card">
          {item.image_url && (
            <img
              src={`http://localhost:3000${item.image_url}`}
              alt={item.name}
              className="item-details-image"
            />
          )}

          <h2>{item.name}</h2>
          <p>{item.description || 'No description'}</p>
          <p>Owner: {item.owner_name || 'Unknown'}</p>
        </div>

        <form onSubmit={handleSubmit} className="request-form">
          <label>
            Requested Start:
            <input
              type="datetime-local"
              name="requested_start"
              value={formData.requested_start}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Requested End:
            <input
              type="datetime-local"
              name="requested_end"
              value={formData.requested_end}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Reason:
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="primary-button">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookItem;
