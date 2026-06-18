'use strict';
/**
 * e2e-web/tests/base/baseTest.js
 *
 * Global Mocha hooks — spins up a Chrome WebDriver before any test suite
 * and tears it down cleanly afterwards.  The ExcelReporter is populated
 * by the hooks so every test file gets automatic reporting with zero boiler-
 * plate.  Individual test files just require this file and use `getDriver()`.
 *
 * Mocha loads this via --file in .mocharc.json so it runs ONCE per session.
 */

const { buildDriver }    = require('../../helpers/driverFactory');
const excelReporter      = require('../../helpers/excelReporter');
const { screenshot }     = require('../../helpers/waitHelpers');
const logger             = require('../../helpers/logger');
const testConfig         = require('../../config/testConfig');

let driver = null;
const sessionStart = Date.now();

/* ── Global state tracked across all suites ─────────────────────────────── */
let totalTests  = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

/* ── Root-level hooks ────────────────────────────────────────────────────── */

before(async function () {
  this.timeout(60000);
  logger.info('🚀 Starting Web E2E session');
  driver = await buildDriver();
  logger.info(`Browser launched — Base URL: ${testConfig.baseUrl}`);
});

after(async function () {
  this.timeout(30000);

  const durationSec = ((Date.now() - sessionStart) / 1000).toFixed(1);
  const pct = totalTests > 0
    ? ((passedTests / totalTests) * 100).toFixed(1)
    : '0.0';

  excelReporter.addSummaryRow({
    date:       new Date().toISOString().slice(0, 19).replace('T', ' '),
    browser:    'Chrome (headless)',
    baseUrl:    testConfig.baseUrl,
    total:      totalTests,
    passed:     passedTests,
    failed:     failedTests,
    skipped:    skippedTests,
    percentage: pct + '%',
    duration:   durationSec + 's',
  });

  const reportPath = await excelReporter.saveReport();
  logger.info(`📊 Excel report: ${reportPath}`);
  logger.info(`✅ Session complete — ${passedTests}/${totalTests} passed (${pct}%)`);

  if (driver) {
    await driver.quit().catch(() => {});
    driver = null;
  }
});

/* ── Per-test hooks (track pass/fail, capture screenshots on failure) ─── */

beforeEach(function () {
  totalTests++;
  this.currentTest._startTime = Date.now();
});

afterEach(async function () {
  const test      = this.currentTest;
  const durationMs = Date.now() - (test._startTime || Date.now());
  const module    = (test.parent && test.parent.title) || 'Unknown';
  const status    = test.state === 'passed' ? 'PASSED'
                  : test.state === 'failed' ? 'FAILED'
                  : 'SKIPPED';

  if (status === 'PASSED')  passedTests++;
  else if (status === 'FAILED') failedTests++;
  else skippedTests++;

  /* ── Write test-case row ── */
  excelReporter.addTestCaseRow({
    id:       `TC-${String(totalTests).padStart(3, '0')}`,
    module,
    scenario: test.fullTitle(),
    browser:  'Chrome',
    status,
    start:    new Date(test._startTime || Date.now()).toISOString().slice(0, 19).replace('T', ' '),
    end:      new Date().toISOString().slice(0, 19).replace('T', ' '),
    duration: (durationMs / 1000).toFixed(2) + 's',
  });

  /* ── Capture screenshot + write failed-test row on failure ── */
  if (status === 'FAILED' && driver) {
    let screenshotPath = '';
    try {
      screenshotPath = await screenshot(driver, test.title.replace(/[^a-z0-9]/gi, '_').slice(0, 40));
    } catch { /* ignore screenshot errors */ }

    excelReporter.addFailedTestRow({
      test:       test.fullTitle(),
      reason:     test.err ? test.err.message : 'Unknown',
      screenshot: screenshotPath,
      browser:    'Chrome',
      url:        driver ? await driver.getCurrentUrl().catch(() => '') : '',
    });

    logger.error(`FAILED: ${test.fullTitle()} — ${test.err && test.err.message}`);
  }

  /* ── Write execution-log row ── */
  excelReporter.addExecutionLogRow({
    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
    test:      test.fullTitle(),
    step:      'Test complete',
    result:    status,
    remarks:   status === 'FAILED' && test.err ? test.err.message.slice(0, 120) : '',
    time:      (durationMs / 1000).toFixed(2) + 's',
    failure:   status === 'FAILED' && test.err ? (test.err.stack || '').slice(0, 200) : '',
  });
});

/* ── Export helpers for test files ─────────────────────────────────────── */

function getDriver() {
  return driver;
}

module.exports = { getDriver };
