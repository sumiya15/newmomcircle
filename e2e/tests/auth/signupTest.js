'use strict';
const { expect }  = require('chai');
const baseTest    = require('../base/baseTest');
const LoginPage   = require('../../pages/loginPage');
const SignupPage  = require('../../pages/signupPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Auth - Signup Validation', function () {
  let loginPage, signupPage, driver;

  before(async function () {
    driver     = baseTest.getDriver();
    loginPage  = new LoginPage(driver);
    signupPage = new SignupPage(driver);
    // Navigate to signup
    await loginPage.tapSignupLink().catch(() => { /* already on signup */ });
  });

  it('SGN-01: Should display signup screen', async function () {
    const visible = await signupPage.isAt();
    expect(visible).to.be.true;
  });

  it('SGN-02: Should show error when all fields are empty', async function () {
    await signupPage.submit();
    const msg = await signupPage.getErrorMessage();
    expect(msg.toLowerCase()).to.match(/required|field|empty/);
  });

  it('SGN-03: Should show error for invalid email format', async function () {
    await signupPage.fillForm({ name: 'Test User', email: 'bademail', password: 'Pass123!' });
    await signupPage.submit();
    const msg = await signupPage.getErrorMessage();
    expect(msg.toLowerCase()).to.match(/invalid|email|format/);
  });

  it('SGN-04: Should show error for weak password (less than 8 chars)', async function () {
    await signupPage.fillForm({ name: 'Test User', email: 'user@test.com', password: 'abc' });
    await signupPage.submit();
    const msg = await signupPage.getErrorMessage();
    expect(msg.toLowerCase()).to.match(/password|weak|characters|short/);
  });

  it('SGN-05: Should show password strength indicator', async function () {
    await signupPage.fillForm({ password: 'StrongP@ss1!' });
    const strength = await signupPage.getPasswordStrength();
    expect(strength).to.not.be.empty;
  });

  it('SGN-06: Should navigate back to login screen', async function () {
    await signupPage.tapLoginLink();
    const atLogin = await loginPage.isAt();
    expect(atLogin).to.be.true;
  });
});
