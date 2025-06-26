document.addEventListener("DOMContentLoaded", function () {
    // Menu Toggle
    document.getElementById("menuToggle").addEventListener("click", function () {
      document.getElementById("nav-links").classList.toggle("active");
    });

    // Card Animation on Scroll
    const cards = document.querySelectorAll('.service-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, {
      threshold: 0.15 // Adjust how early animation triggers
    });

    cards.forEach((card) => {
      observer.observe(card);
    });
  });
// book a meeting

document.addEventListener('DOMContentLoaded', () => {
  const openPopupBtn = document.getElementById('openPopup');
  const popupOverlay = document.getElementById('popupOverlay');
  const closeBtn = popupOverlay.querySelector('.close-btn');

  const nameInput = document.getElementById('name');
  const contactInput = document.getElementById('contact');
  const emailInput = document.getElementById('email');
  const timezoneSelect = document.getElementById('timezone');
  const submitBookingBtn = document.getElementById('submitBooking');

  const calendarDays = document.getElementById('calendarDays');
  const slotsDiv = document.getElementById('slots');
  const monthYear = document.getElementById('monthYear');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');

  const times = [
    '10:00 am', '10:30 am', '11:00 am', '11:30 am',
    '12:00 pm', '12:30 pm', '1:00 pm', '1:30 pm', '2:00 pm', '2:30 pm'
  ];

  let today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();
  let selectedDay = null;
  let selectedTime = null;

  function renderCalendar(month, year) {
    calendarDays.innerHTML = '';
    monthYear.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;
    const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    labels.forEach(label => {
      const span = document.createElement('span');
      span.textContent = label;
      calendarDays.appendChild(span);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) calendarDays.appendChild(document.createElement('div'));

    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const dayDiv = document.createElement('div');
      dayDiv.textContent = day;
      dayDiv.classList.add('day');

      const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (date < todayNoTime) {
        dayDiv.classList.add('disabled');
      } else {
        dayDiv.addEventListener('click', () => selectDay(dayDiv, day, month, year));
      }
      calendarDays.appendChild(dayDiv);
    }
  }

  function selectDay(dayDiv, day, month, year) {
    clearSelectedDay();
    dayDiv.classList.add('active');
    selectedDay = { day, month, year };
    renderTimeSlots();
    updateSubmitButton();
  }

  function clearSelectedDay() {
    calendarDays.querySelectorAll('.day.active').forEach(d => d.classList.remove('active'));
  }

  function renderTimeSlots() {
    slotsDiv.innerHTML = '';
    selectedTime = null;
    times.forEach(time => {
      const slotDiv = document.createElement('div');
      slotDiv.textContent = time;
      slotDiv.classList.add('slot');
      slotDiv.addEventListener('click', () => selectTimeSlot(slotDiv, time));
      slotsDiv.appendChild(slotDiv);
    });
  }

  function selectTimeSlot(slotDiv, time) {
    clearSelectedTime();
    slotDiv.classList.add('active');
    selectedTime = time;
    updateSubmitButton();
  }

  function clearSelectedTime() {
    slotsDiv.querySelectorAll('.slot.active').forEach(s => s.classList.remove('active'));
  }

  function clearTimeSlots() {
    slotsDiv.innerHTML = '';
  }

  function resetSelection() {
    clearSelectedDay();
    clearSelectedTime();
    clearTimeSlots();
    nameInput.value = '';
    contactInput.value = '';
    emailInput.value = '';
    timezoneSelect.value = '';
    selectedDay = null;
    selectedTime = null;
    updateSubmitButton();
  }

  function updateSubmitButton() {
    const valid =
      nameInput.value.trim() !== '' &&
      contactInput.value.trim() !== '' &&
      emailInput.value.trim() !== '' &&
      timezoneSelect.value &&
      selectedDay && selectedTime;

    submitBookingBtn.disabled = !valid;
  }

  // Event Listeners
  if (openPopupBtn) {
    openPopupBtn.addEventListener('click', e => {
      e.preventDefault();
      popupOverlay.style.display = 'flex';
      resetSelection();
      renderCalendar(currentMonth, currentYear);
    });
  }

  closeBtn.addEventListener('click', () => {
    popupOverlay.style.display = 'none';
  });

  prevMonthBtn.addEventListener('click', () => changeMonth(-1));
  nextMonthBtn.addEventListener('click', () => changeMonth(1));

  function changeMonth(step) {
    currentMonth += step;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    } else if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
    clearTimeSlots();
    selectedDay = null;
    selectedTime = null;
    updateSubmitButton();
  }

  // Watch inputs
  [nameInput, contactInput, emailInput, timezoneSelect].forEach(input => {
    input.addEventListener('input', updateSubmitButton);
    input.addEventListener('change', updateSubmitButton);
  });

  submitBookingBtn.addEventListener('click', async () => {
    if (!selectedDay || !selectedTime) {
      alert('Please complete all fields.');
      return;
    }

    const bookingData = {
      name: nameInput.value.trim(),
      contact: contactInput.value.trim(),
      email: emailInput.value.trim(),
      timezone: timezoneSelect.value,
      day: selectedDay.day,
      month: selectedDay.month + 1,
      year: selectedDay.year,
      time: selectedTime
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!res.ok) throw new Error(await res.text());
      alert('Booking successful!');
      popupOverlay.style.display = 'none';
      resetSelection();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
});
