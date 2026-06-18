'use strict';
/**
 * tests/auth/forgotPassword.test.js  — Web Selenium E2E: Forgot Password
 *
 * IDs tested: FPW-W-01 … FPW-W-05
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const BasePage   = require('../../helpers/pages/BasePage');

describe('WEB – Auth: Forgot Password', function () {
  let page;

  before(function () {
    page = new BasePage(baseTest.getDriver());
  });

  beforeEach(async function () { await page.navigate('/auth/forgot-password'); });

  it('FPW-W-01: Forgot password page loads', async function () {
    const url = await page.currentUrl();
    expect(url).to.include('forgot-password');
  });

  it('FPW-W-02: Empty email submit shows validation error', async function () {
    await page.click('forgot-password-submit-btn');
    await page.driver.sleep(800);
    const err = await page.elOrNull('forgot-password-error', 3000)
             || await page.elOrNull('form-error', 3000);
    expect(err).to.not.be.null;
  });

  it('FPW-W-03: Invalid email shows error', async function () {
    await page.type('forgot-password-email-input', 'notvalid');
    await page.click('forgot-password-submit-btn');
    await page.driver.sleep(800);
    const err = await page.elOrNull('forgot-password-error', 3000)
             || await page.elOrNull('form-error', 3000);
    expect(err).to.not.be.null;
  });

  it('FPW-W-04: Valid email submit shows success/confirmation message', async function () {
    await page.type('forgot-password-email-input', 'test@example.com');
    await page.click('forgot-password-submit-btn');
    await page.driver.sleep(2000);
    // Success message OR redirect is acceptable
    const url = await page.currentUrl();
    const hasSuccess = await page.exists('forgot-password-success', 4000);
    const hasConfirm = await page.exists('forgot-password-confirm', 4000);
    expect(
      url.includes('confirm') || url.includes('success') || hasSuccess || hasConfirm,
      'No success feedback after valid email submission'
    ).to.be.true;
  });

  it('FPW-W-05: Back to Login link is present', async function () {
    const hasLink = await page.exists('forgot-password-back-link', 5000);
    expect(hasLink, 'Back-to-login link not found').to.be.true;
  });
});
