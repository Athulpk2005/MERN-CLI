#!/usr/bin/env node
import path from 'path';

const port = process.env.PORT || 5001;

console.log('Starting smoke test by importing server module...');

(async () => {
  // ensure test env defaults so server doesn't exit on missing env validation
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.PORT = process.env.PORT || String(port);
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';
  try {
    const mod = await import('../server.js');
    const server = mod.server;
    // give server a moment to start
    await new Promise((r) => setTimeout(r, 500));
    const res = await fetch(`http://localhost:${port}/health`);
      if (res.status === 200) {
      console.log('Smoke test passed: /health returned 200');
      try {
        const mongoose = await import('mongoose');
        await mongoose.disconnect();
      } catch (e) {
        // ignore disconnect errors
      }
      server.close(() => {
        // give Node a moment to close handles
        setTimeout(() => process.exit(0), 200);
      });
    } else {
      console.error('Smoke test failed: /health returned', res.status);
      process.exit(1);
    }
  } catch (err) {
    console.error('Smoke test error:', err);
    process.exit(1);
  }
})();
