'use strict';
const fs   = require('fs');
const path = require('path');
const testConfig = require('../config/testConfig');
const logger     = require('./logger');

class DeviceLogUtils {

  static async captureLogcat(driver, name) {
    try {
      fs.mkdirSync(testConfig.paths.logs, { recursive: true });

      const logs = await driver.getLogs('logcat');
      const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${name}_logcat_${ts}.txt`;
      const filepath = path.join(testConfig.paths.logs, filename);

      const content = logs
        .map(l => `[${new Date(l.timestamp).toISOString()}] [${l.level}] ${l.message}`)
        .join('\n');

      fs.writeFileSync(filepath, content, 'utf8');
      logger.info(`Logcat: ${filepath} (${logs.length} entries)`);
      return filepath;
    } catch (error) {
      logger.error(`Logcat capture failed: ${error.message}`);
      return null;
    }
  }

  static async captureFilteredLogcat(driver, name, tag) {
    try {
      const all = await driver.getLogs('logcat');
      const filtered = all.filter(l => l.message.includes(tag));

      fs.mkdirSync(testConfig.paths.logs, { recursive: true });
      const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filepath = path.join(testConfig.paths.logs, `${name}_${tag}_${ts}.txt`);
      const content  = filtered.map(l => `[${l.level}] ${l.message}`).join('\n');

      fs.writeFileSync(filepath, content, 'utf8');
      logger.info(`Filtered logcat [${tag}]: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Filtered logcat failed: ${error.message}`);
      return null;
    }
  }

  static async getCrashLogs(driver) {
    try {
      const logs = await driver.getLogs('logcat');
      return logs.filter(l =>
        l.level === 'ERROR' &&
        (l.message.includes('FATAL') || l.message.includes('AndroidRuntime') ||
         l.message.includes('CRASH'))
      );
    } catch {
      return [];
    }
  }
}

module.exports = DeviceLogUtils;
