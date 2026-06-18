'use strict';
const { expect } = require('chai');
const { buildDriver }    = require('../../helpers/driverFactory');
const { waitForTestId, waitForUrl, safeClick, screenshot, waitForPageLoad } = require('../../helpers/waitHelpers');
const testConfig  = require('../../config/testConfig');

const BASE = testConfig.baseUrl;

describe('NAVIGATION – Landing Page', function () {
  this.timeout(90000);
  this.retries(testConfig.retries.test);

  let driver;

  before(async function () { driver = await buildDriver(); });
  after(async function ()  { if (driver) await driver.quit(); });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      await screenshot(driver, `landing-FAIL-${this.currentTest.title.replace(/\s+/g, '_').slice(0, 40)}`);
    }
  });

  // ── TC-NAV-001 ───────────────────────────────────────────────────────────
  it('TC-NAV-001: Landing page loads successfully (200 status, body visible)', async function () {
    await driver.get(BASE);
    await waitForPageLoad(driver);
    const bodyText = await driver.findElement(require('selenium-webdriver').By.tagName('body')).getText();
    expect(bodyText.length).to.be.greaterThan(0);
  });

  // ── TC-NAV-002 ───────────────────────────────────────────────────────────
  it('TC-NAV-002: Hero CTA "Begin Your Journey" navigates to signup', async function () {
    await driver.get(BASE);
    await waitForPageLoad(driver);
    await safeClick(driver, 'landing-hero-cta-btn');
    await waitForUrl(driver, 'signup');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('signup');
  });

  // ── TC-NAV-003 ───────────────────────────────────────────────────────────
  it('TC-NAV-003: "Sign In" nav link navigates to login page', async function () {
    await driver.get(BASE);
    await waitForPageLoad(driver);
    await safeClick(driver, 'landing-signin-btn');
    await waitForUrl(driver, 'login');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('login');
  });

  // ── TC-NAV-004 ───────────────────────────────────────────────────────────
  it('TC-NAV-004: "Get Started Free" nav link navigates to signup', async function () {
    await driver.get(BASE);
    await waitForPageLoad(driver);
    await safeClick(driver, 'landing-signup-btn');
    await waitForUrl(driver, 'signup');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('signup');
  });

  // ── TC-NAV-005 ───────────────────────────────────────────────────────────
  it('TC-NAV-005: Mobile menu toggle button is present', async function () {
    // Resize to mobile viewport
    await driver.manage().window().setRect({ width: 390, height: 844 });
    await driver.get(BASE);
    await waitForPageLoad(driver);
    const hamburger = await waitForTestId(driver, 'landing-mobile-menu-btn');
    expect(await hamburger.isDisplayed()).to.be.true;
    // Restore
    await driver.manage().window().setRect(testConfig.browser.windowSize);
  });

  // ── TC-NAV-006 ───────────────────────────────────────────────────────────
  it('TC-NAV-006: Page title contains "NewMomCircle"', async function () {
    await driver.get(BASE);
    await waitForPageLoad(driver);
    const title = await driver.getTitle();
    expect(title.toLowerCase()).to.include('newmomcircle');
  });
});
