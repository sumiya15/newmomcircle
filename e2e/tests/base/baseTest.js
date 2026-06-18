'use strict';
require('dotenv').config();

const DriverFactory    = require('../../drivers/driverFactory');
const ScreenshotUtils  = require('../../utilities/screenshotUtils');
const DeviceLogUtils   = require('../../utilities/deviceLogUtils');
const excelReporter    = require('../../utilities/excelReporter');
const logger           = require('../../utilities/logger');

let driver;
let suiteStart;
const stats = { total: 0, passed: 0, failed: 0, skipped: 0 };

// ── Global setup / teardown ───────────────────────────────────────────────────

before(async function () {
  this.timeout(120000);
  suiteStart = Date.now();

  logger.info('═══════════════════════════════════════════');
  logger.info('  NewMomCircle E2E  |  Execution Starting ');
  logger.info('═══════════════════════════════════════════');

  try {
    driver = await DriverFactory.createDriver();
    global.driver = driver;
    logger.info(`Device : ${global.deviceName}  Android ${global.androidVersion}`);
  } catch (err) {
    logger.error(`Global setup failed: ${err.message}`);
    throw err;
  }
});

// ── Per-test hooks ────────────────────────────────────────────────────────────

beforeEach(async function () {
  this.currentTest._startTime = Date.now();
  stats.total++;
  logger.info(`\n▶  ${this.currentTest.fullTitle()}`);
});

afterEach(async function () {
  const test      = this.currentTest;
  const name      = test.title;
  const state     = test.state;
  const duration  = Date.now() - (test._startTime || Date.now());
  const module    = (test.fullTitle().split(' - ')[0] || 'General').split(' ')[0];
  const testId    = name.split(':')[0].trim();

  if      (state === 'passed')  { stats.passed++;  logger.info (`✅ PASSED  (${duration}ms) ${name}`); }
  else if (state === 'failed')  { stats.failed++;  logger.error(`❌ FAILED  (${duration}ms) ${name}`); }
  else if (state === 'pending') { stats.skipped++; logger.warn (`⏭ SKIPPED  ${name}`); }

  // Test Cases sheet
  excelReporter.addTestCaseRow({
    id:       testId,
    module,
    scenario: name,
    device:   global.deviceName   || 'Unknown',
    status:   (state || 'SKIPPED').toUpperCase(),
    start:    new Date(test._startTime || Date.now()).toISOString(),
    end:      new Date().toISOString(),
    duration: `${duration}ms`,
  });

  // Failure artifacts
  if (state === 'failed') {
    const safe = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    let screenshotPath = 'N/A';
    let logcatPath     = 'N/A';
    let activity       = 'unknown';

    if (driver) {
      try { screenshotPath = await ScreenshotUtils.captureFailureScreenshot(driver, safe); } catch { /* no-op */ }
      try { logcatPath     = await DeviceLogUtils.captureLogcat(driver, safe);             } catch { /* no-op */ }
      try { activity       = await driver.getCurrentActivity();                             } catch { /* no-op */ }
    }

    excelReporter.addFailedTestRow({
      test:       name,
      reason:     (test.err?.message || 'Unknown').substring(0, 250),
      screenshot: screenshotPath,
      device:     global.deviceName    || 'Unknown',
      version:    global.androidVersion || 'Unknown',
      activity,
    });
  }

  // Execution Logs sheet
  excelReporter.addExecutionLogRow({
    timestamp: new Date().toISOString(),
    test:      name,
    step:      state === 'failed' ? 'TEST FAILED' : 'COMPLETED',
    result:    (state || 'SKIP').toUpperCase(),
    remarks:   state === 'failed' ? (test.err?.message || '').substring(0, 120) : '',
    time:      `${duration}ms`,
    failure:   state === 'failed' ? (test.err?.stack  || '').substring(0, 300) : '',
  });
});

// ── Global teardown ───────────────────────────────────────────────────────────

after(async function () {
  const duration    = Date.now() - suiteStart;
  const passPct     = stats.total > 0
    ? ((stats.passed / stats.total) * 100).toFixed(1)
    : '0.0';

  logger.info('\n═══════════════════════════════════════════');
  logger.info('  Execution Complete');
  logger.info(`  Total   : ${stats.total}`);
  logger.info(`  Passed  : ${stats.passed}  ✅`);
  logger.info(`  Failed  : ${stats.failed}  ❌`);
  logger.info(`  Skipped : ${stats.skipped} ⏭`);
  logger.info(`  Pass %  : ${passPct}%`);
  logger.info(`  Duration: ${(duration / 1000).toFixed(1)}s`);
  logger.info('═══════════════════════════════════════════\n');

  // Summary sheet
  excelReporter.addSummaryRow({
    date:       new Date().toISOString().split('T')[0],
    device:     global.deviceName    || 'Unknown',
    version:    global.androidVersion || 'Unknown',
    total:      stats.total,
    passed:     stats.passed,
    failed:     stats.failed,
    skipped:    stats.skipped,
    percentage: `${passPct}%`,
    duration:   `${(duration / 1000).toFixed(1)}s`,
  });

  await excelReporter.saveReport();
  await DriverFactory.quitDriver(driver);
  global.driver = null;
});

module.exports = { getDriver: () => driver };
