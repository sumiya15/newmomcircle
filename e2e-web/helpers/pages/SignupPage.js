'use strict';
const BasePage = require('./BasePage');

class SignupPage extends BasePage {
  async open()  { await this.navigate('/auth/signup'); }
  async isAt()  { return this.exists('signup-screen', 8000); }

  async fillForm({ name, email, password, confirm }) {
    if (name    !== undefined) await this.type('signup-name-input',     name);
    if (email   !== undefined) await this.type('signup-email-input',    email);
    if (password !== undefined) await this.type('signup-password-input', password);
    if (confirm !== undefined) await this.type('signup-confirm-input',   confirm);
  }

  async submit() { await this.click('signup-submit-btn'); }

  async getErrorText() {
    await this.driver.sleep(800);
    const el = await this.elOrNull('signup-error-message', 3000)
            || await this.elOrNull('form-error', 3000);
    return el ? el.getText() : '';
  }

  async clickLoginLink() { await this.click('signup-login-link'); }
}

module.exports = SignupPage;
