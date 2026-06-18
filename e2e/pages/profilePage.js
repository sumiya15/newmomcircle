'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   profile-header, profile-username, profile-avatar, profile-edit-btn,
//   profile-logout-btn, profile-settings-btn, profile-baby-age-pill,
//   profile-stats-posts, profile-stats-circles, profile-stats-journal,
//   profile-milestone-badge, profile-delete-confirm-sheet,
//   tab-profile

class ProfilePage extends BasePage {
  get header()        { return '~profile-header'; }
  get username()      { return '~profile-username'; }
  get editBtn()       { return '~profile-edit-btn'; }
  get logoutBtn()     { return '~profile-logout-btn'; }
  get settingsBtn()   { return '~profile-settings-btn'; }
  get babyAgePill()   { return '~profile-baby-age-pill'; }
  get statsPosts()    { return '~profile-stats-posts'; }
  get statsCircles()  { return '~profile-stats-circles'; }
  get statsJournal()  { return '~profile-stats-journal'; }
  get deleteSheet()   { return '~profile-delete-confirm-sheet'; }
  get bottomNavTab()  { return '~tab-profile'; }

  async navigateToProfile() {
    await this.click(this.bottomNavTab);
    await this.isAt();
  }

  async getUserName() {
    return this.getText(this.username);
  }

  async tapEditProfile() {
    await this.click(this.editBtn);
  }

  async tapSettings() {
    await this.click(this.settingsBtn);
  }

  async logout() {
    await this.click(this.logoutBtn);
  }

  async getPostsCount() {
    return this.getText(this.statsPosts);
  }

  async getCirclesCount() {
    return this.getText(this.statsCircles);
  }

  async getBabyAge() {
    return this.getText(this.babyAgePill);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = ProfilePage;
