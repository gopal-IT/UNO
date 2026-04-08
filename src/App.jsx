import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameBoard } from './components/GameBoard';

function App() {
  const [inGame, setInGame] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const [startingCards, setStartingCards] = useState(7);

  const handleStart = (pCount, sCards) => {
    setPlayerCount(pCount);
    setStartingCards(sCards);
    setInGame(true);
  };

  const handleQuit = () => {
    setInGame(false);
  };

  return (
    <>
      {!inGame ? (
        <StartScreen onStart={handleStart} />
      ) : (
        <GameBoard playerCount={playerCount} startingCards={startingCards} onQuit={handleQuit} />
      )}
    </>
  );
}

export default App;
