'use strict';

/* eslint-disable no-console */

const {
  concatFirstStringElements,
  format,
} = require('../../core/transforms/format');
const { maxDepth, toJSON } = require('../transforms/object');
const { transform } = require('../../core/transforms/transform');

const consoleMethods = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  verbose: console.info,
  debug: console.debug,
  silly: console.debug,
  log: console.log,
};

module.exports = consoleTransportFactory;

// const separator = process.platform === 'win32' ? '>' : '›';
const DEFAULT_FORMAT = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] ({level}){scope} {text}';

Object.assign(consoleTransportFactory, {
  DEFAULT_FORMAT,
});

function consoleTransportFactory(logger) {
  return Object.assign(transport, {
    format: DEFAULT_FORMAT,
    level: 'silly',
    transforms: [
      format,
      concatFirstStringElements,
      maxDepth,
      toJSON,
    ],

    writeFn({ message }) {
      const consoleLogFn = consoleMethods[message.level] || consoleMethods.info;
      consoleLogFn(...message.data);
    },
  });

  function transport(message) {
    const data = transform({ logger, message, transport });
    transport.writeFn({
      message: { ...message, data },
    });
  }
}

