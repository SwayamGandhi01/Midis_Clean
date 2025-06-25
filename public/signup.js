document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/users', {  // ✅ Corrected endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message);
      window.location.href = 'login.html'; // ✅ Redirect
    } else {
      alert(result.message || 'Signup failed');
    }
  } catch (error) {
    alert('An error occurred: ' + error.message);
  }
});
