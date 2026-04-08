import React, { useState, useEffect } from 'react';
import './StartScreen.css';

export const StartScreen = ({ onStart }) => {
    const [mode, setMode] = useState(null);
    const [playerCount, setPlayerCount] = useState(4);
    const [startingCards, setStartingCards] = useState(7);
    const [showHistory, setShowHistory] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [history, setHistory] = useState([]);


    const clearHistory = () => {
        localStorage.removeItem('uno_history');
        setHistory([]);
    };

    return (
        <div className="start-screen">
            <div className="bg-card-1"></div>
            <div className="bg-card-2"></div>

            <div className="start-menu glass">
                <h1 className="title">UNO <span className="title-offline">OFFLINE</span></h1>

                {showRules ? (
                    <div className="history-panel rules-panel">
                        <h2>Game Rules</h2>
                        <div className="rules-content text-left">
                            <p><b>Objective:</b> Be the first player to get rid of all your cards.</p>
                            <p><b>Matching:</b> Play a card that matches the color or value (or Action) of the top card on the discard pile.</p>
                            <p><b>Stacking (+2 & +4):</b> If you are attacked with a penalty, you must play a matching Draw card to compound and pass the total penalty to the next player. Otherwise, you must Pick up the cards and skip your turn.</p>
                            <p><b>Draw-to-Play:</b> If you click the Draw pile, you draw exactly one card. Your turn does NOT automatically end! You can play a valid card, or click PASS to end your turn.</p>
                            <p><b>Bots:</b> They play completely by the rules, including sneaky wild card color logic!</p>
                        </div>
                        <div className="history-actions" style={{ marginTop: '20px' }}>
                            <button className="back-btn" onClick={() => setShowRules(false)}>Back</button>
                        </div>
                    </div>
                ) : showHistory ? (
                    <div className="history-panel">
                        <h2>Match History</h2>
                        {history.length > 0 ? (
                            <ul className="history-list">
                                {history.map((h, i) => (
                                    <li key={i}>
                                        <span className="h-date">{h.date}</span>
                                        <span className="h-winner">Winner: <b>{h.winner}</b></span>
                                        <span className="h-players">Players: {h.totalPlayers}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: '#999', marginBottom: '20px' }}>No matches played yet.</p>
                        )}
                        <div className="history-actions">
                            <button className="back-btn" onClick={() => setShowHistory(false)}>Back</button>
                            {history.length > 0 && <button className="clear-btn" onClick={clearHistory}>Clear History</button>}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mode-selection">
                            <button className={`mode-btn ${mode === 'offline' ? 'active' : ''}`} onClick={() => setMode('offline')}>
                                🕹️ Play Offline (Bots)
                            </button>
                            <button className="mode-btn disabled" title="Coming soon!" onClick={() => alert("Online mode is currently disabled in this version.")}>
                                🌐 Play Online (Multiplayer)
                            </button>
                        </div>

                        {mode === 'offline' && (
                            <div className="player-count-config">
                                <label>Players:</label>
                                <div className="slider-container" style={{ marginBottom: '15px' }}>
                                    <input
                                        type="range" min="3" max="6" step="1"
                                        value={playerCount}
                                        onChange={(e) => setPlayerCount(Number(e.target.value))}
                                    />
                                    <div className="count-display">{playerCount} PLAYERS</div>
                                    <div className="count-breakdown">(1 Human + {playerCount - 1} Bots)</div>
                                </div>

                                <label>Starting Cards:</label>
                                <div className="slider-container" style={{ marginBottom: '25px' }}>
                                    <input
                                        type="range" min="6" max="14" step="1"
                                        value={startingCards}
                                        onChange={(e) => setStartingCards(Number(e.target.value))}
                                    />
                                    <div className="count-display">{startingCards} CARDS</div>
                                </div>

                                <button className="start-btn" onClick={() => onStart(playerCount, startingCards)}>
                                    START GAME
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginTop: '20px' }}>
                                    <button className="history-toggle-btn" style={{ marginTop: 0 }} onClick={() => setShowRules(true)}>
                                        📖 Game Rules
                                    </button>
                                    <button className="history-toggle-btn" style={{ marginTop: 0 }} onClick={() => {
                                        try {
                                            setHistory(JSON.parse(localStorage.getItem('uno_history')) || []);
                                        } catch (e) {
                                            console.error("No history found, starting fresh.", e);
                                        }
                                        setShowHistory(true);
                                    }}>
                                        📜 Match History
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
