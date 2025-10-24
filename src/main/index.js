'use strict';

const electron = require('electron');
const ElectronExternalApi = require('./ElectronExternalApi');
const { initialize, getRendererTransportsConfig } = require('./initialize');
const createDefaultLogger = require('../node/createDefaultLogger');

const externalApi = new ElectronExternalApi({ electron });
const defaultLogger = createDefaultLogger({
  dependencies: { externalApi },
  initializeFn: initialize,
});

module.exports = defaultLogger;

externalApi.onIpc('__ELECTRON_LOG__', (_, message) => {
  if (message.scope) {
    defaultLogger.Logger.getInstance(message).scope(message.scope);
  }

  const date = new Date(message.date);
  const rendererTransportsConfig = getRendererTransportsConfig();
  
  processMessage({
    ...message,
    date: date.getTime() ? date : new Date(),
    rendererTransportsConfig,
  });
});

externalApi.onIpcInvoke('__ELECTRON_LOG__', (_, { cmd = '', logId }) => {
  switch (cmd) {
    case 'getOptions': {
      const logger = defaultLogger.Logger.getInstance({ logId });
      return {
        levels: logger.levels,
        logId,
      };
    }

    default: {
      processMessage({ data: [`Unknown cmd '${cmd}'`], level: 'error' });
      return {};
    }
  }
});

function processMessage(message) {
  const { rendererTransportsConfig, ...msg } = message;
  const logger = defaultLogger.Logger.getInstance(msg);
  
  if (rendererTransportsConfig) {
    logger.processMessage(msg, { transports: rendererTransportsConfig });
  } else {
    logger.processMessage(msg);
  }
}
