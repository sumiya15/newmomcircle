'use strict';
const BasePage    = require('./basePage');
const GestureUtils = require('../utilities/gestureUtils');

// testID props required in React Native:
//   journal-header, journal-new-entry-btn, journal-text-area,
//   journal-save-btn, journal-entry-card, journal-entry-date,
//   journal-sentiment-badge, journal-empty-state, journal-modal-close,
//   journal-error-banner, journal-insights-btn, tab-journal

class JournalPage extends BasePage {
  get header()       { return '~journal-header'; }
  get newEntryBtn()  { return '~journal-new-entry-btn'; }
  get textArea()     { return '~journal-text-area'; }
  get saveBtn()      { return '~journal-save-btn'; }
  get entryCard()    { return '~journal-entry-card'; }
  get errorBanner()  { return '~journal-error-banner'; }
  get emptyState()   { return '~journal-empty-state'; }
  get modalClose()   { return '~journal-modal-close'; }
  get insightsBtn()  { return '~journal-insights-btn'; }
  get bottomNavTab() { return '~tab-journal'; }

  async navigateToJournal() {
    await this.click(this.bottomNavTab);
    await this.isAt();
  }

  async openNewEntryModal() {
    await this.click(this.newEntryBtn);
    await this.isElementDisplayed(this.textArea, 5000);
  }

  async writeEntry(text) {
    await this.clearAndType(this.textArea, text);
    await this.hideKeyboard();
  }

  async saveEntry() {
    await this.click(this.saveBtn);
  }

  async closeModal() {
    await this.click(this.modalClose);
  }

  async createEntry(text) {
    await this.openNewEntryModal();
    await this.writeEntry(text);
    await this.saveEntry();
    // Wait for modal to close and entry to appear
    await this.waitForGone(this.textArea, 10000);
  }

  async getEntryCount() {
    return this.getElementCount(this.entryCard);
  }

  async getErrorMessage() {
    return this.getText(this.errorBanner);
  }

  async scrollDown() {
    await GestureUtils.scrollDown(this.driver);
  }

  async openInsights() {
    await this.click(this.insightsBtn);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = JournalPage;
