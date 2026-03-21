import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import taxpayerRoutes from './routes/taxpayerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CURRENT_PID = process.pid;

// Auto-free port — skips current process PID so we don't kill ourselves
function freePort(port) {
  try {
    const result = execSync(
      `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`,
      { encoding: 'utf8' }
    ).trim();

    if (result) {
      const pids = result.split('\n').map(p => parseInt(p.trim(), 10)).filter(pid => !isNaN(pid) && pid !== CURRENT_PID);
      if (pids.length === 0) return;
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' });
          console.log(`[Backend] Freed port ${port} by killing PID ${pid}`);
        } catch (_) { }
      });
      // Give OS time to release the port
      execSync('powershell -Command "Start-Sleep -Milliseconds 500"');
    }
  } catch (_) {
    // Port was free, nothing to do
  }
}

// Free port BEFORE starting (skip our own PID)
freePort(PORT);

// Middleware
app.use(cors({ origin: true, credentials: true }));

app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.url}`);
  next();
});

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
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Backend SUCCESS] Server is running on http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Backend] Port ${PORT} in use, force-clearing and retrying...`);
    // Kill anything else (not us) and retry after a short delay
    freePort(PORT);
    setTimeout(() => server.listen(PORT, '127.0.0.1'), 600);
  } else {
    console.error('[Backend ERROR]', err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());

// Keep process alive
setInterval(() => { }, 1000 * 60 * 60);
