# Agent Guide

Check out some example agents below. To get started with adding agents to your own Verse, check out the [Verse Guide](VerseGuide.md).

## Static Agents

These agents work as static entities, and are fixed in place so cannot move. They must be added to the verse's `VerseEntitiesStatic` table manually.

- [Fantasy Llama](../process/npc/rpgland/FantasyLlama.lua)
  - A simple NPC that listens to the `Default` (click) interaction and writes in the Chat for RPG World.

To add this agent to your verse, spin up a new process for the agent, configure `CHAT_TARGET` in the agent code's to point to your verse process ID, and at the following to your `Verse`'s `VerseEntitiesStatic` table:
```lua
VerseEntitiesStatic = {
  ['<your agent process id>'] = {
    Type = "Avatar",
    Position = { 10, 10 }, -- Or wherever you want the agent to sit
    Metadata = {
      DisplayName = "Fantasy Llama" -- Or another name
      SkinNumber = 5, -- SkinNumber can be 0-9
      Interaction = {
        Type = "Default", -- Click interaction used by Fantasy Llama
      },
    },
  }
}
```

Read the [Verse Protocol](Verse.md) docs for more information on how to configure agents in your verse.

## Dynamic Agents

Dynamic entities must send a registration message to the verse process (instead of being manually added to the verse's `VerseEntitiesStatic` table). Dynamic entities are able to update their position and other parameters in real-time, just like players.

To use these agents, you should first configure the `TARGET_VERSE_PID` global to your desired verse Id **before** you load the agent's source code.

- [Llama Complainer](../process/npc/LlamaComplainer.lua)
  - Listens to the chat, if there are more than a couple messages he will complain about it.
- [Llama Runner](../process/npc/LlamaRunner.lua)
  - Players can instruct him to run around Llama Land in a loop.
