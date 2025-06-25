document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#bookCallTable tbody');
  const headers = document.querySelectorAll('#bookCallTable thead th.sortable');

  let bookings = [];
  let currentSortKey = null;
  let currentSortOrder = 'asc';

  // Fetch bookings from backend API
  async function fetchBookings() {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch booking data');

      bookings = await res.json();

      if (!bookings.length) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No booked calls found.</td></tr>`;
        return;
      }

      renderTable(bookings);
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error loading data: ${error.message}</td></tr>`;
    }
  }

  // Render table rows
  function renderTable(data) {
    tableBody.innerHTML = '';

    data.forEach(item => {
      const submittedDate = item.submittedAt
        ? new Date(item.submittedAt).toLocaleString()
        : '-';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name || '-'}</td>
        <td>${item.contact || '-'}</td>
        <td>${item.day || '-'}</td>
        <td>${item.month || '-'}</td>
        <td>${item.year || '-'}</td>
        <td>${item.time || '-'}</td>
        <td>${item.timezone || '-'}</td>
        <td>${item.email || '-'}</td>
        <td>${submittedDate}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Sort data by key and order
  function sortData(key) {
    if (currentSortKey === key) {
      currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortKey = key;
      currentSortOrder = 'asc';
    }

    bookings.sort((a, b) => {
      let valA = a[key] || '';
      let valB = b[key] || '';

      if (key === 'submittedAt') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    updateSortIndicators();
    renderTable(bookings);
  }

  // Update the sorting indicator icons
  function updateSortIndicators() {
    headers.forEach(header => {
      header.classList.remove('sorted-asc', 'sorted-desc');
      if (header.dataset.key === currentSortKey) {
        header.classList.add(currentSortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
      }
    });
  }

  // Attach click listeners to sortable headers
  headers.forEach(header => {
    header.addEventListener('click', () => {
      sortData(header.dataset.key);
    });
  });

  // Initial fetch
  fetchBookings();
});
