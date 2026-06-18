'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   safety-header, safety-sos-btn, safety-sos-countdown,
//   safety-cancel-btn, safety-guardian-card, safety-add-guardian-btn,
//   safety-guardian-name-input, safety-guardian-phone-input,
//   safety-guardian-relationship-input, safety-save-guardian-btn,
//   safety-cancel-modal-btn, safety-delete-guardian-btn,
//   safety-delete-confirm-yes, safety-toast, tab-safety

class SafetyPage extends BasePage {
  get header()              { return '~safety-header'; }
  get sosBtn()              { return '~safety-sos-btn'; }
  get sosCountdown()        { return '~safety-sos-countdown'; }
  get cancelBtn()           { return '~safety-cancel-btn'; }
  get guardianCard()        { return '~safety-guardian-card'; }
  get addGuardianBtn()      { return '~safety-add-guardian-btn'; }
  get nameInput()           { return '~safety-guardian-name-input'; }
  get phoneInput()          { return '~safety-guardian-phone-input'; }
  get relationshipInput()   { return '~safety-guardian-relationship-input'; }
  get saveGuardianBtn()     { return '~safety-save-guardian-btn'; }
  get cancelModalBtn()      { return '~safety-cancel-modal-btn'; }
  get deleteGuardianBtn()   { return '~safety-delete-guardian-btn'; }
  get deleteConfirmYes()    { return '~safety-delete-confirm-yes'; }
  get toast()               { return '~safety-toast'; }
  get bottomNavTab()        { return '~tab-safety'; }

  async navigateToSafety() {
    await this.click(this.bottomNavTab);
    await this.isAt();
  }

  async triggerSOS() {
    await this.click(this.sosBtn);
    return this.isElementDisplayed(this.sosCountdown, 5000);
  }

  async cancelSOS() {
    await this.click(this.cancelBtn);
  }

  async openAddGuardianModal() {
    await this.click(this.addGuardianBtn);
    return this.isElementDisplayed(this.nameInput, 5000);
  }

  async fillGuardianForm({ name, phone, relationship }) {
    if (name)         await this.clearAndType(this.nameInput,         name);
    if (phone)        await this.clearAndType(this.phoneInput,        phone);
    if (relationship) await this.clearAndType(this.relationshipInput, relationship);
    await this.hideKeyboard();
  }

  async saveGuardian() {
    await this.click(this.saveGuardianBtn);
  }

  async addGuardian(data) {
    await this.openAddGuardianModal();
    await this.fillGuardianForm(data);
    await this.saveGuardian();
    await this.waitForGone(this.nameInput, 8000);
  }

  async deleteFirstGuardian() {
    if (await this.isElementDisplayed(this.deleteGuardianBtn, 2000)) {
      await this.click(this.deleteGuardianBtn);
      if (await this.isElementDisplayed(this.deleteConfirmYes, 3000)) {
        await this.click(this.deleteConfirmYes);
      }
    }
  }

  async getGuardianCount() {
    return this.getElementCount(this.guardianCard);
  }

  async getToastText() {
    return this.getText(this.toast);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = SafetyPage;
