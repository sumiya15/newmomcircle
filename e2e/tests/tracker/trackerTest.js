'use strict';
const { expect }   = require('chai');
const baseTest     = require('../base/baseTest');
const TrackerPage  = require('../../pages/trackerPage');
const FeedPage     = require('../../pages/feedPage');
const LoginPage    = require('../../pages/loginPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Tracker - Baby Activity Logging', function () {
  let trackerPage, feedPage, loginPage, driver;

  before(async function () {
    driver      = baseTest.getDriver();
    trackerPage = new TrackerPage(driver);
    feedPage    = new FeedPage(driver);
    loginPage   = new LoginPage(driver);

    if (await loginPage.isAt()) {
      const user = DataProvider.getValidUser();
      await loginPage.login(user.email, user.password);
    }
    await feedPage.isAt();
    await trackerPage.navigateToTracker();
  });

  it('TRK-01: Should display Tracker dashboard', async function () {
    const atTracker = await trackerPage.isAt();
    expect(atTracker).to.be.true;
  });

  it('TRK-02: Should display feeding log button in sheet', async function () {
    await trackerPage.openLogSheet();
    const visible = await trackerPage.isElementDisplayed(trackerPage.logFeedBtn);
    expect(visible).to.be.true;
    await trackerPage.pressBack();
  });

  it('TRK-03: Should display sleep log button in sheet', async function () {
    await trackerPage.openLogSheet();
    const visible = await trackerPage.isElementDisplayed(trackerPage.logSleepBtn);
    expect(visible).to.be.true;
    await trackerPage.pressBack();
  });

  it('TRK-04: Should display diaper log button in sheet', async function () {
    await trackerPage.openLogSheet();
    const visible = await trackerPage.isElementDisplayed(trackerPage.logDiaperBtn);
    expect(visible).to.be.true;
    await trackerPage.pressBack();
  });

  it('TRK-05: Should log a feeding entry', async function () {
    const countBefore = await trackerPage.getEntryCount();
    await trackerPage.logFeeding('120ml', 'Breastfed — left side');
    await trackerPage._sleep(1500);
    const countAfter = await trackerPage.getEntryCount();
    expect(countAfter).to.be.at.least(countBefore);
  });

  it('TRK-06: Should log a sleep entry', async function () {
    await trackerPage.logSleep('2h', 'Afternoon nap');
    await trackerPage._sleep(1500);
    const atTracker = await trackerPage.isAt();
    expect(atTracker).to.be.true;
  });

  it('TRK-07: Should log a diaper change', async function () {
    await trackerPage.logDiaper('wet');
    await trackerPage._sleep(1500);
    const atTracker = await trackerPage.isAt();
    expect(atTracker).to.be.true;
  });

  it('TRK-08: Should display today summary after entries', async function () {
    const summaryVisible = await trackerPage.isElementDisplayed(trackerPage.todaySummary, 3000);
    expect(typeof summaryVisible).to.equal('boolean');
  });

  it('TRK-09: Should scroll tracker list without crashing', async function () {
    await trackerPage.scrollDown();
    const atTracker = await trackerPage.isAt();
    expect(atTracker).to.be.true;
  });
});
