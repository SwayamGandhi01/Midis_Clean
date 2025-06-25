const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message');
const AdminStatus = require('./models/AdminStatus');
require('dotenv').config();

const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route Imports
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const chatRoutes = require('./routes/chatRoutes');
const bookCallRoutes = require('./routes/bookCallRoutes');

// Create Express App & Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/userAuth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/bookcalls', bookCallRoutes);

app.get('/api/test-save', async (req, res) => {
  const Test = mongoose.model('Test', new mongoose.Schema({ msg: String }));
  await Test.create({ msg: "Hello MongoDB!" });
  res.send("✅ Data inserted");
});

// Health Check
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// -------------------------
// 🔌 Socket.IO Chat Logic
// -------------------------
let adminSocket = null;
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('📡 New socket connected:', socket.id);

  socket.on('userJoin', ({ userId, userName }) => {
    onlineUsers.set(userId, socket.id);
    io.emit('userStatus', { userId, status: 'online' });
    console.log(`🟢 User online: ${userId}`);
  });

  socket.on('userTyping', (userId) => {
    if (adminSocket) {
      adminSocket.emit('userTyping', userId);
    }
  });

  socket.on('userMessage', async ({ userId, userName, message }) => {
    const status = await AdminStatus.findOne({});
    const isAdminOnline = status?.online;

    const newMsg = await Message.create({ sender: 'user', userId, userName, message });

    if (isAdminOnline && adminSocket) {
      adminSocket.emit('newUserMessage', newMsg);
      socket.emit('info', 'Please wait, admin is online and will get back to you shortly.');
    } else {
      try {
        const systemPrompt = `
You are the official chatbot of Midis Resources, a leading digital marketing agency in India, delivering 360° creative and technical solutions to ambitious businesses around the globe.

Company Overview:
Midis Resources specializes in brand building, performance-driven marketing, and custom eCommerce growth strategies designed to generate measurable ROI.

Services We Offer:
- Web Development
- Graphic Designing
- Content Creation
- Video Editing
- YouTube Channel Setup & Management
- SEO
- Email Marketing
- Google Ads (PPC)
- Meta Ads (Facebook & Instagram)
- LinkedIn Ads
- Organic Social Media Growth
- E-Commerce Strategy (Shopify, WordPress, Wix, WooCommerce)

Website Features:
- "Book a Meeting" button on every page.
- Contact form for selecting services and submitting queries.

Unique Qualities:
🌍 Global Reach
💼 Experienced Team
🤝 Long-Term Partnership
📊 Transparent Reporting
🎯 Customized Funnels

Strict Chatbot Rules:
1. Only mention the services listed above.
2. Do NOT recommend tools/services not offered by Midis Resources.
3. If unsure, say: "Please contact our admin using the Book a Meeting button."
4. Respond like a helpful Midis chatbot.
5. Keep replies short, to the point, and under 2–3 sentences.
        `;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
        });

        const botReply = completion.choices[0].message.content;
        await Message.create({ sender: 'bot', userId, message: botReply });
        socket.emit('botReply', botReply);
      } catch (error) {
        console.error('OpenAI API error:', error);
        socket.emit('botReply', "Sorry, I'm having trouble right now. Please try again later.");
      }
    }
  });

  socket.on('adminLogin', async () => {
    adminSocket = socket;
    await AdminStatus.findOneAndUpdate({}, { online: true }, { upsert: true });
    io.emit('adminStatus', 'online');
    console.log('✅ Admin is online.');
  });

  socket.on('adminLogout', async () => {
    await AdminStatus.findOneAndUpdate({}, { online: false }, { upsert: true });
    adminSocket = null;
    io.emit('adminStatus', 'offline');
    console.log('🛑 Admin logged out.');
  });

  socket.on('adminTyping', ({ userId }) => {
    const userSocketId = onlineUsers.get(userId);
    if (userSocketId) {
      io.to(userSocketId).emit('adminTyping');
    }
  });

  socket.on('adminMessage', async ({ userId, message }) => {
    await Message.create({ sender: 'admin', userId, message });
    io.emit('adminReply', { userId, message });
  });

  socket.on('disconnect', async () => {
    if (socket === adminSocket) {
      await AdminStatus.findOneAndUpdate({}, { online: false });
      adminSocket = null;
      io.emit('adminStatus', 'offline');
      console.log('⚠️ Admin disconnected.');
    } else {
      for (const [userId, id] of onlineUsers.entries()) {
        if (id === socket.id) {
          onlineUsers.delete(userId);
          io.emit('userStatus', { userId, status: 'offline' });
          console.log(`🔴 User offline: ${userId}`);
          break;
        }
      }
    }
  });
});



// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
