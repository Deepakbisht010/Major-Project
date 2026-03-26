import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import taxpayerRoutes from './src/routes/taxpayerRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import chatbotRoutes from './src/routes/chatbotRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Support
app.use(cors());

// Middleware
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[Backend] ${req.method} ${req.url}`);
    next();
});

// API Base Route
app.get("/", (req, res) => res.send("Backend running"));

// Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'E-Taxpay API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/taxpayers', taxpayerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global ERROR Handler]:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        details: err.message
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`[Backend SUCCESS] Server is running on port ${PORT}`);
});
