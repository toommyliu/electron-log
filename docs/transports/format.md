# Format

Format property can be a string template or a function

## Template

Example: ``'[{h}:{i}:{s}.{ms}] [{level}] {text}'``

| Name        | Value                  |
|-------------|------------------------|
| level       | Logging level          |
| logId       | Logging instance id    |
| text        | Serialized log message |
| scope       | Scope                  |
| processType | browser or renderer    |
| y           | Year                   |
| m           | Month                  |
| d           | Day                    |
| h           | Hour                   |
| i           | Minute                 |
| s           | Second                 |
| ms          | Millisecond            |
| z           | Timezone offset        |
| iso         | date.toISOString()     |
| date        | Localized date         |
| time        | Localized time         |
| datetime    | Localized date & time  |

Also, you can use your own values:

```js
log.variables.label = 'dev';
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{label}] {text}';
```

## Internationalization

The new `{date}`, `{time}`, and `{datetime}` format options use the user's locale settings:

```js
// Uses user's locale for date/time formatting
log.transports.console.format = '[{datetime}] [{level}] {text}';

// Individual components
log.transports.console.format = '[{date} {time}] [{level}] {text}';

// Mix with traditional formatting
log.transports.console.format = '[{date} {h}:{i}:{s}] [{level}] {text}';
```

## Function

`(params: FormatParams) => any[]`

```ts
interface FormatParams {
  data: any[];
  level: LogLevel;
  logger: Logger;
  message: LogMessage;
  transport: Transport;
}
```

```js
import util from 'node:util';

log.transports.console.format = ({ data, level, message }) => {
  const text = util.format(...data);
  
  return [
    message.date.toISOString().slice(11, -1),
    `[${level}]`,
    text
  ];
};
```
