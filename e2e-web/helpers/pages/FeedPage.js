'use strict';
const BasePage = require('./BasePage');

class FeedPage extends BasePage {
  async open()  { await this.navigate('/'); }
  async isAt()  { return this.exists('feed-screen', 8000); }

  async createPost(text) {
    await this.click('feed-create-btn');
    await this.type('create-post-input', text);
    await this.click('create-post-submit-btn');
    await this.driver.sleep(1200);
  }

  async getFirstPostText() {
    const el = await this.elOrNull('post-card-0', 4000)
            || await this.elOrNull('feed-list', 4000);
    return el ? el.getText() : '';
  }

  async filterByCategory(category) {
    // Category pills rendered as data-testid="category-pill-{name}"
    const testId = `category-pill-${category.toLowerCase().replace(/\s+/g, '-')}`;
    await this.click(testId);
    await this.driver.sleep(600);
  }

  async isFeedVisible() {
    return this.exists('feed-list', 8000);
  }
}

module.exports = FeedPage;
