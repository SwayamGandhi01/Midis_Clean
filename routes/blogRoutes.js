const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const mongoose = require('mongoose');

// @route   POST /api/blogs
// @desc    Create a new blog
router.post('/', async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const blog = new Blog({
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl?.trim() || ''
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ error: 'Server error while creating blog.' });
  }
});

// @route   GET /api/blogs
// @desc    Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Server error while fetching blogs.' });
  }
});

// @route   GET /api/blogs/:id
// @desc    Get a single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid blog ID.' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    res.status(200).json(blog);
  } catch (err) {
    console.error('Error fetching blog by ID:', err);
    res.status(500).json({ error: 'Server error while fetching blog.' });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, imageUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid blog ID.' });
    }

    const updated = await Blog.findByIdAndUpdate(
      id,
      {
        title: title?.trim(),
        content: content?.trim(),
        imageUrl: imageUrl?.trim() || ''
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Server error while updating blog.' });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid blog ID.' });
    }

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    res.status(200).json({ message: 'Blog deleted successfully.' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Server error while deleting blog.' });
  }
});

module.exports = router;
