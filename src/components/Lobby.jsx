import React, { useState, useEffect } from 'react';
import './Lobby.css';

export const Lobby = ({ rooms, onCreateRoom, onJoinRoom, error, onBack }) => {
    const [playerName, setPlayerName] = useState(sessionStorage.getItem('uno_player_name') || '');
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = (e) => {
        e.preventDefault();
        if (!playerName) return alert('Enter your name!');
        sessionStorage.setItem('uno_player_name', playerName);
        onCreateRoom(playerName, maxPlayers);
    };

    const handleJoin = (roomId) => {
        if (!playerName) return alert('Enter your name before joining!');
        sessionStorage.setItem('uno_player_name', playerName);
        onJoinRoom(roomId, playerName);
    };


    return (
        <div className="lobby-container glass">
            <button className="back-btn" onClick={onBack}>← Back</button>
            <h1>Online Multiplayer</h1>

            <div className="player-setup">
                <label>Your Name:</label>
                <input 
                    type="text" 
                    value={playerName} 
                    onChange={(e) => setPlayerName(e.target.value)} 
                    placeholder="Enter name..."
                />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="lobby-main">
                <div className="room-list">
                    <h2>Available Rooms</h2>
                    {rooms.length === 0 ? (
                        <p className="no-rooms">No rooms available. Create one!</p>
                    ) : (
                        <div className="rooms-grid">
                            {rooms.map(room => (
                                <div key={room.id} className="room-card glass">
                                    <div className="room-info">
                                        <h3>{room.hostName}'s Room</h3>
                                        <span>{room.playerCount}/{room.maxPlayers} Players</span>
                                    </div>
                                    <button 
                                        className="join-btn" 
                                        onClick={() => handleJoin(room.id)}
                                        disabled={room.playerCount >= room.maxPlayers}
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="create-room">
                    <h2>Create New Room</h2>
                    <form onSubmit={handleCreate}>
                        <div className="form-group">
                            <label>Max Players:</label>
                            <select value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))}>
                                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Players</option>)}
                            </select>
                        </div>
                        <button type="submit" className="create-btn">Create & Host</button>
                    </form>
                </div>
            </div>
        </div>
    );
};
