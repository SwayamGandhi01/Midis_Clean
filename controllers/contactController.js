const ContactMessage = require('../models/ContactMessage');

// Create new contact message
exports.createMessage = async (req, res) => {
  try {
    const { name, email, phone, serviceProposal, message } = req.body;

    // Validate required fields
    if (!name || !email || !serviceProposal || !message) {
      return res.status(400).json({ error: 'Name, Email, Service, and Message are required.' });
    }

    const newMessage = new ContactMessage({
      name,
      email,
      phone,
      serviceProposal,
      message,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message received successfully!' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all contact messages (for admin dashboard)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ submittedAt: -1 });
    console.log(messages); // ✅ Add this to check what's returned
    res.json(messages);    // Make sure this sends the array
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
