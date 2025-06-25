// Escape HTML helper to prevent injection
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Show messages
function showMessage(msg, type = 'success') {
  const box = document.getElementById('messageBox');
  box.innerHTML = `<p class="message ${type}">${escapeHtml(msg)}</p>`;
  setTimeout(() => { box.innerHTML = ''; }, 5000);
}

// Clear messages and form container
function clearMessages() {
  document.getElementById('messageBox').innerHTML = '';
}
function clearForm() {
  document.getElementById('formContainer').innerHTML = '';
}

// Load contact messages into table
async function loadContactMessages() {
  const table = document.querySelector('#contactMessagesTable tbody');
  if (!table) return; // Skip if table not present
  table.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  try {
    const response = await fetch('/api/contact');
    const messages = await response.json();

    if (!messages.length) {
      table.innerHTML = '<tr><td colspan="4">No messages yet.</td></tr>';
      return;
    }

    table.innerHTML = messages.map(msg => `
      <tr>
        <td>${escapeHtml(msg.name)}</td>
        <td>${escapeHtml(msg.email)}</td>
        <td>${escapeHtml(msg.message)}</td>
        <td>${new Date(msg.submittedAt).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    table.innerHTML = '<tr><td colspan="4">Failed to load messages.</td></tr>';
  }
}

// Load dashboard chart data and render charts
async function loadDashboardCharts() {
  const token = localStorage.getItem('token');
  const lineChartEl = document.getElementById('lineChart');
  const pieChartEl = document.getElementById('pieChart');

  if (!lineChartEl || !pieChartEl) return;

  try {
    const response = await fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Chart Data:', data);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Clear existing chart instances if you want (optional)
    if (window.lineChartInstance) window.lineChartInstance.destroy();
    if (window.pieChartInstance) window.pieChartInstance.destroy();

    window.lineChartInstance = new Chart(lineChartEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Users Registered',
          data: data.monthlyUsers,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0,123,255,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    window.pieChartInstance = new Chart(pieChartEl.getContext('2d'), {
      type: 'pie',
      data: {
        labels: Object.keys(data.roleDistribution),
        datasets: [{
          data: Object.values(data.roleDistribution),
          backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
        }]
      },
      options: {
        responsive: true
      }
    });

  } catch (err) {
    console.error('Failed to fetch chart data:', err);
  }
}

// Main logic after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Check login & admin role
  if (!user || user.role !== 'admin') {
    alert('Access denied! Redirecting to login.');
    window.location.href = '/login.html';
    return;
  }

  // Show welcome message
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) {
    welcomeMsg.textContent = `Welcome, ${user.name}`;
  }

  // Load profile avatar if available
  const avatar = document.getElementById('profileAvatar');
  const dropdown = document.getElementById('profileDropdown');
  const storedProfile = JSON.parse(localStorage.getItem('adminSettings') || '{}');

  if (avatar && storedProfile.profilePic) {
    avatar.src = storedProfile.profilePic;

    avatar.addEventListener('click', () => {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', (e) => {
      if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '../index.html';
    });
  }

  // Dashboard button logic
  const dashboardNav = document.getElementById('navDashboard');
  if (dashboardNav) {
    dashboardNav.addEventListener('click', () => {
      clearMessages();
      clearForm();

      const main = document.getElementById('mainContent');
      if (main) {
        main.innerHTML = `
          <h2 id="welcomeMsg">Welcome, ${escapeHtml(user.name)}</h2>
          <p>This is your dashboard. Use the sidebar to manage your platform.</p>
          <div id="chartsContainer" style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div class="chart-box" style="flex:1; min-width: 300px;">
              <h4>New Users Over Time</h4>
              <canvas id="lineChart"></canvas>
            </div>
            <div class="chart-box" style="flex:1; min-width: 300px;">
              <h4>User Roles Distribution</h4>
              <canvas id="pieChart"></canvas>
            </div>
          </div>
          <div id="formContainer"></div>
          <div id="messageBox"></div>
        `;
        loadDashboardCharts(); // Re-initialize charts when switching back to dashboard
      }
    });
  }

  // Initial loads
  loadContactMessages();
  loadDashboardCharts(); // Load charts on first load
});



//for chatbot

const socket = io('http://localhost:5000'); // Update if using a different port

  // Notify backend that admin is online
  window.addEventListener('DOMContentLoaded', () => {
    socket.emit('adminLogin');
  });

  // Notify backend when admin logs out
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    socket.emit('adminLogout');
  });

  // Also clean up on tab close
  window.addEventListener('beforeunload', () => {
    socket.emit('adminLogout');
  });