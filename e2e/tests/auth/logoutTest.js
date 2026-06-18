'use strict';
const { expect }   = require('chai');
const baseTest     = require('../base/baseTest');
const LoginPage    = require('../../pages/loginPage');
const FeedPage     = require('../../pages/feedPage');
const ProfilePage  = require('../../pages/profilePage');
const DataProvider = require('../../utilities/dataProvider');

describe('Auth - Logout & Session', function () {
  let loginPage, feedPage, profilePage, driver;

  before(async function () {
    driver      = baseTest.getDriver();
    loginPage   = new LoginPage(driver);
    feedPage    = new FeedPage(driver);
    profilePage = new ProfilePage(driver);

    // Ensure logged in
    if (await loginPage.isAt()) {
      const user = DataProvider.getValidUser();
      await loginPage.login(user.email, user.password);
      await feedPage.isAt();
    }
  });

  it('LGO-01: Should be logged in and on Feed', async function () {
    const atFeed = await feedPage.isAt();
    expect(atFeed).to.be.true;
  });

  it('LGO-02: Should navigate to Profile tab', async function () {
    await profilePage.navigateToProfile();
    const atProfile = await profilePage.isAt();
    expect(atProfile).to.be.true;
  });

  it('LGO-03: Should show logout button on profile screen', async function () {
    const visible = await profilePage.isElementDisplayed(profilePage.logoutBtn);
    expect(visible).to.be.true;
  });

  it('LGO-04: Should logout and return to login screen', async function () {
    await profilePage.logout();
    const atLogin = await loginPage.isAt();
    expect(atLogin, 'Should be on login screen after logout').to.be.true;
  });

  it('LGO-05: Should not allow back navigation to authenticated area after logout', async function () {
    await loginPage.pressBack();
    // Should remain on login or go to splash — not feed
    const stillOnLogin = await loginPage.isAt();
    expect(stillOnLogin).to.be.true;
  });
});
