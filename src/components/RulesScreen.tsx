import React from 'react';
import Button from './ui/Button';

interface RulesScreenProps {
  onReturnToMenu: () => void;
}

const PowerUpIcon: React.FC<{ color: string }> = ({ color }) => (
    <div className={`w-5 h-5 ${color} border border-black dark:border-white mr-3 inline-block align-middle`}></div>
);

const RulesScreen: React.FC<RulesScreenProps> = ({ onReturnToMenu }) => {
  return (
    <div className="w-full h-full flex flex-col items-center p-6 bg-gray-200 dark:bg-gray-800 overflow-y-auto text-sm">
      <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 dark:text-yellow-300 mb-6 uppercase" style={{ textShadow: '3px 3px #000' }}>
        How to Play
      </h1>
      <div className="text-left max-w-2xl w-full space-y-6 text-gray-800 dark:text-gray-200">
        
        <div>
          <h2 className="text-lg font-bold mb-2 text-custom-blue dark:text-blue-400">OBJECTIVE</h2>
          <p>Your mission is to survive the relentless onslaught of enemy pixels. Rack up points by destroying enemies and aim for the top of the highscore leaderboard!</p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2 text-custom-purple dark:text-purple-400">CONTROLS</h2>
          <ul className="space-y-2">
            <li><strong className="w-28 inline-block bg-gray-300 dark:bg-gray-700 p-1 text-center">ARROW KEYS</strong> Move your player.</li>
            <li><strong className="w-28 inline-block bg-gray-300 dark:bg-gray-700 p-1 text-center">SPACEBAR</strong> Fire projectiles.</li>
            <li><strong className="w-28 inline-block bg-gray-300 dark:bg-gray-700 p-1 text-center">ESC / P</strong> Pause or Resume.</li>
          </ul>
        </div>
        
        <div>
            <h2 className="text-lg font-bold mb-2 text-custom-purple dark:text-purple-400">POWER-UPS</h2>
            <p>Collect colored squares that appear on screen to get powerful, temporary upgrades.</p>
            <ul className="space-y-2 mt-3">
                <li className="flex items-center"><PowerUpIcon color="bg-green-500" /> <strong>EXTRA HEALTH:</strong> Instantly restores 25 health.</li>
                <li className="flex items-center"><PowerUpIcon color="bg-sky-500" /> <strong>SHIELD:</strong> Makes you invincible for 5 seconds.</li>
                <li className="flex items-center"><PowerUpIcon color="bg-orange-500" /> <strong>DOUBLE ATTACK:</strong> Doubles your firing speed for 8 seconds.</li>
            </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2 text-custom-blue dark:text-blue-400">SCORING</h2>
          <p>Every enemy you destroy adds to your score. More difficult enemies are worth more points. Your final score is recorded when you are destroyed or you exit the game.</p>
        </div>

      </div>
      <div className="mt-auto pt-6 w-full max-w-sm">
        <Button onClick={onReturnToMenu}>Back to Menu</Button>
      </div>
    </div>
  );
};

export default RulesScreen;