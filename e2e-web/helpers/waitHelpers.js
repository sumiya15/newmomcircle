'use strict';
const { By, until } = require('selenium-webdriver');
const testConfig    = require('../config/testConfig');
const logger        = require('./logger');

const TIMEOUT = testConfig.timeouts.explicit;

/**
 * Wait for an element identified by [data-testid="<id>"] to be visible.
 */
async function waitForTestId(driver, testId, timeoutMs = TIMEOUT) {
  const locator = By.css(`[data-testid="${testId}"]`);
  return driver.wait(until.elementLocated(locator), timeoutMs,
    `Timed out waiting for [data-testid="${testId}"]`);
}

/**
 * Wait for an element to be clickable (visible + enabled).
 */
async function waitForClickable(driver, testId, timeoutMs = TIMEOUT) {
  const el = await waitForTestId(driver, testId, timeoutMs);
  await driver.wait(until.elementIsEnabled(el), timeoutMs,
    `Element [data-testid="${testId}"] not enabled`);
  return el;
}

/**
 * Safe click — waits for clickable state then clicks.
 */
async function safeClick(driver, testId) {
  const el = await waitForClickable(driver, testId);
  await el.click();
  return el;
}

/**
 * Wait for URL to contain a substring.
 */
async function waitForUrl(driver, urlPart, timeoutMs = TIMEOUT) {
  await driver.wait(
    async () => {
      const url = await driver.getCurrentUrl();
      return url.includes(urlPart);
    },
    timeoutMs,
    `URL did not contain "${urlPart}" within ${timeoutMs}ms`
  );
}

/**
 * Take a screenshot and save it with a label.
 */
async function screenshot(driver, label) {
  const path = require('path');
  const fs   = require('fs');
  const dir  = testConfig.paths.screenshots;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts   = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${label}_${ts}.png`);
  const data = await driver.takeScreenshot();
  fs.writeFileSync(file, data, 'base64');
  logger.info(`Screenshot saved: ${file}`);
  return file;
}

/**
 * Wait for page to finish loading (document.readyState === 'complete').
 */
async function waitForPageLoad(driver, timeoutMs = testConfig.timeouts.pageLoad) {
  await driver.wait(
    () => driver.executeScript('return document.readyState === "complete"'),
    timeoutMs
  );
  // Extra wait for JS-driven animations/transitions
  await driver.sleep(testConfig.timeouts.animation);
}

/**
 * Get text of element by testId.
 */
async function getText(driver, testId) {
  const el = await waitForTestId(driver, testId);
  return el.getText();
}

/**
 * Type text into an input/textarea identified by testId.
 */
async function typeInto(driver, testId, text) {
  const el = await waitForClickable(driver, testId);
  await el.clear();
  await el.sendKeys(text);
  return el;
}

/**
 * Check if an element exists on the page (non-throwing).
 */
async function elementExists(driver, testId, timeoutMs = 3000) {
  try {
    await waitForTestId(driver, testId, timeoutMs);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  waitForTestId,
  waitForClickable,
  safeClick,
  waitForUrl,
  screenshot,
  waitForPageLoad,
  getText,
  typeInto,
  elementExists,
};
