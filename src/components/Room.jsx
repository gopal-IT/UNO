import React from 'react';
import './Lobby.css';

export const Room = ({ roomId, players, maxPlayers, isHost, onStart, onLeave }) => {
    return (
        <div className="room-container glass">
            <div className="room-header">
                <h1>Room: {roomId}</h1>
                <button className="leave-btn" onClick={onLeave}>Leave Room</button>
            </div>

            <div className="room-body">
                <div className="players-list-container">
                    <h2>Players ({players.length})</h2>
                    <ul className="players-list">
                        {players.map((name, i) => (
                            <li key={i} className="player-item">
                                <span className="player-name">{name}</span>
                                {i === 0 && <span className="host-badge">HOST</span>}
                            </li>
                        ))}
                        {/* Fill empty slots */}
                        {[...Array(Math.max(0, maxPlayers - players.length))].map((_, i) => (
                            <li key={`empty-${i}`} className="player-item empty">
                                <span className="player-name">Waiting for players...</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="room-actions">
                    {isHost ? (
                        <>
                            <p className="host-msg">You are the host. Start the game when everyone is ready!</p>
                            <button 
                                className="start-game-btn" 
                                onClick={onStart}
                                disabled={players.length < 2}
                            >
                                Start Game
                            </button>
                        </>
                    ) : (
                        <p className="waiting-msg">Waiting for host to start the game...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
