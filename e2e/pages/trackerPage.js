'use strict';
const BasePage    = require('./basePage');
const GestureUtils = require('../utilities/gestureUtils');

// testID props required in React Native:
//   tracker-header, tracker-log-feed-btn, tracker-log-sleep-btn,
//   tracker-log-diaper-btn, tracker-log-mood-btn,
//   tracker-amount-input, tracker-notes-input, tracker-save-btn,
//   tracker-entry-card, tracker-today-summary, tracker-empty-state,
//   tab-tracker

class TrackerPage extends BasePage {
  get header()       { return '~tracker-header'; }
  get logFeedBtn()   { return '~tracker-log-feed-btn'; }
  get logSleepBtn()  { return '~tracker-log-sleep-btn'; }
  get logDiaperBtn() { return '~tracker-log-diaper-btn'; }
  get logMoodBtn()   { return '~tracker-log-mood-btn'; }
  get amountInput()  { return '~tracker-amount-input'; }
  get notesInput()   { return '~tracker-notes-input'; }
  get saveBtn()      { return '~tracker-save-btn'; }
  get entryCard()    { return '~tracker-entry-card'; }
  get todaySummary() { return '~tracker-today-summary'; }
  get emptyState()   { return '~tracker-empty-state'; }
  get bottomNavTab() { return '~tab-tracker'; }

  async navigateToTracker() {
    await this.click(this.bottomNavTab);
    await this.isAt();
  }

  async logFeeding(amount, notes = '') {
    await this.click(this.logFeedBtn);
    if (await this.isElementDisplayed(this.amountInput, 3000)) {
      await this.clearAndType(this.amountInput, amount);
    }
    if (notes && await this.isElementDisplayed(this.notesInput, 2000)) {
      await this.clearAndType(this.notesInput, notes);
    }
    await this.hideKeyboard();
    await this.click(this.saveBtn);
  }

  async logSleep(duration = '', notes = '') {
    await this.click(this.logSleepBtn);
    if (duration && await this.isElementDisplayed(this.amountInput, 3000)) {
      await this.clearAndType(this.amountInput, duration);
    }
    if (notes && await this.isElementDisplayed(this.notesInput, 2000)) {
      await this.clearAndType(this.notesInput, notes);
    }
    await this.hideKeyboard();
    await this.click(this.saveBtn);
  }

  async logDiaper(type = 'wet') {
    await this.click(this.logDiaperBtn);
    await this.click(`~tracker-diaper-type-${type}`);
    await this.click(this.saveBtn);
  }

  async getEntryCount() {
    return this.getElementCount(this.entryCard);
  }

  async scrollDown() {
    await GestureUtils.scrollDown(this.driver);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = TrackerPage;
