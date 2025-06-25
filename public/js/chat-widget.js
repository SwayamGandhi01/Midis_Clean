document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('chatToggleBtn');
  const chatPopup = document.getElementById('chatPopup');
  
  button.addEventListener('click', () => {
    chatPopup.classList.toggle('visible'); // Add your CSS to show/hide
  });

  const socket = io(); // assuming you included socket.io from local server
  // handle chat logic...
});
