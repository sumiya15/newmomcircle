'use strict';
const BasePage    = require('./basePage');
const GestureUtils = require('../utilities/gestureUtils');

// testID props required in React Native:
//   resources-header, resources-featured-card, resources-article-card,
//   resources-category-pill, resources-events-banner, resources-search-input,
//   article-hero, article-body, article-share-btn, article-related-card,
//   tab-resources

class ResourcesPage extends BasePage {
  get header()        { return '~resources-header'; }
  get featuredCard()  { return '~resources-featured-card'; }
  get articleCard()   { return '~resources-article-card'; }
  get categoryPill()  { return '~resources-category-pill'; }
  get eventsBanner()  { return '~resources-events-banner'; }
  get searchInput()   { return '~resources-search-input'; }
  get articleHero()   { return '~article-hero'; }
  get articleBody()   { return '~article-body'; }
  get shareBtn()      { return '~article-share-btn'; }
  get relatedCard()   { return '~article-related-card'; }
  get bottomNavTab()  { return '~tab-resources'; }

  async navigateToResources() {
    await this.click(this.bottomNavTab);
    await this.isAt();
  }

  async searchArticle(query) {
    await this.clearAndType(this.searchInput, query);
    await this.hideKeyboard();
    await this._sleep(600);
  }

  async filterByCategory(cat) {
    await this.click(`~resources-category-${cat}`);
  }

  async tapFeaturedArticle() {
    await this.click(this.featuredCard);
    return this.isElementDisplayed(this.articleHero, 6000);
  }

  async tapFirstArticle() {
    await this.click(this.articleCard);
    return this.isElementDisplayed(this.articleHero, 6000);
  }

  async tapEventsBanner() {
    await this.click(this.eventsBanner);
  }

  async scrollDown() {
    await GestureUtils.scrollDown(this.driver);
  }

  async getArticleCount() {
    return this.getElementCount(this.articleCard);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = ResourcesPage;
