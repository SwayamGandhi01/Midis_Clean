async function fetchAdminRequests() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/users/pending-admins', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    const table = document.getElementById('adminRequestsTable');
    const tableBody = document.getElementById('tableBody');
    const noMsg = document.getElementById('noRequestsMsg');

    tableBody.innerHTML = '';

    if (data.length === 0) {
      noMsg.textContent = 'No pending admin requests.';
      table.style.display = 'none';
    } else {
      table.style.display = 'table';
      noMsg.style.display = 'none';

      data.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
          <td><button class="approve-btn" data-id="${user._id}">Approve</button></td>
        `;
        tableBody.appendChild(row);
      });

      // ✅ Add event listeners separately (no inline)
      document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userId = btn.getAttribute('data-id');
          await approveAdmin(userId);
        });
      });
    }
  } catch (err) {
    console.error('Error loading requests:', err);
    document.getElementById('noRequestsMsg').textContent = 'Failed to load requests.';
  }
}

async function approveAdmin(userId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/users/approve-admin/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      alert('Admin approved successfully!');
      fetchAdminRequests(); // refresh list
    } else {
      const err = await res.json();
      alert(err.message || 'Error approving admin');
    }
  } catch (err) {
    console.error('Approval error:', err);
    alert('Error approving admin');
  }
}

// 🔄 Run on page load
fetchAdminRequests();
