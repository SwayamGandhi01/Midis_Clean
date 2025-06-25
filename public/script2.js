function toggleMenu() {
    document.getElementById("nav-links").classList.toggle("active");
  }
   const cards = document.querySelectorAll('.service-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        // Optional: Stop observing once animated
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15  // Adjust how early animation triggers
  });

  cards.forEach((card) => {
    observer.observe(card);
  });
 

  const counters = document.querySelectorAll(".stats h3");
  let animated = false;

  function animateCounters() {
    if (animated) return;
    const section = document.querySelector(".stats");
    const rect = section.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

    if (isVisible) {
      counters.forEach(counter => {
        const target = +counter.getAttribute("data-target");
        let count = 0;
        const speed = 20;

        const updateCounter = () => {
          if (count < target) {
            count += Math.ceil(target / 40);
            counter.textContent = count > target ? target : count;
            setTimeout(updateCounter, speed);
          }
        };

        updateCounter();
      });
      animated = true;
    }
  }

  window.addEventListener("scroll", animateCounters);
    const openBtn = document.getElementById("openPopupBtn");
  const closeBtn = document.getElementById("closePopup4");
  const popup = document.getElementById("popup4");

  openBtn.addEventListener("click", () => {
    popup.style.display = "flex";
    document.body.style.overflow = "hidden"; // Lock scroll
  });

  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
    document.body.style.overflow = "auto";
  });

