#!/usr/bin/env node
'use strict';
/**
 * scripts/generateXlsxReport.js
 *
 * Standalone script — reads the merged mochawesome JSON and produces
 * a branded Excel (.xlsx) report in reports/xlsx/.
 *
 * Run after tests:
 *   node scripts/generateXlsxReport.js [path/to/mochawesome-combined.json]
 *
 * Or via npm script:
 *   npm run generate-xlsx
 */

require('dotenv').config({ path: `${__dirname}/../.env` });

const ExcelJS  = require('exceljs');
const fs       = require('fs');
const path     = require('path');
const testConfig = require('../config/testConfig');

const INPUT_JSON = process.argv[2]
  || path.join(__dirname, '../reports/mochawesome-combined.json');

const OUT_DIR = testConfig.paths.xlsx;

// ── Brand ─────────────────────────────────────────────────────────────────────
const BRAND = {
  peach:     'FFFF9F7C',
  peachDark: 'FFE8734A',
  green:     'FF4CAF7D',
  red:       'FFD94F4F',
  yellow:    'FFFFCB47',
  lightBg:   'FFFFF8F5',
  white:     'FFFFFFFF',
  darkText:  'FF2D1B13',
  border:    'FFE8D4CC',
};
const solid = (a) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: a } });
const thin  = () => {
  const s = { style: 'thin', color: { argb: BRAND.border } };
  return { top: s, left: s, bottom: s, right: s };
};
const statusFill = (s) => {
  const u = (s || '').toUpperCase();
  if (u === 'PASSED' || u === 'PASS') return solid(BRAND.green);
  if (u === 'FAILED' || u === 'FAIL') return solid(BRAND.red);
  return solid(BRAND.yellow);
};

function headerRow(sheet) {
  const row = sheet.getRow(1);
  row.height = 26;
  row.eachCell(cell => {
    cell.fill      = solid(BRAND.peach);
    cell.font      = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 11 };
    cell.border    = thin();
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
}

function dataRow(sheet, rn, alt) {
  const row = sheet.getRow(rn);
  row.height = 18;
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill      = solid(alt ? BRAND.lightBg : BRAND.white);
    cell.font      = { color: { argb: BRAND.darkText }, name: 'Calibri', size: 10 };
    cell.border    = thin();
    cell.alignment = { vertical: 'middle' };
  });
}

// ── Parse mochawesome JSON ─────────────────────────────────────────────────────

function flatten(suites, results = []) {
  for (const suite of suites || []) {
    const moduleName = suite.title || 'Unknown';
    for (const test of suite.tests || []) {
      results.push({
        module:   moduleName,
        scenario: test.fullTitle || test.title || '—',
        status:   test.pass ? 'PASSED' : test.fail ? 'FAILED' : 'SKIPPED',
        duration: ((test.duration || 0) / 1000).toFixed(2) + 's',
        error:    test.err ? (test.err.message || '') : '',
        code:     test.code || '',
      });
    }
    flatten(suite.suites, results);
  }
  return results;
}

