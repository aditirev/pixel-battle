import React, { useState, useEffect, createContext, useContext } from 'react';
import { GameState, Highscore } from './types';
import MenuScreen from './components/MenuScreen';
import Game from './components/Game';
import HighscoresScreen from './components/HighscoresScreen';
import RulesScreen from './components/RulesScreen';
import SettingsScreen from './components/SettingsScreen';

type Theme = 'light' | 'dark';
interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Menu);
    const [score, setScore] = useState(0);
    const [highscores, setHighscores] = useState<Highscore[]>([]);
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if (storedTheme) {
            setTheme(storedTheme);
        }
        const storedHighscores = localStorage.getItem('pixel-battle-highscores');
        if (storedHighscores) {
            setHighscores(JSON.parse(storedHighscores));
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const handleGameOver = (finalScore: number) => {
        setScore(finalScore);
        setGameState(GameState.GameOver);
    };

    const handleReturnToMenu = () => {
        setGameState(GameState.Menu);
    };
    
    const renderGameState = () => {
        switch (gameState) {
            case GameState.Playing:
                return <Game onGameOver={handleGameOver} onExit={handleReturnToMenu} />;
            case GameState.GameOver:
                return <HighscoresScreen score={score} currentHighscores={highscores} onHighscoresUpdate={setHighscores} onReturnToMenu={handleReturnToMenu} />;
            case GameState.Highscores:
                 return <HighscoresScreen score={null} currentHighscores={highscores} onHighscoresUpdate={setHighscores} onReturnToMenu={handleReturnToMenu} />;
            case GameState.Rules:
                return <RulesScreen onReturnToMenu={handleReturnToMenu} />;
            case GameState.Settings:
                return <SettingsScreen onReturnToMenu={handleReturnToMenu} />;
            case GameState.Menu:
            default:
                return <MenuScreen onNavigate={setGameState} />;
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <div className="bg-neutral-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center font-press-start selection:bg-yellow-400 selection:text-black p-4">
                <div className="w-full h-full sm:w-[800px] sm:h-[600px] bg-neutral-100 dark:bg-black border-4 border-neutral-400 dark:border-neutral-600 shadow-lg relative">
                   {renderGameState()}
                </div>
            </div>
        </ThemeContext.Provider>
    );
};

export default App;