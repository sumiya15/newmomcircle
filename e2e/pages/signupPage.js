'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   signup-name-input, signup-email-input, signup-password-input,
//   signup-submit-btn, signup-error-banner, signup-title,
//   signup-login-link, signup-password-strength

class SignupPage extends BasePage {
  get nameInput()      { return '~signup-name-input'; }
  get emailInput()     { return '~signup-email-input'; }
  get passwordInput()  { return '~signup-password-input'; }
  get submitBtn()      { return '~signup-submit-btn'; }
  get errorBanner()    { return '~signup-error-banner'; }
  get title()          { return '~signup-title'; }
  get loginLink()      { return '~signup-login-link'; }
  get strengthMeter()  { return '~signup-password-strength'; }

  async fillForm({ name, email, password }) {
    if (name     !== undefined) await this.clearAndType(this.nameInput,     name);
    if (email    !== undefined) await this.clearAndType(this.emailInput,    email);
    if (password !== undefined) await this.clearAndType(this.passwordInput, password);
    await this.hideKeyboard();
  }

  async submit() {
    await this.click(this.submitBtn);
  }

  async signup(name, email, password) {
    await this.fillForm({ name, email, password });
    await this.submit();
  }

  async getErrorMessage() {
    return this.getText(this.errorBanner);
  }

  async getPasswordStrength() {
    return this.getText(this.strengthMeter);
  }

  async tapLoginLink() {
    await this.click(this.loginLink);
  }

  async isAt() {
    return this.isElementDisplayed(this.title, 8000);
  }
}

module.exports = SignupPage;
