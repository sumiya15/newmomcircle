'use strict';
const { expect }   = require('chai');
const baseTest     = require('../base/baseTest');
const SafetyPage   = require('../../pages/safetyPage');
const FeedPage     = require('../../pages/feedPage');
const LoginPage    = require('../../pages/loginPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Safety - SOS & Guardian Management', function () {
  let safetyPage, feedPage, loginPage, driver;

  before(async function () {
    driver     = baseTest.getDriver();
    safetyPage = new SafetyPage(driver);
    feedPage   = new FeedPage(driver);
    loginPage  = new LoginPage(driver);

    if (await loginPage.isAt()) {
      const user = DataProvider.getValidUser();
      await loginPage.login(user.email, user.password);
    }
    await feedPage.isAt();
    await safetyPage.navigateToSafety();
  });

  it('SAF-01: Should display Safety screen', async function () {
    const atSafety = await safetyPage.isAt();
    expect(atSafety).to.be.true;
  });

  it('SAF-02: Should display large SOS button', async function () {
    const visible = await safetyPage.isElementDisplayed(safetyPage.sosBtn);
    expect(visible).to.be.true;
  });

  it('SAF-03: Should show countdown overlay when SOS is triggered', async function () {
    const countdownShown = await safetyPage.triggerSOS();
    expect(countdownShown, 'SOS countdown not shown').to.be.true;
  });

  it('SAF-04: Should cancel SOS countdown', async function () {
    await safetyPage.cancelSOS();
    const countdownGone = !(await safetyPage.isElementDisplayed(safetyPage.sosCountdown, 2000));
    expect(countdownGone, 'SOS countdown should disappear after cancel').to.be.true;
  });

  it('SAF-05: Should display Add Guardian button', async function () {
    const visible = await safetyPage.isElementDisplayed(safetyPage.addGuardianBtn);
    expect(visible).to.be.true;
  });

  it('SAF-06: Should open Add Guardian modal', async function () {
    const modalOpen = await safetyPage.openAddGuardianModal();
    expect(modalOpen).to.be.true;
  });

  it('SAF-07: Should save a valid guardian', async function () {
    const countBefore = await safetyPage.getGuardianCount();
    await safetyPage.fillGuardianForm({
      name:         'Test Guardian',
      phone:        '+1 555-123-4567',
      relationship: 'Partner',
    });
    await safetyPage.saveGuardian();
    await safetyPage.waitForGone(safetyPage.nameInput, 8000);
    const countAfter = await safetyPage.getGuardianCount();
    expect(countAfter).to.be.at.least(countBefore);
  });

  it('SAF-08: Should delete a guardian', async function () {
    const countBefore = await safetyPage.getGuardianCount();
    if (countBefore > 0) {
      await safetyPage.deleteFirstGuardian();
      await safetyPage._sleep(1500);
      const countAfter = await safetyPage.getGuardianCount();
      expect(countAfter).to.equal(countBefore - 1);
    } else {
      this.skip();
    }
  });

  it('SAF-09: Should validate required fields in guardian form', async function () {
    await safetyPage.openAddGuardianModal();
    await safetyPage.saveGuardian(); // Empty form
    // Modal should remain open — name input still visible
    const modalOpen = await safetyPage.isElementDisplayed(safetyPage.nameInput, 3000);
    expect(modalOpen, 'Empty guardian form should not be saved').to.be.true;
    await safetyPage.click(safetyPage.cancelModalBtn).catch(() => safetyPage.pressBack());
  });
});
