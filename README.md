<<<<<<< HEAD
# UNO
=======
# UNO Offline (React Edition) 🃏

A premium, feature-rich offline UNO game built entirely in React and Vanilla CSS. Play against aggressive AI bots with a mathematically precise game engine that enforces official competitive UNO rules seamlessly.

## 🚀 Tech Stack
- **Framework:** React 18 + Vite
- **Styling:** Custom Vanilla CSS (Glassmorphism design tokens, CSS Variable geometric animations)
- **State Management:** Custom React Hooks (`useGame.js`) mapping immutable functional data structures
- **Storage:** HTML5 LocalStorage for permanent Match History syncing

## ✨ Key Features
- **Dynamic Player Scaling:** Play with anywhere from 3 to 6 players simultaneously. The layout engine dynamically maps the count into a proportionally balanced elliptical bot perimeter around the table.
- **Configurable Starting Decks:** Rather than being forced to 7 cards, you can tweak the starting hand size for a faster or more agonizing game (6 to 14 cards).
- **Embedded AI System:** Bots seamlessly evaluate color-weight heuristics to select the most optimal colors for wild cards, aggressively chain and stack Draw penalties onto opponents, and intelligently calculate pass-to-play validity limits.
- **Fluid Animation System:** When cards are played, they physically detach from their flexbox hand layer, swap onto a highly precise absolute CSS overlay layer, calculate the exact mathematical trajectory to the center discard pile relative to the viewport, and visually 'fly' across the screen for 400ms before finalizing the game logic.
- **Persistent Match History:** All victorious 1st-place wins are safely injected into Local Storage synchronously upon game logic evaluation and populated beautifully in the Start Menu history ledger.

## 📜 Official Rule Implementations
This engine perfectly replicates complex UNO rule sets that many digital versions completely ignore:
- **Draw-to-Play Pass Rule:** If you click the board to draw a card from the deck, your turn doesn't automatically forcefully jump to the next player! You can seamlessly examine the card you just drew. If it's valid, you can immediately play it. If not, you must manually explicitly click the newly formed 'PASS' button to end your turn.
- **Compound Penalty Stacking (+2 & +4):** If you are hit with a Draw 2, you are immediately considered 'Under Attack'. You can either pick up the penalty and lose your turn, OR stack another Draw 2 on top of it to mathematically compound a brutal +4 to the next player inline. 
- **Endgame Spectating Continuation:** The simulation does not rudely end when the very first person reaches 0 cards. The winner gets "1st Place", their cards disappear, and they transition cleanly into a Spectator. Meanwhile, the remainder of the engine aggressively fights it out in a continuation loop for 2nd and 3rd place until a final loser is crowned on a post-game Final Standings leaderboard.

## 🏗️ Technical Architecture

### 1. The Game Engine (`src/hooks/useGame.js`)
Serving as the completely immutable single source of truth, this massive custom hook safely maps deep state matrices across all functional layers.
- Uses dense `useCallback` tracking to cleanly map rapidly firing interval AI loop closures without dropping or overriding stale React states.
- Utilizes purely modular arithmetic logic blocks `(prev + currentDirection) % playerCount` dynamically coupled with `!finishedRank` evaluations to map exact skipping, reversing, and target acquisition mechanics natively on the array pointer.

### 2. Logic Abstraction Layers (`src/utils/gameLogic.js`, `botLogic.js`)
- `gameLogic.js`: Pure mathematical utility layer exposing the 108-card deck generator script, a Fisher-Yates array shuffler, and rigorous stateless `canPlayCard` validation algorithms tracking both passive and active penalty stacking combinations.
- `botLogic.js`: Iterative map loops testing top discard requirements linearly against Bot arrays to intelligently execute valid DOM choices directly into the controller overlay.

### 3. Visual Handlers (`src/components/GameBoard.jsx`)
- Binds directly onto the mathematical logic layers to generate CSS matrices dynamically.
- `GameBoard.jsx`: Mounts the active UI, automatically groups duplicate cards in a player's hand into unified, stackable badges, monitors UI timeouts aligning perfectly with the CSS DOM transitions, and executes recursive `setTimeout` logic matching the bot rendering blocks directly against the `useGame` hook states.

## 🎮 How to Run Locally

1. Open your terminal and navigate to the root directory where this `README.md` is located (`c:\Users\gjha5\OneDrive\Desktop\games\uno-offline`).
2. Run standard installation to pull React bundles:
   ```bash
   npm install
   ```
3. Boot the local continuous HMR framework server:
   ```bash
   npm run dev
   ```
4. Access the fully playable game cleanly inside your browser immediately at:
   [http://localhost:5173/](http://localhost:5173/)
>>>>>>> a495b09 (Applied .gitignore)
