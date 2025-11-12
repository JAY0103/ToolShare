document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addItemForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form values
    const name = form.name.value.trim();
    const description = form.description.value.trim();
    const serial_number = form.serial_number.value.trim();
    const image_url = form.image_url.value.trim();

    // Send to server
    try {
      const res = await fetch('/api/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          serial_number,
          image_url
        })
      });

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        window.location.href = '/home';
      }

    } catch (err) {
      console.error('Error:', err);
      alert('Error adding item.');
    }
  });
});
