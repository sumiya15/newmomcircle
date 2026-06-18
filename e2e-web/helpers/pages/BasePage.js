'use strict';
/**
 * e2e-web/helpers/pages/BasePage.js
 *
 * All page objects extend this class to get common Selenium helpers.
 */
const { By, until } = require('selenium-webdriver');
const testConfig    = require('../../config/testConfig');
const logger        = require('../logger');

const T = testConfig.timeouts;

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigate(path = '') {
    const url = `${testConfig.baseUrl}${path}`;
    await this.driver.get(url);
    await this.waitForLoad();
    logger.info(`Navigated → ${url}`);
  }

  async currentUrl() {
    return this.driver.getCurrentUrl();
  }

  async waitForLoad(timeoutMs = T.pageLoad) {
    await this.driver.wait(
      () => this.driver.executeScript('return document.readyState === "complete"'),
      timeoutMs
    );
    await this.driver.sleep(T.animation);
  }

  // ── Element helpers by data-testid ────────────────────────────────────────

  async el(testId, timeoutMs = T.explicit) {
    const locator = By.css(`[data-testid="${testId}"]`);
    return this.driver.wait(until.elementLocated(locator), timeoutMs,
      `Timeout: [data-testid="${testId}"] not found`);
  }

  async elOrNull(testId, timeoutMs = 3000) {
    try { return await this.el(testId, timeoutMs); } catch { return null; }
  }

  async exists(testId, timeoutMs = 3000) {
    const e = await this.elOrNull(testId, timeoutMs);
    return e !== null;
  }

  async click(testId) {
    const e = await this.el(testId);
    await this.driver.wait(until.elementIsEnabled(e), T.explicit);
    await e.click();
  }

  async type(testId, text) {
    const e = await this.el(testId);
    await e.clear();
    await e.sendKeys(text);
  }

  async getText(testId) {
    const e = await this.el(testId);
    return e.getText();
  }

  async getValue(testId) {
    const e = await this.el(testId);
    return e.getAttribute('value');
  }

  // ── URL assertions ────────────────────────────────────────────────────────

  async waitForUrl(fragment, timeoutMs = T.explicit) {
    await this.driver.wait(
      async () => (await this.driver.getCurrentUrl()).includes(fragment),
      timeoutMs,
      `URL did not include "${fragment}" within ${timeoutMs}ms`
    );
  }

  // ── Screenshot ────────────────────────────────────────────────────────────

  async screenshot(label) {
    const path = require('path');
    const fs   = require('fs');
    const dir  = testConfig.paths.screenshots;
    fs.mkdirSync(dir, { recursive: true });
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(dir, `${label}_${ts}.png`);
    const data = await this.driver.takeScreenshot();
    fs.writeFileSync(file, data, 'base64');
    logger.info(`Screenshot → ${file}`);
    return file;
  }

  // ── Scroll ────────────────────────────────────────────────────────────────

  async scrollToBottom() {
    await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
    await this.driver.sleep(300);
  }

  async scrollIntoView(testId) {
    const e = await this.el(testId);
    await this.driver.executeScript('arguments[0].scrollIntoView({block:"center"})', e);
    await this.driver.sleep(200);
  }
}

module.exports = BasePage;
