#!/usr/bin/env node
'use strict';
/**
 * scripts/generateMochaJson.js
 *
 * Converts a combined mochawesome JSON report into standard Mocha JSON format.
 * This is used by the GitHub Actions workflow to feed test results into
 * dorny/test-reporter (which natively supports mocha-json but not mochawesome).
 */

const fs = require('fs');
const path = require('path');

const INPUT_JSON = process.argv[2] || path.join(__dirname, '../reports/mochawesome-combined.json');
const OUTPUT_JSON = process.argv[3] || path.join(__dirname, '../reports/mocha-combined.json');

if (!fs.existsSync(INPUT_JSON)) {
  console.error(`❌  Combined mochawesome JSON report not found: ${INPUT_JSON}`);
  process.exit(1);
}

try {
  const raw = JSON.parse(fs.readFileSync(INPUT_JSON, 'utf-8'));
  const stats = raw.stats || {};

  const passes = [];
  const pending = [];
  const failures = [];
  const tests = [];

  function flatten(suites) {
    for (const suite of suites || []) {
      const moduleName = suite.title || 'Unknown';
      for (const test of suite.tests || []) {
        const mapped = {
          title: test.title || '—',
          fullTitle: test.fullTitle || test.title || '—',
          file: test.file || '',
          duration: test.duration || 0,
          currentRetry: 0,
          err: test.err && Object.keys(test.err).length > 0 ? {
            message: test.err.message || '',
            stack: test.err.stack || ''
          } : {}
        };
        
        tests.push(mapped);
        if (test.pass) {
          passes.push(mapped);
        } else if (test.fail) {
          failures.push(mapped);
        } else {
          pending.push(mapped);
        }
      }
      flatten(suite.suites);
    }
  }

  flatten(raw.results || []);

  const mochaReport = {
    stats: {
      suites: stats.suites || 0,
      tests: stats.tests || tests.length,
      passes: stats.passes || passes.length,
      pending: stats.pending || pending.length,
      failures: stats.failures || failures.length,
      start: stats.start || new Date().toISOString(),
      end: stats.end || new Date().toISOString(),
      duration: stats.duration || 0
    },
    tests,
    passes,
    pending,
    failures
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(mochaReport, null, 2), 'utf-8');
  console.log(`\n✅ Successfully converted to standard Mocha JSON: ${OUTPUT_JSON}\n`);
} catch (err) {
  console.error('❌ Failed to convert report format:', err.message);
  process.exit(1);
}
