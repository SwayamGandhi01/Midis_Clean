document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('toggleTermsBtn');
  const content = document.getElementById('moreTerms');

  if (button && content) {
    button.addEventListener('click', () => {
      const isVisible = content.style.display === 'block';
      content.style.display = isVisible ? 'none' : 'block';
      button.textContent = isVisible ? 'Read More ↓' : 'Read Less ↑';
      button.setAttribute('aria-expanded', !isVisible);
    });
  }
});
