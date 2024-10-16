import React, { createContext, useContext, useState, ReactNode } from 'react';
import { gameStateStore } from '@/lib/gameStateStore';

interface GameStateContextType {
  isChatFocused: boolean;
  setChatFocus: (focus: boolean) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChatFocused, setIsChatFocused] = useState(false);

  const setChatFocus = (focus: boolean) => {
    setIsChatFocused(focus);
    gameStateStore.setChatFocus(focus); // Update the global store
  };

  return (
    <GameStateContext.Provider value={{ isChatFocused, setChatFocus }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = (): GameStateContextType => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
