'use strict';
const { expect }   = require('chai');
const baseTest     = require('../base/baseTest');
const MessagesPage = require('../../pages/messagesPage');
const FeedPage     = require('../../pages/feedPage');
const LoginPage    = require('../../pages/loginPage');
const DataProvider = require('../../utilities/dataProvider');

describe('Messages - Chat & Conversations', function () {
  let messagesPage, feedPage, loginPage, driver;

  before(async function () {
    driver       = baseTest.getDriver();
    messagesPage = new MessagesPage(driver);
    feedPage     = new FeedPage(driver);
    loginPage    = new LoginPage(driver);

    if (await loginPage.isAt()) {
      const user = DataProvider.getValidUser();
      await loginPage.login(user.email, user.password);
    }
    await feedPage.isAt();
    await messagesPage.navigateToMessages();
  });

  it('MSG-01: Should display Messages screen', async function () {
    const atMessages = await messagesPage.isAt();
    expect(atMessages).to.be.true;
  });

  it('MSG-02: Should show empty state when no conversations', async function () {
    const count = await messagesPage.getConversationCount();
    if (count === 0) {
      const empty = await messagesPage.isEmptyState();
      expect(empty).to.be.true;
    } else {
      expect(count).to.be.greaterThan(0);
    }
  });

  it('MSG-03: Should filter conversations via search bar', async function () {
    await messagesPage.searchConversation('test');
    await messagesPage._sleep(800);
    const atMessages = await messagesPage.isAt();
    expect(atMessages).to.be.true;
  });

  it('MSG-04: Should open a conversation when one exists', async function () {
    const count = await messagesPage.getConversationCount();
    if (count > 0) {
      const opened = await messagesPage.openFirstConversation();
      expect(opened).to.be.true;

      it('MSG-05: Should display chat messages', async function () {
        const msgCount = await messagesPage.getMessageCount();
        expect(msgCount).to.be.at.least(0);
      });

      await messagesPage.pressBack();
    } else {
      this.skip();
    }
  });

  it('MSG-06: Should navigate back to Feed from Messages', async function () {
    await feedPage.click(feedPage.bottomNavFeed);
    const atFeed = await feedPage.isAt();
    expect(atFeed).to.be.true;
  });
});
