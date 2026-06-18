const winston = require('winston');
const path = require('path');
const testConfig = require('../config/testConfig');

// Format for logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(testConfig.paths.logs, 'execution.log'),
      level: 'info'
    }),
    new winston.transports.File({
      filename: path.join(testConfig.paths.logs, 'error.log'),
      level: 'error'
    })
  ]
});

module.exports = logger;
