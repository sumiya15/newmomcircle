'use strict';
const testConfig = require('../config/testConfig');
const logger     = require('../utilities/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver || global.driver;
  }

  // ── Wait helpers ──────────────────────────────────────────────────────────────

  async waitForElement(selector, timeout = testConfig.timeouts.explicit) {
    try {
      const el = await this.driver.$(selector);
      await el.waitForDisplayed({ timeout });
      return el;
    } catch (error) {
      logger.error(`Element not visible within ${timeout}ms: ${selector}`);
      throw error;
    }
  }

  async waitForGone(selector, timeout = testConfig.timeouts.explicit) {
    try {
      const el = await this.driver.$(selector);
      await el.waitForDisplayed({ timeout, reverse: true });
    } catch {
      // element already gone — acceptable
    }
  }

  async waitForAny(selectors, timeout = testConfig.timeouts.explicit) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      for (const sel of selectors) {
        if (await this.isElementDisplayed(sel, 600)) return sel;
      }
      await this._sleep(400);
    }
    throw new Error(`None of [${selectors.join(', ')}] appeared within ${timeout}ms`);
  }

  async waitForText(selector, expectedText, timeout = testConfig.timeouts.explicit) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try {
        const text = await this.getText(selector);
        if (text.includes(expectedText)) return true;
      } catch { /* keep waiting */ }
      await this._sleep(500);
    }
    throw new Error(`Text "${expectedText}" never appeared in ${selector}`);
  }

  // ── Interaction helpers ───────────────────────────────────────────────────────

  async click(selector) {
    const el = await this.waitForElement(selector);
    await el.click();
    logger.info(`Clicked: ${selector}`);
  }

  async type(selector, text) {
    const el = await this.waitForElement(selector);
    if (text !== '' && text !== undefined) await el.setValue(text);
    logger.info(`Typed "${text}" into: ${selector}`);
  }

  async clearAndType(selector, text) {
    const el = await this.waitForElement(selector);
    await el.clearValue();
    if (text !== '' && text !== undefined) await el.setValue(text);
    logger.info(`Cleared & typed "${text}" into: ${selector}`);
  }

  async clearField(selector) {
    const el = await this.waitForElement(selector);
    await el.clearValue();
    logger.info(`Cleared: ${selector}`);
  }

  async getText(selector) {
    const el = await this.waitForElement(selector);
    const text = await el.getText();
    logger.info(`Text[${selector}] = "${text}"`);
    return text;
  }

  async getAttribute(selector, attr) {
    const el = await this.waitForElement(selector);
    return await el.getAttribute(attr);
  }

  async getElements(selector) {
    return await this.driver.$$(selector);
  }

  async getElementCount(selector) {
    const els = await this.driver.$$(selector);
    return els.length;
  }

  // ── State checks ──────────────────────────────────────────────────────────────

  async isElementDisplayed(selector, timeout = 3000) {
    try {
      const el = await this.driver.$(selector);
      return await el.waitForDisplayed({ timeout });
    } catch {
      return false;
    }
  }

  async isElementEnabled(selector) {
    try {
      const el = await this.waitForElement(selector);
      return await el.isEnabled();
    } catch {
      return false;
    }
  }

  async isElementChecked(selector) {
    try {
      const el = await this.waitForElement(selector);
      return await el.getAttribute('checked') === 'true';
    } catch {
      return false;
    }
  }

  // ── Scroll helpers ────────────────────────────────────────────────────────────

  async scrollUntilVisible(selector, maxScrolls = 12, direction = 'down') {
    for (let i = 0; i < maxScrolls; i++) {
      if (await this.isElementDisplayed(selector, 1000)) return true;
      const { width, height } = await this.driver.getWindowRect();
      const mx = Math.floor(width / 2);
      const [startY, endY] = direction === 'down'
        ? [Math.floor(height * 0.75), Math.floor(height * 0.25)]
        : [Math.floor(height * 0.25), Math.floor(height * 0.75)];
      await this.driver.performActions([{
        type: 'pointer', id: 'swipe', parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: mx, y: startY },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 700, x: mx, y: endY },
          { type: 'pointerUp', button: 0 },
        ],
      }]);
      await this._sleep(400);
    }
    return false;
  }

  // ── Navigation ────────────────────────────────────────────────────────────────

  async pressBack() {
    await this.driver.pressKeyCode(4);
    logger.info('Pressed Back');
  }

  async hideKeyboard() {
    try {
      if (await this.driver.isKeyboardShown()) {
        await this.driver.hideKeyboard();
      }
    } catch { /* no-op */ }
  }

  async getCurrentActivity() {
    try { return await this.driver.getCurrentActivity(); }
    catch { return 'unknown'; }
  }

  async getDeviceSize() {
    return await this.driver.getWindowRect();
  }

  // ── Internal ──────────────────────────────────────────────────────────────────

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = BasePage;
