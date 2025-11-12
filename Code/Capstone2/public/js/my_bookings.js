document.addEventListener('DOMContentLoaded', () => {

  // Hide faculty-only links if not faculty
  fetch('/api/getUser')
    .then(res => res.json())
    .then(data => {
      const user = data.user;
      if (!user || user.user_type !== 'Faculty') {
        document.querySelectorAll('.faculty-only').forEach(el => el.style.display = 'none');
      }

      if (!user) return;

      // Fetch this user's bookings
      fetch(`/api/my-bookings?user_id=${user.id}`)
        .then(res => res.json())
        .then(bookings => {
          const container = document.getElementById('bookingsList');
          container.innerHTML = '';

          if (bookings.length === 0) {
            container.innerHTML = `<p>You have no borrow requests.</p>`;
            return;
          }

          bookings.forEach(b => {
            const col = document.createElement('div');
            col.className = 'col';

            const card = document.createElement('div');
            card.className = 'card h-100';

            const img = document.createElement('img');
            img.className = 'card-img-top img-fluid';
            img.src = b.image_url || '/images/default-item.png';
            img.alt = b.name;
            img.style.maxHeight = '200px';
            img.style.objectFit = 'cover';

            const body = document.createElement('div');
            body.className = 'card-body';

            const title = document.createElement('h5');
            title.className = 'card-title';
            title.textContent = b.name;

            const desc = document.createElement('p');
            desc.className = 'card-text';
            desc.textContent = b.description;

            const datetime = document.createElement('p');
            datetime.className = 'card-text';
            datetime.textContent = `From: ${new Date(b.requested_start).toLocaleString()}  To: ${new Date(b.requested_end).toLocaleString()}`;

            const status = document.createElement('p');
            status.className = 'card-text fw-bold';
            status.textContent = `Status: ${b.status}`;

            body.appendChild(title);
            body.appendChild(desc);
            body.appendChild(datetime);
            body.appendChild(status);

            card.appendChild(img);
            card.appendChild(body);
            col.appendChild(card);

            container.appendChild(col);
          });
        })
        .catch(err => console.error('Error fetching bookings:', err));
    })
    .catch(err => console.error('Error fetching user:', err));
});
