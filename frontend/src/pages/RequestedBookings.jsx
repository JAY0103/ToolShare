// src/pages/RequestedBookings.jsx 
import React, { useState, useEffect } from 'react';
import { bookingsService } from '../services/api';

const RequestedBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await bookingsService.getRequestedBookings();
      setRequests(data.requests || []);
    } catch (err) {
      alert('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (requestId, status) => {
    try {
      await bookingsService.updateRequestStatus(requestId, status);
      
      // Update UI instantly
      setRequests(prev => 
        prev.map(req => 
          req.request_id === requestId 
            ? { ...req, status: status === 'Approved' ? 'Approved' : 'Rejected' }
            : req
        )
      );

      alert(status === 'Approved' ? 'Request Approved!' : 'Request Rejected!');
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div style={{ marginLeft: '280px', paddingTop: '140px', padding: '2rem' }}>
        <h3 className="text-center">Loading incoming requests...</h3>
      </div>
    );
  }

  return (
    <div style={{ marginLeft: '280px', paddingTop: '140px', padding: '2rem' }}>
      <div className="container">
        <h2 className="text-primary fw-bold mb-4">Incoming Borrow Requests</h2>

        {requests.length === 0 ? (
          <div className="alert alert-info text-center">
            No pending requests for your tools.
          </div>
        ) : (
          <div className="row g-4">
            {requests.map(req => (
              <div key={req.request_id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={req.image_url || 'https://via.placeholder.com/300x200'}
                    className="card-img-top"
                    alt={req.item_name}
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title text-primary">{req.item_name}</h5>
                    <p><strong>Student:</strong> {req.borrower_name}</p>
                    <p><strong>From:</strong> {new Date(req.requested_start).toLocaleString()}</p>
                    <p><strong>To:</strong> {new Date(req.requested_end).toLocaleString()}</p>
                    <p><strong>Reason:</strong> {req.reason}</p>

                    <div className="mt-auto d-flex gap-2">
                      {req.status === 'Pending' ? (
                        <>
                          <button 
                            onClick={() => handleStatus(req.request_id, 'Approved')}
                            className="btn btn-success btn-sm flex-fill"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleStatus(req.request_id, 'Rejected')}
                            className="btn btn-danger btn-sm flex-fill"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`badge w-100 py-3 fs-6 ${
                          req.status === 'Approved' ? 'bg-success' : 'bg-danger'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
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

export default RequestedBookings;