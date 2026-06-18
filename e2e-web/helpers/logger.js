'use strict';
const path = require('path');
const fs   = require('fs');
const testConfig = require('../config/testConfig');

// Ensure logs directory exists
const logDir = testConfig.paths.logs;
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

let winstonLogger = null;

function getLogger() {
  if (winstonLogger) return winstonLogger;

  try {
    const winston = require('winston');
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
    );

    winstonLogger = winston.createLogger({
      level: 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), logFormat)
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'execution.log'),
          level: 'info'
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error'
        }),
      ],
    });
  } catch {
    // Fallback to console if winston not installed yet
    winstonLogger = {
      info:  (msg) => console.log(`[INFO]  ${msg}`),
      warn:  (msg) => console.warn(`[WARN]  ${msg}`),
      error: (msg) => console.error(`[ERROR] ${msg}`),
      debug: (msg) => console.debug(`[DEBUG] ${msg}`),
    };
  }

  return winstonLogger;
}

module.exports = getLogger();
