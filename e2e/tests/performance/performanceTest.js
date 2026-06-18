'use strict';
const { expect }      = require('chai');
const baseTest        = require('../base/baseTest');
const FeedPage        = require('../../pages/feedPage');
const LoginPage       = require('../../pages/loginPage');
const JournalPage     = require('../../pages/journalPage');
const PerformanceUtils = require('../../utilities/performanceUtils');
const DataProvider    = require('../../utilities/dataProvider');

// SLA thresholds (ms)
const SLA = {
  appLaunch:    8000,
  loginAction:  5000,
  feedLoad:     6000,
  screenSwitch: 3000,
  journalSave:  10000,
};

describe('Performance - Screen Load & Response Times', function () {
  let feedPage, loginPage, journalPage, driver;

  before(async function () {
    driver      = baseTest.getDriver();
    feedPage    = new FeedPage(driver);
    loginPage   = new LoginPage(driver);
    journalPage = new JournalPage(driver);
  });

  it('PER-01: App launch time should be within SLA', async function () {
    const launchMs = await PerformanceUtils.measureAppLaunchTime(
      driver, '~login-title', 20000
    );
    global.perfAppLaunch = launchMs;
    expect(launchMs, `Launch took ${launchMs}ms — SLA: ${SLA.appLaunch}ms`).to.be.below(SLA.appLaunch);
  });

  it('PER-02: Login action should complete within SLA', async function () {
    const user = DataProvider.getValidUser();
    const loginMs = await PerformanceUtils.measureActionDuration(
      async () => {
        await loginPage.login(user.email, user.password);
        await feedPage.isAt();
      },
      'Login Action'
    );
    global.perfLogin = loginMs;
    expect(loginMs, `Login took ${loginMs}ms — SLA: ${SLA.loginAction}ms`).to.be.below(SLA.loginAction);
  });

  it('PER-03: Home Feed load time should be within SLA', async function () {
    const feedMs = await PerformanceUtils.measureScreenLoad(driver, '~feed-header');
    global.perfFeed = feedMs;
    expect(feedMs, `Feed loaded in ${feedMs}ms — SLA: ${SLA.feedLoad}ms`).to.be.below(SLA.feedLoad);
  });

  it('PER-04: Tab switch to Journal should be within SLA', async function () {
    const switchMs = await PerformanceUtils.measureActionDuration(
      async () => {
        await journalPage.navigateToJournal();
      },
      'Tab Switch → Journal'
    );
    expect(switchMs).to.be.below(SLA.screenSwitch);
  });

  it('PER-05: Journal entry save should complete within SLA', async function () {
    await journalPage.openNewEntryModal();
    const saveMs = await PerformanceUtils.measureActionDuration(
      async () => {
        await journalPage.writeEntry('Performance test journal entry — automated.');
        await journalPage.saveEntry();
        await journalPage.waitForGone('~journal-text-area', 15000);
      },
      'Journal Entry Save'
    );
    global.perfJournalSave = saveMs;
    expect(saveMs).to.be.below(SLA.journalSave);
  });

  it('PER-06: Performance metrics summary', async function () {
    const summary = PerformanceUtils.getSummary();
    if (summary) {
      console.log('\n  📊 Performance Summary:');
      console.log(`     Count: ${summary.count} measurements`);
      console.log(`     Min:   ${summary.min}ms`);
      console.log(`     Max:   ${summary.max}ms`);
      console.log(`     Avg:   ${summary.avg}ms`);
    }
    // This test always passes — it's a reporting test
    expect(true).to.be.true;
  });
});
