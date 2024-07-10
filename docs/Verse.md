# Verse Protocol v0.1

> Note: This document is a work in progress and subject to change. Newer versions of the protocol may break backward-compatibility.

Verse Protocol allows representing `Entities` in space. Each `Verse` defines the dimensionality of that space (e.g. 2 or 3), and each `Entity` has a position within that space represented by a vector of numbers.

The Protocol is comprised of Handlers for `Definitions` for the Verse itself, and `Entities`.

## Definitions

These components define base information about the verse and how to render it.

### `VerseInfo` Handler

Handler Tags:
```json
{
  "Action": "VerseInfo",
}
```

Response Data: `VerseInfo` Model

#### `VerseInfo` Model

```
{
  Dimensions: Number,
  Name: String,
  Render-With: '2D-Tile-0',
}
```

- `Dimensions` is the number of dimensions in the space, for example `2` or `3`. All `Vector<Number>` types in a Verse process should have their length equal to `Dimensions`, unless otherwise stated.
- Currently '2D-Tile-0' is the only supported rendering method. This method render a world based on 2D Tileset/Tilemap assets.

### `VerseParameters` Handler

Handler Tags:
```json
{
  "Action": "VerseParameters",
}
```

Response Data: `VerseParameters` Model

#### `VerseParameters` Model

Contains the configuration for the specified rendering method. Below is the configuration for the '2D-Tile-0' rendering method.

```js
{
  ['2D-Tile-0']: {
    Version: '0',
    Spawn?: Vector<Number>,
    Tileset: {
      Type: 'Fixed',
      Format: 'PNG',
      TxId: String,
    },
    Tilemap = {
      Type: 'Fixed',
      Format: 'TMJ',
      TxId: String,
      Offset?: Vector<Number>,
    },
  },
}
```

- `TxId` refers to Arweave Transaction Ids
- `Tileset` is the art used to render the world.
  - Currently only `PNG` format is supported.
- `Tilemap` refers to a TMJ file that contains the tilemap Asset.
  - Currently only the `TMJ` format is supported. `TMJ` refers to the standard [Tiled TMX Map Format](https://doc.mapeditor.org/en/stable/reference/tmx-map-format/), exported in the [JSON variant](https://doc.mapeditor.org/en/stable/reference/json-map-format/).
    - Please see **TODO** for how to set up a tilemap that will work with the `2D-Tilemap-0` Renderer
  - `Offset` is a vector (with length of 2) that represents the offset of the tilemap relative to the Origin.

## Entities

### Read Entities Handlers

Entities are split into two categories, Static and dynamic. Static entities are defined by the Verse and do not change, while dynamic entities are updated by the Process, and should be periodically refreshed by the client.

#### EntitiesStatic

Handler Tags:
```json
{
  "Action": "EntitiesStatic",
}
```

Response Data: `Entities` Model

#### Entities Dynamic

Returns: `Entities` Model

Handler Tags:
```json
{
  "Action": "EntitiesDynamic",
}
```
Handler Data:
```
{
  Timestamp: Number,
}
```

- The handler returns all entities that have been created or updated since the provided `Timestamp`.

Response Data: `Entities` Model

#### `Entities` Model

```
{
  [EntityId]: {
    Position: Vector<Number>,
    Type: 'Avatar' | 'Hidden' | 'Unknown',
    Metadata?: {
      Interaction?: ...,
      ...,
    },
  },
  ...
}
```

- EntityId: A unique identifier for the Entity, usually an `ao` ProcessId.
- The length of the `Position` Vector should be equal to the `Dimensions` of the `Verse`.
- `Type` indicates how the Entity should be represented:
  - `Avatar`: Represents a user or process.
  - `Hidden`: Represents an entity that is invisible.
  - `Unknown`: Representation is ignored.

#### `Metadata` Model

Metadata is optional, and can contain additional information about the Entity.

#### `Interaction` Model

Interaction is optional, and can be defined as one of the following models: `Warp`, `SchemaForm`, `SchemaExternalForm`.

##### Warp

Indicates that the entity is a warp area. When a player overlaps with a warp area, they teleport to that Verse. The `EntityId` (i.e. the key of the Entity object) should be the Id of a another Process implementing the Verse Protocol.

```
{
  Type: 'Warp',
  Size: Vector<Number>,
  Spawn?: Vector<Number>,
}
```

- `Size` is a vector (with length of 2) that represents the size of the warp area.
- `Spawn` is an optional vector that override the spawn position of the target Verse. This Vector should have the same dimensions of the target Verse, rather than the current Verse. 

>> TODO: Some kind of direct Schema Action on Click?

##### SchemaForm / SchemaExternalForm

Indicates that interactions with this Entity (i.e. by click) should show a form based on the Entity's `Schema`. `SchemaExternalForm` allows for sending messages to a different Process Id, and therefore may be require additional confirmations from the user or in some cases be restricted.

```
{
  Type: 'SchemaForm' | 'SchemaExternalForm',
  Id: String,
}
```

- `Id` Refers to the Action Id of the Schema. Please see the [Schema Protocol](./Schema.md) for more information.

### Write Entities Handlers

#### `VerseEntityCreate` Handler

Creates a dynamic entity in the Verse, identified by the Process or Wallet that sent the message. If the entity already exists, it will be updated.

Handler Tags:
```json
{
  "Action": "VerseEntityCreate",
}
```
Handler Data:
```
{
  Type: 'Avatar' | 'Hidden' | 'Unknown',
  Position?: Vector<Number>,
  Metadata?: {
    Interaction?: ...,
    ...,
  },
}
```

- Position is the initial position of the Entity. If not provided, the Entity will be placed at the `Spawn` position of the Verse, or at the origin if no `Spawn` is defined.
- See Read Entities Handlers for more information on `Type`, `Metadata` and `Interaction` models.


#### `VerseEntityUpdatePosition` Handler

Updates the position of a dynamic entity in the Verse. The entity must already have been created for this to work.

Handler Tags:
```json
{
  "Action": "VerseEntityUpdatePosition",
}
```

Handler Data:
```
{
  Position: Vector<Number>,
}
```

- `Position` is the new position of the Entity.
- Calling this handler will update the timestamp of the Entity, so it will be returned by the `EntitiesDynamic` handler when provided with a recent timestamp.
