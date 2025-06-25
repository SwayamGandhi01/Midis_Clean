document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    console.log('Login response:', result);

    if (res.ok) {
      alert(result.message || 'Login successful');

      // Store token and user info
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Redirect based on role
      if (result.user.role === 'admin') {
        window.location.href = 'admin/admin-dashboard.html';
      } else {
        window.location.href = 'index.html';
      }
    } else {
      alert(result.message || 'Login failed');
    }
  } catch (error) {
    alert('An error occurred: ' + error.message);
  }
});
