# Verse Guide

The goal of this guide is to get you started developing your own Verse. We will start by creating our own Verse process based on a template, and then modifying it.

For more details on the Verse protocol, please see the [Verse Docs](./Verse.md) or [Verse.lua](../process/blueprint/Verse.lua) source code.

## Creating your own Verse Process

### Prerequisites

- Familiarity with `ao` and `aos`. See the [ao cookbook](https://cookbook_ao.arweave.dev/welcome/index.html) for more information.

### Setup

1. Download the [`Verse.lua`](../process/blueprint/Verse.lua) protocol source and the [`VerseTemplate.lua`](./src/VerseTemplate.lua) config
2. Start a new process with aos, using a module with sqlite3 built in, e.g.:

`aos MyVerseProcessName --module="GYrbbe0VbHim_7Hi6zrOpHQXrSQz07XNtwCnfbFo2I0"`

3. Load the two lua files in aos
```
aos> .load Verse.lua
Loaded Verse Protocol
aos> .load VerseTemplate.lua
Loaded Verse Template
```
> Optional: If you want chat enabled for your verse, load the [`Chat.lua`](../process/blueprint/Chat.lua) protocol source as well 

1. Enter your verse ID in [verseviewer.arweave.net](https://verseviewer.arweave.net/)

## Customizing your Verse

Edit your `VerseTemplate.lua` file to customize your verse. After editing the file, you'll have to load it in `aos` again & refresh the page for changes to take effect

For example you can move your spawn location to the opposite corner of of the Island:
```lua
VerseParameters = {
  ['2D-Tile-0'] = {
    ...
    Spawn = { 15, 12 },
    ...
  }
}
```

Or add an NPC:
```lua
VerseEntitiesStatic = {
  ['MyNpc'] = {
    Type = "Avatar",
    Position = { 10, 10 },
    Metadata = {
      DisplayName = "My NPC"
    },
  }
}
```

To change the art and layout for the map itself, you'll have to update the assets. See the next section for details.

## Customizing your Tilemap

You'll need to download the [Tiled](https://www.mapeditor.org/) editor to create custom tilemaps.

### Option A: Starting from the Template Tiled Project

1. Download and extract [TemplateTiledProject.zip](./dl/TemplateTiledProject.zip) into a new folder,and open the project in Tiled.
![Open the Tiled Project](./img/00openproject.png)
1. Double click on "Tilemap.json" file in the Tiled editor to edit the map layout

### Option B: Starting a new Tiled Project

1. Create a new empty folder for the project
2. Create a new Tiled project at that empty folder.
![Create a new Tiled project](./img/01newproject.png)
3. Create a new map with a fixed size. Use the tile size of the tileset you will use later. Use tile size 16 x 16 pixels.
![Create a new map](./img/02newmap.png)
4. File > Save As... "Tilemap.json" with format "JSON map files"
![Save the map](./img/03savemap.png)
5. Create a tileset art PNG image and copy it into your Project folder as "Primary.png". Tiles should be 16 x 16 pixels.
6. In the map editor, click "New tileset...". Name it "Primary" & choose the image from your Project folder ("Primary.png"). Make sure the tile size matches that of the map, and "Embed in map" is checked
![Create a new tileset](./img/04newtileset.png)

### Editing your tilemap

1. Customize the tileset art (`Primary.png`) as desired. Tiles should be 16 x 16 pixels.
2. Prefix Background layers with "BG_" & foreground layers with "FG_"
![Prefix layers](./img/05layers.png)
3. Draw your map layers using the tiled editor.
![Draw your map](./img/06drawmap.png)
4. To add collision to your map:
   - Click the "Edit Tileset" button
  ![Edit Tileset](./img/07edittileset.png)
   - Select all the tiles, right click "Custom Properties", and add a property of type `bool` named `collides`
  ![Add custom property](./img/08addproperty.png)
   - Set the `collides` property to `true` for any tiles you decide
  ![Set collides property](./img/09setcollides.png)

### Using your tilemap with your Verse
1. Remember to save your map file in the Tiled editor.
2. Upload the `Primary.png` & `Tilemap.json` files to Arweave and note the TxIds.
3. Reference these TxIds in your process's VerseParameters global.
   - Update `Tileset.TxId` to `Primary.png`'s TxId
   - Update `Tilemap.TxId` to `Tilemap.json`'s TxId
