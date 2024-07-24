# Schema Protocol v0.1

Schema Protocol allows a process to declare it's handler interface as data. By doing so, user interfaces (e.g. CLIs, slash commands, GUI forms) can be generated dynamically by dApps to allow users to easily interact with arbitrary protocols. 

The Schema is defined using the JSONSchema standard, which allows for complex data structures and validation rules. Schemas may be static or dynamic, allowing the process to declare legal actions based on a combination of internal state, queries to other processes, and the sender's identity.

## Schema Handler

This returns the Schema for the current process.

Handler Tags:
```json
{
  "Action": "Schema",
}
```

Response Data: `Schema`

### `Schema` Model

```
{
  [ActionName]: {
    Title: String,
    Description: String,
    Schema?: {
        Tags: JsonSchema,
        Data?: JsonSchema,
        Result?: JsonSchema,
    },
  },
}
```

- `ActionName` is a unique key for the action. Multiple actions may be declared in a Schema.
- `Title` and `Description` are human-readable strings that describe the action.
- The `Schema` field is optional. In the case it is not defined, the action is disabled and the `Title` and `Description` should indicate why and/or how to enable it.
  - `Tags` is required and defines the structure for the tags that the action accepts.
  - `Data` defines the structure of JSON data for message that the action accepts, if applicable.
  - `Result` defines the expected shape of JSON data in the reply message data.

### `JsonSchema` Model

For `Tags`, the JSONSchema should define a flat object, where each value should be a string or serializable to a string (e.g. number).

Example JsonSchema for Tags:

```json
{
  "type": "object",
  "required": [
    "Action",
    "StatusType"
  ],
  "properties": {
    "Action": {
      "type": "string",
      "const": "UpdateStatus"
    },
    "StatusType": {
      "title": "Status Type",
      "type": "string",
      "enum": ["online", "away", "offline"]
    },
    "StatusMessage": {
      "title": "Status Message",
      "description": "A message to display with the status.",
      "type": "string",
      "maxLength": 140
    },
    "DurationMs": {
      "title": "Duration",
      "description": "The duration of the status change in seconds.",
      "type": "integer",
      "minimum": 0,
      "maximum": 86400,
      "$comment": "1000"
    },
  }
}
```

This example schema defines a JSONSchema with four properties: `Action`, `StatusType`, `StatusMessage`, and `DurationMs`. The `Action` property is required and must be the string "UpdateStatus". The `StatusType` property is required and must be one of the strings "online", "away", or "offline". The `StatusMessage` property is optional and must be a string with a maximum length of 140 characters. The `DurationMs` property is optional and must be an integer between 0 and 86400, which is input as seconds and converted into milliseconds.

> Note: when an integer field has a `comment` property, it is used to multiply the value before sending it. This is useful for for converting from whole token amounts to the base unit quantity (e.g. wrapped Winston to wrapped Arweave).

## SchemaExternal Handler

This returns an External Schema for the current process. External Schemas are used to declare actions that are relevant to the current process, but sent via another processes. This is kept in a separate handler as a security boundary, as it allows processes to declare potentially malicious actions. Messages generated from this handler should be verified by the user before sending.

Handler Tags:
```json
{
  "Action": "SchemaExternal",
}
```

Response Data: `SchemaExternal`

### `SchemaExternal` Model

```
{
  [ActionName]: {
    Target: String,
    Title: String,
    Description: String,
    Schema?: {
        Tags: JsonSchema,
        Data?: JsonSchema,
        Result?: JsonSchema,
    },
  },
}
```

- This is the same as the `Schema` model with the addition of the `Target` property, which is the Process Id of the target process that the action will be sent to.
