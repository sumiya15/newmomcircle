'use strict';
/**
 * tests/functionality/journal.test.js  — Web Selenium E2E: Journal
 *
 * IDs: JRL-W-01 … JRL-W-06
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const LoginPage  = require('../../helpers/pages/LoginPage');
const BasePage   = require('../../helpers/pages/BasePage');

describe('WEB – Feature: Journal', function () {
  let page, login;

  before(async function () {
    this.timeout(40000);
    page  = new BasePage(baseTest.getDriver());
    login = new LoginPage(baseTest.getDriver());
    await login.loginAsTestUser();
  });

  const goToJournal = async () => {
    await page.navigate('/journal');
    await page.driver.sleep(800);
  };

  it('JRL-W-01: Journal screen loads after authentication', async function () {
    await goToJournal();
    const at = await page.exists('journal-screen', 8000);
    expect(at, 'Journal screen not found').to.be.true;
  });

  it('JRL-W-02: "New Entry" button is visible', async function () {
    const hasBt = await page.exists('journal-new-btn', 5000);
    expect(hasBt, '"New Entry" button not found').to.be.true;
  });

  it('JRL-W-03: Clicking "New Entry" opens the compose modal', async function () {
    await page.click('journal-new-btn');
    await page.driver.sleep(600);
    const hasInput = await page.exists('journal-content-input', 5000);
    expect(hasInput, 'Journal content input not shown').to.be.true;
  });

  it('JRL-W-04: Submitting empty entry shows error or disables button', async function () {
    // Ensure modal is open
    const open = await page.elOrNull('journal-content-input', 2000);
    if (!open) {
      await page.click('journal-new-btn');
      await page.driver.sleep(600);
    }
    const btn = await page.elOrNull('journal-submit-btn', 3000);
    if (btn) {
      const disabled = !(await btn.isEnabled());
      expect(disabled, 'Submit btn should be disabled for empty entry').to.be.true;
    }
  });

  it('JRL-W-05: Entry list or empty state is visible', async function () {
    await goToJournal();
    const hasList  = await page.exists('journal-entries-list', 5000);
    const hasEmpty = await page.exists('journal-empty-state', 3000);
    expect(hasList || hasEmpty, 'Neither entries list nor empty state found').to.be.true;
  });

  it('JRL-W-06: Journal URL is correct', async function () {
    await goToJournal();
    const url = await page.currentUrl();
    expect(url).to.include('journal');
  });
});
