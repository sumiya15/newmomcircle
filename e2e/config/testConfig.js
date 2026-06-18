const path = require('path');

module.exports = {
  // Timeouts
  timeouts: {
    implicit: 10000,
    explicit: 5000,
    pageLoad: 30000,
    command: 20000,
  },

  // Retries
  retries: {
    test: process.env.CI ? 2 : 0,
    element: 3,
  },

  // File Paths
  paths: {
    screenshots: path.join(__dirname, '../screenshots'),
    logs: path.join(__dirname, '../logs'),
    reports: path.join(__dirname, '../reports'),
    failures: path.join(__dirname, '../reports/failures'),
    excel: path.join(__dirname, '../excel'),
    testData: path.join(__dirname, '../testdata'),
  },

  // Appium Server
  appium: {
    host: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
    logLevel: 'error',
  }
};
