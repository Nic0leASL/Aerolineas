/**
 * Logger utility para registrar eventos del sistema
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor(logLevel = 'info') {
    this.logLevel = LOG_LEVELS[logLevel] || LOG_LEVELS.info;
  }

  format(level, message, data = '') {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
  }

  error(message, data) {
    if (this.logLevel >= LOG_LEVELS.error) {
      console.error(this.format('error', message, data));
    }
  }

  warn(message, data) {
    if (this.logLevel >= LOG_LEVELS.warn) {
      console.warn(this.format('warn', message, data));
    }
  }

  info(message, data) {
    if (this.logLevel >= LOG_LEVELS.info) {
      console.log(this.format('info', message, data));
    }
  }

  debug(message, data) {
    if (this.logLevel >= LOG_LEVELS.debug) {
      console.log(this.format('debug', message, data));
    }
  }
}

export default Logger;
