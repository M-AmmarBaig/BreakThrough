import { BOARD_SIZE, DECK_COMPOSITION, VAULT_LOCATIONS, PIECE_POWER } from './balance_config';
import type { BoardTile, Card, GameState, Piece, PlayerColor } from './types';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the 32-card deck based on balance_config
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  
  // Power Cards
  for (let i = 0; i < DECK_COMPOSITION.POWER_CARDS.DEFUSAL_KIT; i++) deck.push({ id: generateId(), type: 'DEFUSAL_KIT' });
  for (let i = 0; i < DECK_COMPOSITION.POWER_CARDS.SURGE; i++) deck.push({ id: generateId(), type: 'SURGE' });
  for (let i = 0; i < DECK_COMPOSITION.POWER_CARDS.MINE; i++) deck.push({ id: generateId(), type: 'MINE' });
  for (let i = 0; i < DECK_COMPOSITION.POWER_CARDS.TOUCH_ME_NOT; i++) deck.push({ id: generateId(), type: 'TOUCH_ME_NOT' });
  for (let i = 0; i < DECK_COMPOSITION.POWER_CARDS.DISPLACE; i++) deck.push({ id: generateId(), type: 'DISPLACE' });
  for (let i = 0; i < DECK_COMPOSITION.POWER_CARDS.UNDYING; i++) deck.push({ id: generateId(), type: 'UNDYING' });

  // Risk Cards
  for (let i = 0; i < DECK_COMPOSITION.RISK_CARDS.BLANK; i++) deck.push({ id: generateId(), type: 'BLANK' });
  for (let i = 0; i < DECK_COMPOSITION.RISK_CARDS.SKILL_ISSUE; i++) deck.push({ id: generateId(), type: 'SKILL_ISSUE' });

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
};

// Create the 8x8 Board and spawn pieces
export const createInitialBoard = (): BoardTile[][] => {
  const board: BoardTile[][] = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: BoardTile[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      const isVault = VAULT_LOCATIONS.some(v => v.x === x && v.y === y);
      
      let piece: Piece | null = null;

      // Spawn Black Pieces (Top rows)
      if (y === 0 && x === 7) piece = { id: generateId(), type: 'GENERAL', color: 'black' }; // H8 -> (7, 0)
      if (y === 1 && x === 6) piece = { id: generateId(), type: 'MAGE', color: 'black' };    // G7 -> (6, 1)
      if (y === 0 && x === 4) piece = { id: generateId(), type: 'SEPOY', color: 'black' };   // E8 -> (4, 0)
      if (y === 1 && x === 5) piece = { id: generateId(), type: 'SEPOY', color: 'black' };   // F7 -> (5, 1)
      if (y === 2 && x === 6) piece = { id: generateId(), type: 'SEPOY', color: 'black' };   // G6 -> (6, 2)
      if (y === 3 && x === 7) piece = { id: generateId(), type: 'SEPOY', color: 'black' };   // H5 -> (7, 3)

      // Spawn White Pieces (Bottom rows)
      if (y === 7 && x === 0) piece = { id: generateId(), type: 'GENERAL', color: 'white' }; // A1 -> (0, 7)
      if (y === 6 && x === 1) piece = { id: generateId(), type: 'MAGE', color: 'white' };    // B2 -> (1, 6)
      if (y === 4 && x === 0) piece = { id: generateId(), type: 'SEPOY', color: 'white' };   // A4 -> (0, 4)
      if (y === 5 && x === 1) piece = { id: generateId(), type: 'SEPOY', color: 'white' };   // B3 -> (1, 5)
      if (y === 6 && x === 2) piece = { id: generateId(), type: 'SEPOY', color: 'white' };   // C2 -> (2, 6)
      if (y === 7 && x === 3) piece = { id: generateId(), type: 'SEPOY', color: 'white' };   // D1 -> (3, 7)

      row.push({
        x,
        y,
        piece,
        hasMine: false,
        isVault
      });
    }
    board.push(row);
  }

  return board;
};

