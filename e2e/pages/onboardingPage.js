'use strict';
const BasePage    = require('./basePage');
const GestureUtils = require('../utilities/gestureUtils');

// testID props required in React Native:
//   onboarding-splash-screen, onboarding-get-started-btn,
//   onboarding-next-btn, onboarding-skip-btn,
//   onboarding-language-{code}, onboarding-carousel,
//   quiz-name-input, quiz-baby-stage-{stage},
//   quiz-topic-{topic}, quiz-community-style-{style},
//   quiz-next-btn, quiz-finish-btn

class OnboardingPage extends BasePage {
  get splashScreen()  { return '~onboarding-splash-screen'; }
  get getStartedBtn() { return '~onboarding-get-started-btn'; }
  get nextBtn()       { return '~onboarding-next-btn'; }
  get skipBtn()       { return '~onboarding-skip-btn'; }
  get carousel()      { return '~onboarding-carousel'; }
  get quizNameInput() { return '~quiz-name-input'; }
  get quizNextBtn()   { return '~quiz-next-btn'; }
  get quizFinishBtn() { return '~quiz-finish-btn'; }

  async waitForSplash() {
    return this.isElementDisplayed(this.splashScreen, 15000);
  }

  async tapGetStarted() {
    await this.click(this.getStartedBtn);
  }

  async selectLanguage(langCode = 'en') {
    await this.click(`~onboarding-language-${langCode}`);
  }

  async swipeOnboarding() {
    await GestureUtils.swipeLeft(this.driver);
  }

  async skipOnboarding() {
    if (await this.isElementDisplayed(this.skipBtn, 2000)) {
      await this.click(this.skipBtn);
    }
  }

  async completeOnboardingFlow() {
    await this.tapGetStarted();
    // Swipe through onboarding cards
    for (let i = 0; i < 3; i++) {
      await this.swipeOnboarding();
      await this._sleep(500);
    }
  }

  async completeQuiz({ name, stage = 'newborn', topics = ['sleep'], style = 'open' } = {}) {
    if (name) await this.clearAndType(this.quizNameInput, name);
    await this.hideKeyboard();
    await this.click(this.quizNextBtn);

    await this.click(`~quiz-baby-stage-${stage}`);
    await this.click(this.quizNextBtn);

    for (const t of topics) {
      await this.click(`~quiz-topic-${t}`);
    }
    await this.click(this.quizNextBtn);

    await this.click(`~quiz-community-style-${style}`);
    await this.click(this.quizFinishBtn);
  }

  async isAt() {
    return this.isElementDisplayed(this.splashScreen, 10000);
  }
}

module.exports = OnboardingPage;
