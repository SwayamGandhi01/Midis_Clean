// === Helper Functions ===
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showMessage(msg, type = 'success') {
  const box = document.getElementById('messageBox');
  box.innerHTML = `<p class="message ${type}">${escapeHtml(msg)}</p>`;
  setTimeout(() => { box.innerHTML = ''; }, 5000);
}

function clearMessages() {
  document.getElementById('messageBox').innerHTML = '';
}
function clearForm() {
  document.getElementById('formContainer').innerHTML = '';
}

// === Dashboard Charts ===
async function loadDashboardCharts() {
  const token = localStorage.getItem('token');
  const lineChartEl = document.getElementById('lineChart');
  const pieChartEl = document.getElementById('pieChart');
  if (!lineChartEl || !pieChartEl) return;

  try {
    const response = await fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
      options: { responsive: true }
    });

  } catch (err) {
    console.error('Failed to fetch chart data:', err);
  }
}

// === Load Messages ===
async function loadContactMessages() {
  const table = document.querySelector('#contactMessagesTable tbody');
  if (!table) return;
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

// === Main Logic ===
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    alert('Access denied! Redirecting to login.');
    window.location.href = '/login.html';
    return;
  }

  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) {
    welcomeMsg.textContent = `Welcome, ${user.name}`;
  }

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

  // Responsive menu toggle
  const toggleBtn = document.getElementById('toggleMenuBtn');
  const sidebar = document.getElementById('sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // === ✅ Proper Logout Handler (not tied to socket) ===
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = '../index.html';
    });
  }

  // Dashboard nav reset logic
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
        loadDashboardCharts();
      }
    });
  }

  loadContactMessages();
  loadDashboardCharts();
});


// === ✅ Chatbot socket.io logic (unchanged) ===
const socket = io('http://localhost:5000'); // or use your live backend

window.addEventListener('DOMContentLoaded', () => {
  socket.emit('adminLogin');
});

window.addEventListener('beforeunload', () => {
  socket.emit('adminLogout');
});

// Optional: also notify on logout button click (chatbot tracking only)
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  socket.emit('adminLogout');
});
