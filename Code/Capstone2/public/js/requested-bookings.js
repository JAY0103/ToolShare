document.addEventListener('DOMContentLoaded', () => {

  // Hide faculty-only links if not faculty
  fetch('/api/getUser')
    .then(res => res.json())
    .then(data => {
      const user = data.user;
      if (!user || user.user_type !== 'Faculty') {
        document.querySelectorAll('.faculty-only').forEach(el => el.style.display = 'none');
        return;
      }

      // Fetch borrow requests for items owned by this faculty
      fetch(`/api/requested-bookings?faculty_id=${user.id}`)
        .then(res => res.json())
        .then(requests => {
          const container = document.getElementById('requestsList');
          container.innerHTML = '';

          if (requests.length === 0) {
            container.innerHTML = `<p>No borrow requests for your items.</p>`;
            return;
          }

          requests.forEach(r => {
            const col = document.createElement('div');
            col.className = 'col';

            const card = document.createElement('div');
            card.className = 'card h-100';

            const img = document.createElement('img');
            img.className = 'card-img-top img-fluid';
            img.src = r.image_url || '/images/default-item.png';
            img.alt = r.name;
            img.style.maxHeight = '200px';
            img.style.objectFit = 'cover';

            const body = document.createElement('div');
            body.className = 'card-body';

            const title = document.createElement('h5');
            title.className = 'card-title';
            title.textContent = r.name;

            const borrower = document.createElement('p');
            borrower.className = 'card-text';
            borrower.textContent = `Borrower: ${r.borrower_name}`;

            const datetime = document.createElement('p');
            datetime.className = 'card-text';
            datetime.textContent = `From: ${new Date(r.requested_start).toLocaleString()}  To: ${new Date(r.requested_end).toLocaleString()}`;

            const reason = document.createElement('p');
            reason.className = 'card-text';
            reason.textContent = `Reason: ${r.reason}`;

            const status = document.createElement('p');
            status.className = 'card-text fw-bold';
            status.textContent = `Status: ${r.status}`;
            status.id = `status-${r.request_id}`;

            // Approve & Reject Buttons
            const btnGroup = document.createElement('div');
            btnGroup.className = 'mt-2';

            const approveBtn = document.createElement('button');
            approveBtn.className = 'btn btn-success me-2';
            approveBtn.textContent = 'Approve';
            approveBtn.disabled = r.status !== 'Pending'; // only allow pending
            approveBtn.addEventListener('click', () => updateRequestStatus(r.request_id, 'Approved'));

            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'btn btn-danger';
            rejectBtn.textContent = 'Reject';
            rejectBtn.disabled = r.status !== 'Pending';
            rejectBtn.addEventListener('click', () => updateRequestStatus(r.request_id, 'Rejected'));

            btnGroup.appendChild(approveBtn);
            btnGroup.appendChild(rejectBtn);

            body.appendChild(title);
            body.appendChild(borrower);
            body.appendChild(datetime);
            body.appendChild(reason);
            body.appendChild(status);
            body.appendChild(btnGroup);

            card.appendChild(img);
            card.appendChild(body);
            col.appendChild(card);

            container.appendChild(col);
          });
        })
        .catch(err => console.error('Error fetching requested bookings:', err));

    })
    .catch(err => console.error('Error fetching user:', err));

});

// --- Function to update status ---
function updateRequestStatus(requestId, newStatus) {
  fetch('/api/borrowrequests/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId, status: newStatus })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const statusEl = document.getElementById(`status-${requestId}`);
      statusEl.textContent = `Status: ${newStatus}`;
    } else {
      alert('Failed to update status: ' + data.message);
    }
  })
  .catch(err => console.error('Error updating request status:', err));
}