// Initialize the complete Game State
export const initializeGame = (): GameState => {
  const deck = createDeck();
  const board = createInitialBoard();

  // As per rules, players START with exactly 1 Surge and 1 Snare.
  // We do NOT draw these from the deck. The deck retains its 32 cards.
  // This ensures the 50/50 balance remains perfectly intact for Vault draws.
  const createStartingHand = (): Card[] => [
    { id: generateId(), type: 'SURGE' },
    { id: generateId(), type: 'MINE' }
  ];

  return {
    board,
    deck,
    players: {
      white: {
        color: 'white',
        hand: createStartingHand(),
        graveyard: [],
        extraLife: false
      },
      black: {
        color: 'black',
        hand: createStartingHand(),
        graveyard: [],
        extraLife: false
      }
    },
    currentTurn: 'white',
    winner: null,
    selectedPos: null,
    validMoves: [],
    pendingCombat: null,
    activeCardId: null,
    pendingRevive: null,
    pendingExplosion: null,
    toastMessage: null,
    drawnCard: null,
    turnCount: 1,
    diceRolls: null
  };
};

// Calculate valid moves based on piece range
export const calculateValidMoves = (
  board: BoardTile[][],
  startX: number,
  startY: number,
  piece: Piece
): { x: number; y: number }[] => {
  const moves: { x: number; y: number }[] = [];
  const range = piece.type === 'MAGE' ? 2 : 1;
  const enemyColor = piece.color === 'white' ? 'black' : 'white';

  // Check if enemy has any active Sepoys (Pawn Shield)
  const enemyHasSepoys = board.some(row => 
    row.some(tile => tile.piece?.color === enemyColor && tile.piece.type === 'SEPOY')
  );

  // LAST STAND MECHANIC: If the moving piece is the General and it is the ONLY piece left, it bypasses the Pawn Shield
  let isLastStand = false;
  if (piece.type === 'GENERAL') {
    let allyCount = 0;
    board.forEach(row => row.forEach(tile => {
      if (tile.piece?.color === piece.color) allyCount++;
    }));
    if (allyCount === 1) isLastStand = true;
  }

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      if (dx === 0 && dy === 0) continue; // Skip own tile

      const newX = startX + dx;
      const newY = startY + dy;

      // Check board boundaries
      if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
        const targetTile = board[newY][newX];
        
        // Cannot move onto a friendly piece
        if (!targetTile.piece || targetTile.piece.color !== piece.color) {
          // Check Pawn Shield: Cannot attack General if Sepoys are alive (Unless Last Stand)
          if (targetTile.piece?.type === 'GENERAL' && enemyHasSepoys && !isLastStand) {
            continue; // General is shielded!
          }
          
          // Check Invincibility
          if (targetTile.piece && (targetTile.piece.invincibleTurns || 0) > 0) {
            continue; // Cannot attack an invincible piece!
          }
          if (targetTile.piece && (piece.invincibleTurns || 0) > 0) {
            continue; // Invincible pieces cannot attack!
          }

          moves.push({ x: newX, y: newY });
        }
      }
    }
  }

  return moves;
};

// Helper to handle turn transitions and decrement buffs
export const endTurn = (gameState: GameState): GameState => {
  const nextTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
  
  // Decrement buffs (invincible, defusal) for the NEXT player, since their turn is starting
  const newBoard = gameState.board.map(row => row.map(tile => {
    if (tile.piece && tile.piece.color === nextTurn) {
      const piece = { ...tile.piece };
      if (piece.invincibleTurns) piece.invincibleTurns -= 1;
      if (piece.defusalTurns) piece.defusalTurns -= 1;
      return { ...tile, piece };
    }
    return tile;
  }));

  // Consume surge if it wasn't used this turn
  const newPlayers = { ...gameState.players };
  if (newPlayers[gameState.currentTurn].activeSurge) {
    newPlayers[gameState.currentTurn] = { ...newPlayers[gameState.currentTurn], activeSurge: false };
  }

  // Check Win Condition (Generals)
  let whiteGeneralAlive = false;
  let blackGeneralAlive = false;
  newBoard.forEach(row => row.forEach(tile => {
    if (tile.piece?.type === 'GENERAL') {
      if (tile.piece.color === 'white') whiteGeneralAlive = true;
      if (tile.piece.color === 'black') blackGeneralAlive = true;
    }
  }));

  let winner = gameState.winner;
  if (!whiteGeneralAlive) winner = 'black';
  if (!blackGeneralAlive) winner = 'white';

  return {
    ...gameState,
    board: newBoard,
    players: newPlayers,
    currentTurn: nextTurn,
    turnCount: gameState.turnCount + 1,
    selectedPos: null,
    validMoves: [],
    pendingCombat: null,
    activeCardId: null,
    pendingDisplaceSource: null,
    pendingRevive: null,
    pendingExplosion: null,
    winner
    // drawnCard is dismissed by the UI explicitly
  };
};

