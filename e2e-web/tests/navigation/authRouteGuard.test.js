'use strict';
/**
 * tests/navigation/authRouteGuard.test.js
 *
 * Verifies that all protected routes redirect unauthenticated users to login.
 * IDs: RTG-W-01 … RTG-W-06
 */
const { expect } = require('chai');
const baseTest   = require('../base/baseTest');
const BasePage   = require('../../helpers/pages/BasePage');

const PROTECTED_ROUTES = [
  { name: 'Feed',      path: '/' },
  { name: 'Journal',   path: '/journal' },
  { name: 'Resources', path: '/resources' },
  { name: 'Safety',    path: '/safety' },
  { name: 'Toolbox',   path: '/toolbox' },
  { name: 'Profile',   path: '/profile' },
];

describe('WEB – Navigation: Auth Route Guard', function () {
  let page;

  before(function () {
    page = new BasePage(baseTest.getDriver());
  });

  PROTECTED_ROUTES.forEach(({ name, path }, idx) => {
    it(`RTG-W-0${idx + 1}: Unauthenticated access to "${name}" redirects to /auth/login`, async function () {
      // Clear storage to simulate logged-out state
      await page.driver.executeScript(
        'window.localStorage.clear(); window.sessionStorage.clear();'
      );
      await page.driver.manage().deleteAllCookies();

      await page.navigate(path);
      await page.driver.sleep(1500);

      const url = await page.currentUrl();
      expect(url, `"${name}" did not redirect to login — still at ${url}`)
        .to.include('login');
    });
  });
});
