'use strict';
require('dotenv').config();
const path = require('path');

class Capabilities {
  static getAndroidCapabilities(udid, androidVersion) {
    const caps = {
      platformName: 'Android',
      'appium:automationName':                'UiAutomator2',
      'appium:autoGrantPermissions':          true,
      'appium:newCommandTimeout':             300,
      'appium:uiautomator2ServerInstallTimeout': 60000,
      'appium:ensureWebviewsHavePages':       true,
      'appium:nativeWebScreenshot':           true,
      'appium:disableWindowAnimation':        true,
      'appium:ignoreHiddenApiPolicyError':    true,
      'appium:skipServerInstallation':        false,
    };

    // Device targeting — explicit args take priority over env vars
    const resolvedUdid = udid || process.env.DEVICE_UDID;
    const resolvedVersion = androidVersion || process.env.ANDROID_VERSION;

    if (resolvedUdid)   caps['appium:udid']            = resolvedUdid;
    if (resolvedVersion) caps['appium:platformVersion'] = resolvedVersion;

    // Execution mode: APK vs installed app
    if (process.env.EXECUTION_MODE === 'apk') {
      const apkPath = path.resolve(__dirname, process.env.APK_PATH ||
        '../../apps/mobile/android/app/build/outputs/apk/release/app-release.apk');
      caps['appium:app']      = apkPath;
      caps['appium:fullReset'] = false;
    } else {
      caps['appium:appPackage']  = process.env.APP_PACKAGE  || 'host.exp.exponent';
      caps['appium:appActivity'] = process.env.APP_ACTIVITY || 'host.exp.exponent.LauncherActivity';
      caps['appium:noReset']    = false;
      caps['appium:fullReset']  = false;
    }

    return caps;
  }
}

module.exports = Capabilities;