// Helper to spawn a piece at a player's base row (or nearest empty row)
export const spawnAtBase = (board: BoardTile[][], piece: Piece, color: PlayerColor): boolean => {
  const baseY = color === 'white' ? 7 : 0;
  const dir = color === 'white' ? -1 : 1;
  
  // Check base row, then row in front of it, etc.
  for (let offset = 0; offset < 3; offset++) {
    const y = baseY + (offset * dir);
    if (y < 0 || y >= BOARD_SIZE) break;
    
    // Try to find an empty spot in this row
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!board[y][x].piece) {
        board[y][x].piece = piece;
        return true;
      }
    }
  }
  return false; // Board full
};

// Execute a move or initiate combat
export const executeMove = (
  gameState: GameState,
  targetX: number,
  targetY: number
): GameState => {
  if (!gameState.selectedPos) return gameState;

  // Force Bomb placement anytime it's in hand
  const hasMine = gameState.players[gameState.currentTurn].hand.some(c => c.type === 'MINE');
  if (hasMine) {
    return { ...gameState, toastMessage: "You must place your Snare (Bomb) card on the board before moving any pieces!", selectedPos: null };
  }

  // Create a deep copy of the board to mutate safely
  const newBoard = gameState.board.map(row => row.map(tile => ({ ...tile })));
  
  const sourceTile = newBoard[gameState.selectedPos.y][gameState.selectedPos.x];
  const targetTile = newBoard[targetY][targetX];
  const movingPiece = sourceTile.piece;

  if (!movingPiece) return gameState;

  // If moving onto an enemy piece -> Trigger Combat!
  if (targetTile.piece && targetTile.piece.color !== movingPiece.color) {
    const defenderColor = targetTile.piece.color;
    const validSupporters: {x: number, y: number}[] = [];

    // Find adjacent allies for the defender (excluding General)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const adjX = targetX + dx;
        const adjY = targetY + dy;

        if (adjX >= 0 && adjX < BOARD_SIZE && adjY >= 0 && adjY < BOARD_SIZE) {
          const adjPiece = newBoard[adjY][adjX].piece;
          // Must be friendly and NOT a general
          if (adjPiece && adjPiece.color === defenderColor && adjPiece.type !== 'GENERAL') {
            validSupporters.push({ x: adjX, y: adjY });
          }
        }
      }
    }

    if (validSupporters.length > 0) {
      // Enter Pending Combat State (awaiting defender choice)
      return {
        ...gameState,
        selectedPos: null,
        validMoves: [],
        pendingCombat: {
          attackerPos: { x: gameState.selectedPos.x, y: gameState.selectedPos.y },
          defenderPos: { x: targetX, y: targetY },
          validSupporters
        }
      };
    } else {
      // Resolve combat immediately if no supporters
      return resolveCombat(
        { ...gameState, board: newBoard, selectedPos: null, validMoves: [] },
        { x: gameState.selectedPos.x, y: gameState.selectedPos.y },
        { x: targetX, y: targetY },
        null
      );
    }
  }

  // If moving to an empty tile -> Simple Move
  targetTile.piece = movingPiece;
  sourceTile.piece = null;

  let finalState: GameState = {
    ...gameState,
    board: newBoard,
    selectedPos: null,
    validMoves: []
  };

  // Check if they stepped on a MINE
  if (targetTile.hasMine) {
    if (movingPiece.type === 'GENERAL') {
      finalState.toastMessage = `The General safely crushed a hidden Mine!`;
      targetTile.hasMine = false;
    } else if ((movingPiece.defusalTurns || 0) > 0) {
      finalState.toastMessage = `DEFUSAL KIT USED! Your ${movingPiece.type} safely defused the mine!`;
      targetTile.piece = { ...movingPiece, defusalTurns: 0 };
      targetTile.hasMine = false;
    } else {
      // Instead of destroying instantly, we set pendingExplosion
      // It will pause the game for the cinematic
      finalState.pendingExplosion = { x: targetX, y: targetY, piece: movingPiece };
      targetTile.hasMine = false; // We clear the mine, piece remains temporarily
    }
  }
  // Check if they stepped on a Vault
  else if (targetTile.isVault) {
    finalState = processVaultDraw(finalState, targetX, targetY);
  }

  if (finalState.pendingExplosion || finalState.pendingRevive) return finalState;
  return endTurn(finalState);
};

