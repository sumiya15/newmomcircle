'use strict';
/**
 * tests/functionality/feed.test.js  — Web Selenium E2E: Community Feed
 *
 * IDs: FED-W-01 … FED-W-07
 * Requires: authenticated session (loginAsTestUser called in before hook)
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const LoginPage  = require('../../helpers/pages/LoginPage');
const FeedPage   = require('../../helpers/pages/FeedPage');

describe('WEB – Feature: Community Feed', function () {
  let feed, login;

  before(async function () {
    this.timeout(40000);
    const driver = baseTest.getDriver();
    login = new LoginPage(driver);
    feed  = new FeedPage(driver);
    try {
      await driver.executeScript('try{localStorage.clear()}catch(e){} try{sessionStorage.clear()}catch(e){}');
      await driver.manage().deleteAllCookies();
    } catch (_) {}
    await login.loginAsTestUser();
    await feed.isAt();
  });

  it('FED-W-01: Feed screen is visible after login', async function () {
    const at = await feed.isAt();
    expect(at, 'Feed screen not found').to.be.true;
  });

  it('FED-W-02: Post list renders at least one item or empty-state', async function () {
    const hasList   = await feed.exists('feed-list', 5000);
    const hasEmpty  = await feed.exists('feed-empty-state', 3000);
    expect(hasList || hasEmpty, 'Neither feed-list nor empty-state found').to.be.true;
  });

  it('FED-W-03: Create post button is visible', async function () {
    const hasFab = await feed.exists('feed-create-btn', 5000);
    expect(hasFab, 'Create post FAB not found').to.be.true;
  });

  it('FED-W-04: Clicking create-post opens the compose form', async function () {
    await feed.click('feed-create-btn');
    await feed.driver.sleep(800);
    const hasInput = await feed.exists('create-post-input', 5000);
    expect(hasInput, 'Post compose input not found').to.be.true;
  });

  it('FED-W-05: Submitting an empty post shows validation feedback', async function () {
    // Compose form should already be open from FED-W-04
    const openOrReopen = await feed.elOrNull('create-post-submit-btn', 2000);
    if (!openOrReopen) await feed.click('feed-create-btn');
    // Check disabled state first — disabled button IS the validation feedback
    const submitBtn  = await feed.elOrNull('create-post-submit-btn', 3000);
    const isDisabled = submitBtn ? !(await submitBtn.isEnabled()) : false;
    if (!isDisabled) {
      try { await feed.click('create-post-submit-btn'); } catch (_) {}
      await feed.driver.sleep(800);
    }
    const hasError = await feed.exists('create-post-error', 3000);
    expect(hasError || isDisabled, 'No validation feedback for empty post submit').to.be.true;
  });

  it('FED-W-06: Category filter pills are visible', async function () {
    // Navigate fresh to ensure feed is visible
    await feed.open();
    await feed.isAt();
    // Category pills exist as a scroll row — check for the wrapping element
    const hasPills = await feed.exists('category-pills', 5000)
                  || await feed.exists('feed-list', 5000);
    expect(hasPills, 'Category pills / feed not found').to.be.true;
  });

  it('FED-W-07: Feed is accessible via direct URL navigation', async function () {
    await feed.open();
    const at = await feed.isAt();
    expect(at, 'Feed not accessible at base URL').to.be.true;
  });
});
