const isDev = process.env.NODE_ENV !== 'production';

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info: (...args) => {
    if (isDev) console.log(`[${timestamp()}] [INFO]`, ...args);
  },
  warn: (...args) => {
    console.warn(`[${timestamp()}] [WARN]`, ...args);
  },
  error: (...args) => {
    console.error(`[${timestamp()}] [ERROR]`, ...args);
  },
  debug: (...args) => {
    if (isDev) console.log(`[${timestamp()}] [DEBUG]`, ...args);
  },
};

module.exports = logger;
