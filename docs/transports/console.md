# Console transport

Displays a log message in the console

## Options

#### `format` {string | (params: FormatParams) => any[]}

Default: `'[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'`

Determines how to serialize log message while writing to a file.
[Read more](format.md).

#### `level` {LogLevel | false}

Default: `false`

Filter log messages which can be sent via the transport.

#### `writeFn` {(options: { message: LogMessage }) => void}

A function which actually prints formatted console message to console. You can
override it if you want to use some third-party library for that.
