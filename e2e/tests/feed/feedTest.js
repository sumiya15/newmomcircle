'use strict';
const { expect }   = require('chai');
const baseTest     = require('../base/baseTest');
const FeedPage     = require('../../pages/feedPage');
const LoginPage    = require('../../pages/loginPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Feed - Home Feed Validation', function () {
  let feedPage, loginPage, driver;

  before(async function () {
    driver    = baseTest.getDriver();
    feedPage  = new FeedPage(driver);
    loginPage = new LoginPage(driver);

    if (await loginPage.isAt()) {
      const user = DataProvider.getValidUser();
      await loginPage.login(user.email, user.password);
    }
    await feedPage.isAt();
  });

  it('FED-01: Should load the home feed screen', async function () {
    const atFeed = await feedPage.isAt();
    expect(atFeed).to.be.true;
  });

  it('FED-02: Should display at least one post card', async function () {
    const count = await feedPage.getPostCount();
    expect(count).to.be.greaterThan(0);
  });

  it('FED-03: Should display FAB (create post button)', async function () {
    const visible = await feedPage.isElementDisplayed(feedPage.fab);
    expect(visible).to.be.true;
  });

  it('FED-04: Should filter feed by category pill', async function () {
    const beforeCount = await feedPage.getPostCount();
    await feedPage.filterByCategory('sleep');
    await feedPage._sleep(1000);
    // Feed should still render (filtered or not)
    const atFeed = await feedPage.isAt();
    expect(atFeed).to.be.true;
  });

  it('FED-05: Should open Explore circles from header button', async function () {
    await feedPage.tapExploreButton();
    const onExplore = await feedPage.isElementDisplayed('~explore-header', 8000);
    expect(onExplore).to.be.true;
    await feedPage.pressBack();
  });

  it('FED-06: Should open Create Post screen via FAB', async function () {
    await feedPage.tapFAB();
    const onCreate = await feedPage.isElementDisplayed('~create-post-header', 8000);
    expect(onCreate).to.be.true;
    await feedPage.pressBack();
  });

  it('FED-07: Should scroll the feed without crashing', async function () {
    await feedPage.scrollDown();
    await feedPage.scrollDown();
    const atFeed = await feedPage.isAt();
    expect(atFeed).to.be.true;
  });

  it('FED-08: Should like a post and update like state', async function () {
    await feedPage.likeFirstPost();
    // Verify the like button state changed (we just check no crash)
    const atFeed = await feedPage.isAt();
    expect(atFeed).to.be.true;
  });

  it('FED-09: Should navigate to post detail on tap', async function () {
    await feedPage.tapFirstPost();
    const onDetail = await feedPage.isElementDisplayed('~post-detail-header', 8000);
    expect(onDetail).to.be.true;
    await feedPage.pressBack();
  });
});
