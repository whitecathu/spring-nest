import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const Game2048 = lazy(() => import('../pages/games/Game2048'));
const MemoryGame = lazy(() => import('../pages/games/MemoryGame'));
const WhackAMole = lazy(() => import('../pages/games/WhackAMole'));
const ColorMerge = lazy(() => import('../pages/games/ColorMerge'));
const ForestWalk = lazy(() => import('../pages/games/ForestWalk'));
const Snake = lazy(() => import('../pages/games/Snake'));
const ReactionTest = lazy(() => import('../pages/games/ReactionTest'));
const NumberPuzzle = lazy(() => import('../pages/games/NumberPuzzle'));
const TicTacToe = lazy(() => import('../pages/games/TicTacToe'));
const TypingChallenge = lazy(() => import('../pages/games/TypingChallenge'));
const ColorStroop = lazy(() => import('../pages/games/ColorStroop'));
const Minesweeper = lazy(() => import('../pages/games/Minesweeper'));
const FlappyBird = lazy(() => import('../pages/games/FlappyBird'));
const BrickBreaker = lazy(() => import('../pages/games/BrickBreaker'));
const SimonSays = lazy(() => import('../pages/games/SimonSays'));
const SudokuGame = lazy(() => import('../pages/games/SudokuGame'));
const TypingSpeedTest = lazy(() => import('../pages/games/TypingSpeedTest'));
const WordSearch = lazy(() => import('../pages/games/WordSearch'));
const BubblePop = lazy(() => import('../pages/games/BubblePop'));

export type GameComponent = LazyExoticComponent<ComponentType<{ onBack: () => void }>>;

export const gameComponents: Record<string, GameComponent> = {
  'game-1': Game2048,
  'game-2': MemoryGame,
  'game-3': WhackAMole,
  'game-4': ColorMerge,
  'game-5': ForestWalk,
  'game-6': Snake,
  'game-7': ReactionTest,
  'game-8': NumberPuzzle,
  'game-9': TicTacToe,
  'game-10': TypingChallenge,
  'game-11': ColorStroop,
  'game-12': Minesweeper,
  'game-13': FlappyBird,
  'game-14': BrickBreaker,
  'game-15': SimonSays,
  'game-16': SudokuGame,
  'game-17': TypingSpeedTest,
  'game-18': WordSearch,
  'game-19': BubblePop,
};
