import React, { useState, useEffect } from 'react';
import { bookingsService } from '../services/api';

const RequestedBookings = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsService.getRequestedBookings()
      .then(data => setRequests(data || []))
      .catch(() => alert('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id, status) => {
    try {
      await bookingsService.updateRequestStatus(id, status === 'Approved' ? 'Approved' : 'Rejected');
      setRequests(prev => prev.map(r => r.request_id === id ? { ...r, status } : r));
      alert(`Request ${status.toLowerCase()}!`);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-4">Loading incoming requests...</div>;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-primary">Incoming Borrow Requests</h2>

      {requests.length === 0 ? (
        <div className="alert alert-info">No pending requests for your items.</div>
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
                  <p><strong>Borrower:</strong> {req.borrower_name || `${req.first_name} ${req.last_name}`}</p>
                  <p><strong>From:</strong> {new Date(req.requested_start).toLocaleString()}</p>
                  <p><strong>To:</strong> {new Date(req.requested_end).toLocaleString()}</p>
                  <p><strong>Reason:</strong> {req.reason}</p>
                  <p><strong>Status:</strong> <span className="badge bg-warning">{req.status}</span></p>

                  {req.status === 'Pending' && (
                    <div className="d-flex gap-2">
                      <button onClick={() => handleStatus(req.request_id, 'Approved')} className="btn btn-success btn-sm">
                        Approve
                      </button>
                      <button onClick={() => handleStatus(req.request_id, 'Rejected')} className="btn btn-danger btn-sm">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestedBookings;