'use strict';
/**
 * tests/functionality/safety.test.js  — Web Selenium E2E: Safety / SOS
 *
 * IDs: SFT-W-01 … SFT-W-05
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const LoginPage  = require('../../helpers/pages/LoginPage');
const BasePage   = require('../../helpers/pages/BasePage');

describe('WEB – Feature: Safety', function () {
  let page, login;

  before(async function () {
    this.timeout(40000);
    page  = new BasePage(baseTest.getDriver());
    login = new LoginPage(baseTest.getDriver());
    await login.loginAsTestUser();
  });

  const goToSafety = async () => {
    await page.navigate('/safety');
    await page.driver.sleep(800);
  };

  it('SFT-W-01: Safety screen loads', async function () {
    await goToSafety();
    const at = await page.exists('safety-screen', 8000);
    expect(at, 'Safety screen not found').to.be.true;
  });

  it('SFT-W-02: SOS button is visible on the screen', async function () {
    const hasSos = await page.exists('safety-sos-btn', 5000);
    expect(hasSos, 'SOS button not found').to.be.true;
  });

  it('SFT-W-03: Add Guardian button is visible', async function () {
    const hasAdd = await page.exists('safety-add-guardian-btn', 5000);
    expect(hasAdd, 'Add Guardian button not found').to.be.true;
  });

  it('SFT-W-04: Clicking Add Guardian opens the modal form', async function () {
    await page.click('safety-add-guardian-btn');
    await page.driver.sleep(600);
    const hasInput = await page.exists('safety-guardian-name-input', 5000);
    expect(hasInput, 'Guardian name input not shown after clicking Add').to.be.true;
  });

  it('SFT-W-05: Cancelling guardian form closes the modal', async function () {
    const cancelBtn = await page.elOrNull('safety-cancel-guardian-btn', 3000);
    if (cancelBtn) {
      await cancelBtn.click();
      await page.driver.sleep(500);
      const stillOpen = await page.exists('safety-guardian-name-input', 1000);
      expect(stillOpen, 'Modal still open after cancel').to.be.false;
    } else {
      this.skip();
    }
  });
});
