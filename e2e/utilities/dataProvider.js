'use strict';
const path = require('path');
const fs   = require('fs');

class DataProvider {
  static load(filename) {
    const filepath = path.join(__dirname, '../testdata', filename);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Test data file not found: ${filepath}`);
    }
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }

  static getUsers()         { return this.load('users.json'); }
  static getPosts()         { return this.load('posts.json'); }
  static getJournalEntries() { return this.load('journalEntries.json'); }

  static getValidUser() {
    return this.getUsers().find(u => u.type === 'valid');
  }

  static getInvalidUser() {
    return this.getUsers().find(u => u.type === 'invalid');
  }

  static generateTimestampedText(prefix = 'Test') {
    return `${prefix}_${Date.now()}`;
  }
}

module.exports = DataProvider;
