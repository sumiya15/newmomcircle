'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   toolbox-header, toolbox-tab-breath, toolbox-tab-affirm,
//   toolbox-tab-ground, toolbox-tab-joke,
//   toolbox-breath-circle, toolbox-breath-phase, toolbox-begin-btn, toolbox-stop-btn,
//   toolbox-affirmation-text, toolbox-next-affirmation-btn,
//   toolbox-ground-step, toolbox-joke-text, toolbox-next-joke-btn,
//   tab-toolbox

class ToolboxPage extends BasePage {
  get header()         { return '~toolbox-header'; }
  get tabBreath()      { return '~toolbox-tab-breath'; }
  get tabAffirm()      { return '~toolbox-tab-affirm'; }
  get tabGround()      { return '~toolbox-tab-ground'; }
  get tabJoke()        { return '~toolbox-tab-joke'; }
  get breathCircle()   { return '~toolbox-breath-circle'; }
  get breathPhase()    { return '~toolbox-breath-phase'; }
  get beginBtn()       { return '~toolbox-begin-btn'; }
  get stopBtn()        { return '~toolbox-stop-btn'; }
  get affirmText()     { return '~toolbox-affirmation-text'; }
  get nextAffirmBtn()  { return '~toolbox-next-affirmation-btn'; }
  get groundStep()     { return '~toolbox-ground-step'; }
  get jokeText()       { return '~toolbox-joke-text'; }
  get nextJokeBtn()    { return '~toolbox-next-joke-btn'; }
  get bottomNavTab()   { return '~tab-toolbox'; }

  async navigateToToolbox() {
    await this.click(this.bottomNavTab);
    await this.isAt();
  }

  async switchTab(tab) {
    const tabs = {
      breath: this.tabBreath,
      affirm: this.tabAffirm,
      ground: this.tabGround,
      joke:   this.tabJoke,
    };
    await this.click(tabs[tab] || this.tabBreath);
    await this._sleep(350); // allow animation
  }

  async startBreathing() {
    await this.click(this.beginBtn);
    return this.isElementDisplayed(this.stopBtn, 3000);
  }

  async stopBreathing() {
    await this.click(this.stopBtn);
  }

  async getBreathPhase() {
    return this.getText(this.breathPhase);
  }

  async getAffirmationText() {
    return this.getText(this.affirmText);
  }

  async nextAffirmation() {
    await this.click(this.nextAffirmBtn);
  }

  async getGroundingStepCount() {
    return this.getElementCount(this.groundStep);
  }

  async getJokeText() {
    return this.getText(this.jokeText);
  }

  async nextJoke() {
    await this.click(this.nextJokeBtn);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = ToolboxPage;
