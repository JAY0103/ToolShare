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
    reason: ''
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
        const foundItem = items.find(i => i.item_id === parseInt(itemId));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/borrow-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

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
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <h3>Loading item...</h3>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="d-flex min-vh-100">
      <Sidebar selectedCategory="All Tools" onCategoryChange={() => {}} />

      <div style={{ marginLeft: '280px', paddingTop: '140px', padding: '2rem', width: '100%' }}>
        <div className="container">
          <h2 className="text-primary fw-bold mb-5">Request to Borrow</h2>

          <div className="row g-5">
            {/* LEFT: Item Details */}
            <div className="col-lg-5">
              <div className="card shadow border-0">
                <img
                  src={item.image_url || 'https://via.placeholder.com/600x400/007847/white?text=No+Image'}
                  className="card-img-top"
                  alt={item.name}
                  style={{ height: '380px', objectFit: 'cover', borderRadius: '15px 15px 0 0' }}
                />
                <div className="card-body p-4">
                  <h3 className="text-primary fw-bold">{item.name}</h3>
                  <p className="text-muted fs-5">{item.description || 'No description'}</p>
                  <p className="text-success fw-bold">Owner: {item.owner_name || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="col-lg-7">
              <div className="card shadow border-0 h-100">
                <div className="card-body p-5">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-bold fs-5">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-lg"
                        required
                        onChange={(e) => setFormData({ ...formData, requested_start: e.target.value })}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold fs-5">End Date & Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-lg"
                        required
                        onChange={(e) => setFormData({ ...formData, requested_end: e.target.value })}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold fs-5">Reason for Borrowing *</label>
                      <textarea
                        className="form-control"
                        rows="5"
                        placeholder="e.g., For project presentation, lab work..."
                        required
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="d-grid gap-3">
                      <button type="submit" className="btn btn-success btn-lg fw-bold">
                        Send Request
                      </button>
                      <button type="button" onClick={() => navigate('/home')} className="btn btn-outline-secondary btn-lg">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookItem;