'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   search-bar, search-trending-grid, search-recent-item,
//   search-clear-recent-btn, search-tab-posts, search-tab-people,
//   search-tab-circles, search-result-post, search-result-person,
//   search-result-circle, search-empty-state

class SearchPage extends BasePage {
  get searchBar()        { return '~search-bar'; }
  get trendingGrid()     { return '~search-trending-grid'; }
  get recentItem()       { return '~search-recent-item'; }
  get clearRecentBtn()   { return '~search-clear-recent-btn'; }
  get tabPosts()         { return '~search-tab-posts'; }
  get tabPeople()        { return '~search-tab-people'; }
  get tabCircles()       { return '~search-tab-circles'; }
  get resultPost()       { return '~search-result-post'; }
  get resultPerson()     { return '~search-result-person'; }
  get resultCircle()     { return '~search-result-circle'; }
  get emptyState()       { return '~search-empty-state'; }

  async searchFor(query) {
    await this.clearAndType(this.searchBar, query);
    await this.hideKeyboard();
    await this._sleep(800); // debounce
  }

  async clearSearch() {
    await this.clearField(this.searchBar);
  }

  async clearRecentSearches() {
    if (await this.isElementDisplayed(this.clearRecentBtn, 2000)) {
      await this.click(this.clearRecentBtn);
    }
  }

  async switchTab(tab) {
    const tabs = {
      posts:   this.tabPosts,
      people:  this.tabPeople,
      circles: this.tabCircles,
    };
    await this.click(tabs[tab]);
  }

  async getResultCount(tab = 'posts') {
    const selectors = { posts: this.resultPost, people: this.resultPerson, circles: this.resultCircle };
    return this.getElementCount(selectors[tab]);
  }

  async isEmptyState() {
    return this.isElementDisplayed(this.emptyState, 3000);
  }

  async isAt() {
    return this.isElementDisplayed(this.searchBar, 8000);
  }
}

module.exports = SearchPage;
