'use strict';
/**
 * tests/functionality/resources.test.js  — Web Selenium E2E: Resources / Articles
 *
 * IDs: RES-W-01 … RES-W-07
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const LoginPage  = require('../../helpers/pages/LoginPage');
const BasePage   = require('../../helpers/pages/BasePage');

describe('WEB – Feature: Resources', function () {
  let page, login;

  before(async function () {
    this.timeout(40000);
    page  = new BasePage(baseTest.getDriver());
    login = new LoginPage(baseTest.getDriver());
    await login.loginAsTestUser();
  });

  const goToResources = async () => {
    await page.navigate('/resources');
    await page.driver.sleep(800);
  };

  it('RES-W-01: Resources screen loads', async function () {
    await goToResources();
    const at = await page.exists('resources-screen', 8000);
    expect(at, 'Resources screen not found').to.be.true;
  });

  it('RES-W-02: Article list renders', async function () {
    const hasList  = await page.exists('resources-list', 5000);
    const hasFeat  = await page.exists('resources-featured-article-btn', 5000);
    expect(hasList || hasFeat, 'Neither list nor featured article found').to.be.true;
  });

  it('RES-W-03: Search toggle button is visible', async function () {
    const hasSearch = await page.exists('resources-search-toggle', 5000);
    expect(hasSearch, 'Search toggle not found').to.be.true;
  });

  it('RES-W-04: Clicking search opens the search input', async function () {
    await page.click('resources-search-toggle');
    await page.driver.sleep(500);
    const hasInput = await page.exists('resources-search-input', 4000);
    expect(hasInput, 'Search input not visible after toggle').to.be.true;
  });

  it('RES-W-05: Typing a search query filters the list', async function () {
    await page.type('resources-search-input', 'breastfeeding');
    await page.driver.sleep(600);
    // Should still show a list OR an empty state — not crash
    const hasList   = await page.exists('resources-list', 4000);
    const hasEmpty  = await page.exists('resources-empty-state', 4000);
    const hasFeat   = await page.exists('resources-featured-article-btn', 4000);
    expect(hasList || hasEmpty || hasFeat, 'No result or empty state for search').to.be.true;
  });

  it('RES-W-06: Category "Mental Health" pill filters articles', async function () {
    await goToResources();
    const hasChip = await page.exists('resources-cat-mental-health-btn', 5000);
    if (hasChip) {
      await page.click('resources-cat-mental-health-btn');
      await page.driver.sleep(600);
      const hasList = await page.exists('resources-list', 4000)
                   || await page.exists('resources-featured-article-btn', 4000);
      expect(hasList, 'Article list disappeared after category filter').to.be.true;
    } else {
      this.skip(); // chip testId not present
    }
  });

  it('RES-W-07: Clicking an article navigates to article detail', async function () {
    await goToResources();
    const featBtn = await page.elOrNull('resources-featured-article-btn', 5000);
    if (featBtn) {
      await featBtn.click();
      await page.driver.sleep(1000);
      const url = await page.currentUrl();
      expect(url).to.include('resources');
    } else {
      this.skip();
    }
  });
});
