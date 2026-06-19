'use strict';
const BasePage = require('./BasePage');
const testConfig = require('../../config/testConfig');

class LoginPage extends BasePage {
  async open()      { await this.navigate('/auth/login'); }
  async isAt()      { return this.exists('login-email-input', 8000); }

  async login(email, password) {
    await this.type('login-email-input', email);
    await this.type('login-password-input', password);
    await this.click('login-submit-btn');
    // Settle as soon as /feed redirect OR an auth/validation error appears
    try {
      await Promise.race([
        this.waitForUrl('/feed', 10000),
        this.el('login-error-message', 8000),
      ]);
    } catch { /* neither happened — subsequent assertions will catch this */ }
  }

  async getErrorText() {
    // Wait briefly for error to appear
    await this.driver.sleep(1000);
    const el = await this.elOrNull('login-error-message', 4000)
            || await this.elOrNull('form-error', 4000);
    return el ? el.getText() : '';
  }

  async clickForgotPassword() { await this.click('login-forgot-password-link'); }
  async clickSignupLink()      { await this.click('login-signup-link'); }

  async loginAsTestUser() {
    const { email, password } = testConfig.testUser;
    await this.open();
    await this.login(email, password);
  }
}

module.exports = LoginPage;
