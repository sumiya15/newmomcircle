'use strict';
const BasePage = require('./basePage');

// testID props required in React Native:
//   messages-header, messages-search-input, messages-conversation-row,
//   messages-unread-badge, messages-empty-state,
//   chat-header, chat-message-bubble, chat-input, chat-send-btn,
//   chat-typing-indicator, tab-messages

class MessagesPage extends BasePage {
  get header()           { return '~messages-header'; }
  get searchInput()      { return '~messages-search-input'; }
  get conversationRow()  { return '~messages-conversation-row'; }
  get unreadBadge()      { return '~messages-unread-badge'; }
  get emptyState()       { return '~messages-empty-state'; }
  get chatHeader()       { return '~chat-header'; }
  get messageBubble()    { return '~chat-message-bubble'; }
  get chatInput()        { return '~chat-input'; }
  get sendBtn()          { return '~chat-send-btn'; }
  get typingIndicator()  { return '~chat-typing-indicator'; }
  get feedMessagesBtn()  { return '~feed-messages-btn'; }

  async navigateToMessages() {
    await this.click(this.feedMessagesBtn);
    await this.isAt();
  }

  async searchConversation(query) {
    await this.clearAndType(this.searchInput, query);
    await this.hideKeyboard();
  }

  async openFirstConversation() {
    await this.click(this.conversationRow);
    return this.isElementDisplayed(this.chatHeader, 6000);
  }

  async sendMessage(text) {
    await this.clearAndType(this.chatInput, text);
    await this.click(this.sendBtn);
  }

  async getConversationCount() {
    return this.getElementCount(this.conversationRow);
  }

  async getMessageCount() {
    return this.getElementCount(this.messageBubble);
  }

  async isEmptyState() {
    return this.isElementDisplayed(this.emptyState, 3000);
  }

  async isAt() {
    return this.isElementDisplayed(this.header, 8000);
  }
}

module.exports = MessagesPage;
