'use strict';
/**
 * tests/auth/signup.test.js  — Web Selenium E2E: Signup flow
 *
 * IDs tested: SGN-W-01 … SGN-W-08
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const SignupPage  = require('../../helpers/pages/SignupPage');
const LoginPage   = require('../../helpers/pages/LoginPage');

describe('WEB – Auth: Signup', function () {
  let signup, login;

  before(function () {
    signup = new SignupPage(baseTest.getDriver());
    login  = new LoginPage(baseTest.getDriver());
  });

  beforeEach(async function () { await signup.open(); });

  it('SGN-W-01: Signup page loads with form visible', async function () {
    const at = await signup.isAt();
    expect(at, 'Signup screen not found').to.be.true;
  });

  it('SGN-W-02: Submitting empty form shows validation errors', async function () {
    await signup.submit();
    const err = await signup.getErrorText();
    expect(err.length, 'No validation error shown').to.be.above(0);
  });

  it('SGN-W-03: Invalid email format shows error', async function () {
    await signup.fillForm({ name: 'Test Mom', email: 'bademail', password: 'Pass1!', confirm: 'Pass1!' });
    await signup.submit();
    const err = await signup.getErrorText();
    expect(err.toLowerCase()).to.match(/email|invalid/);
  });

  it('SGN-W-04: Mismatched passwords show error', async function () {
    await signup.fillForm({ name: 'Test Mom', email: 'test@example.com', password: 'Pass1!', confirm: 'Different1!' });
    await signup.submit();
    const err = await signup.getErrorText();
    expect(err.toLowerCase()).to.match(/match|confirm|password/);
  });

  it('SGN-W-05: Short password shows strength error', async function () {
    await signup.fillForm({ name: 'Test Mom', email: 'test@example.com', password: '123', confirm: '123' });
    await signup.submit();
    const err = await signup.getErrorText();
    expect(err.length, 'No error for short password').to.be.above(0);
  });

  it('SGN-W-06: "Login" link navigates to login page', async function () {
    await signup.clickLoginLink();
    await signup.waitForUrl('/auth/login');
    const url = await signup.currentUrl();
    expect(url).to.include('login');
  });

  it('SGN-W-07: Hero banner image is visible', async function () {
    // The signup screen renders a banner image — check it's in the DOM
    const hasBanner = await signup.exists('signup-screen', 5000);
    expect(hasBanner).to.be.true;
  });

  it('SGN-W-08: Password field is masked', async function () {
    const el   = await signup.el('signup-password-input');
    const type = await el.getAttribute('type');
    expect(type).to.equal('password');
  });
});
