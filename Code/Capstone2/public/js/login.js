document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (res.ok) {
    alert('Login successful!');
    window.location.href = '/home';
  } else {
    alert(result.message);
  }
});
