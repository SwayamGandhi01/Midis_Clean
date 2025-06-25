async function fetchBookCalls() {
  try {
    const token = localStorage.getItem('token'); // Ensure token is stored during admin login
    if (!token) throw new Error('Admin not authenticated.');

    const res = await fetch('/api/bookcalls', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Unauthorized: Please log in as admin.');
      }
      throw new Error('Failed to fetch book calls.');
    }

    const data = await res.json();

    const tbody = document.querySelector('#bookcallsTable tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No book call requests found.</td></tr>';
      return;
    }

    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.email}</td>
        <td>${item.contactNumber}</td>
        <td>${item.serviceProposal}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    alert('Error loading book calls: ' + error.message);
    console.error('Fetch error:', error);
  }
}

// Attach refresh button
document.getElementById('refreshBtn').addEventListener('click', fetchBookCalls);

// Load on page load
document.addEventListener('DOMContentLoaded', fetchBookCalls);
