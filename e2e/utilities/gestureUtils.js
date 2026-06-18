'use strict';
const logger = require('./logger');

class GestureUtils {

  // ── Tap ───────────────────────────────────────────────────────────────────────

  static async tap(driver, x, y) {
    await driver.performActions([{
      type: 'pointer', id: 'tap', parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pause',       duration: 80 },
        { type: 'pointerUp',   button: 0 },
      ],
    }]);
    logger.info(`Tapped (${x}, ${y})`);
  }

  static async doubleTap(driver, x, y) {
    await driver.performActions([{
      type: 'pointer', id: 'dtap', parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerUp',   button: 0 },
        { type: 'pause',       duration: 100 },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerUp',   button: 0 },
      ],
    }]);
    logger.info(`Double-tapped (${x}, ${y})`);
  }

  static async longPress(driver, x, y, duration = 1500) {
    await driver.performActions([{
      type: 'pointer', id: 'lp', parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x, y },
        { type: 'pointerDown', button: 0 },
        { type: 'pause',       duration },
        { type: 'pointerUp',   button: 0 },
      ],
    }]);
    logger.info(`Long-pressed (${x}, ${y}) for ${duration}ms`);
  }

  // ── Swipe / Scroll ────────────────────────────────────────────────────────────

  static async swipe(driver, startX, startY, endX, endY, duration = 800) {
    await driver.performActions([{
      type: 'pointer', id: 'swipe', parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0,        x: startX, y: startY },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerMove', duration,            x: endX,   y: endY },
        { type: 'pointerUp',   button: 0 },
      ],
    }]);
    logger.info(`Swiped (${startX},${startY}) → (${endX},${endY})`);
  }

  static async scrollDown(driver, fraction = 0.55) {
    const { width, height } = await driver.getWindowRect();
    const mx = Math.floor(width / 2);
    await this.swipe(driver, mx, Math.floor(height * 0.75), mx, Math.floor(height * (0.75 - fraction)));
  }

  static async scrollUp(driver, fraction = 0.55) {
    const { width, height } = await driver.getWindowRect();
    const mx = Math.floor(width / 2);
    await this.swipe(driver, mx, Math.floor(height * 0.25), mx, Math.floor(height * (0.25 + fraction)));
  }

  static async swipeLeft(driver) {
    const { width, height } = await driver.getWindowRect();
    await this.swipe(driver, Math.floor(width * 0.85), Math.floor(height / 2),
                              Math.floor(width * 0.15), Math.floor(height / 2));
  }

  static async swipeRight(driver) {
    const { width, height } = await driver.getWindowRect();
    await this.swipe(driver, Math.floor(width * 0.15), Math.floor(height / 2),
                              Math.floor(width * 0.85), Math.floor(height / 2));
  }

  static async scrollUntilVisible(driver, selector, direction = 'down', maxScrolls = 12) {
    for (let i = 0; i < maxScrolls; i++) {
      try {
        const el = await driver.$(selector);
        if (await el.isDisplayed()) return true;
      } catch { /* keep scrolling */ }
      direction === 'down' ? await this.scrollDown(driver) : await this.scrollUp(driver);
      await new Promise(r => setTimeout(r, 400));
    }
    return false;
  }

  // ── Drag ──────────────────────────────────────────────────────────────────────

  static async dragAndDrop(driver, fromX, fromY, toX, toY) {
    await driver.performActions([{
      type: 'pointer', id: 'drag', parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0,    x: fromX, y: fromY },
        { type: 'pointerDown', button: 0 },
        { type: 'pause',       duration: 500 },
        { type: 'pointerMove', duration: 1000, x: toX,   y: toY },
        { type: 'pause',       duration: 200 },
        { type: 'pointerUp',   button: 0 },
      ],
    }]);
    logger.info(`Dragged (${fromX},${fromY}) → (${toX},${toY})`);
  }

  // ── Pinch / Zoom ──────────────────────────────────────────────────────────────

  static async pinch(driver, centerX, centerY, scale = 0.5) {
    const offset = Math.floor(100 * (1 - scale));
    await this._twoFingerGesture(driver, centerX, centerY, offset, true);
    logger.info(`Pinched at (${centerX},${centerY}) scale=${scale}`);
  }

  static async zoom(driver, centerX, centerY, scale = 1.5) {
    const offset = Math.floor(100 * (scale - 1));
    await this._twoFingerGesture(driver, centerX, centerY, offset, false);
    logger.info(`Zoomed at (${centerX},${centerY}) scale=${scale}`);
  }

  static async _twoFingerGesture(driver, cx, cy, offset, pinch) {
    const [startA, endA] = pinch
      ? [cy - offset, cy]
      : [cy, cy - offset];
    const [startB, endB] = pinch
      ? [cy + offset, cy]
      : [cy, cy + offset];

    await driver.performActions([
      {
        type: 'pointer', id: 'f1', parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0,   x: cx, y: startA },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 600, x: cx, y: endA },
          { type: 'pointerUp',   button: 0 },
        ],
      },
      {
        type: 'pointer', id: 'f2', parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0,   x: cx, y: startB },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', duration: 600, x: cx, y: endB },
          { type: 'pointerUp',   button: 0 },
        ],
      },
    ]);
  }
}

module.exports = GestureUtils;
