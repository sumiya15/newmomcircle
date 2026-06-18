'use strict';
require('dotenv').config();
const { remote } = require('webdriverio');
const { execSync }  = require('child_process');
const testConfig    = require('../config/testConfig');
const Capabilities  = require('../config/capabilities');
const logger        = require('../utilities/logger');

class DriverFactory {

  // ── Session creation ──────────────────────────────────────────────────────────

  static async createDriver(udid, androidVersion) {
    try {
      logger.info('Initializing Appium driver session...');

      // Auto-detect device if none specified
      if (!udid && !process.env.DEVICE_UDID) {
        const devices = this.getConnectedDevices();
        if (devices.length > 0) {
          udid = devices[0];
          logger.info(`Auto-selected device: ${udid}`);
        }
      }

      const capabilities = Capabilities.getAndroidCapabilities(udid, androidVersion);

      const driver = await remote({
        hostname: testConfig.appium.host,
        port:     testConfig.appium.port,
        logLevel: testConfig.appium.logLevel,
        path:     '/',
        capabilities,
        connectionRetryCount: 3,
        connectionRetryTimeout: 30000,
      });

      await driver.setTimeout({ implicit: testConfig.timeouts.implicit });

      // Store device metadata for reporting
      global.deviceName     = await this.getDeviceName(driver);
      global.androidVersion = await this.getAndroidVersion(driver);

      logger.info(`Driver ready — device: ${global.deviceName}, Android: ${global.androidVersion}`);
      return driver;
    } catch (error) {
      logger.error(`Driver creation failed: ${error.message}`);
      throw error;
    }
  }

  static async quitDriver(driver) {
    if (!driver) return;
    try {
      await driver.deleteSession();
      logger.info('Appium session closed');
    } catch (error) {
      logger.warn(`Session close warning: ${error.message}`);
    }
  }

  // ── Device detection ──────────────────────────────────────────────────────────

  static getConnectedDevices() {
    try {
      const raw = execSync('adb devices').toString();
      return raw.split('\n')
        .filter(line => line.includes('\tdevice'))
        .map(line => line.split('\t')[0].trim());
    } catch {
      logger.warn('adb device detection failed — ensure ADB is in PATH');
      return [];
    }
  }

  static async getDeviceName(driver) {
    try {
      const name = await driver.executeScript('mobile: shell', [{
        command: 'getprop ro.product.model',
      }]);
      return (name || '').trim() || 'Android Device';
    } catch {
      return 'Android Device';
    }
  }

  static async getAndroidVersion(driver) {
    try {
      const ver = await driver.executeScript('mobile: shell', [{
        command: 'getprop ro.build.version.release',
      }]);
      return (ver || '').trim() || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  // ── Parallel execution ────────────────────────────────────────────────────────

  static async createDriversForAllDevices() {
    const devices = this.getConnectedDevices();
    if (devices.length === 0) {
      logger.warn('No devices found — creating single default driver');
      return [await this.createDriver()];
    }
    logger.info(`Creating drivers for ${devices.length} device(s): ${devices.join(', ')}`);
    return Promise.all(devices.map(udid => this.createDriver(udid)));
  }
}

module.exports = DriverFactory;
