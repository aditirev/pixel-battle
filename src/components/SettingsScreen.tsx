
import React from 'react';
import Button from './ui/Button';
import ToggleSwitch from './ui/ToggleSwitch';
import { useTheme } from '../App';

interface SettingsScreenProps {
  onReturnToMenu: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onReturnToMenu }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full h-full flex flex-col items-center p-8 bg-gray-200 dark:bg-gray-800">
      <h1 className="text-4xl font-bold text-yellow-400 dark:text-yellow-300 mb-12 uppercase" style={{ textShadow: '3px 3px #000' }}>
        Settings
      </h1>
      <div className="w-full max-w-md space-y-6">
        <div className="p-4 border-2 border-gray-400 dark:border-gray-600">
            <ToggleSwitch 
                label="Dark Mode" 
                enabled={theme === 'dark'}
                setEnabled={(enabled) => setTheme(enabled ? 'dark' : 'light')}
            />
        </div>
      </div>
      <div className="mt-auto pt-8 w-full max-w-sm">
        <Button onClick={onReturnToMenu}>Back to Menu</Button>
      </div>
    </div>
  );
};

export default SettingsScreen;
