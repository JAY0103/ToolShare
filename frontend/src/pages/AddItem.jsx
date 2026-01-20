import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsService } from '../services/api';

const AddItem = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    image_url: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await itemsService.addItem(formData);
      alert('Item added successfully!');
      navigate('/home');
    } catch (err) {
      alert(err.message || 'Failed to add item');
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4 text-primary">Add New Item</h2>

      <div className="card shadow p-4" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Item Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows="4"
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label">Serial Number (Optional)</label>
            <input
              type="text"
              name="serial_number"
              className="form-control"
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Image URL (Optional)</label>
            <input
              type="url"
              name="image_url"
              className="form-control"
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <button type="submit" className="btn btn-success">
            Add Item
          </button>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="btn btn-secondary ms-3"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItem;
