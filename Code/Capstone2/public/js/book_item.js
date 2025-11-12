document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('item_id');

  if (!itemId) {
    alert('No item selected.');
    window.location.href = '/home';
    return;
  }

  document.getElementById('itemIdInput').value = itemId;

  // Fetch item details
  fetch(`/api/items/${itemId}`)
    .then(res => res.json())
    .then(item => {
      document.getElementById('itemName').textContent = item.name;
      document.getElementById('itemDescription').textContent = item.description;
      document.getElementById('itemImage').src = item.image_url || '/images/default-item.png';
    })
    .catch(err => {
      console.error('Error fetching item:', err);
      alert('Could not load item.');
      window.location.href = '/home';
    });

  // Handle booking form
  const form = document.getElementById('bookItemForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
      item_id: document.getElementById('itemIdInput').value,
      requested_start: document.getElementById('requested_start').value,
      requested_end: document.getElementById('requested_end').value,
      reason: document.getElementById('reason').value,
    };

    fetch('/api/book-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      if (data.request_id) window.location.href = '/my-bookings';
    })
    .catch(err => {
      console.error('Error booking item:', err);
      alert('Failed to book item.');
    });
  });
});
