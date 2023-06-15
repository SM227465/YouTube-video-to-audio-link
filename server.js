const dotenv = require('dotenv');
const app = require('./app');

// Handling uncaught exception
process.on('uncaughtException', (err) => {
  console.info('UNCAUGHT EXCEPTION!');
  console.error(err.name, err.message);
  process.exit(1);
});

// setting path for .env file
dotenv.config({ path: './config.env' });

// Environment Logging

// getting port number from environment
const port = process.env.PORT || 8000;

// creating a server
const server = app.listen(port, () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`App is running on Production environment on port ${port}`);
  } else {
    console.log(`App is running on Development environment on port ${port}`);
  }
});

// Handling unhandle promise rejection
process.on('unhandledRejection', (err) => {
  console.warn('UNHANDLED REJECTION!');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED, Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated.');
  });
});
