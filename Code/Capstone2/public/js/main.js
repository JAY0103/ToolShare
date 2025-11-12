document.addEventListener('DOMContentLoaded', () => {
  // --- Check current user ---
  fetch('/api/getUser')
    .then(res => {
      if (!res.ok) throw new Error('Not logged in');
      return res.json();
    })
    .then(data => {
      const user = data.user; // get the actual user object
      if (!user || user.user_type !== 'Faculty') {
        // hide all elements with class "faculty-only" for non-faculty users
        document.querySelectorAll('.faculty-only').forEach(el => el.style.display = 'none');
      }
    })
    .catch(err => {
      console.error('Error fetching user:', err);
      // hide faculty-only elements if session fetch fails
      document.querySelectorAll('.faculty-only').forEach(el => el.style.display = 'none');
    });

  // --- Example: Add Item Form ---
  const addItemForm = document.getElementById('addItemForm');
  if (addItemForm) {
    addItemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(addItemForm);
      fetch('/api/add-item', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          alert(data.message);
          if (data.message === 'Item added successfully') window.location.href = '/home';
        })
        .catch(err => console.error('Error adding item:', err));
    });
  }

  // --- Logout button ---
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch('/api/logout', { method: 'POST' })
        .then(res => res.json())
        .then(() => window.location.href = '/')
        .catch(err => console.error('Error logging out:', err));
    });
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const itemsList = document.getElementById('itemsList');

  if (itemsList) {
    fetch('/api/items')
      .then(res => res.json())
      .then(items => {
        itemsList.innerHTML = '';

        items.forEach(item => {
          const col = document.createElement('div');
          col.className = 'col';

          const card = document.createElement('div');
          card.className = 'card item-card h-100';

          const img = document.createElement('img');
          img.className = 'card-img-top';
          img.src = item.image_url || '/images/default-item.png';
          img.alt = item.name;

          const body = document.createElement('div');
          body.className = 'card-body';

          const title = document.createElement('h5');
          title.className = 'card-title';
          title.textContent = item.name;

          const desc = document.createElement('p');
          desc.className = 'card-text';
          desc.textContent = item.description;

          const requestBtn = document.createElement('a');
          requestBtn.className = 'btn btn-primary';
          requestBtn.textContent = 'Request';
          requestBtn.href = `/book_item?item_id=${item.item_id}`;

          body.appendChild(title);
          body.appendChild(desc);
          body.appendChild(requestBtn);

          card.appendChild(img);
          card.appendChild(body);
          col.appendChild(card);

          itemsList.appendChild(col);
        });
      })
      .catch(err => console.error('Error fetching items:', err));
  }
});
