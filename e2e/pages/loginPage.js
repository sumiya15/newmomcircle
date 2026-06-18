'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   login-email-input, login-password-input, login-submit-btn,
//   login-error-banner, login-forgot-btn, login-title,
//   login-signup-link

class LoginPage extends BasePage {
  get emailInput()   { return '~login-email-input'; }
  get passwordInput(){ return '~login-password-input'; }
  get submitBtn()    { return '~login-submit-btn'; }
  get errorBanner()  { return '~login-error-banner'; }
  get forgotBtn()    { return '~login-forgot-btn'; }
  get title()        { return '~login-title'; }
  get signupLink()   { return '~login-signup-link'; }
  get showPwdBtn()   { return '~login-show-password'; }

  async login(email, password) {
    await this.clearAndType(this.emailInput, email);
    await this.clearAndType(this.passwordInput, password);
    await this.hideKeyboard();
    await this.click(this.submitBtn);
  }

  async getErrorMessage() {
    return this.getText(this.errorBanner);
  }

  async tapForgotPassword() {
    await this.click(this.forgotBtn);
  }

  async tapSignupLink() {
    await this.click(this.signupLink);
  }

  async togglePasswordVisibility() {
    await this.click(this.showPwdBtn);
  }

  async isAt() {
    return this.isElementDisplayed(this.title, 8000);
  }
}

module.exports = LoginPage;
