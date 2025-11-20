import React, { useState, useEffect } from 'react';
import { bookingsService } from '../services/api';

const MyBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsService.getMyBookings()
      .then(data => setRequests(data || []))
      .catch(() => alert('Failed to load your requests'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading your requests...</div>;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-primary">My Borrow Requests</h2>

      {requests.length === 0 ? (
        <div className="alert alert-info">You have no borrow requests yet.</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {requests.map((req) => (
            <div key={req.request_id} className="col">
              <div className="card h-100 shadow-sm">
                <img
                  src={req.image_url || '/images/default-item.png'}
                  className="card-img-top"
                  alt={req.item_name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5>{req.item_name}</h5>
                  <p><strong>From:</strong> {new Date(req.requested_start).toLocaleString()}</p>
                  <p><strong>To:</strong> {new Date(req.requested_end).toLocaleString()}</p>
                  <p><strong>Status:</strong> 
                    <span className={`badge ms-2 ${
                      req.status === 'Approved' ? 'bg-success' : 
                      req.status === 'Rejected' ? 'bg-danger' : 'bg-warning'
                    }`}>
                      {req.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;