export const getBotMove = (botPlayer, topCard, activeColor) => {
    // 1. Try to play a regular matching card (not wild)
    for (let i = 0; i < botPlayer.cards.length; i++) {
        const card = botPlayer.cards[i];
        if (card.color !== 'wild' &&
            (card.color === activeColor ||
                (card.type === topCard.type && card.type !== 'number') ||
                (card.type === 'number' && card.value === topCard.value))) {
            return { cardIndex: i, selectedColor: null };
        }
    }

    // 2. If no regular card works, play a wild card
    for (let i = 0; i < botPlayer.cards.length; i++) {
        const card = botPlayer.cards[i];
        if (card.color === 'wild') {
            return { cardIndex: i, selectedColor: getBestBotColor(botPlayer) };
        }
    }

    // 3. No valid cards
    return null;
};

export const getBestBotColor = (botPlayer) => {
    const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
    botPlayer.cards.forEach(c => {
        if (c.color !== 'wild') colorCounts[c.color]++;
    });
    let bestColor = 'red';
    let max = -1;
    for (const [color, count] of Object.entries(colorCounts)) {
        if (count > max) {
            max = count;
            bestColor = color;
        }
    }
    return bestColor;
};
