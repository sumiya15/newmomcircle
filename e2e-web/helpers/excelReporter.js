'use strict';
/**
 * e2e-web/helpers/excelReporter.js
 *
 * Branded Excel reporter (4 worksheets) for the Selenium web test suite.
 * Mirrors the Appium reporter in e2e/utilities/excelReporter.js but adapted
 * for web — device/Android fields replaced with browser/URL.
 *
 * Worksheets:
 *   1. Summary        — one row per test session
 *   2. Test Cases     — one row per test case (colour-coded status)
 *   3. Failed Tests   — expanded failure info + screenshot path
 *   4. Execution Logs — step-level log with timestamps
 */

const ExcelJS    = require('exceljs');
const path       = require('path');
const fs         = require('fs');
const testConfig = require('../config/testConfig');
const logger     = require('./logger');

// ── Brand palette ──────────────────────────────────────────────────────────
const BRAND = {
  peach:     'FFFF9F7C',   // header fill
  peachDark: 'FFE8734A',   // accent
  green:     'FF4CAF7D',   // PASSED
  red:       'FFD94F4F',   // FAILED
  yellow:    'FFFFCB47',   // SKIPPED / warning
  lightBg:   'FFFFF8F5',   // alternating row
  white:     'FFFFFFFF',
  darkText:  'FF2D1B13',
  mutedText: 'FFA08070',
  border:    'FFE8D4CC',
};

const solidFill  = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const thinBorder = () => {
  const side = { style: 'thin', color: { argb: BRAND.border } };
  return { top: side, left: side, bottom: side, right: side };
};
const statusFill = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'PASSED' || s === 'PASS')   return solidFill(BRAND.green);
  if (s === 'FAILED' || s === 'FAIL')   return solidFill(BRAND.red);
  return solidFill(BRAND.yellow);
};

function applyHeaderRow(sheet) {
  const row = sheet.getRow(1);
  row.height = 26;
  row.eachCell(cell => {
    cell.fill      = solidFill(BRAND.peach);
    cell.font      = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 11 };
    cell.border    = thinBorder();
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  });
}

function applyDataRow(sheet, rowNum, isAlt) {
  const row = sheet.getRow(rowNum);
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill      = solidFill(isAlt ? BRAND.lightBg : BRAND.white);
    cell.font      = { color: { argb: BRAND.darkText }, name: 'Calibri', size: 10 };
    cell.border    = thinBorder();
    cell.alignment = { vertical: 'middle', wrapText: false };
  });
}

// ── ExcelReporter class ────────────────────────────────────────────────────

class ExcelReporter {
  constructor() {
    this._wb           = new ExcelJS.Workbook();
    this._wb.creator   = 'NewMomCircle Web QA';
    this._wb.created   = new Date();

    this._summary  = this._wb.addWorksheet('📋 Summary');
    this._cases    = this._wb.addWorksheet('🧪 Test Cases');
    this._failures = this._wb.addWorksheet('❌ Failed Tests');
    this._logs     = this._wb.addWorksheet('📝 Execution Logs');

    this._tcCount  = 0;
    this._ftCount  = 0;
    this._lgCount  = 0;

    this._buildHeaders();
  }

