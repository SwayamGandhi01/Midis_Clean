const apiBase = 'http://localhost:5000/api/users';
const token = localStorage.getItem('token');

if (!token) {
  alert('Not authenticated. Please login first.');
  window.location.href = 'login.html';
}

const usersTableBody = document.getElementById('usersTableBody');
const createUserForm = document.getElementById('createUserForm');
const updateUserForm = document.getElementById('updateUserForm');
const updateUserSection = document.getElementById('updateUserSection');
const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');

let users = [];
let selectedUserId = null;

async function fetchUsers() {
  try {
    const res = await fetch(apiBase, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    users = await res.json();
    renderUsers();
  } catch (err) {
    alert('Error loading users: ' + err.message);
  }
}

function renderUsers() {
  usersTableBody.innerHTML = '';
  users.forEach(user => {
    const tr = document.createElement('tr');
    const actionTd = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEditUser(user._id));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteUser(user._id));

    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);

    tr.innerHTML = `
      <td>${user._id}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
    `;

    tr.appendChild(actionTd);
    usersTableBody.appendChild(tr);
  });
}

createUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = createUserForm.name.value.trim();
  const email = createUserForm.email.value.trim();
  const password = createUserForm.password.value.trim();
  const role = createUserForm.role.value;

  if (!name || !email || !password || !role) {
    alert('Please fill all fields');
    return;
  }

  try {
    const res = await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create user');

    alert('User created successfully');
    createUserForm.reset();
    fetchUsers();
  } catch (err) {
    alert('Error creating user: ' + err.message);
  }
});

function startEditUser(userId) {
  const user = users.find(u => u._id === userId);
  if (!user) {
    alert('User not found');
    return;
  }

  selectedUserId = userId;
  updateUserForm.name.value = user.name;
  updateUserForm.email.value = user.email;
  updateUserForm.role.value = user.role;
  updateUserForm.password.value = '';
  updateUserSection.style.display = 'block';
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function cancelUpdate() {
  selectedUserId = null;
  updateUserForm.reset();
  updateUserSection.style.display = 'none';
}

cancelUpdateBtn.addEventListener('click', cancelUpdate);

updateUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedUserId) {
    alert('No user selected');
    return;
  }

  const name = updateUserForm.name.value.trim();
  const email = updateUserForm.email.value.trim();
  const role = updateUserForm.role.value;
  const password = updateUserForm.password.value.trim();

  if (!name || !email || !role) {
    alert('Name, email, and role are required');
    return;
  }

  try {
    const body = { name, email, role };
    if (password) {
      body.password = password;
    }

    const res = await fetch(`${apiBase}/${selectedUserId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update user');

    alert('User updated successfully');
    cancelUpdate();
    fetchUsers();
  } catch (err) {
    alert('Error updating user: ' + err.message);
  }
});

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const res = await fetch(`${apiBase}/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete user');

    alert('User deleted successfully');
    fetchUsers();
  } catch (err) {
    alert('Error deleting user: ' + err.message);
  }
}

fetchUsers();
