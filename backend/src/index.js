import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import taxpayerRoutes from './routes/taxpayerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.url}`);
  next();
});
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/taxpayers', taxpayerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'E-Taxpay API is running' });
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Backend SUCCESS] Server is running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('[Backend ERROR] Failed to start server:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process or change the port.`);
  }
});

// Force process to stay alive just in case something is closing it prematurely
setInterval(() => { }, 1000 * 60 * 60); 
