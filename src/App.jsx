import React, { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameBoard } from './components/GameBoard';
import { Lobby } from './components/Lobby';
import { Room } from './components/Room';
import { useOnlineGame } from './hooks/useOnlineGame';

function App() {
  const [gameMode, setGameMode] = useState(null); // 'offline' | 'online'
  const [inGame, setInGame] = useState(false);
  const [offlineSettings, setOfflineSettings] = useState({ playerCount: 4, startingCards: 7 });
  
  const online = useOnlineGame();

  const handleStartOffline = (pCount, sCards) => {
    setOfflineSettings({ playerCount: pCount, startingCards: sCards });
    setGameMode('offline');
    setInGame(true);
  };

  const handleQuit = () => {
    if (gameMode === 'online' && online.game) {
      online.game.leaveRoom();
    }
    setInGame(false);
    setGameMode(null);
  };

  // Determine current view
  if (gameMode === 'offline' && inGame) {
    return (
      <GameBoard 
        playerCount={offlineSettings.playerCount} 
        startingCards={offlineSettings.startingCards} 
        onQuit={handleQuit} 
      />
    );
  }

  if (gameMode === 'online') {
    if (online.game?.players?.length > 0 && !online.inLobby) {
      return (
        <GameBoard 
          gameProp={online.game} 
          onQuit={handleQuit} 
        />
      );
    }
    
    if (online.inLobby) {
      return (
        <Room 
          roomId={online.currentRoomId} 
          players={online.game?.lobbyPlayers || []} 
          maxPlayers={online.game?.maxPlayers || 4}
          isHost={online.game?.isHost} 
          onStart={online.startRoomGame}
          onLeave={() => {
            online.game.leaveRoom();
            setGameMode(null);
          }}
        />
      );
    }

    return (
      <Lobby 
        rooms={online.rooms} 
        onCreateRoom={online.createRoom} 
        onJoinRoom={online.joinRoom} 
        error={online.error}
        onBack={() => setGameMode(null)}
      />
    );
  }


  return (
    <StartScreen 
      onStart={handleStartOffline} 
      onStartOnline={() => setGameMode('online')} 
    />
  );
}

export default App;

