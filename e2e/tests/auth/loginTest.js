'use strict';
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const LoginPage  = require('../../pages/loginPage');
const FeedPage   = require('../../pages/feedPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Auth - Login Validation', function () {
  let loginPage, feedPage, driver;

  before(function () {
    driver    = baseTest.getDriver();
    loginPage = new LoginPage(driver);
    feedPage  = new FeedPage(driver);
  });

  it('LGN-01: Should display login screen on app launch', async function () {
    const visible = await loginPage.isAt();
    expect(visible, 'Login screen not visible').to.be.true;
  });

  it('LGN-02: Should show error for empty email field', async function () {
    await loginPage.login('', 'Password123!');
    const msg = await loginPage.getErrorMessage();
    expect(msg.toLowerCase()).to.match(/email|required|field/);
  });

  it('LGN-03: Should show error for empty password field', async function () {
    await loginPage.login('test@example.com', '');
    const msg = await loginPage.getErrorMessage();
    expect(msg.toLowerCase()).to.match(/password|required|field/);
  });

  it('LGN-04: Should show error for invalid email format', async function () {
    await loginPage.login('notanemail', 'Password123!');
    const msg = await loginPage.getErrorMessage();
    expect(msg.toLowerCase()).to.match(/invalid|email|format/);
  });

  it('LGN-05: Should show error for invalid credentials', async function () {
    await loginPage.login('wrong@example.com', 'WrongPass999!');
    const msg = await loginPage.getErrorMessage();
    expect(msg.toLowerCase()).to.match(/invalid|credentials|incorrect|password/);
  });

  it('LGN-06: Should navigate to Forgot Password screen', async function () {
    await loginPage.tapForgotPassword();
    const onForgot = await loginPage.isElementDisplayed('~forgot-password-title', 6000);
    expect(onForgot).to.be.true;
    await loginPage.pressBack();
  });

  it('LGN-07: Should navigate to Signup screen from login', async function () {
    await loginPage.tapSignupLink();
    const onSignup = await loginPage.isElementDisplayed('~signup-title', 6000);
    expect(onSignup).to.be.true;
    await loginPage.pressBack();
  });

  it('LGN-08: Should login successfully with valid credentials', async function () {
    const user = DataProvider.getValidUser();
    await loginPage.login(user.email, user.password);
    const atFeed = await feedPage.isAt();
    expect(atFeed, 'Feed not shown after valid login').to.be.true;
  });
});
