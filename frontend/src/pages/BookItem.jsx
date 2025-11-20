import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { itemsService, bookingsService } from '../services/api';

const BookItem = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [formData, setFormData] = useState({
    item_id: itemId,
    requested_start: '',
    requested_end: '',
    reason: ''
  });

  useEffect(() => {
    if (!itemId) {
      alert('Invalid item');
      navigate('/home');
    } else {
      fetchItem();
    }
  }, [itemId, navigate]);

  const fetchItem = async () => {
    try {
      const allItems = await itemsService.getItems();
      const found = allItems.find(i => i.item_id === parseInt(itemId));
      setItem(found);
    } catch (err) {
      alert('Item not found');
      navigate('/home');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookingsService.bookItem(formData);
      alert('Borrow request sent successfully!');
      navigate('/my-bookings');
    } catch (err) {
      alert(err.message || 'Failed to send request');
    }
  };

  if (!item) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-primary">Request to Borrow</h2>
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow">
            <img
              src={item.image_url || '/images/default-item.png'}
              className="card-img-top"
              alt={item.name}
              style={{ height: '300px', objectFit: 'cover' }}
            />
            <div className="card-body">
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <p><strong>Owner:</strong> {item.owner_name}</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Start Date & Time *</label>
              <input type="datetime-local" name="requested_start" className="form-control" onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">End Date & Time *</label>
              <input type="datetime-local" name="requested_end" className="form-control" onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Reason for Borrowing *</label>
              <textarea name="reason" className="form-control" rows="4" onChange={handleChange} required></textarea>
            </div>
            <button type="submit" className="btn btn-success me-2">Send Request</button>
            <button type="button" onClick={() => navigate('/home')} className="btn btn-secondary">
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookItem;