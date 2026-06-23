'use strict';
/**
 * tests/functionality/profile.test.js  — Web Selenium E2E: Profile
 *
 * IDs: PRF-W-01 … PRF-W-06
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const LoginPage  = require('../../helpers/pages/LoginPage');
const BasePage   = require('../../helpers/pages/BasePage');

describe('WEB – Feature: Profile', function () {
  let page, login;

  before(async function () {
    this.timeout(40000);
    const driver = baseTest.getDriver();
    page  = new BasePage(driver);
    login = new LoginPage(driver);
    try {
      await driver.executeScript('try{localStorage.clear()}catch(e){} try{sessionStorage.clear()}catch(e){}');
      await driver.manage().deleteAllCookies();
    } catch (_) {}
    await login.loginAsTestUser();
  });

  const goToProfile = async () => {
    await page.navigate('/profile');
    await page.driver.sleep(800);
  };

  it('PRF-W-01: Profile screen loads', async function () {
    await goToProfile();
    const at = await page.exists('profile-screen', 8000);
    expect(at, 'Profile screen not found').to.be.true;
  });

  it('PRF-W-02: User name is displayed in the hero', async function () {
    const hasName = await page.exists('profile-name-text', 5000);
    expect(hasName, 'Profile name element not found').to.be.true;
  });

  it('PRF-W-03: Sign Out button is visible', async function () {
    const hasLogout = await page.exists('profile-logout-btn', 5000);
    expect(hasLogout, 'Logout button not found').to.be.true;
  });

  it('PRF-W-04: Edit profile button is visible', async function () {
    const hasEdit = await page.exists('profile-edit-btn', 5000)
                 || await page.exists('profile-settings-btn', 5000);
    expect(hasEdit, 'Edit/settings button not found').to.be.true;
  });

  it('PRF-W-05: Signing out redirects to login', async function () {
    this.timeout(35000);
    await page.click('profile-logout-btn');
    // signOut() API call can be slow when Supabase is rate-limited
    await page.waitForUrl('/auth/login', 25000);
    const url = await page.currentUrl();
    expect(url).to.include('login');
  });

  it('PRF-W-06: Unauthenticated access to /profile redirects to login', async function () {
    // After sign-out, try to go back to profile
    await page.navigate('/profile');
    await page.driver.sleep(1200);
    const url = await page.currentUrl();
    expect(url).to.include('login');
  });
});
