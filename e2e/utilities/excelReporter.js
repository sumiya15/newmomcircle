'use strict';
const ExcelJS   = require('exceljs');
const path      = require('path');
const fs        = require('fs');
const testConfig = require('../config/testConfig');
const logger    = require('./logger');

// ── Brand colours ─────────────────────────────────────────────────────────────
const BRAND = {
  peach:     'FFFF9F7C',
  peachDark: 'FFE8734A',
  green:     'FF4CAF7D',
  red:       'FFD94F4F',
  yellow:    'FFFFCB47',
  lightBg:   'FFFFF8F5',
  white:     'FFFFFFFF',
  darkText:  'FF2D1B13',
  mutedText: 'FFA08070',
  border:    'FFE8D4CC',
};

function headerFill(color) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}
function solidFill(color) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}
function border() {
  const side = { style: 'thin', color: { argb: BRAND.border } };
  return { top: side, left: side, bottom: side, right: side };
}
function statusFill(status) {
  const s = (status || '').toUpperCase();
  if (s === 'PASSED' || s === 'PASS')    return solidFill(BRAND.green);
  if (s === 'FAILED' || s === 'FAIL')    return solidFill(BRAND.red);
  return solidFill(BRAND.yellow);
}

function styleSheet(sheet) {
  sheet.properties.defaultRowHeight = 18;
}

function applyHeaderRow(sheet, rowIdx = 1) {
  const row = sheet.getRow(rowIdx);
  row.eachCell(cell => {
    cell.fill   = headerFill(BRAND.peach);
    cell.font   = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 11 };
    cell.border = border();
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  });
  row.height = 24;
}

function applyDataRow(sheet, rowNumber, isAlt) {
  const row = sheet.getRow(rowNumber);
  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill   = solidFill(isAlt ? BRAND.lightBg : BRAND.white);
    cell.font   = { color: { argb: BRAND.darkText }, name: 'Calibri', size: 10 };
    cell.border = border();
    cell.alignment = { vertical: 'middle', wrapText: false };
  });
}

// ── ExcelReporter ─────────────────────────────────────────────────────────────

class ExcelReporter {
  constructor() {
    this._wb     = new ExcelJS.Workbook();
    this._wb.creator  = 'NewMomCircle QA';
    this._wb.created  = new Date();

    this._summary   = this._wb.addWorksheet('Summary');
    this._testCases = this._wb.addWorksheet('Test Cases');
    this._failed    = this._wb.addWorksheet('Failed Tests');
    this._logs      = this._wb.addWorksheet('Execution Logs');

    this._initHeaders();
    this._tcCount = 0;
    this._ftCount = 0;
    this._logCount = 0;
  }

  _initHeaders() {
    // Summary sheet — wide columns for readability
    this._summary.columns = [
      { header: 'Execution Date',     key: 'date',       width: 20 },
      { header: 'Device Name',        key: 'device',     width: 22 },
      { header: 'Android Version',    key: 'version',    width: 16 },
      { header: 'Total Tests',        key: 'total',      width: 14 },
      { header: 'Passed ✅',          key: 'passed',     width: 14 },
      { header: 'Failed ❌',          key: 'failed',     width: 14 },
      { header: 'Skipped ⏭',         key: 'skipped',    width: 14 },
      { header: 'Pass %',             key: 'percentage', width: 12 },
      { header: 'Duration',           key: 'duration',   width: 14 },
    ];

    this._testCases.columns = [
      { header: 'Test ID',    key: 'id',       width: 14 },
      { header: 'Module',     key: 'module',   width: 18 },
      { header: 'Scenario',   key: 'scenario', width: 48 },
      { header: 'Device',     key: 'device',   width: 22 },
      { header: 'Status',     key: 'status',   width: 12 },
      { header: 'Start Time', key: 'start',    width: 24 },
      { header: 'End Time',   key: 'end',      width: 24 },
      { header: 'Duration',   key: 'duration', width: 14 },
    ];

    this._failed.columns = [
      { header: 'Test Name',       key: 'test',       width: 44 },
      { header: 'Failure Reason',  key: 'reason',     width: 56 },
      { header: 'Screenshot Path', key: 'screenshot', width: 56 },
      { header: 'Device',          key: 'device',     width: 22 },
      { header: 'Android Version', key: 'version',    width: 16 },
      { header: 'Activity',        key: 'activity',   width: 36 },
    ];

    this._logs.columns = [
      { header: 'Timestamp',      key: 'timestamp', width: 26 },
      { header: 'Test Name',      key: 'test',      width: 44 },
      { header: 'Step',           key: 'step',      width: 36 },
      { header: 'Result',         key: 'result',    width: 12 },
      { header: 'Remarks',        key: 'remarks',   width: 36 },
      { header: 'Duration',       key: 'time',      width: 14 },
      { header: 'Failure Detail', key: 'failure',   width: 50 },
    ];

    [this._summary, this._testCases, this._failed, this._logs].forEach(s => {
      styleSheet(s);
      applyHeaderRow(s, 1);
    });

    // Freeze header row and add autofilter on test cases sheet
    this._testCases.views = [{ state: 'frozen', ySplit: 1 }];
    this._testCases.autoFilter = { from: 'A1', to: 'H1' };
    this._failed.views     = [{ state: 'frozen', ySplit: 1 }];
    this._failed.autoFilter = { from: 'A1', to: 'F1' };
    this._logs.views       = [{ state: 'frozen', ySplit: 1 }];
  }

  addSummaryRow(data) {
    const row = this._summary.addRow(data);
    const rowNum = row.number;
    applyDataRow(this._summary, rowNum, rowNum % 2 === 0);

    // Colour-code pass percentage cell
    const pct = parseFloat(data.percentage);
    const pctCell = this._summary.getRow(rowNum).getCell('percentage');
    pctCell.fill = solidFill(pct >= 90 ? BRAND.green : pct >= 70 ? BRAND.yellow : BRAND.red);
    pctCell.font = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };
  }

  addTestCaseRow(data) {
    this._tcCount++;
    const row = this._testCases.addRow(data);
    const rowNum = row.number;
    applyDataRow(this._testCases, rowNum, this._tcCount % 2 === 0);

    // Colour-code status cell
    const statusCell = this._testCases.getRow(rowNum).getCell('status');
    statusCell.fill = statusFill(data.status);
    statusCell.font = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  addFailedTestRow(data) {
    this._ftCount++;
    const row = this._failed.addRow(data);
    applyDataRow(this._failed, row.number, this._ftCount % 2 === 0);
    // Highlight reason cell
    const reasonCell = this._failed.getRow(row.number).getCell('reason');
    reasonCell.font = { color: { argb: BRAND.red }, name: 'Calibri', size: 10 };
  }

  addExecutionLogRow(data) {
    this._logCount++;
    const row = this._logs.addRow(data);
    applyDataRow(this._logs, row.number, this._logCount % 2 === 0);
    const resultCell = this._logs.getRow(row.number).getCell('result');
    resultCell.fill = statusFill(data.result);
    resultCell.font = { bold: true, color: { argb: BRAND.white }, name: 'Calibri', size: 10 };
  }

  async saveReport() {
    try {
      fs.mkdirSync(testConfig.paths.excel, { recursive: true });
      const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `Mobile_E2E_Report_${ts}.xlsx`;
      const filepath = path.join(testConfig.paths.excel, filename);

      await this._wb.xlsx.writeFile(filepath);
      logger.info(`📊 Excel report saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Excel report save failed: ${error.message}`);
      return null;
    }
  }
}

module.exports = new ExcelReporter();
