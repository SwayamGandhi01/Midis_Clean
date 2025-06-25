// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// POST /api/bookings - Save booking data
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      contact,
      service,
      day,
      month,
      year,
      time,
      timezone
    } = req.body;

    // Validate required fields
    if (!name || !email || !contact || !day || !month || !year || !time || !timezone) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const booking = new Booking({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact.trim(),
      service: service?.trim(),
      day,
      month,
      year,
      time,
      timezone
    });

    await booking.save();
    res.status(201).json({ message: 'Booking saved successfully', booking });
  } catch (err) {
    console.error('Error saving booking:', err);
    res.status(500).json({ message: 'Failed to save booking' });
  }
});

// GET /api/bookings - Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ submittedAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

module.exports = router;
