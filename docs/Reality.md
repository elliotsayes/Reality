# Reality Protocol v0.1

> [!NOTE]
> This document is a work in progress and subject to change. Newer versions of the protocol may break backward-compatibility.

Reality Protocol allows representing `Entities` in space. Each `Reality` defines the dimensionality of that space (e.g. 2 or 3), and each `Entity` has a position within that space represented by a vector of numbers.

The Protocol is comprised of Handlers for `Definitions` for the World itself, and `Entities`.

Source code is available in [Reality.lua](../process/blueprint/Reality.lua)

## Definitions

These components define base information about the world and how to render it.

### `RealityInfo` Handler

Handler Tags:
```json
{
  "Action": "Reality.Info",
}
```

Response Data: `RealityInfo` Model

#### `RealityInfo` Model

```
{
  Dimensions: Number,
  Name: String,
  Render-With: '2D-Tile-0',
}
```

- `Dimensions` is the number of dimensions in the space, for example `2` or `3`. All `Vector<Number>` types in a World process should have their length equal to `Dimensions`, unless otherwise stated.
- Currently '2D-Tile-0' is the only supported rendering method. This method renders a world based on 2D Tileset/Tilemap assets.

### `RealityParameters` Handler

Handler Tags:
```json
{
  "Action": "Reality.Parameters",
}
```

Response Data: `RealityParameters` Model

#### `RealityParameters` Model

Contains the configuration for the specified rendering method. Below is the configuration for the '2D-Tile-0' rendering method.

```
{
  ['2D-Tile-0']: {
    Version: '0',
    Spawn?: Vector<Number>,
    Tileset: {
      Type: 'Fixed',
      Format: 'PNG',
      TxId: String,
    },
    Tilemap: {
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
    - Please see the [World Guide](WorldGuide.md) for how to set up a tilemap that will work with the `2D-Tilemap-0` Renderer
  - `Offset` is a vector (with length of 2) that represents the offset of the tilemap relative to the Origin.

This rendering method can be combined with extensions in `RealityParameters`. Currently the only extension is `Audio-0`.

```
{
  ...
  ['Audio-0']?: {
    Bgm?: {
      Type: 'Fixed',
      Format: 'MP3' | 'OGG' | 'OPUS' | 'WEBM' | 'WAV' | 'FLAC',
      TxId: String,
    },
  },
}
```

- `Bgm` is the background music for the World.
  - `Type` is the type of the audio file.
  - `Format` is the format of the audio file.
  - `TxId` refers to Arweave Transaction Ids.

## Entities

### Read Entities Handlers

Entities are split into two categories, Static and dynamic. Static entities are defined by the World and do not change, while dynamic entities are updated by the Process, and should be periodically refreshed by the client.

#### EntitiesStatic

Handler Tags:
```json
{
  "Action": "Reality.EntitiesStatic",
}
```

Response Data: `Entities` Model

#### Entities Dynamic

Returns: `Entities` Model

Handler Tags:
```json
{
  "Action": "Reality.EntitiesDynamic",
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
- The length of the `Position` Vector should be equal to the `Dimensions` of the `Reality`.
- `Type` indicates how the Entity should be represented:
  - `Avatar`: Represents a user or process.
  - `Hidden`: Represents an entity that is invisible.
  - `Unknown`: Representation is ignored.

#### `Metadata` Model

Metadata is optional, and can contain additional information about the Entity.

#### `Interaction` Model

Interaction is optional, and can be defined as one of the following models: `Default`, `Warp`, `SchemaForm`, `SchemaExternalForm`.

##### Default

This indicates that the client should send an ao message to the entity upon being click. The message is sent with the `Action` tag set to `DefaultInteraction`. You should set up your agent to have a handler for this message.

##### Warp

Indicates that the entity is a warp area. When a player overlaps with a warp area, they teleport to that World. The `EntityId` (i.e. the key of the Entity object) should be the Id of a another Process implementing the Reality Protocol.

```
{
  Type: 'Warp',
  Size: Vector<Number>,
  Spawn?: Vector<Number>,
}
```

- `Size` is a vector (with length of 2) that represents the size of the warp area.
- `Spawn` is an optional vector that override the spawn position of the target World. This Vector should have the same dimensions of the target World, rather than the current World. 

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

#### `RealityEntityCreate` Handler

Creates a dynamic entity in the World, identified by the Process or Wallet that sent the message. If the entity already exists, it will be updated.

Handler Tags:
```json
{
  "Action": "Reality.EntityCreate",
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

- Position is the initial position of the Entity. If not provided, the Entity will be placed at the `Spawn` position of the World, or at the origin if no `Spawn` is defined.
- See Read Entities Handlers for more information on `Type`, `Metadata` and `Interaction` models.


#### `RealityEntityUpdatePosition` Handler

Updates the position of a dynamic entity in the World. The entity must already have been created for this to work.

Handler Tags:
```json
{
  "Action": "Reality.EntityUpdatePosition",
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
