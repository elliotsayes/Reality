import { Events } from 'phaser';
import { type EventFromLogic } from 'xstate';
import { renderMachine } from '../machines/renderMachine';

// Used to emit events between React components and Phaser scenes
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Events.EventEmitter
const GameEventBus = new Events.EventEmitter();

export function emitSceneReady(scene: Phaser.Scene) {
  GameEventBus.emit('scene-ready', scene);
}

export function emitSceneEnd(scene: Phaser.Scene) {
  GameEventBus.emit('scene-end', scene);
}

export function listenScene(event: 'scene-ready' | 'scene-end', callback: (scene: Phaser.Scene) => void) {
  GameEventBus.on(event, callback);
  return () => {
    GameEventBus.off(event, callback);
  }
}

export function emitSceneEvent(event: EventFromLogic<typeof renderMachine>) {
  GameEventBus.emit('scene-event', event);
}

export function listenSceneEvent(callback: (event: EventFromLogic<typeof renderMachine>) => void) {
  GameEventBus.on('scene-event', callback);
  return () => {
    GameEventBus.off('scene-event', callback);
  }
}
