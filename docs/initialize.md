# Initialize the logger in a renderer process

Previously in v4, the logger instances worked independently in 
main and renderer processes. But currently, there are a lot of restrictions
for code in a renderer processes by default. So now all the logic performed
in the main process. A logger in the renderer processes just collects the data
and sends it to the main process through IPC.

There are a few ways how a renderer logger could be configured.

## 1. Most common case. Use some bundler and contextIsolation/sandbox enabled

```js
import log from 'electron-log/main';

log.initialize();
````

**renderer.ts**
```typescript
import log from 'electron-log/renderer';

log.info('Log from the renderer');
````

This method injects a built-in preload script into a renderer process through
sessions. The preload script is injected into the default session and any
sessions created after a `log.initialize()` call.

### Using custom sessions

If you use another session, make sure it's initialized
after `log.initialize()` call or pass your sessions to the function:

```js
log.initialize({ getSessions: () => [customSession] });
````

To disable preload script injection, pass `includeFutureSession: false` option
to the `initizlize` function.

## 2. Inject preload code manually

Instead of calling `log.initialize()`, you can inject the preload script 
manually.
Add the import inside your preload script:

`import 'electron-log/preload';`

## 3. Use `window.__electronLog` with isolated context without bundling

**main.js**
```js
import log from 'electron-log/main';

log.initialize();
````

**renderer.js**
```js
__electronLog.info('Log from the renderer');
````

Please be aware that `__electronLog` global variable only exposes log functions,
no errorHandler, scope and other members.

## 4. Configure which transports handle renderer logs

By default, renderer process logs are processed by all configured transports in
the main process (e.g., console, file, remote, etc.). You can control which
transports should handle renderer logs by using the `rendererTransports` option.
This is useful if you want to isolate main and renderer logs, or vary logging
behavior per renderer process.

**main.js**
```js
import log from 'electron-log/main';

// Renderer logs will only be written to console, not to file
log.initialize({ 
  rendererTransports: ['console']
});
```

You can pass an array of transport names. Available transports are:
- `'console'` - Browser/Node console
- `'file'` - File transport
- `'remote'` - Remote transport
- `'ipc'` - IPC transport
- Any custom transport names you've added

Example: Log renderers to file but not console:
```js
log.initialize({ 
  rendererTransports: ['file']
});
```

Example: Don't log renderers at all:
```js
log.initialize({ 
  rendererTransports: []
});
```

If `rendererTransports` is not specified, all transports handle renderer logs.

## 5. Spy on `console.log` calls

It's possible to collect logs written by `console.log` in the renderer process

**main.js**
```js
import log from 'electron-log/main';

// It makes a renderer logger available trough a global electronLog instance
log.initialize({ spyRendererConsole: true });
````

After that, any console call from a renderer will be processed in the
main process. But in that case, it's not possible to log object. 
For example, when `console.log('test', { a: 1 })` is called in a renderer,
`test [Object]` is received on the main side.

## 6. Using IPC directly

Starting from electron-log v5, an electron-log IPC call has a constant
signature. So you can call it directly if you don't want to use a renderer-side
logger instance for some reason:

```js
import { ipcRenderer } from 'electron';

ipcRenderer.send('__ELECTRON_LOG__', {
  // LogMessage-like object
  data: ['Log from a renderer'],
  level: 'info',
  variables: { processType: 'renderer' },
  // ... some other optional fields like scope, logId and so on
});
```

When context isolation is enabled or nodeIntegration is disabled, which is the
default WebContext state in Electron, this code only works in a preload script.
Otherwise, it can be used in a renderer code as well.