export const resolveCombat = (
  gameState: GameState,
  attackerPos: {x: number, y: number},
  defenderPos: {x: number, y: number},
  supporterPos: {x: number, y: number} | null
): GameState => {
  // Deep clone to safely mutate
  const newBoard = gameState.board.map(row => row.map(tile => ({ ...tile })));
  const newState: GameState = { ...gameState, board: newBoard, pendingCombat: null };

  const attackerPiece = newBoard[attackerPos.y][attackerPos.x].piece!;
  const defenderPiece = newBoard[defenderPos.y][defenderPos.x].piece!;

  // Calc max dice powers
  let atkMax = PIECE_POWER[attackerPiece.type];
  let defMax = PIECE_POWER[defenderPiece.type];

  // Apply SURGE buff if active
  if (newState.players[attackerPiece.color].activeSurge) {
    atkMax += 5;
  }

  if (supporterPos) {
    const supporterPiece = newBoard[supporterPos.y][supporterPos.x].piece!;
    defMax += PIECE_POWER[supporterPiece.type];
  }

  // Roll dice
  const atkRoll = Math.floor(Math.random() * atkMax) + 1;
  const defRoll = Math.floor(Math.random() * defMax) + 1;

  newState.diceRolls = {
    atk: atkRoll,
    def: defRoll,
    maxAtk: atkMax,
    maxDef: defMax,
    atkType: attackerPiece.type,
    defType: defenderPiece.type,
    winner: atkRoll >= defRoll ? attackerPiece.color : defenderPiece.color,
    attackerPos,
    defenderPos,
    supporterPos
  };

  return newState;
};

