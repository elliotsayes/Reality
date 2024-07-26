# Agent Guide

> [!NOTE]
> You can now use the [`@reality/api`](https://apm.betteridea.dev/pkg?id=UEtFZarBGFKXjyNEHFm5JagOBW7Frij8ojk7BjkSbVE) APM package for the most streamlined way to create `Reality` agents.

Check out some example agents below. To get started with adding agents to your own World, check out the [World Guide](WorldGuide.md).

## Static Agents

These agents work as static entities, and are fixed in place so cannot move. They can be added to the world's `RealityEntitiesStatic` table manually.

- [Fantasy Llama](../process/npc/rpgland/FantasyLlama.lua)
  - A simple NPC that listens to the `Default` (click) interaction and writes in the Chat.
- [Llama Joker](../process/npc/palmisland/LlamaJoker.lua)
  - A more complex NPC that makes use of the `SchemaFormExternal` interaction, that allows the user to pay $LLAMA coin and request a joke in a given topic. This NPC uses `aos-sqlite`, and AI to generate jokes. See the source code for more details on how to set this up.

To add any of these agents to your world, spin up a new process for the agent, configure `CHAT_TARGET` in the agent source to point to your world process ID, and add the agent to your World's `RealityEntitiesStatic` table (as described in the respective source files).

## Dynamic Agents

Dynamic entities must send a registration message to the world process (instead of being manually added to the world's `RealityEntitiesStatic` table). Dynamic entities are able to update their position and other parameters in real-time, just like players.

You'll need to set your process up to use the [`Cron`](https://cookbook_ao.g8way.io/references/cron.html) system, so that they can run periodic tasks.

Before loading the agent's source, you should configure the `TARGET_WORLD_PID` global to your desired world Id. You may also want to change the `Position`s to line up with your world's coordinate system.

- [Llama Complainer](../process/npc/LlamaComplainer.lua)
  - Listens to the chat, if there are more than a couple messages he will complain about it.
- [Llama Runner](../process/npc/LlamaRunner.lua)
  - Players can instruct him to run around Llama Land in a loop.

> [!NOTE]
> To prevent your agents from disappearing due to inactivity, you can fix the agent's visibility by sending the following message from the Agent's process:

```lua
Send({
  Target = TARGET_WORLD_PID,
  Tags = {
    Action = 'Reality.EntityFix',
  },
})
``

## Further Info

Read the [Reality Protocol](Reality.md) docs for more information on how to configure agents in your world. See the (Schema Protocol)[Schema.md] for more information on how to configure custom interactions with your agents.
