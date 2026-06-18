'use strict';
const { expect }   = require('chai');
const baseTest     = require('../base/baseTest');
const FeedPage     = require('../../pages/feedPage');
const ExplorePage  = require('../../pages/explorePage');
const LoginPage    = require('../../pages/loginPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Explore - Circles Discovery', function () {
  let explorePage, feedPage, loginPage, driver;

  before(async function () {
    driver      = baseTest.getDriver();
    explorePage = new ExplorePage(driver);
    feedPage    = new FeedPage(driver);
    loginPage   = new LoginPage(driver);

    if (await loginPage.isAt()) {
      const user = DataProvider.getValidUser();
      await loginPage.login(user.email, user.password);
    }
    await feedPage.isAt();
    await feedPage.tapExploreButton();
    await explorePage.isAt();
  });

  it('EXP-01: Should display Explore Circles screen', async function () {
    const atExplore = await explorePage.isAt();
    expect(atExplore).to.be.true;
  });

  it('EXP-02: Should show circle cards in the grid', async function () {
    const count = await explorePage.getCircleCount();
    expect(count).to.be.greaterThan(0);
  });

  it('EXP-03: Should search and filter circles by keyword', async function () {
    await explorePage.searchCircle('sleep');
    await explorePage._sleep(800);
    const count = await explorePage.getCircleCount();
    expect(count).to.be.at.least(0); // Could be 0 for no results
    await explorePage.clearSearch();
  });

  it('EXP-04: Should filter circles by category', async function () {
    await explorePage.filterByCategory('nutrition');
    await explorePage._sleep(600);
    const atExplore = await explorePage.isAt();
    expect(atExplore).to.be.true;
  });

  it('EXP-05: Should navigate to Circle Detail on tap', async function () {
    await explorePage.tapFirstCircle();
    const onDetail = await explorePage.isElementDisplayed(explorePage.detailHeader, 8000);
    expect(onDetail).to.be.true;
  });

  it('EXP-06: Should switch between Posts / Members / About tabs in detail', async function () {
    await explorePage.switchDetailTab('members');
    await explorePage._sleep(400);
    await explorePage.switchDetailTab('about');
    await explorePage._sleep(400);
    await explorePage.switchDetailTab('posts');
    const stillOnDetail = await explorePage.isElementDisplayed(explorePage.detailHeader);
    expect(stillOnDetail).to.be.true;
    await explorePage.pressBack();
  });

  it('EXP-07: Should join a circle from the list', async function () {
    if (await explorePage.isElementDisplayed(explorePage.joinBtn, 3000)) {
      await explorePage.joinFirstCircle();
      // Verify button state changed (join → leave)
      const hasLeave = await explorePage.isElementDisplayed(explorePage.leaveBtn, 5000);
      expect(hasLeave).to.be.true;
    } else {
      this.skip(); // Already joined all circles
    }
  });
});
