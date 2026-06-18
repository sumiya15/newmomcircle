'use strict';
const BasePage    = require('./basePage');
const GestureUtils = require('../utilities/gestureUtils');

// testID props required in React Native:
//   feed-header, feed-post-card, feed-post-like-btn, feed-post-comment-btn,
//   feed-fab, feed-category-pill, feed-explore-btn,
//   feed-search-result, feed-empty-state, tab-feed

class FeedPage extends BasePage {
  get header()         { return '~feed-header'; }
  get postCard()       { return '~feed-post-card'; }
  get likeBtn()        { return '~feed-post-like-btn'; }
  get commentBtn()     { return '~feed-post-comment-btn'; }
  get fab()            { return '~feed-fab'; }
  get categoryPill()   { return '~feed-category-pill'; }
  get exploreBtn()     { return '~feed-explore-btn'; }
  get emptyState()     { return '~feed-empty-state'; }
  get bottomNavFeed()  { return '~tab-feed'; }

  async waitForFeed() {
    return this.isElementDisplayed(this.header, 15000);
  }

  async scrollDown() {
    await GestureUtils.scrollDown(this.driver);
  }

  async tapFirstPost() {
    await this.click(this.postCard);
  }

  async likeFirstPost() {
    await this.click(this.likeBtn);
  }

  async tapFAB() {
    await this.click(this.fab);
  }

  async filterByCategory(categoryTestId) {
    await this.scrollUntilVisible(`~feed-category-${categoryTestId}`, 5, 'down');
    await this.click(`~feed-category-${categoryTestId}`);
  }

  async tapExploreButton() {
    await this.click(this.exploreBtn);
  }

  async getPostCount() {
    return this.getElementCount(this.postCard);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = FeedPage;
