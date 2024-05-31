import { Events } from 'phaser';
import { type EventFromLogic } from 'xstate';
import { renderMachine } from '../machines/renderMachine';

// Used to emit events between React components and Phaser scenes
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Events.EventEmitter
const EventBus = new Events.EventEmitter();

export function emitSceneReady(scene: Phaser.Scene) {
  EventBus.emit('scene-ready', scene);
}

export function emitSceneEnd(scene: Phaser.Scene) {
  EventBus.emit('scene-end', scene);
}

export function listenScene(event: 'scene-ready' | 'scene-end', callback: (scene: Phaser.Scene) => void) {
  EventBus.on(event, callback);
  return () => {
    EventBus.off(event, callback);
  }
}

export function emitVerseSceneEvent(event: EventFromLogic<typeof renderMachine>) {
  EventBus.emit('verse-scene-event', event);
}

export function listenVerseSceneEvent(callback: (event: EventFromLogic<typeof renderMachine>) => void) {
  EventBus.on('verse-scene-event', callback);
  return () => {
    EventBus.off('verse-scene-event', callback);
  }
}
