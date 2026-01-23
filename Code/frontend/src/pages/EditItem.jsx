import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { itemsService } from '../services/api';

const EditItem = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
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

      if (!found) {
        throw new Error('Item not found');
      }

      setFormData({
        name: found.name || '',
        description: found.description || '',
        image_url: found.image_url || ''
      });

      setLoading(false);
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
      await itemsService.editItem(itemId, formData);
      alert('Item updated successfully!');
      navigate('/home');
    } catch (err) {
      alert(err.message || 'Failed to update item');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-primary">Edit Item</h2>

      <div className="row">
        <div className="col-md-6">
          <div className="card shadow">
            <img
              src={formData.image_url || '/images/default-item.png'}
              className="card-img-top"
              alt={formData.name}
              style={{ height: '300px', objectFit: 'cover' }}
            />
          </div>
        </div>

        <div className="col-md-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
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
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Image URL</label>
              <input
                type="text"
                name="image_url"
                className="form-control"
                value={formData.image_url}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn btn-success me-2">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditItem;
