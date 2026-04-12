import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useOnlineGame = () => {
    const [socket, setSocket] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [playerIndex, setPlayerIndex] = useState(null);
    const [maxPlayers, setMaxPlayers] = useState(4);
    const [isHost, setIsHost] = useState(false);
    const [lobbyPlayers, setLobbyPlayers] = useState([]);
    const [inLobby, setInLobby] = useState(false);

    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState(null);

    // Mirror useGame state for UI compatibility
    const [colorSelectorVisible, setColorSelectorVisible] = useState(false);
    const [pendingWildCard, setPendingWildCard] = useState(null);
    const [animatingCard, setAnimatingCard] = useState(null);
    const [rematchVotes, setRematchVotes] = useState({ votes: 0, needed: 0 });

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('rooms_list', (list) => setRooms(list));
        
        newSocket.on('room_created', ({ roomId, playerIndex, playerName, maxPlayers }) => {
            setCurrentRoomId(roomId);
            setPlayerIndex(playerIndex);
            setMaxPlayers(maxPlayers);
            setIsHost(true);
            setInLobby(true);
            setLobbyPlayers([playerName]);
        });

        newSocket.on('room_joined', ({ roomId, playerIndex, players, maxPlayers }) => {
            setCurrentRoomId(roomId);
            setPlayerIndex(playerIndex);
            setMaxPlayers(maxPlayers);
            setLobbyPlayers(players);
            setInLobby(true);
        });

        newSocket.on('player_joined', ({ players, maxPlayers }) => {
            setLobbyPlayers(players);
            if (maxPlayers) setMaxPlayers(maxPlayers);
        });

        newSocket.on('player_left', ({ players }) => {
            setLobbyPlayers(players);
        });

        newSocket.on('game_started', ({ gameState, playerIndex: pIdx }) => {
            setGameState(gameState);
            setPlayerIndex(pIdx);
            setInLobby(false);
            setRematchVotes({ votes: 0, needed: 0 });
        });

        newSocket.on('game_updated', ({ gameState }) => {
            setGameState(gameState);
        });

        newSocket.on('rematch_vote', (data) => {
            setRematchVotes(data);
        });

        newSocket.on('error', (err) => {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        });

        newSocket.on('player_disconnected', ({ playerName }) => {
            alert(`${playerName} disconnected. Game Over.`);
            // Handle disconnection logic if needed
        });

        return () => newSocket.close();
    }, []);

    const createRoom = (playerName, maxPlayers = 4) => {
        socket.emit('create_room', { playerName, maxPlayers });
    };

    const joinRoom = (roomId, playerName) => {
        socket.emit('join_room', { roomId, playerName });
    };

    const requestRooms = () => {
        socket.emit('request_rooms');
    };

    const startRoomGame = () => {
        if (isHost && currentRoomId) {
            socket.emit('start_game', { roomId: currentRoomId });
        }
    };

    const playCard = (pIdx, cardIndex, selectedColor = null) => {
        if (!gameState || pIdx !== gameState.turnIndex) return;
        
        const card = gameState.players[pIdx].cards[cardIndex];
        if (card.color === 'wild' && !selectedColor) {
            setPendingWildCard({ playerIndex: pIdx, cardIndex });
            setColorSelectorVisible(true);
            return;
        }

        socket.emit('play_card', { roomId: currentRoomId, cardIndex, selectedColor });
        
        // Trigger local animation
        setAnimatingCard({ card, fromPlayerIndex: pIdx, destination: 'center' });
        setTimeout(() => setAnimatingCard(null), 400);
    };

    const drawCard = () => {
        socket.emit('draw_card', { roomId: currentRoomId });
    };

    const rematch = () => {
        socket.emit('rematch', { roomId: currentRoomId });
    };

    const leaveRoom = () => {
        socket.emit('leave_room', { roomId: currentRoomId });
        setGameState(null);
        setCurrentRoomId(null);
        setInLobby(false);
        setIsHost(false);
    };

    const gameInterface = {
        players: gameState?.players || [],
        discardPile: gameState?.discardPile || [],
        deck: gameState?.deck || [],
        turnIndex: gameState?.turnIndex ?? 0,
        direction: gameState?.direction ?? 1,
        activeColor: gameState?.activeColor || 'red',
        gameOver: gameState?.gameOver || false,
        winner: gameState?.winner || null,
        log: gameState?.log || [],
        pendingDrawCount: gameState?.pendingDrawCount || 0,
        pendingDrawType: gameState?.pendingDrawType || null,
        hasDrawnThisTurn: gameState?.hasDrawnThisTurn || false,
        colorSelectorVisible,
        setColorSelectorVisible,
        playCard,
        drawCard,
        acceptPenalty: drawCard,
        pendingWildCard,
        setPendingWildCard,
        animatingCard,
        setHasDrawnThisTurn: () => {},
        nextTurn: drawCard,
        addLog: (msg) => {},
        initializeGame: () => {},
        isOnline: true,
        playerIndex,
        maxPlayers,
        isHost,
        currentRoomId,
        lobbyPlayers,
        inLobby,
        rematch,
        rematchVotes,
        leaveRoom
    };

    return {
        rooms,
        createRoom,
        joinRoom,
        requestRooms,
        startRoomGame,
        game: gameInterface,
        error,
        inLobby,
        currentRoomId
    };
};