async function generate() {
  if (!fs.existsSync(INPUT_JSON)) {
    console.error(`❌  JSON report not found: ${INPUT_JSON}`);
    console.error('    Run tests first: npm run test:ci && npm run merge-reports');
    process.exit(1);
  }

  const raw    = JSON.parse(fs.readFileSync(INPUT_JSON, 'utf-8'));
  const stats  = raw.stats || {};
  const tests  = flatten(raw.results || []);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'NewMomCircle Web QA';
  wb.created = new Date();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summary = wb.addWorksheet('📋 Summary');
  summary.columns = [
    { header: 'Report Generated',  key: 'date',       width: 24 },
    { header: 'Base URL',          key: 'baseUrl',    width: 44 },
    { header: 'Total Tests',       key: 'total',      width: 14 },
    { header: 'Passed ✅',         key: 'passed',     width: 12 },
    { header: 'Failed ❌',         key: 'failed',     width: 12 },
    { header: 'Pending ⏭',        key: 'pending',    width: 12 },
    { header: 'Pass Rate',         key: 'rate',       width: 12 },
    { header: 'Duration',          key: 'duration',   width: 14 },
  ];

  const total   = stats.tests || tests.length;
  const passed  = stats.passes || tests.filter(t => t.status === 'PASSED').length;
  const failed  = stats.failures || tests.filter(t => t.status === 'FAILED').length;
  const pending = stats.pending || tests.filter(t => t.status === 'SKIPPED').length;
  const rate    = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0.0%';
  const durSec  = stats.duration != null ? (stats.duration / 1000).toFixed(1) + 's' : '—';

  summary.addRow({
    date:     new Date().toISOString().slice(0, 19).replace('T', ' '),
    baseUrl:  testConfig.baseUrl,
    total, passed, failed, pending,
    rate, duration: durSec,
  });
  headerRow(summary);
  dataRow(summary, 2, false);

  const rateCell = summary.getRow(2).getCell('rate');
  rateCell.fill  = statusFill(parseFloat(rate) >= 90 ? 'PASSED' : parseFloat(rate) >= 70 ? 'SKIPPED' : 'FAILED');
  rateCell.font  = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };

  // ── Sheet 2: All Test Cases ───────────────────────────────────────────────
  const cases = wb.addWorksheet('🧪 Test Cases');
  cases.columns = [
    { header: 'Test ID',   key: 'id',       width: 12 },
    { header: 'Module',    key: 'module',   width: 28 },
    { header: 'Scenario',  key: 'scenario', width: 68 },
    { header: 'Status',    key: 'status',   width: 12 },
    { header: 'Duration',  key: 'duration', width: 12 },
  ];
  cases.views    = [{ state: 'frozen', ySplit: 1 }];
  cases.autoFilter = { from: 'A1', to: 'E1' };

  tests.forEach((t, i) => {
    const row = cases.addRow({ id: `TC-${String(i + 1).padStart(3, '0')}`, ...t });
    dataRow(cases, row.number, i % 2 === 0);
    const sc = cases.getRow(row.number).getCell('status');
    sc.fill = statusFill(t.status);
    sc.font = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };
    sc.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  headerRow(cases);

  // ── Sheet 3: Failed Tests ─────────────────────────────────────────────────
  const failures = wb.addWorksheet('❌ Failed Tests');
  failures.columns = [
    { header: 'Module',         key: 'module',   width: 28 },
    { header: 'Scenario',       key: 'scenario', width: 68 },
    { header: 'Failure Reason', key: 'error',    width: 60 },
  ];
  failures.views    = [{ state: 'frozen', ySplit: 1 }];
  failures.autoFilter = { from: 'A1', to: 'C1' };

  const failedTests = tests.filter(t => t.status === 'FAILED');
  failedTests.forEach((t, i) => {
    const row = failures.addRow(t);
    dataRow(failures, row.number, i % 2 === 0);
    const ec = failures.getRow(row.number).getCell('error');
    ec.font = { color: { argb: BRAND.red }, name: 'Calibri', size: 10 };
  });
  headerRow(failures);

  if (failedTests.length === 0) {
    const r = failures.addRow({ module: '—', scenario: 'All tests passed! ✅', error: '—' });
    dataRow(failures, r.number, false);
  }

  // ── Write file ────────────────────────────────────────────────────────────
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `Web_E2E_Report_${ts}.xlsx`;
  const filepath = path.join(OUT_DIR, filename);

  await wb.xlsx.writeFile(filepath);
  console.log(`\n📊 Excel report saved → ${filepath}`);
  console.log(`   Total: ${total}  ✅ ${passed}  ❌ ${failed}  ⏭ ${pending}  (${rate})\n`);
}

generate().catch(e => {
  console.error('❌ Report generation failed:', e.message);
  process.exit(1);
});
