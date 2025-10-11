'use strict';

const { transform } = require('./transform');

module.exports = {
  concatFirstStringElements,
  formatScope,
  formatText,
  formatVariables,
  timeZoneFromOffset,
  formatLocalizedDate,
  formatLocalizedTime,
  formatLocalizedDateTime,

  format({ message, logger, transport, data = message?.data }) {
    switch (typeof transport.format) {
      case 'string': {
        return transform({
          message,
          logger,
          transforms: [formatVariables, formatScope, formatText],
          transport,
          initialData: [transport.format, ...data],
        });
      }

      case 'function': {
        return transport.format({
          data,
          level: message?.level || 'info',
          logger,
          message,
          transport,
        });
      }

      default: {
        return data;
      }
    }
  },
};

/**
 * The first argument of console.log may contain a template. In the library
 * the first element is a string related to transports.console.format. So
 * this function concatenates first two elements to make templates like %d
 * work
 * @param {*[]} data
 * @return {*[]}
 */
function concatFirstStringElements({ data }) {
  if (typeof data[0] !== 'string' || typeof data[1] !== 'string') {
    return data;
  }

  if (data[0].match(/%[1cdfiOos]/)) {
    return data;
  }

  return [`${data[0]} ${data[1]}`, ...data.slice(2)];
}

function timeZoneFromOffset(minutesOffset) {
  const minutesPositive = Math.abs(minutesOffset);
  const sign = minutesOffset > 0 ? '-' : '+';
  const hours = Math.floor(minutesPositive / 60).toString().padStart(2, '0');
  const minutes = (minutesPositive % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

/**
 * Format date using user's locale and internationalization settings
 * @param {Date} date
 * @return {string}
 */
function formatLocalizedDate(date) {
  try {
    return new Intl.DateTimeFormat().format(date);
  } catch (error) {
    // Fallback to ISO date if Intl is not available
    return date.toISOString().split('T')[0];
  }
}

/**
 * Format time using user's locale and internationalization settings
 * @param {Date} date
 * @return {string}
 */
function formatLocalizedTime(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch (error) {
    // Fallback to manual formatting if Intl is not available
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}

/**
 * Format date and time using user's locale and internationalization settings
 * @param {Date} date
 * @return {string}
 */
function formatLocalizedDateTime(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch (error) {
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }
}

function formatScope({ data, logger, message }) {
  const { defaultLabel, labelLength } = logger?.scope || {};
  const template = data[0];
  let label = message.scope;

  if (!label) {
    label = defaultLabel;
  }

  let scopeText;
  if (label === '') {
    scopeText = labelLength > 0 ? ''.padEnd(labelLength + 3) : '';
  } else if (typeof label === 'string') {
    scopeText = ` (${label})`.padEnd(labelLength + 3);
  } else {
    scopeText = '';
  }

  data[0] = template.replace('{scope}', scopeText);
  return data;
}

function formatVariables({ data, message }) {
  let template = data[0];
  if (typeof template !== 'string') {
    return data;
  }

  // Add additional space to the end of {level}] template to align messages
  template = template.replace('{level}]', `${message.level}]`.padEnd(6, ' '));

  const date = message.date || new Date();
  data[0] = template
    .replace(/\{(\w+)}/g, (substring, name) => {
      switch (name) {
        case 'level': return message.level || 'info';
        case 'logId': return message.logId;

        case 'y': return date.getFullYear().toString(10);
        case 'm': return (date.getMonth() + 1).toString(10).padStart(2, '0');
        case 'd': return date.getDate().toString(10).padStart(2, '0');
        case 'h': return date.getHours().toString(10).padStart(2, '0');
        case 'i': return date.getMinutes().toString(10).padStart(2, '0');
        case 's': return date.getSeconds().toString(10).padStart(2, '0');
        case 'ms': return date.getMilliseconds().toString(10).padStart(3, '0');
        case 'z': return timeZoneFromOffset(date.getTimezoneOffset());
        case 'iso': return date.toISOString();
        
        // Internationalization support
        case 'date': return formatLocalizedDate(date);
        case 'time': return formatLocalizedTime(date);
        case 'datetime': return formatLocalizedDateTime(date);

        default: {
          return message.variables?.[name] || substring;
        }
      }
    })
    .trim();

  return data;
}

function formatText({ data }) {
  const template = data[0];
  if (typeof template !== 'string') {
    return data;
  }

  const textTplPosition = template.lastIndexOf('{text}');
  if (textTplPosition === template.length - 6) {
    data[0] = template.replace(/\s?{text}/, '');
    if (data[0] === '') {
      data.shift();
    }

    return data;
  }

  const templatePieces = template.split('{text}');
  let result = [];

  if (templatePieces[0] !== '') {
    result.push(templatePieces[0]);
  }

  result = result.concat(data.slice(1));

  if (templatePieces[1] !== '') {
    result.push(templatePieces[1]);
  }

  return result;
}