export const executeCombatRoll = (gameState: GameState): GameState => {
  if (!gameState.diceRolls) return gameState;

  const newBoard = gameState.board.map(row => row.map(tile => ({ ...tile })));
  const newState: GameState = { ...gameState, board: newBoard };

  const roll = gameState.diceRolls;
  const attackerPiece = newBoard[roll.attackerPos.y][roll.attackerPos.x].piece!;
  const defenderPiece = newBoard[roll.defenderPos.y][roll.defenderPos.x].piece!;
  let supporterPiece: Piece | null = null;
  if (roll.supporterPos) {
    supporterPiece = newBoard[roll.supporterPos.y][roll.supporterPos.x].piece!;
  }

  let combatToast = "";

  if (roll.winner === attackerPiece.color) {
    // Attacker wins!
    if (defenderPiece.type === 'GENERAL') {
      newState.winner = attackerPiece.color;
    }

    if (newState.players[defenderPiece.color].extraLife && defenderPiece.type !== 'GENERAL') {
      newState.players[defenderPiece.color].extraLife = false;
      newBoard[roll.defenderPos.y][roll.defenderPos.x].piece = null;
      spawnAtBase(newBoard, defenderPiece, defenderPiece.color);
      combatToast += `UNDYING TRIGGERED! ${defenderPiece.type} was killed but immediately respawned at base!\n`;
    } else {
      newState.players[defenderPiece.color].graveyard.push(defenderPiece);
      newBoard[roll.defenderPos.y][roll.defenderPos.x].piece = null;
    }

    if (roll.supporterPos && supporterPiece) {
      if (newState.players[supporterPiece.color].extraLife && supporterPiece.type !== 'GENERAL') {
        newState.players[supporterPiece.color].extraLife = false;
        newBoard[roll.supporterPos.y][roll.supporterPos.x].piece = null;
        spawnAtBase(newBoard, supporterPiece, supporterPiece.color);
        combatToast += `UNDYING TRIGGERED! Supporting ${supporterPiece.type} was killed but immediately respawned at base!\n`;
      } else {
        newState.players[supporterPiece.color].graveyard.push(supporterPiece);
        newBoard[roll.supporterPos.y][roll.supporterPos.x].piece = null;
      }
    }

    newBoard[roll.defenderPos.y][roll.defenderPos.x].piece = attackerPiece;
    newBoard[roll.attackerPos.y][roll.attackerPos.x].piece = null;
    
    if (newBoard[roll.defenderPos.y][roll.defenderPos.x].isVault) {
      let intermediateState = { ...newState, board: newBoard };
      intermediateState = processVaultDraw(intermediateState, roll.defenderPos.x, roll.defenderPos.y);
      Object.assign(newState, intermediateState);
    }
  } else {
    // Defender wins!
    if (newState.players[attackerPiece.color].extraLife && attackerPiece.type !== 'GENERAL') {
      newState.players[attackerPiece.color].extraLife = false;
      newBoard[roll.attackerPos.y][roll.attackerPos.x].piece = null;
      spawnAtBase(newBoard, attackerPiece, attackerPiece.color);
      combatToast += `UNDYING TRIGGERED! Attacking ${attackerPiece.type} was killed but immediately respawned at base!\n`;
    } else {
      newState.players[attackerPiece.color].graveyard.push(attackerPiece);
      newBoard[roll.attackerPos.y][roll.attackerPos.x].piece = null;
    }
  }

  if (combatToast) {
    newState.toastMessage = (newState.toastMessage ? newState.toastMessage + "\n" : "") + combatToast;
  }

  newState.diceRolls = null;
  
  if (newState.pendingRevive) return newState;
  return endTurn(newState);
};

export const processVaultDraw = (
  gameState: GameState,
  targetX: number,
  targetY: number
): GameState => {
  const tile = gameState.board[targetY][targetX];
  if (!tile.isVault) return gameState; // Not a vault
  
  const piece = tile.piece;
  if (!piece) return gameState; // No piece here (died in combat?)

  if (gameState.deck.length === 0) {
    gameState.toastMessage = "The Vault is empty! (No cards left in deck)";
    return gameState;
  }

  // Draw card from the end of the array
  const card = gameState.deck.pop()!;
  gameState.drawnCard = card;

  if (card.type === 'SKILL_ISSUE') {
    if (piece.type === 'GENERAL') {
      gameState.toastMessage = `VAULT DRAW: "Skill issue" trap!\nLuckily, Generals are immune to traps. (Discarded)`;
    } else if (gameState.players[piece.color].extraLife) {
      gameState.players[piece.color].extraLife = false;
      tile.piece = null;
      spawnAtBase(gameState.board, piece, piece.color);
      gameState.toastMessage = `VAULT DRAW: "Skill issue" trap!\nYour ${piece.type} triggered a trap and died, but your UNDYING buff instantly respawned them at base!`;
    } else {
      gameState.toastMessage = `VAULT DRAW: "Skill issue" trap!\nYour ${piece.type} triggered a trap and was instantly killed!`;
      gameState.players[piece.color].graveyard.push(piece);
      tile.piece = null;
    }
  } else if (card.type === 'BLANK') {
    gameState.toastMessage = `VAULT DRAW: "Blank"\nThe vault was empty. Nothing happens. (Discarded)`;
  } else if (card.type === 'UNDYING') {
    // Play-On-Draw Effect
    const graveyard = gameState.players[piece.color].graveyard;
    if (graveyard.length === 0) {
      gameState.players[piece.color].extraLife = true;
      gameState.toastMessage = `VAULT DRAW: "Undying"!\nYour graveyard is empty, so you gain an EXTRA LIFE buff! (Automatically saves your next piece that dies)`;
    } else {
      // Trigger the graveyard selection modal
      gameState.pendingRevive = { color: piece.color };
    }
  } else {
    // Standard cards go to hand
    gameState.players[piece.color].hand.push(card);
    gameState.toastMessage = `VAULT DRAW: You found a "${card.type}" card!\nIt has been added to your hand.`;
  }

  return gameState;
};

