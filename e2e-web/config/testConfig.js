'use strict';
require('dotenv').config();
const path = require('path');

module.exports = {
  // ── Base URLs ─────────────────────────────────────────────────
  baseUrl: process.env.WEB_BASE_URL || 'https://sumiya15.github.io/newmomcircle',
  apiUrl:  process.env.API_BASE_URL || 'https://newmomcircle.onrender.com',

  // ── Test credentials (never commit real values; use GitHub Secrets) ──
  testUser: {
    email:    process.env.TEST_USER_EMAIL    || 'testuser@newmomcircle.test',
    password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
    name:     process.env.TEST_USER_NAME     || 'Test Mom',
  },

  // ── Timeouts (ms) ─────────────────────────────────────────────
  timeouts: {
    implicit:  8000,
    explicit:  15000,
    pageLoad:  30000,
    animation: 600,   // wait after page transitions
  },

  // ── Browser options ───────────────────────────────────────────
  browser: {
    headless:   process.env.CI === 'true',     // headless in CI; headed locally
    windowSize: { width: 1280, height: 900 },
  },

  // ── File paths ────────────────────────────────────────────────
  paths: {
    reports:     path.join(__dirname, '../reports'),
    screenshots: path.join(__dirname, '../reports/screenshots'),
    xlsx:        path.join(__dirname, '../reports/xlsx'),
    logs:        path.join(__dirname, '../reports/logs'),
  },

  // ── Retry settings ────────────────────────────────────────────
  retries: {
    test:    process.env.CI === 'true' ? 1 : 0,
    element: 3,
  },
};
