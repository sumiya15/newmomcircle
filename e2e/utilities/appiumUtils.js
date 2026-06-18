'use strict';
const testConfig = require('../config/testConfig');
const logger     = require('./logger');

class AppiumUtils {

  static sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  static async retryCommand(action, retries = testConfig.retries.element, delayMs = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await action();
      } catch (error) {
        if (attempt === retries) throw error;
        logger.warn(`Retry ${attempt}/${retries}: ${error.message}`);
        await this.sleep(delayMs);
      }
    }
  }

  static async hideKeyboard(driver) {
    try {
      if (await driver.isKeyboardShown()) {
        await driver.hideKeyboard();
        logger.info('Keyboard hidden');
      }
    } catch (e) {
      logger.warn(`hideKeyboard: ${e.message}`);
    }
  }

  static async acceptAlert(driver) {
    try {
      await driver.acceptAlert();
      logger.info('Alert accepted');
    } catch {
      logger.warn('No alert to accept');
    }
  }

  static async dismissAlert(driver) {
    try {
      await driver.dismissAlert();
      logger.info('Alert dismissed');
    } catch {
      logger.warn('No alert to dismiss');
    }
  }

  static async getAlertText(driver) {
    try {
      return await driver.getAlertText();
    } catch {
      return null;
    }
  }

  static async waitForActivity(driver, activity, timeout = 15000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try {
        const current = await driver.getCurrentActivity();
        if (current === activity || current.includes(activity)) return true;
      } catch { /* keep waiting */ }
      await this.sleep(500);
    }
    throw new Error(`Activity "${activity}" not reached within ${timeout}ms`);
  }

  static async getCurrentActivity(driver) {
    try { return await driver.getCurrentActivity(); }
    catch { return 'unknown'; }
  }

  static async isAppInForeground(driver, appPackage) {
    try {
      const state = await driver.queryAppState(appPackage);
      return state === 4; // RUNNING_IN_FOREGROUND
    } catch {
      return false;
    }
  }

  static async launchApp(driver) {
    try {
      await driver.activateApp(
        process.env.APP_PACKAGE || 'host.exp.exponent'
      );
      logger.info('App launched');
    } catch (e) {
      logger.error(`launchApp: ${e.message}`);
    }
  }

  static async closeApp(driver) {
    try {
      await driver.terminateApp(
        process.env.APP_PACKAGE || 'host.exp.exponent'
      );
      logger.info('App terminated');
    } catch (e) {
      logger.warn(`closeApp: ${e.message}`);
    }
  }

  static async resetApp(driver) {
    await this.closeApp(driver);
    await this.sleep(1500);
    await this.launchApp(driver);
    await this.sleep(2000);
  }

  static async getDeviceInfo(driver) {
    try {
      const [model, androidVer, screenSize] = await Promise.all([
        driver.executeScript('mobile: shell', [{ command: 'getprop ro.product.model' }]),
        driver.executeScript('mobile: shell', [{ command: 'getprop ro.build.version.release' }]),
        driver.getWindowRect(),
      ]);
      return {
        model:          (model || '').trim(),
        androidVersion: (androidVer || '').trim(),
        screenWidth:    screenSize.width,
        screenHeight:   screenSize.height,
      };
    } catch {
      return { model: 'Unknown', androidVersion: 'Unknown', screenWidth: 0, screenHeight: 0 };
    }
  }
}

module.exports = AppiumUtils;
