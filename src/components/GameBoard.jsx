import React, { useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { getBotMove, getBestBotColor } from '../utils/botLogic';
import { canPlayCard } from '../utils/gameLogic';
import { Card } from './Card';
import './GameBoard.css';

const groupCards = (cards) => {
    const grouped = [];
    const map = new Map();
    cards.forEach((card, index) => {
        const key = `${card.color}_${card.type}_${card.value}`;
        if (map.has(key)) {
            map.get(key).count++;
            map.get(key).indices.push(index);
        } else {
            const newGroup = { card, count: 1, indices: [index] };
            map.set(key, newGroup);
            grouped.push(newGroup);
        }
    });
    return grouped;
};

export const GameBoard = ({ playerCount, startingCards, onQuit }) => {
    const game = useGame(playerCount, startingCards);
    const [showLog, setShowLog] = useState(false);

    useEffect(() => {
        game.initializeGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game.initializeGame]);

    useEffect(() => {
        if (game.gameOver || game.colorSelectorVisible) return;

        const currentPlayer = game.players[game.turnIndex];
        if (currentPlayer && currentPlayer.isBot && !currentPlayer.finishedRank) {
            const timer = setTimeout(() => {
                if (game.pendingDrawCount > 0) {
                    const matchingIndex = currentPlayer.cards.findIndex(c => c.type === game.pendingDrawType);
                    if (matchingIndex !== -1) {
                        let color = currentPlayer.cards[matchingIndex].color === 'wild' ? getBestBotColor(currentPlayer) : null;
                        game.playCard(game.turnIndex, matchingIndex, color);
                    } else {
                        game.acceptPenalty(game.turnIndex);
                    }
                } else {
                    const topCard = game.discardPile[game.discardPile.length - 1];
                    const move = getBotMove(currentPlayer, topCard, game.activeColor);

                    if (move) {
                        game.playCard(game.turnIndex, move.cardIndex, move.selectedColor);
                    } else if (!game.hasDrawnThisTurn) {
                        game.addLog(`${currentPlayer.name} draws a card`);
                        game.drawCard(game.turnIndex, 1);
                        game.setHasDrawnThisTurn(true);
                    } else {
                        game.addLog(`${currentPlayer.name} passed`);
                        game.nextTurn();
                    }
                }
            }, 1200);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game.turnIndex, game.players, game.gameOver, game.colorSelectorVisible, game.hasDrawnThisTurn]);

    if (game.players.length === 0) return <div className="loading">Loading Deck...</div>;

    const humanPlayer = game.players[0];
    const topCard = game.discardPile[game.discardPile.length - 1];
    const bots = game.players.slice(1);

    const botLayout = {
        3: ['left', 'right'],
        4: ['left', 'top', 'right'],
        5: ['left-low', 'top-left', 'top-right', 'right-low'],
        6: ['left-low', 'left-high', 'top', 'right-high', 'right-low']
    }[playerCount] || [];

    const handlePlayerPlayCard = (cardIndex) => {
        if (game.turnIndex !== 0) return;
        const card = humanPlayer.cards[cardIndex];
        if (!canPlayCard(card, topCard, game.activeColor, game.pendingDrawCount, game.pendingDrawType)) return;
        game.playCard(0, cardIndex);
    };

    const handlePlayerDrawCard = () => {
        if (game.turnIndex !== 0) return;
        if (game.pendingDrawCount > 0) {
            game.acceptPenalty(0);
        } else {
            if (game.hasDrawnThisTurn) {
                game.addLog(`You passed`);
                game.nextTurn();
            } else {
                game.addLog(`You drew a card`);
                game.drawCard(0, 1);
                game.setHasDrawnThisTurn(true);
            }
        }
    };

    const handleColorSelect = (color) => {
        if (game.pendingWildCard) {
            game.setColorSelectorVisible(false);
            const { playerIndex, cardIndex } = game.pendingWildCard;
            game.setPendingWildCard(null);
            game.playCard(playerIndex, cardIndex, color);
        }
    };

    const getAnimationStartVars = (playerIndex) => {
        if (playerIndex === 0) return { '--start-x': '0px', '--start-y': '400px', '--start-rot': '0deg' };

        const layout = botLayout[playerIndex - 1];
        if (!layout) return { '--start-x': '0px', '--start-y': '0px', '--start-rot': '0deg' };

        if (layout.includes('left')) return { '--start-x': '-450px', '--start-y': '0px', '--start-rot': '90deg' };
        if (layout.includes('right')) return { '--start-x': '450px', '--start-y': '0px', '--start-rot': '-90deg' };
        if (layout.includes('top')) return { '--start-x': '0px', '--start-y': '-350px', '--start-rot': '180deg' };
        return { '--start-x': '0px', '--start-y': '0px', '--start-rot': '0deg' };
    };

    const groupedHumanCards = groupCards(humanPlayer.cards);

    return (
        <div className="game-board" style={{ '--active-color': `var(--uno-${game.activeColor === 'wild' ? 'dark' : game.activeColor})` }}>
            <button className="quit-btn" onClick={onQuit}>Quit to Menu</button>
            <button className="log-toggle-btn" onClick={() => setShowLog(!showLog)}>
                {showLog ? 'Hide Logs' : '📜 Show Logs'}
            </button>

            <div className="table-area glass">

                {bots.map((bot, index) => {
                    const positionClass = botLayout[index] || 'top';
                    const isVerticalLayout = positionClass.includes('high') || positionClass.includes('low') || positionClass === 'left' || positionClass === 'right';

                    return (
                        <div key={bot.id} className={`player bot ${positionClass} ${bot.finishedRank ? 'finished' : ''}`} style={{ opacity: bot.finishedRank ? 0.6 : 1 }}>
                            <div className="player-info">
                                <span>{bot.name}</span>
                                {bot.finishedRank && <span className="finished-badge" style={{ background: 'gold', color: 'black', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px', fontWeight: 'bold' }}>#{bot.finishedRank}</span>}
                            </div>
                            {!bot.finishedRank && (
                                <div className={`bot-hand ${isVerticalLayout ? 'vertical' : ''}`}>
                                    <div className="grouped-card-wrapper">
                                        <Card hidden />
                                        <div className="card-badge" style={{ transform: 'scale(1.2)' }}>{bot.cards.length}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Center Area */}
                <div className="center-piles">
                    <div className={`draw-pile ${game.pendingDrawCount > 0 ? 'attacked' : ''}`} onClick={handlePlayerDrawCard}>
                        <Card hidden card={{}} />
                        <span className="pile-text" style={{ color: game.pendingDrawCount > 0 ? '#ff5555' : 'rgba(255,255,255,0.8)' }}>
                            {game.pendingDrawCount > 0 ? `+${game.pendingDrawCount}` : (game.hasDrawnThisTurn ? 'PASS' : `DRAW (${game.deck.length})`)}
                        </span>
                    </div>
                    <div className="discard-pile">
                        {topCard && !game.animatingCard && <Card card={topCard} />}
                        {topCard && game.animatingCard && game.discardPile.length > 1 && <Card card={game.discardPile[game.discardPile.length - 2]} />}
                    </div>

                    {game.animatingCard && (
                        <div className="animating-card-overlay" style={getAnimationStartVars(game.animatingCard.fromPlayerIndex)}>
                            <Card card={game.animatingCard.card} />
                        </div>
                    )}

                    <div className="action-indicator">
                        <span className="turn-arrow" style={{ transform: `rotate(${game.direction === 1 ? 0 : 180}deg)` }}>↻</span>
                        <span className="active-color-badge" style={{ backgroundColor: `var(--uno-${game.activeColor === 'wild' ? 'dark' : game.activeColor})` }}>
                            {game.activeColor.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Human Player (Bottom) */}
                <div className={`player bottom human ${humanPlayer.finishedRank ? 'finished' : ''}`}>
                    <div className="player-info" style={{ opacity: humanPlayer.finishedRank ? 0.8 : 1 }}>
                        <span>Your Hand {!game.gameOver && game.turnIndex === 0 && <span className="your-turn-badge">YOUR TURN</span>}</span>
                        {humanPlayer.finishedRank && <span className="finished-badge" style={{ background: 'gold', color: 'black', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px', fontWeight: 'bold' }}>#{humanPlayer.finishedRank} SPECTATING</span>}
                        {game.pendingDrawCount > 0 && game.turnIndex === 0 && <span className="your-turn-badge" style={{ background: 'red' }}>UNDER ATTACK (+{game.pendingDrawCount})</span>}
                    </div>
                    {!humanPlayer.finishedRank && (
                        <div className="human-hand">
                            {groupedHumanCards.map((group, uiIdx) => {
                                const isCardPlayable = canPlayCard(group.card, topCard, game.activeColor, game.pendingDrawCount, game.pendingDrawType);
                                return (
                                    <div key={group.card.id} className="grouped-card-wrapper" style={{ marginLeft: uiIdx === 0 ? 0 : '-50px', zIndex: uiIdx }}>
                                        <Card
                                            card={group.card}
                                            disabled={game.turnIndex !== 0 || !isCardPlayable}
                                            onClick={() => handlePlayerPlayCard(group.indices[0])}
                                        />
                                        {group.count > 1 && (
                                            <div className="card-badge">{group.count}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            <div className={`action-log glass ${showLog ? 'visible' : ''}`}>
                <h3>Game Log</h3>
                <ul>
                    {game.log.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
            </div>

            {game.colorSelectorVisible && (
                <div className="modal-overlay">
                    <div className="color-selector glass">
                        <h2>Choose Color</h2>
                        <div className="color-buttons">
                            <button className="color-btn color-red" onClick={() => handleColorSelect('red')}></button>
                            <button className="color-btn color-blue" onClick={() => handleColorSelect('blue')}></button>
                            <button className="color-btn color-green" onClick={() => handleColorSelect('green')}></button>
                            <button className="color-btn color-yellow" onClick={() => handleColorSelect('yellow')}></button>
                        </div>
                    </div>
                </div>
            )}

            {game.gameOver && (
                <div className="modal-overlay">
                    <div className="game-over-modal glass">
                        <h1 style={{ color: 'gold', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>🏆 Final Standings 🏆</h1>
                        <div className="leaderboard" style={{ marginTop: '25px', marginBottom: '35px', fontSize: '1.4rem', textAlign: 'left', display: 'inline-block' }}>
                            {game.players.slice().sort((a, b) => {
                                const rankA = a.finishedRank || game.players.length;
                                const rankB = b.finishedRank || game.players.length;
                                return rankA - rankB;
                            }).map(p => (
                                <div key={p.id} style={{
                                    marginBottom: '15px',
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    background: 'rgba(0,0,0,0.4)',
                                    fontWeight: p.id === 0 ? '900' : 'normal',
                                    color: p.id === 0 ? 'var(--uno-yellow)' : 'white',
                                    borderLeft: p.id === 0 ? '5px solid var(--uno-yellow)' : '5px solid transparent'
                                }}>
                                    <span style={{ color: '#ccc', marginRight: '15px' }}>#{p.finishedRank || game.players.length}</span>
                                    {p.name} {p.finishedRank === 1 ? ' 👑' : ''}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <button className="play-again-btn" style={{ marginTop: 0 }} onClick={game.initializeGame}>Play Again</button>
                            <button className="play-again-btn" onClick={onQuit} style={{ marginTop: 0, background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)' }}>Menu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
