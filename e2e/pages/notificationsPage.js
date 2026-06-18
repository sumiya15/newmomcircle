'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   notifications-header, notifications-filter-tab,
//   notifications-item, notifications-mark-all-btn,
//   notifications-empty-state, notifications-accept-btn,
//   notifications-decline-btn

class NotificationsPage extends BasePage {
  get header()        { return '~notifications-header'; }
  get filterTab()     { return '~notifications-filter-tab'; }
  get notifItem()     { return '~notifications-item'; }
  get markAllBtn()    { return '~notifications-mark-all-btn'; }
  get emptyState()    { return '~notifications-empty-state'; }
  get acceptBtn()     { return '~notifications-accept-btn'; }
  get declineBtn()    { return '~notifications-decline-btn'; }

  async filterBy(filterName) {
    await this.click(`~notifications-filter-${filterName}`);
  }

  async markAllRead() {
    await this.click(this.markAllBtn);
  }

  async getNotificationCount() {
    return this.getElementCount(this.notifItem);
  }

  async acceptFirstInvite() {
    if (await this.isElementDisplayed(this.acceptBtn, 3000)) {
      await this.click(this.acceptBtn);
    }
  }

  async declineFirstInvite() {
    if (await this.isElementDisplayed(this.declineBtn, 3000)) {
      await this.click(this.declineBtn);
    }
  }

  async dismissFirst() {
    if (await this.isElementDisplayed(this.notifItem, 2000)) {
      const el = await this.driver.$(this.notifItem);
      const loc = await el.getLocation();
      const size = await el.getSize();
      await this.driver.performActions([{
        type: 'pointer', id: 'swipe', parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: loc.x + Math.floor(size.width / 2), y: loc.y + Math.floor(size.height / 2) },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 600, x: loc.x + size.width - 10, y: loc.y + Math.floor(size.height / 2) },
          { type: 'pointerUp', button: 0 },
        ],
      }]);
    }
  }

  async isEmptyState() {
    return this.isElementDisplayed(this.emptyState, 3000);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = NotificationsPage;
