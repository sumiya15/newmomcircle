'use strict';
const { Builder, Capabilities } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const testConfig = require('../config/testConfig');

/**
 * Creates and returns a configured Chrome WebDriver instance.
 * Runs headless in CI; headed locally for debugging.
 */
async function buildDriver() {
  const options = new chrome.Options();

  if (testConfig.browser.headless) {
    options.addArguments('--headless=new');
  }

  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-popup-blocking',
    '--disable-notifications',
    `--window-size=${testConfig.browser.windowSize.width},${testConfig.browser.windowSize.height}`
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    implicit: testConfig.timeouts.implicit,
    pageLoad: testConfig.timeouts.pageLoad,
    script:   testConfig.timeouts.explicit,
  });

  await driver.manage().window().setRect(testConfig.browser.windowSize);

  return driver;
}

module.exports = { buildDriver };
