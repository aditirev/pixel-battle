import React from 'react';
import { GameState } from '../types';
import Button from './ui/Button';

interface MenuScreenProps {
  onNavigate: (state: GameState) => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-200 dark:bg-gray-800">
      <h1 className="text-6xl md:text-7xl font-bold text-yellow-400 dark:text-yellow-300 mb-4 text-center">
        Pixel Battle
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-12 animate-pulse-fast">A Simple Pixel Shooter</p>
      <div className="w-full max-w-sm space-y-4">
        <Button onClick={() => onNavigate(GameState.Playing)}>Start Game</Button>
        <Button onClick={() => onNavigate(GameState.Highscores)}>Highscores</Button>
        <Button onClick={() => onNavigate(GameState.Rules)}>Rules</Button>
        <Button onClick={() => onNavigate(GameState.Settings)}>Settings</Button>
      </div>
       <div className="absolute bottom-4 text-xs text-gray-500 dark:text-gray-400">
        Use Arrow Keys and Spacebar
      </div>
    </div>
  );
};

export default MenuScreen;