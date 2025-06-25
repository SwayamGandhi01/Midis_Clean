const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// POST /api/contact - submit message
router.post('/', contactController.createMessage);

// GET /api/contact - get all messages (admin)
router.get('/', contactController.getAllMessages);

module.exports = router;
