const BookCall = require('../models/BookCall');

exports.createBookCall = async (req, res) => {
  const { name, email, contactNumber, serviceProposal } = req.body;

  if (!name || !email || !contactNumber || !serviceProposal) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newBookCall = new BookCall({ name, email, contactNumber, serviceProposal });
    await newBookCall.save();
    res.status(201).json({ message: 'Book call created successfully' });
  } catch (err) {
    console.error('Error creating book call:', err);
    res.status(500).json({ message: 'Server error while booking call' });
  }
};

exports.getAllBookCalls = async (req, res) => {
  try {
    const bookCalls = await BookCall.find().sort({ createdAt: -1 });
    res.json(bookCalls);
  } catch (err) {
    console.error('Error fetching book calls:', err);
    res.status(500).json({ message: 'Server error fetching book calls' });
  }
};
