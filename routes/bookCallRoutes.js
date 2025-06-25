const express = require('express');
const router = express.Router();
const bookCallController = require('../controllers/bookCallController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');  // <-- fixed path

// Public route to create a booking call
router.post('/', bookCallController.createBookCall);

// Protected route to get all bookings (admin only)
router.get('/', authenticateToken, authorizeAdmin, bookCallController.getAllBookCalls);



module.exports = router;