export const playCard = (gameState: GameState, targetX: number, targetY: number): GameState => {
  if (!gameState.activeCardId) return gameState;
  
  const playerColor = gameState.currentTurn;
  const player = gameState.players[playerColor];
  const cardIndex = player.hand.findIndex(c => c.id === gameState.activeCardId);
  
  if (cardIndex === -1) return { ...gameState, activeCardId: null, pendingDisplaceSource: null };

  const card = player.hand[cardIndex];
  const tile = gameState.board[targetY][targetX];
  const piece = tile.piece;

  const newState = { 
    ...gameState, 
    board: gameState.board.map(row => row.map(t => ({...t}))) 
  };
  
  const newPlayer = { ...player, hand: [...player.hand] };
  newState.players = { ...gameState.players, [playerColor]: newPlayer };
  
  // Force Bomb placement anytime it's in hand (cannot play other cards until bomb is placed)
  if (card.type !== 'MINE') {
    const hasMine = newPlayer.hand.some(c => c.type === 'MINE');
    if (hasMine) {
      return { ...gameState, activeCardId: null, toastMessage: "You must place your Snare (Bomb) card before doing anything else!" };
    }
  }

  // Card: MINE (Free Action)
  if (card.type === 'MINE') {
    if (piece || tile.isVault) {
      return { ...gameState, activeCardId: null, toastMessage: "Invalid target! Mines can only be placed on tiles without players or vaults." };
    }
    newState.board[targetY][targetX].hasMine = true;
    newPlayer.hand.splice(cardIndex, 1);
    newState.toastMessage = "Snare (Mine) placed successfully!";
    // Free action, so turn does not end
  } 
  
  // Card: SURGE (Free Action)
  else if (card.type === 'SURGE') {
    // We can just click any friendly piece to activate it for the player
    if (!piece || piece.color !== playerColor) {
      return { ...gameState, activeCardId: null, toastMessage: "Click on any of your pieces to activate Surge (+5 to your next combat roll this turn)!" };
    }
    newPlayer.activeSurge = true;
    newPlayer.hand.splice(cardIndex, 1);
    newState.toastMessage = "SURGE ACTIVATED! You have +5 power for your next attack.";
  }
  
  // Card: DEFUSAL_KIT (Free Action)
  else if (card.type === 'DEFUSAL_KIT') {
    if (!piece || piece.color !== playerColor) {
      return { ...gameState, activeCardId: null, toastMessage: "Target one of your own pieces to equip the Defusal Kit." };
    }
    newState.board[targetY][targetX].piece = { ...piece, defusalTurns: 1 };
    newPlayer.hand.splice(cardIndex, 1);
    newState.toastMessage = "DEFUSAL KIT EQUIPPED! This piece is immune to mines for 1 move.";
  }

  // Card: TOUCH_ME_NOT (Free Action)
  else if (card.type === 'TOUCH_ME_NOT') {
    if (!piece || piece.color !== playerColor) {
      return { ...gameState, activeCardId: null, toastMessage: "Target one of your own pieces to make it invincible." };
    }
    newState.board[targetY][targetX].piece = { ...piece, invincibleTurns: 2 };
    newPlayer.hand.splice(cardIndex, 1);
    newState.toastMessage = "TOUCH-ME-NOT ACTIVATED! This piece is invincible for 2 moves.";
  }

  // Card: DISPLACE (Ends Turn)
  else if (card.type === 'DISPLACE') {
    if (!gameState.pendingDisplaceSource) {
      // Step 1: Select own piece
      if (!piece || piece.color !== playerColor) {
        return { ...gameState, activeCardId: null, toastMessage: "Displace Step 1: Select one of your OWN pieces first." }; // Reset to let them try again
      }
      return { ...newState, pendingDisplaceSource: { x: targetX, y: targetY } };
    } else {
      // Step 2: Select enemy piece (Not General)
      if (!piece || piece.color === playerColor) {
        return { ...gameState, activeCardId: null, pendingDisplaceSource: null, toastMessage: "Displace Step 2: Select an ENEMY piece." };
      }
      if (piece.type === 'GENERAL') {
        return { ...gameState, activeCardId: null, pendingDisplaceSource: null, toastMessage: "You cannot Displace the enemy General!" };
      }

      const sourcePos = gameState.pendingDisplaceSource;
      const sourcePiece = newState.board[sourcePos.y][sourcePos.x].piece!;
      
      // Swap them!
      newState.board[targetY][targetX].piece = sourcePiece;
      newState.board[sourcePos.y][sourcePos.x].piece = piece;
      
      newPlayer.hand.splice(cardIndex, 1);
      newState.toastMessage = "DISPLACE SUCCESSFUL!";

      // Displace ends the turn!
      newState.currentTurn = newState.currentTurn === 'white' ? 'black' : 'white';
    }
  }

  newState.activeCardId = null;
  newState.pendingDisplaceSource = null;
  return newState;
};

