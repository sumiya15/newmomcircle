'use strict';
const logger = require('./logger');

class PerformanceUtils {
  constructor() {
    this.metrics = [];
  }

  startTimer(label) {
    this._timers = this._timers || {};
    this._timers[label] = Date.now();
    return this._timers[label];
  }

  stopTimer(label) {
    if (!this._timers || !this._timers[label]) return 0;
    const duration = Date.now() - this._timers[label];
    this.metrics.push({ label, duration, timestamp: new Date().toISOString() });
    logger.info(`PERF [${label}]: ${duration}ms`);
    return duration;
  }

  static async measureAppLaunchTime(driver, landingSelector, timeout = 30000) {
    const start = Date.now();
    try {
      const el = await driver.$(landingSelector);
      await el.waitForDisplayed({ timeout });
      const ms = Date.now() - start;
      logger.info(`App launch time: ${ms}ms`);
      return ms;
    } catch {
      const ms = Date.now() - start;
      logger.warn(`App launch timed out after ${ms}ms`);
      return ms;
    }
  }

  static async measureScreenLoad(driver, selector, timeout = 15000) {
    const start = Date.now();
    try {
      const el = await driver.$(selector);
      await el.waitForDisplayed({ timeout });
      return Date.now() - start;
    } catch {
      return Date.now() - start;
    }
  }

  static async measureActionDuration(action, label = 'Action') {
    const start = Date.now();
    await action();
    const ms = Date.now() - start;
    logger.info(`PERF [${label}]: ${ms}ms`);
    return ms;
  }

  static getSLAStatus(durationMs, slaMs) {
    return durationMs <= slaMs ? 'PASS' : 'FAIL';
  }

  getMetrics() {
    return this.metrics;
  }

  getSummary() {
    if (!this.metrics.length) return null;
    const durations = this.metrics.map(m => m.duration);
    return {
      count: durations.length,
      min:   Math.min(...durations),
      max:   Math.max(...durations),
      avg:   Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    };
  }
}

module.exports = new PerformanceUtils();
