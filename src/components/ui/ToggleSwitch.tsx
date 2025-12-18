import React from 'react';

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, enabled, setEnabled }) => {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-lg uppercase">{label}</span>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex items-center h-8 w-16 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 border-2 border-gray-500 dark:border-gray-400 ${enabled ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'}`}
      >
        <span
          className={`inline-block w-6 h-6 transform bg-white transition-transform duration-200 ease-in-out border-2 border-gray-500 dark:border-gray-400 ${enabled ? 'translate-x-[28px]' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;