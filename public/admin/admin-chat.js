const socket = io('http://localhost:5000');

let selectedUserId = null;
let userMap = {}; // { userId: userName }
let unreadCounts = {}; // { userId: count }
let typingTimeout;

const usersUl = document.getElementById('usersUl');
const messagesDiv = document.getElementById('messages');
const adminMessageInput = document.getElementById('adminMessage');
const sendAdminBtn = document.getElementById('sendAdminBtn');
const chatHeader = document.getElementById('chatHeader');
const searchInput = document.getElementById('userSearch');

socket.emit('adminLogin');

async function loadUserThreads() {
  try {
    const res = await fetch('/api/messages/threads');
    const threads = await res.json();

    usersUl.innerHTML = '';
    userMap = {};
    unreadCounts = {};

    threads.forEach(thread => {
      userMap[thread.userId] = thread.userName || `User ${thread.userId.toString().slice(-4)}`;
      unreadCounts[thread.userId] = 0;
      renderUserItem(thread.userId);
    });
  } catch (err) {
    console.error('Error loading user threads:', err);
  }
}

function renderUserItem(userId) {
  const name = userMap[userId];
  let li = document.querySelector(`li[data-userid="${userId}"]`);

  if (!li) {
    li = document.createElement('li');
    li.dataset.userid = userId;
    li.addEventListener('click', () => selectUser(userId, li));
    usersUl.appendChild(li);
  }

  const unread = unreadCounts[userId] || 0;
  const unreadHTML = unread > 0 ? `<span style="background:red;color:white;padding:2px 6px;border-radius:50%;margin-left:10px;">${unread}</span>` : '';

  li.innerHTML = `
    ${name}
    ${unreadHTML}
    <span class="status-dot" style="display:inline-block;margin-left:8px;width:10px;height:10px;border-radius:50%;background:gray;"></span>
  `;
}

async function selectUser(userId, liElement) {
  selectedUserId = userId;

  Array.from(usersUl.children).forEach(li => li.classList.remove('active'));
  liElement.classList.add('active');

  unreadCounts[userId] = 0;
  renderUserItem(userId);

  const displayName = userMap[userId] || `User ${userId.toString().slice(-4)}`;
  chatHeader.textContent = `Chat with ${displayName}`;

  adminMessageInput.disabled = false;
  sendAdminBtn.disabled = false;
  messagesDiv.innerHTML = '';

  try {
    const res = await fetch(`/api/messages/history/${userId}`);
    const messages = await res.json();

    if (messages.length > 0 && messages[0].userName) {
      userMap[userId] = messages[0].userName;
    }

    messages.forEach(msg => {
      appendMessage(msg.sender, msg.message, msg.timestamp);
    });

    scrollToBottom();
  } catch (err) {
    console.error('Error fetching chat history:', err);
  }
}

function appendMessage(sender, message, timestamp) {
  const div = document.createElement('div');
  div.classList.add('message', sender);

  const label = sender === 'user' ? 'User' : sender === 'admin' ? 'Admin' : 'Bot';
  const time = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  div.innerHTML = `<strong>${label}:</strong> ${message}<br><small>${time}</small>`;
  messagesDiv.appendChild(div);
}

function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

sendAdminBtn.addEventListener('click', () => {
  const msg = adminMessageInput.value.trim();
  if (!msg || !selectedUserId) return;

  socket.emit('adminMessage', { userId: selectedUserId, message: msg });
  appendMessage('admin', msg, new Date());
  adminMessageInput.value = '';
  scrollToBottom();
});

adminMessageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendAdminBtn.click();
    e.preventDefault();
  } else {
    socket.emit('adminTyping', { userId: selectedUserId });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('adminStopTyping', { userId: selectedUserId });
    }, 1000);
  }
});

socket.on('newUserMessage', (msg) => {
  const userId = msg.userId;
  const userName = msg.userName || `User ${userId.toString().slice(-4)}`;

  if (!userMap[userId]) {
    userMap[userId] = userName;
    unreadCounts[userId] = 0;
  }

  if (userId === selectedUserId) {
    appendMessage('user', msg.message, msg.timestamp);
    scrollToBottom();
  } else {
    unreadCounts[userId] = (unreadCounts[userId] || 0) + 1;
  }

  renderUserItem(userId);
});

socket.on('adminReply', ({ userId, message, timestamp }) => {
  if (userId === selectedUserId) {
    appendMessage('admin', message, timestamp || new Date());
    scrollToBottom();
  }
});

socket.on('botReply', ({ userId, message, timestamp }) => {
  if (userId === selectedUserId) {
    appendMessage('bot', message, timestamp || new Date());
    scrollToBottom();
  } else {
    unreadCounts[userId] = (unreadCounts[userId] || 0) + 1;
    renderUserItem(userId);
  }
});

socket.on('userTyping', ({ userId }) => {
  if (userId === selectedUserId) {
    chatHeader.textContent = `User is typing...`;
  }
});

socket.on('userStopTyping', ({ userId }) => {
  if (userId === selectedUserId) {
    const name = userMap[userId] || `User ${userId.toString().slice(-4)}`;
    chatHeader.textContent = `Chat with ${name}`;
  }
});

socket.on('userStatus', ({ userId, status }) => {
  const li = document.querySelector(`li[data-userid="${userId}"]`);
  if (li) {
    const dot = li.querySelector('.status-dot');
    if (dot) {
      dot.style.background = status === 'online' ? 'green' : 'gray';
    }
  }
});

window.addEventListener('beforeunload', () => {
  socket.emit('adminLogout');
  socket.disconnect();
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  Array.from(usersUl.children).forEach(li => {
    const name = li.textContent.toLowerCase();
    li.style.display = name.includes(query) ? 'block' : 'none';
  });
});

loadUserThreads();
