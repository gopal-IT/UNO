export const COLORS = ['red', 'blue', 'green', 'yellow'];
export const TYPES = ['number', 'skip', 'reverse', 'draw2', 'wild', 'wild4'];

export const generateDeck = () => {
    const deck = [];
    let idCounter = 0;

    COLORS.forEach(color => {
        deck.push({ id: `c_${idCounter++}`, color, type: 'number', value: 0 });

        for (let i = 1; i <= 9; i++) {
            deck.push({ id: `c_${idCounter++}`, color, type: 'number', value: i });
            deck.push({ id: `c_${idCounter++}`, color, type: 'number', value: i });
        }

        ['skip', 'reverse', 'draw2'].forEach(actionType => {
            deck.push({ id: `c_${idCounter++}`, color, type: actionType, value: null });
            deck.push({ id: `c_${idCounter++}`, color, type: actionType, value: null });
        });
    });

    for (let i = 0; i < 4; i++) {
        deck.push({ id: `c_${idCounter++}`, color: 'wild', type: 'wild', value: null });
        deck.push({ id: `c_${idCounter++}`, color: 'wild', type: 'wild4', value: null });
    }

    return deck;
};

export const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

export const dealCards = (deck, numPlayers = 4, startingCards = 7) => {
    const hands = Array.from({ length: numPlayers }, () => []);
    let currentDeck = [...deck];

    for (let i = 0; i < startingCards; i++) {
        for (let p = 0; p < numPlayers; p++) {
            if (currentDeck.length > 0) hands[p].push(currentDeck.pop());
        }
    }

    return { hands, remainingDeck: currentDeck };
};

export const canPlayCard = (card, topCard, activeColor, pendingDrawCount = 0, pendingDrawType = null) => {
    if (pendingDrawCount > 0) {
        if (pendingDrawType === 'draw2' && card.type === 'draw2') return true;
        if (pendingDrawType === 'wild4' && card.type === 'wild4') return true;
        return false;
    }
    if (card.color === 'wild') return true;
    if (card.color === activeColor) return true;
    if (card.type === topCard.type && card.type !== 'number') return true;
    if (card.type === 'number' && card.value === topCard.value) return true;
    return false;
};
