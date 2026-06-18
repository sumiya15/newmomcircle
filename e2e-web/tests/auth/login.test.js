'use strict';
/**
 * tests/auth/login.test.js  — Web Selenium E2E: Login flow
 *
 * IDs tested:
 *   LGN-W-01 … LGN-W-09
 */
const { expect }  = require('chai');
const baseTest    = require('../base/baseTest');
const LoginPage   = require('../../helpers/pages/LoginPage');
const FeedPage    = require('../../helpers/pages/FeedPage');
const testConfig  = require('../../config/testConfig');

describe('WEB – Auth: Login', function () {
  let login, feed;

  before(function () {
    login = new LoginPage(baseTest.getDriver());
    feed  = new FeedPage(baseTest.getDriver());
  });

  beforeEach(async function () { await login.open(); });

  // ── LGN-W-01 ──────────────────────────────────────────────────────────────
  it('LGN-W-01: Login page loads and email input is visible', async function () {
    const visible = await login.isAt();
    expect(visible, 'login-email-input not visible').to.be.true;
  });

  // ── LGN-W-02 ──────────────────────────────────────────────────────────────
  it('LGN-W-02: Submitting empty form shows validation error', async function () {
    await login.login('', '');
    const err = await login.getErrorText();
    expect(err.length, 'No error shown for empty submit').to.be.above(0);
  });

  // ── LGN-W-03 ──────────────────────────────────────────────────────────────
  it('LGN-W-03: Invalid email format shows error', async function () {
    await login.login('notanemail', 'Password1!');
    const err = await login.getErrorText();
    expect(err.toLowerCase()).to.match(/email|invalid|format/);
  });

  // ── LGN-W-04 ──────────────────────────────────────────────────────────────
  it('LGN-W-04: Correct credentials navigate to Feed', async function () {
    await login.login(testConfig.testUser.email, testConfig.testUser.password);
    const atFeed = await feed.isAt();
    expect(atFeed, 'Not redirected to feed after valid login').to.be.true;
  });

  // ── LGN-W-05 ──────────────────────────────────────────────────────────────
  it('LGN-W-05: Wrong password shows error', async function () {
    await login.login(testConfig.testUser.email, 'WrongPass999!');
    const err = await login.getErrorText();
    expect(err.length, 'No error shown for wrong password').to.be.above(0);
  });

  // ── LGN-W-06 ──────────────────────────────────────────────────────────────
  it('LGN-W-06: Forgot password link navigates to correct page', async function () {
    await login.clickForgotPassword();
    await login.waitForUrl('/auth/forgot-password');
    const url = await login.currentUrl();
    expect(url).to.include('forgot-password');
  });

  // ── LGN-W-07 ──────────────────────────────────────────────────────────────
  it('LGN-W-07: Sign Up link navigates to signup page', async function () {
    await login.clickSignupLink();
    await login.waitForUrl('/auth/signup');
    const url = await login.currentUrl();
    expect(url).to.include('signup');
  });

  // ── LGN-W-08 ──────────────────────────────────────────────────────────────
  it('LGN-W-08: Password field is masked (type=password)', async function () {
    const el   = await login.el('login-password-input');
    const type = await el.getAttribute('type');
    expect(type).to.equal('password');
  });

  // ── LGN-W-09 ──────────────────────────────────────────────────────────────
  it('LGN-W-09: Page title contains brand name', async function () {
    const title = await baseTest.getDriver().getTitle();
    expect(title.toLowerCase()).to.include('newmomcircle');
  });
});
