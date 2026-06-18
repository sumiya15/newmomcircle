'use strict';
const { expect }   = require('chai');
const baseTest     = require('../base/baseTest');
const ProfilePage  = require('../../pages/profilePage');
const FeedPage     = require('../../pages/feedPage');
const LoginPage    = require('../../pages/loginPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Profile - User Profile & Settings', function () {
  let profilePage, feedPage, loginPage, driver;

  before(async function () {
    driver      = baseTest.getDriver();
    profilePage = new ProfilePage(driver);
    feedPage    = new FeedPage(driver);
    loginPage   = new LoginPage(driver);

    if (await loginPage.isAt()) {
      const user = DataProvider.getValidUser();
      await loginPage.login(user.email, user.password);
    }
    await feedPage.isAt();
    await profilePage.navigateToProfile();
  });

  it('PRF-01: Should display Profile screen', async function () {
    const atProfile = await profilePage.isAt();
    expect(atProfile).to.be.true;
  });

  it('PRF-02: Should display user name on profile', async function () {
    const name = await profilePage.getUserName();
    expect(name).to.not.be.empty;
  });

  it('PRF-03: Should display post count stat', async function () {
    const visible = await profilePage.isElementDisplayed(profilePage.statsPosts, 3000);
    expect(visible).to.be.true;
  });

  it('PRF-04: Should navigate to Edit Profile screen', async function () {
    await profilePage.tapEditProfile();
    const onEdit = await profilePage.isElementDisplayed('~edit-profile-header', 8000);
    expect(onEdit).to.be.true;
    await profilePage.pressBack();
  });

  it('PRF-05: Should navigate to Settings screen', async function () {
    await profilePage.tapSettings();
    const onSettings = await profilePage.isElementDisplayed('~settings-header', 8000);
    expect(onSettings).to.be.true;
    await profilePage.pressBack();
  });

  it('PRF-06: Should display baby age pill', async function () {
    const visible = await profilePage.isElementDisplayed(profilePage.babyAgePill, 3000);
    if (visible) {
      const age = await profilePage.getBabyAge();
      expect(age).to.not.be.empty;
    } else {
      this.skip(); // Baby DOB not set
    }
  });

  it('PRF-07: Should display logout button', async function () {
    const visible = await profilePage.isElementDisplayed(profilePage.logoutBtn);
    expect(visible).to.be.true;
  });

  it('PRF-08: Should display edit button', async function () {
    const visible = await profilePage.isElementDisplayed(profilePage.editBtn);
    expect(visible).to.be.true;
  });
});
