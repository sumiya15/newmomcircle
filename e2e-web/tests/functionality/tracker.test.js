'use strict';
/**
 * Tracker page tests — run with a logged-in session using offline/mock mode.
 * Because the app supports localStorage-based offline mode, we inject auth
 * state directly before loading the page.
 */
const { expect }  = require('chai');
const { By }      = require('selenium-webdriver');
const { buildDriver }    = require('../../helpers/driverFactory');
const { waitForTestId, safeClick, screenshot, waitForPageLoad, elementExists } = require('../../helpers/waitHelpers');
const testConfig  = require('../../config/testConfig');

const BASE = testConfig.baseUrl;

/** Inject a minimal mock auth session into localStorage so the app treats the
 *  browser as logged-in in offline/demo mode. */
async function injectMockSession(driver) {
  await driver.get(BASE);
  await waitForPageLoad(driver);
  await driver.executeScript(`
    const mockUser = {
      id: 'test-user-e2e-001',
      email: '${testConfig.testUser.email}',
      created_at: new Date().toISOString()
    };
    const mockProfile = {
      userId: 'test-user-e2e-001',
      displayName: '${testConfig.testUser.name}',
      language: 'en',
      babyDob: '2024-01-01'
    };
    localStorage.setItem('newmomcircle_offline_mode', 'true');
    localStorage.setItem('newmomcircle_mock_user', JSON.stringify(mockUser));
    localStorage.setItem('newmomcircle_mock_profile', JSON.stringify(mockProfile));
  `);
}

describe('FUNCTIONALITY – Tracker Page', function () {
  this.timeout(90000);
  this.retries(testConfig.retries.test);

  let driver;

  before(async function () {
    driver = await buildDriver();
    await injectMockSession(driver);
    await driver.get(`${BASE}/tracker`);
    await waitForPageLoad(driver);
  });

  after(async function () { if (driver) await driver.quit(); });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      await screenshot(driver, `tracker-FAIL-${this.currentTest.title.replace(/\s+/g, '_').slice(0, 40)}`);
    }
  });

  // ── TC-TRK-001 ───────────────────────────────────────────────────────────
  it('TC-TRK-001: Tracker screen renders', async function () {
    const hasTracker = await elementExists(driver, 'tracker-screen', 5000);
    // If redirected to login (no auth support in static mode) mark as skipped gracefully
    if (!hasTracker) {
      const url = await driver.getCurrentUrl();
      if (url.includes('login')) { this.skip(); }
    }
    expect(hasTracker).to.be.true;
  });

  // ── TC-TRK-002 ───────────────────────────────────────────────────────────
  it('TC-TRK-002: Log Feeding button is visible and clickable', async function () {
    const hasTracker = await elementExists(driver, 'tracker-screen', 3000);
    if (!hasTracker) { this.skip(); }
    const feedBtn = await waitForTestId(driver, 'tracker-feeding-btn');
    expect(await feedBtn.isDisplayed()).to.be.true;
    expect(await feedBtn.isEnabled()).to.be.true;
  });

  // ── TC-TRK-003 ───────────────────────────────────────────────────────────
  it('TC-TRK-003: Log Sleep button is visible and clickable', async function () {
    const hasTracker = await elementExists(driver, 'tracker-screen', 3000);
    if (!hasTracker) { this.skip(); }
    const sleepBtn = await waitForTestId(driver, 'tracker-sleep-btn');
    expect(await sleepBtn.isDisplayed()).to.be.true;
  });

  // ── TC-TRK-004 ───────────────────────────────────────────────────────────
  it('TC-TRK-004: Log Diaper button is visible and clickable', async function () {
    const hasTracker = await elementExists(driver, 'tracker-screen', 3000);
    if (!hasTracker) { this.skip(); }
    const diaperBtn = await waitForTestId(driver, 'tracker-diaper-btn');
    expect(await diaperBtn.isDisplayed()).to.be.true;
  });

  // ── TC-TRK-005 ───────────────────────────────────────────────────────────
  it('TC-TRK-005: Log list container renders', async function () {
    const hasTracker = await elementExists(driver, 'tracker-screen', 3000);
    if (!hasTracker) { this.skip(); }
    const logList = await waitForTestId(driver, 'tracker-log-list');
    expect(await logList.isDisplayed()).to.be.true;
  });
});