  _buildHeaders() {
    // ── Summary ──
    this._summary.columns = [
      { header: 'Execution Date',  key: 'date',       width: 22 },
      { header: 'Browser',         key: 'browser',    width: 20 },
      { header: 'Base URL',        key: 'baseUrl',    width: 40 },
      { header: 'Total Tests',     key: 'total',      width: 14 },
      { header: 'Passed ✅',       key: 'passed',     width: 12 },
      { header: 'Failed ❌',       key: 'failed',     width: 12 },
      { header: 'Skipped ⏭',      key: 'skipped',    width: 12 },
      { header: 'Pass Rate',       key: 'percentage', width: 12 },
      { header: 'Duration',        key: 'duration',   width: 12 },
    ];

    // ── Test Cases ──
    this._cases.columns = [
      { header: 'Test ID',    key: 'id',       width: 12 },
      { header: 'Module',     key: 'module',   width: 24 },
      { header: 'Scenario',   key: 'scenario', width: 60 },
      { header: 'Browser',    key: 'browser',  width: 16 },
      { header: 'Status',     key: 'status',   width: 12 },
      { header: 'Start Time', key: 'start',    width: 22 },
      { header: 'End Time',   key: 'end',      width: 22 },
      { header: 'Duration',   key: 'duration', width: 12 },
    ];

    // ── Failed Tests ──
    this._failures.columns = [
      { header: 'Test Scenario',   key: 'test',       width: 56 },
      { header: 'Failure Reason',  key: 'reason',     width: 60 },
      { header: 'Screenshot Path', key: 'screenshot', width: 56 },
      { header: 'Browser',         key: 'browser',    width: 16 },
      { header: 'URL at Failure',  key: 'url',        width: 48 },
    ];

    // ── Execution Logs ──
    this._logs.columns = [
      { header: 'Timestamp',      key: 'timestamp', width: 22 },
      { header: 'Test Name',      key: 'test',      width: 52 },
      { header: 'Step',           key: 'step',      width: 30 },
      { header: 'Result',         key: 'result',    width: 12 },
      { header: 'Remarks',        key: 'remarks',   width: 40 },
      { header: 'Duration',       key: 'time',      width: 12 },
      { header: 'Failure Detail', key: 'failure',   width: 60 },
    ];

    // Apply header styles and freeze panes
    [this._summary, this._cases, this._failures, this._logs].forEach(s => {
      s.properties.defaultRowHeight = 18;
      applyHeaderRow(s);
    });

    this._cases.views    = [{ state: 'frozen', ySplit: 1 }];
    this._failures.views = [{ state: 'frozen', ySplit: 1 }];
    this._logs.views     = [{ state: 'frozen', ySplit: 1 }];

    this._cases.autoFilter    = { from: 'A1', to: 'H1' };
    this._failures.autoFilter = { from: 'A1', to: 'E1' };
    this._logs.autoFilter     = { from: 'A1', to: 'G1' };
  }

  // ── Public API ──────────────────────────────────────────────────────────

  addSummaryRow(data) {
    const row    = this._summary.addRow(data);
    const rowNum = row.number;
    applyDataRow(this._summary, rowNum, rowNum % 2 === 0);

    // Colour-code the pass-rate cell
    const pct     = parseFloat(data.percentage);
    const pctCell = this._summary.getRow(rowNum).getCell('percentage');
    pctCell.fill = solidFill(pct >= 90 ? BRAND.green : pct >= 70 ? BRAND.yellow : BRAND.red);
    pctCell.font = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };
    pctCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  addTestCaseRow(data) {
    this._tcCount++;
    const row    = this._cases.addRow(data);
    const rowNum = row.number;
    applyDataRow(this._cases, rowNum, this._tcCount % 2 === 0);

    const statusCell = this._cases.getRow(rowNum).getCell('status');
    statusCell.fill      = statusFill(data.status);
    statusCell.font      = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  addFailedTestRow(data) {
    this._ftCount++;
    const row    = this._failures.addRow(data);
    const rowNum = row.number;
    applyDataRow(this._failures, rowNum, this._ftCount % 2 === 0);

    const reasonCell = this._failures.getRow(rowNum).getCell('reason');
    reasonCell.font = { color: { argb: BRAND.red }, name: 'Calibri', size: 10 };
  }

  addExecutionLogRow(data) {
    this._lgCount++;
    const row    = this._logs.addRow(data);
    const rowNum = row.number;
    applyDataRow(this._logs, rowNum, this._lgCount % 2 === 0);

    const resultCell = this._logs.getRow(rowNum).getCell('result');
    resultCell.fill      = statusFill(data.result);
    resultCell.font      = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };
    resultCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  async saveReport() {
    try {
      const dir = testConfig.paths.xlsx;
      fs.mkdirSync(dir, { recursive: true });
      const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Web_E2E_Report_${ts}.xlsx`;
      const filepath = path.join(dir, filename);
      await this._wb.xlsx.writeFile(filepath);
      logger.info(`📊 Excel report saved → ${filepath}`);
      return filepath;
    } catch (err) {
      logger.error(`Excel report save failed: ${err.message}`);
      return null;
    }
  }
}

module.exports = new ExcelReporter();
