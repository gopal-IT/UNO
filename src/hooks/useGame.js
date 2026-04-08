import React, { useState, useCallback } from 'react';
import { generateDeck, shuffleDeck, dealCards, canPlayCard } from '../utils/gameLogic';

export const useGame = (playerCount = 4, startingCards = 7) => {
    const [deck, setDeck] = useState([]);
    const [discardPile, setDiscardPile] = useState([]);
    const [players, setPlayers] = useState([]);
    const [turnIndex, setTurnIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [activeColor, setActiveColor] = useState('red');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [log, setLog] = useState([]);
    const [colorSelectorVisible, setColorSelectorVisible] = useState(false);
    const [pendingWildCard, setPendingWildCard] = useState(null);
    const [animatingCard, setAnimatingCard] = useState(null);

    const [pendingDrawCount, setPendingDrawCount] = useState(0);
    const [pendingDrawType, setPendingDrawType] = useState(null);
    const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);

    // Refs for latest state access to avoid nested state updaters
    const playersRef = React.useRef(players);
    const deckRef = React.useRef(deck);
    const discardPileRef = React.useRef(discardPile);

    React.useEffect(() => { playersRef.current = players; }, [players]);
    React.useEffect(() => { deckRef.current = deck; }, [deck]);
    React.useEffect(() => { discardPileRef.current = discardPile; }, [discardPile]);

    const addLog = useCallback((msg) => setLog(prev => [msg, ...prev].slice(0, 10)), []);


    const initializeGame = useCallback(() => {
        let newDeck = shuffleDeck(generateDeck());

        const initialPlayers = [];
        initialPlayers.push({ id: 0, name: 'You', isBot: false, cards: [], finishedRank: null });
        for (let i = 1; i < playerCount; i++) {
            initialPlayers.push({ id: i, name: `Bot ${i}`, isBot: true, cards: [], finishedRank: null });
        }

        const { hands, remainingDeck } = dealCards(newDeck, playerCount, startingCards);

        hands.forEach((hand, idx) => {
            initialPlayers[idx].cards = hand;
        });

        let firstCard = remainingDeck.pop();
        while (firstCard.color === 'wild') {
            remainingDeck.unshift(firstCard);
            firstCard = remainingDeck.pop();
        }

        setDeck(remainingDeck);
        setDiscardPile([firstCard]);
        setPlayers(initialPlayers);
        setTurnIndex(0);
        setDirection(1);
        setActiveColor(firstCard.color);
        setGameOver(false);
        setWinner(null);
        setPendingDrawCount(0);
        setPendingDrawType(null);
        setHasDrawnThisTurn(false);
        setLog([`Game started. First card is a ${firstCard.color} ${firstCard.value !== null ? firstCard.value : firstCard.type}`]);
    }, [playerCount, startingCards]);

    const nextTurn = useCallback((step = 1, currentDirection = direction) => {
        setHasDrawnThisTurn(false);
        setTurnIndex(prev => {
            const currentPlayers = playersRef.current;
            const activeCount = currentPlayers.filter(p => !p.finishedRank).length;
            if (activeCount <= 1) return prev;

            let next = prev;
            let stepsTaken = 0;
            let safety = 0;

            while (stepsTaken < step && safety < 50) {
                next = (next + currentDirection) % playerCount;
                if (next < 0) next += playerCount;

                if (!currentPlayers[next].finishedRank) {
                    stepsTaken++;
                }
                safety++;
            }
            return next;
        });
    }, [direction, playerCount]);

    const drawCard = useCallback((playerIndex, count = 1) => {
        let currentDeck = [...deckRef.current];
        let currentDiscard = [...discardPileRef.current];

        if (currentDeck.length < count) {
            const topCard = currentDiscard.pop(); // keep last card
            const rest = [...currentDiscard];
            currentDeck = [...currentDeck, ...shuffleDeck(rest)];
            setDiscardPile([topCard]);
        }

        const drawnCards = [];
        for (let i = 0; i < count; i++) {
            if (currentDeck.length > 0) drawnCards.push(currentDeck.pop());
        }

        setDeck(currentDeck);

        setPlayers(prevPlayers => {
            const newPlayers = [...prevPlayers];
            newPlayers[playerIndex] = {
                ...newPlayers[playerIndex],
                cards: [...newPlayers[playerIndex].cards, ...drawnCards]
            };
            return newPlayers;
        });

        return currentDeck;
    }, []);

    const acceptPenalty = useCallback((playerIndex) => {
        const count = pendingDrawCount;
        drawCard(playerIndex, count);
        addLog(`${players[playerIndex].name} accrued ${count} cards penalty!`);
        setPendingDrawCount(0);
        setPendingDrawType(null);
        setHasDrawnThisTurn(false);
        nextTurn(1);
    }, [pendingDrawCount, drawCard, addLog, players, nextTurn]);

    const resolveCardPlay = useCallback((playerIndex, card, selectedColor) => {
        setDiscardPile(prev => [...prev, card]);

        let newDirection = direction;
        let nextStep = 1;
        let newActiveColor = card.color === 'wild' ? selectedColor : card.color;

        if (card.type === 'reverse') {
            newDirection = direction * -1;
            addLog(`${players[playerIndex].name} played Reverse`);
        } else if (card.type === 'skip') {
            nextStep = 2;
            addLog(`${players[playerIndex].name} played Skip. Next player misses turn!`);
        } else if (card.type === 'draw2') {
            setPendingDrawCount(prev => prev + 2);
            setPendingDrawType('draw2');
            nextStep = 1;
            addLog(`${players[playerIndex].name} played Draw 2. Stack is now ${pendingDrawCount + 2}!`);
        } else if (card.type === 'wild') {
            addLog(`${players[playerIndex].name} played Wild. Color is ${newActiveColor}`);
        } else if (card.type === 'wild4') {
            setPendingDrawCount(prev => prev + 4);
            setPendingDrawType('wild4');
            nextStep = 1;
            addLog(`${players[playerIndex].name} played Wild Draw 4. Stack is now ${pendingDrawCount + 4}! Color is ${newActiveColor}`);
        } else {
            addLog(`${players[playerIndex].name} played ${card.color} ${card.value}`);
        }

        setDirection(newDirection);
        setActiveColor(newActiveColor);
        nextTurn(nextStep, newDirection);
    }, [direction, players, addLog, nextTurn, pendingDrawCount]);

    const playCard = useCallback((playerIndex, cardIndex, selectedColor = null) => {
        const player = players[playerIndex];
        if (!player) return false;

        const card = player.cards[cardIndex];
        const topCard = discardPile[discardPile.length - 1];

        if (!canPlayCard(card, topCard, activeColor, pendingDrawCount, pendingDrawType)) return false;

        if (card.color === 'wild' && !selectedColor && !player.isBot) {
            setPendingWildCard({ playerIndex, cardIndex });
            setColorSelectorVisible(true);
            return false;
        }

        const newCards = [...player.cards];
        newCards.splice(cardIndex, 1);

        setPlayers(prev => {
            const p = [...prev];
            p[playerIndex] = { ...p[playerIndex], cards: newCards };

            if (newCards.length === 0 && !p[playerIndex].finishedRank) {
                const finishedCount = p.filter(pl => pl.finishedRank).length;
                p[playerIndex].finishedRank = finishedCount + 1;

                if (finishedCount === 0) {
                    setWinner(p[playerIndex].name);
                    try {
                        const historyData = {
                            date: new Date().toLocaleString(),
                            winner: p[playerIndex].name,
                            totalPlayers: playerCount,
                        };
                        const existingHistory = JSON.parse(localStorage.getItem('uno_history')) || [];
                        localStorage.setItem('uno_history', JSON.stringify([historyData, ...existingHistory].slice(0, 50)));
                    } catch (e) { 
                        console.error("Failed to save match history: ", e);
                    }
                }

                if (finishedCount === playerCount - 2) {
                    const lastP = p.findIndex(pl => !pl.finishedRank);
                    if (lastP !== -1) p[lastP] = { ...p[lastP], finishedRank: playerCount };
                    setTimeout(() => setGameOver(true), 2500);
                }
            } else if (newCards.length === 1 && !p[playerIndex].finishedRank) {
                addLog(`${player.name} calls UNO!`);
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance("UNO!");
                    utterance.rate = 1.3;
                    utterance.pitch = 1.2;
                    window.speechSynthesis.speak(utterance);
                }
            }
            return p;
        });

        if (newCards.length === 0) {
            addLog(`${player.name} finished the game in #${players.filter(pl => pl.finishedRank).length + 1} place!`);
        }

        setAnimatingCard({ card, fromPlayerIndex: playerIndex, destination: 'center' });

        setTimeout(() => {
            setAnimatingCard(null);
            resolveCardPlay(playerIndex, card, selectedColor);
        }, 400);

        return true;
    }, [players, discardPile, activeColor, resolveCardPlay, addLog, pendingDrawCount, pendingDrawType, playerCount]);

    return {
        deck, discardPile, players, turnIndex, direction, activeColor,
        gameOver, winner, log, colorSelectorVisible,
        setColorSelectorVisible, playCard, drawCard, initializeGame, nextTurn,
        pendingWildCard, setPendingWildCard, addLog, animatingCard,
        pendingDrawCount, pendingDrawType, acceptPenalty,
        hasDrawnThisTurn, setHasDrawnThisTurn
    };
};
