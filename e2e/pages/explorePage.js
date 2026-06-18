'use strict';
const BasePage    = require('./basePage');
const GestureUtils = require('../utilities/gestureUtils');

// testID props required in React Native:
//   explore-header, explore-search-input, explore-circle-card,
//   explore-join-btn, explore-leave-btn, explore-category-{cat},
//   explore-empty-state, circle-detail-header, circle-detail-join-btn,
//   circle-detail-tab-posts, circle-detail-tab-members, circle-detail-tab-about

class ExplorePage extends BasePage {
  get header()         { return '~explore-header'; }
  get searchInput()    { return '~explore-search-input'; }
  get circleCard()     { return '~explore-circle-card'; }
  get joinBtn()        { return '~explore-join-btn'; }
  get leaveBtn()       { return '~explore-leave-btn'; }
  get emptyState()     { return '~explore-empty-state'; }
  get detailHeader()   { return '~circle-detail-header'; }
  get detailJoinBtn()  { return '~circle-detail-join-btn'; }
  get detailTabPosts() { return '~circle-detail-tab-posts'; }
  get detailTabMembers(){ return '~circle-detail-tab-members'; }
  get detailTabAbout() { return '~circle-detail-tab-about'; }

  async searchCircle(query) {
    await this.clearAndType(this.searchInput, query);
    await this.hideKeyboard();
  }

  async clearSearch() {
    await this.clearField(this.searchInput);
  }

  async filterByCategory(cat) {
    await this.click(`~explore-category-${cat}`);
  }

  async tapFirstCircle() {
    await this.click(this.circleCard);
  }

  async joinFirstCircle() {
    await this.click(this.joinBtn);
  }

  async leaveFirstCircle() {
    await this.click(this.leaveBtn);
  }

  async scrollDown() {
    await GestureUtils.scrollDown(this.driver);
  }

  async getCircleCount() {
    return this.getElementCount(this.circleCard);
  }

  async switchDetailTab(tab) {
    const tabs = {
      posts:   this.detailTabPosts,
      members: this.detailTabMembers,
      about:   this.detailTabAbout,
    };
    await this.click(tabs[tab] || this.detailTabPosts);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = ExplorePage;
