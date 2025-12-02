// src/pages/MyBookings.jsx
import React, { useState, useEffect } from 'react';
import { bookingsService } from '../services/api';

const MyBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await bookingsService.getMyBookings();
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch (err) {
        console.error('Failed to load requests:', err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div style={{ marginLeft: '280px', paddingTop: '140px', padding: '2rem' }}>
        <h3 className="text-center">Loading your requests...</h3>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: '280px', paddingTop: '140px', padding: '2rem' }}>
      <div className="container">
        <h2 className="text-primary fw-bold mb-4">My Borrow Requests</h2>

        {requests.length === 0 ? (
          <div className="alert alert-info text-center">
            You have no borrow requests yet.
          </div>
        ) : (
          <div className="row g-4">
            {requests.map(request => (
              <div key={request.request_id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={request.image_url || 'https://via.placeholder.com/300x200'}
                    className="card-img-top"
                    alt={request.item_name}
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    <h5 className="card-title text-primary">{request.item_name}</h5>
                    <p><strong>From:</strong> {new Date(request.requested_start).toLocaleString()}</p>
                    <p><strong>To:</strong> {new Date(request.requested_end).toLocaleString()}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${
                        request.status === 'Approved' ? 'bg-success' :
                        request.status === 'Rejected' ? 'bg-danger' : 'bg-warning'
                      }`}>
                        {request.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;