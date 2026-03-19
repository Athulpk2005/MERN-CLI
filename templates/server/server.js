import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import testRoutes from './routes/testRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { cleanEnv, str, port } from 'envalid';

// Load env vars
dotenv.config();
// Validate required environment variables early (skip strict validation in test)
let env;
if (process.env.NODE_ENV === 'test') {
  // Provide sane defaults for test runs so CI/local smoke tests can run without a DB
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.PORT = process.env.PORT || '5001';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';
  env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: Number(process.env.PORT),
    MONGO_URI: process.env.MONGO_URI
  };
} else {
  try {
    env = cleanEnv(process.env, {
      NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
      PORT: port({ default: 5000 }),
      MONGO_URI: str()
    });
  } catch (err) {
    console.error('Environment validation error:', err.message);
    process.exit(1);
  }

  // Ensure validated values are available on process.env for older modules
  process.env.NODE_ENV = env.NODE_ENV;
  process.env.PORT = String(env.PORT);
  process.env.MONGO_URI = env.MONGO_URI;
}

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Static folder
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security headers (recommended)
app.use(helmet()); 

// Routes
app.use('/api/test', testRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Readiness - ensure DB is connected
app.get('/ready', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  if (ready) return res.status(200).json({ ready: true });
  return res.status(503).json({ ready: false });
});

// Post-route middleware
app.use(notFound);
app.use(errorHandler);

// Define Ports
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing server...`);
  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      console.error('Error closing HTTP server', err);
      process.exit(1);
    }

    try {
      await mongoose.disconnect();
      console.log('MongoDB disconnected.');
      process.exit(0);
    } catch (e) {
      console.error('Error during MongoDB disconnect', e);
      process.exit(1);
    }
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

// Export app and server for testing tools that import the module
export { app, server };
