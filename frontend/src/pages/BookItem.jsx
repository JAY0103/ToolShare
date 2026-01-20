import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { itemsService, bookingsService } from '../services/api';
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
        const items = await itemsService.getItems();
        const found = items.find(
          (i) => i.item_id === parseInt(itemId, 10)
        );

        if (!found) {
          alert('Item not found or no longer available');
          navigate('/home');
          return;
        }

        setItem(found);
      } catch (err) {
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

  const isDateRangeValid = () => {
    const { requested_start, requested_end } = formData;

    if (!requested_start || !requested_end) return false;

    const start = new Date(requested_start);
    const end = new Date(requested_end);
    const now = new Date();

    if (start < now) {
      alert('Start date and time cannot be in the past.');
      return false;
    }

    if (end <= start) {
      alert('End date must be after the start date.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDateRangeValid()) return;

    try {
      await bookingsService.bookItem(formData);
      alert('Borrow request sent successfully!');
      navigate('/my-bookings');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.clear();
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        alert(err.message || 'Request failed');
      }
    }
  };

  const nowLocal = new Date().toISOString().slice(0, 16);

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

  if (!item) return null;

  return (
    <div className="app-container">
      <Sidebar />
      <div className="content">
        <h1>Request to Borrow</h1>

        <div className="item-card">
          {item.image_url && (
            <img
              src={item.image_url}
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
              min={nowLocal}
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
              min={formData.requested_start || nowLocal}
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
