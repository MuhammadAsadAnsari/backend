require('reflect-metadata');
const http = require('http');
const dotenv = require('dotenv');
const app = require('./app'); // Your Express app
const { AppDataSource } = require('./db'); // Import the DB connection from separate file

// Load environment variables
dotenv.config({ path: './config.env' });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
console.log('🚀 ~ AppDataSource: in app', AppDataSource.isInitialized);

    console.log('✅ Database connected successfully');

    const port = process.env.PORT || 3000;
    const server = http.createServer(app);

    server.listen(port, () => {
      console.log(`🚀 App running on port ${port}...`);
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });
