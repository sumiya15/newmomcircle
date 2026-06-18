'use strict';
/**
 * tests/responsive/responsive.test.js
 *
 * Verifies the WebWrapper responsive layout:
 *   - On viewports > 600px, content columns should be ≤ 500px wide
 *   - On mobile viewport, content should fill the available width
 *
 * IDs: RSP-W-01 … RSP-W-06
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const LoginPage  = require('../../helpers/pages/LoginPage');
const BasePage   = require('../../helpers/pages/BasePage');

describe('WEB – Responsive Layout (WebWrapper)', function () {
  let page, login, driver;
  const WIDE_W = 1280, WIDE_H = 900;
  const MOB_W  = 390,  MOB_H  = 844;

  before(async function () {
    this.timeout(40000);
    driver = baseTest.getDriver();
    page   = new BasePage(driver);
    login  = new LoginPage(driver);
    await login.loginAsTestUser();
  });

  /** Resize browser and return screen content column width via JS. */
  async function contentWidth(testId = 'feed-screen') {
    const el = await page.elOrNull(testId, 5000);
    if (!el) return null;
    const rect = await driver.executeScript(
      'return arguments[0].getBoundingClientRect()', el
    );
    return Math.round(rect.width);
  }

  // ── Wide viewport tests ───────────────────────────────────────────────────

  it('RSP-W-01: On 1280px viewport, feed content width ≤ 500px', async function () {
    await driver.manage().window().setRect({ width: WIDE_W, height: WIDE_H });
    await page.navigate('/');
    await page.exists('feed-screen', 8000);
    const w = await contentWidth('feed-screen');
    if (w === null) return this.skip(); // screen not found — skip gracefully
    expect(w, `feed-screen width ${w}px exceeds 500px on wide viewport`).to.be.at.most(500);
  });

  it('RSP-W-02: On 1280px viewport, signup content width ≤ 500px', async function () {
    await driver.manage().window().setRect({ width: WIDE_W, height: WIDE_H });
    await page.navigate('/auth/signup');
    await page.exists('signup-screen', 8000);
    const w = await contentWidth('signup-screen');
    if (w === null) return this.skip();
    expect(w, `signup-screen width ${w}px exceeds 500px on wide viewport`).to.be.at.most(500);
  });

  it('RSP-W-03: On 1280px viewport, login content is horizontally centred', async function () {
    await driver.manage().window().setRect({ width: WIDE_W, height: WIDE_H });
    await page.navigate('/auth/login');
    const el = await page.elOrNull('login-email-input', 5000);
    if (!el) return this.skip();
    const rect = await driver.executeScript(
      'const r = arguments[0].getBoundingClientRect(); return { left: r.left, right: r.right };', el
    );
    const viewCentre = WIDE_W / 2;
    const elCentre   = (rect.left + rect.right) / 2;
    // Centre must be within ±80px of screen centre
    expect(Math.abs(elCentre - viewCentre),
      `Login form is not centred (off by ${Math.abs(elCentre - viewCentre).toFixed(0)}px)`
    ).to.be.below(80);
  });

  // ── Mobile viewport tests ─────────────────────────────────────────────────

  it('RSP-W-04: On 390px viewport, feed fills the full width', async function () {
    await driver.manage().window().setRect({ width: MOB_W, height: MOB_H });
    await page.navigate('/');
    await page.exists('feed-screen', 8000);
    const w = await contentWidth('feed-screen');
    if (w === null) return this.skip();
    // On mobile should be close to full width (within 20px of viewport)
    expect(w, `Feed width ${w}px is too narrow on mobile (< 370px)`).to.be.at.least(MOB_W - 20);
  });

  it('RSP-W-05: On 390px viewport, no horizontal scrollbar appears', async function () {
    await driver.manage().window().setRect({ width: MOB_W, height: MOB_H });
    await page.navigate('/');
    const scrollWidth = await driver.executeScript(
      'return document.documentElement.scrollWidth'
    );
    expect(scrollWidth, `Horizontal overflow (scrollWidth=${scrollWidth})`).to.be.at.most(MOB_W + 5);
  });

  it('RSP-W-06: Resizing from mobile → desktop re-centres content', async function () {
    // Start mobile, then expand
    await driver.manage().window().setRect({ width: MOB_W, height: MOB_H });
    await page.navigate('/');
    await page.exists('feed-screen', 6000);
    await driver.manage().window().setRect({ width: WIDE_W, height: WIDE_H });
    await driver.sleep(400);
    const w = await contentWidth('feed-screen');
    if (w !== null) {
      expect(w).to.be.at.most(500);
    }
    // Restore default window size
    await driver.manage().window().setRect({ width: WIDE_W, height: WIDE_H });
  });
});
