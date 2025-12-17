
import React, { useState, useEffect } from 'react';
import { Highscore } from '../types';
import Button from './ui/Button';

interface HighscoresScreenProps {
  score: number | null;
  currentHighscores: Highscore[];
  onHighscoresUpdate: (scores: Highscore[]) => void;
  onReturnToMenu: () => void;
}

const HighscoresScreen: React.FC<HighscoresScreenProps> = ({ score, currentHighscores, onHighscoresUpdate, onReturnToMenu }) => {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(score === null);

  const isHighscore = score !== null && (currentHighscores.length < 10 || score > currentHighscores[currentHighscores.length - 1].score);

  useEffect(() => {
    if (score !== null && !isHighscore) {
      setSubmitted(true);
    }
  }, [score, isHighscore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && score !== null) {
      const newScores = [...currentHighscores, { name: name.trim(), score }];
      newScores.sort((a, b) => b.score - a.score);
      const finalScores = newScores.slice(0, 10);
      onHighscoresUpdate(finalScores);
      localStorage.setItem('pixel-battle-highscores', JSON.stringify(finalScores));
      setSubmitted(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-8 bg-gray-200 dark:bg-gray-800 overflow-y-auto">
      <h1 className="text-4xl font-bold text-yellow-400 dark:text-yellow-300 mb-4 uppercase" style={{ textShadow: '3px 3px #000' }}>
        {score !== null ? 'Game Over' : 'Highscores'}
      </h1>
      {score !== null && (
         <p className="text-2xl mb-8">Your Score: {score}</p>
      )}

      {isHighscore && !submitted && score !== null && (
        <form onSubmit={handleSubmit} className="w-full max-w-sm mb-8">
            <p className="mb-4 text-green-500 text-center animate-pulse-fast">New Highscore!</p>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 10))}
                placeholder="ENTER YOUR NAME"
                maxLength={10}
                className="w-full p-2 mb-4 text-center text-xl bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                autoFocus
            />
            <Button type="submit">Submit Score</Button>
        </form>
      )}

      <div className="w-full max-w-md text-lg">
        <ol className="list-decimal list-inside space-y-2">
            {currentHighscores.map((hs, index) => (
                <li key={index} className="flex justify-between p-2 bg-gray-300 dark:bg-gray-700">
                    <span>{index + 1}. {hs.name}</span>
                    <span className="font-bold">{hs.score}</span>
                </li>
            ))}
            {currentHighscores.length === 0 && <p className="text-center text-gray-500">No scores yet. Be the first!</p>}
        </ol>
      </div>

      <div className="mt-auto pt-8 w-full max-w-sm">
        <Button onClick={onReturnToMenu}>Back to Menu</Button>
      </div>
    </div>
  );
};

export default HighscoresScreen;
