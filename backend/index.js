const express = require('express');
const cors = require('cors');

const app = express();

// Standard Production Middleware
app.use(cors());
app.use(express.json());

// Example API Route (Reachable at /api/hello)
app.get('/hello', (req, res) => {
  res.status(200).json({
    message: 'Hello from Express on Vercel!',
    timestamp: new Date().toISOString(),
    success: true
  });
});

// Health check (Reachable at /api/health)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'up', 
    service: 'backend-api',
    node_version: process.version
  });
});

// Base API route (Reachable at /api/)
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to the Backend API',
    endpoints: ['/api/hello', '/api/health']
  });
});

// Error handling for non-existent routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// CRITICAL: Export the app instead of app.listen()
module.exports = app;
