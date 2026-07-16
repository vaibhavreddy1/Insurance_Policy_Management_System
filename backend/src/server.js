/**
 * HDFC Life Insurance Policy Management System
 * Entry Point - Express Server
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 HDFC IPMS Server running in ${process.env.NODE_ENV} mode`);
      console.log(`📡 API Base URL : http://localhost:${PORT}/api`);
      console.log(`🔒 Session TTL  : ${process.env.JWT_EXPIRES_IN}`);
      console.log(`\nPress Ctrl+C to stop the server.\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB. Server not started.', err);
    process.exit(1);
  });