export const executeRevive = (gameState: GameState, pieceId: string, targetX: number, targetY: number): GameState => {
  if (!gameState.pendingRevive) return gameState;
  const playerColor = gameState.pendingRevive.color;
  
  // Validate target is empty and in initial triangular boundary
  // Black: top-right triangle (x - y >= 4)
  // White: bottom-left triangle (y - x >= 4)
  const isValidLocation = playerColor === 'black' ? (targetX - targetY >= 4) : (targetY - targetX >= 4);
  if (!isValidLocation) {
    return { ...gameState, toastMessage: "You can only revive a piece in your starting triangular boundary!" };
  }
  if (gameState.board[targetY][targetX].piece || gameState.board[targetY][targetX].isVault || gameState.board[targetY][targetX].hasMine) {
    return { ...gameState, toastMessage: "Target tile must be empty!" };
  }

  const newState = { ...gameState, board: gameState.board.map(r => r.map(t => ({...t}))) };
  const graveyard = [...newState.players[playerColor].graveyard];
  
  const pieceIdx = graveyard.findIndex(p => p.id === pieceId);
  if (pieceIdx === -1) return gameState;
  
  const piece = graveyard.splice(pieceIdx, 1)[0];
  newState.players = {
    ...newState.players,
    [playerColor]: {
      ...newState.players[playerColor],
      graveyard
    }
  };
  
  newState.board[targetY][targetX].piece = piece;
  
  newState.pendingRevive = null;
  
  // Since this is triggered from drawing a card, end the turn now
  return endTurn(newState);
};

export const executeExplosion = (gameState: GameState): GameState => {
  if (!gameState.pendingExplosion) return gameState;
  
  const { x, y, piece } = gameState.pendingExplosion;
  const newState = { ...gameState, board: gameState.board.map(r => r.map(t => ({...t}))) };
  
  newState.toastMessage = `BOOM! Your ${piece.type} stepped on a MINE and was destroyed!`;
  newState.players[piece.color].graveyard.push(piece);
  newState.board[y][x].piece = null;
  newState.pendingExplosion = null;

  // Since mine was triggered during a move, we now end the turn
  return endTurn(newState);
};
