'use strict';
const fs   = require('fs');
const path = require('path');
const testConfig = require('../config/testConfig');
const logger     = require('./logger');

class ScreenshotUtils {

  static async captureScreenshot(driver, name, dir) {
    try {
      const targetDir = dir || testConfig.paths.screenshots;
      fs.mkdirSync(targetDir, { recursive: true });

      const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${name}_${ts}.png`;
      const filepath = path.join(targetDir, filename);

      const base64 = await driver.takeScreenshot();
      fs.writeFileSync(filepath, base64, 'base64');

      logger.info(`Screenshot: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Screenshot failed: ${error.message}`);
      return null;
    }
  }

  static async captureFailureScreenshot(driver, testName) {
    const dir = testConfig.paths.failures;
    return this.captureScreenshot(driver, `FAIL_${testName}`, dir);
  }

  static async captureOnStep(driver, testName, stepName) {
    const safe = `${testName}_${stepName}`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    return this.captureScreenshot(driver, safe);
  }
}

module.exports = ScreenshotUtils;
