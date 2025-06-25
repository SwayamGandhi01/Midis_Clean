document.addEventListener('DOMContentLoaded', loadContactMessages);

async function loadContactMessages() {
  const tbody = document.querySelector('#contactMessagesTable tbody');
  tbody.innerHTML = '<tr><td colspan="6">Loading messages...</td></tr>';

  try {
    const response = await fetch('/api/contact');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const messages = await response.json();
    console.log('Messages received from API:', messages);

    if (!Array.isArray(messages) || messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No messages found.</td></tr>';
      return;
    }

    tbody.innerHTML = ''; // Clear the loading row

    messages.forEach(msg => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${msg.name || ''}</td>
        <td>${msg.email || ''}</td>
        <td>${msg.phone || ''}</td>
        <td>${msg.serviceProposal || ''}</td>
        <td>${msg.message || ''}</td>
        <td>${new Date(msg.submittedAt || msg.createdAt).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    tbody.innerHTML = `<tr><td colspan="6">Error loading messages: ${error.message}</td></tr>`;
  }
}
