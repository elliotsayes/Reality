// gameStateStore.ts

class GameStateStore {
    private isChatFocused: boolean = false;
  
    setChatFocus(focused: boolean) {
      this.isChatFocused = focused;
    }
  
    getChatFocus() {
      return this.isChatFocused;
    }
  }
  
  export const gameStateStore = new GameStateStore();
  