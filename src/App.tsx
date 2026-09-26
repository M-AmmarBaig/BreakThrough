import { useState, useEffect } from 'react';
import './styles/App.css';
import { initializeGame, calculateValidMoves, executeMove, resolveCombat, playCard, executeRevive, executeExplosion } from './game/engine';
import type { GameState } from './game/types';
import { PIECE_NAMES, CARD_NAMES } from './game/balance_config';

function App() {
  const [appState, setAppState] = useState<'MENU' | 'PLAYING'>('MENU');
  const [showRules, setShowRules] = useState(false);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showMines, setShowMines] = useState(false);

  // Dice Animation State
  const [rollingDice, setRollingDice] = useState(false);
  const [displayAtk, setDisplayAtk] = useState<number | null>(null);
  const [displayDef, setDisplayDef] = useState<number | null>(null);

  useEffect(() => {
    if (appState === 'PLAYING' && !gameState) {
      setGameState(initializeGame());
    }
  }, [appState]);

  const handleRollDice = () => {
    if (!gameState?.diceRolls || rollingDice) return;
    setRollingDice(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDisplayAtk(Math.floor(Math.random() * gameState.diceRolls!.maxAtk) + 1);
      setDisplayDef(Math.floor(Math.random() * gameState.diceRolls!.maxDef) + 1);
      rolls++;
      if (rolls > 20) {
        clearInterval(interval);
        setDisplayAtk(gameState.diceRolls!.atk);
        setDisplayDef(gameState.diceRolls!.def);
        setRollingDice(false);
      }
    }, 50);
  };

  const handleResolveCombat = () => {
    setGameState({ ...gameState!, diceRolls: null });
    setDisplayAtk(null);
    setDisplayDef(null);
  };

  const RulesContent = (
    <div className="bg-neutral-800 p-8 rounded-xl max-w-2xl w-full border border-yellow-500 shadow-2xl relative overflow-y-auto max-h-[80vh]">
      <h2 className="text-3xl font-black text-yellow-500 mb-6 tracking-widest border-b border-neutral-700 pb-2">HOW TO PLAY</h2>
      <div className="text-neutral-300 space-y-6 text-sm leading-relaxed pr-2">
        
        <div>
          <h3 className="text-xl text-white font-bold mb-1">👑 The Objective</h3>
          <p>Assassinate the enemy <strong>General</strong>. Generals can attack, but are completely immune to being attacked as long as they have at least one loyal <strong>Sepoy</strong> (Pawn) left on the board to shield them.</p>
          <p className="text-red-400 font-bold mt-1">LAST STAND: If your army is completely wiped out and only your General remains, they become enraged and can bypass the enemy's Sepoy shield to attack their General directly!</p>
        </div>

        <div>
          <h3 className="text-xl text-white font-bold mb-1">♟️ Movement & Pieces</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Sepoy:</strong> Moves 1 tile in any of the 8 directions. (Base Power: 10)</li>
            <li><strong>General:</strong> Moves 1 tile in any of the 8 directions. (Base Power: 25)</li>
            <li><strong>Mage:</strong> Moves up to 2 tiles in any of the 8 directions, and can jump over pieces! (Base Power: 20)</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl text-white font-bold mb-1">⚔️ Combat & Support</h3>
          <p>When you attack an enemy, combat is resolved with a dice roll based on power <em>(1dPower)</em>. However, the defender can call upon an adjacent ally for <strong>Support</strong>, combining their power into a massive defense roll! <em>Risk: If a supported defense fails, both the defender AND the supporter die.</em></p>
        </div>

        <div>
          <h3 className="text-xl text-white font-bold mb-1">🏺 Vaults & Traps</h3>
          <p>Step on the glowing golden Vaults in the corners of the board to draw a card from the 32-card deck. You might find a powerful item, or you might step on a <strong>"Skill Issue"</strong> trap and die instantly! Generals are immune to traps.</p>
        </div>

        <div>
          <h3 className="text-xl text-white font-bold mb-1">🃏 Inventory Cards</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Snare (Bomb):</strong> <span className="text-red-400 font-bold">TURN 1 RULE:</span> You start with one, and having it locks your turn. You MUST place it on an empty tile before doing anything else! Generals crush them safely.</li>
            <li><strong>Surge:</strong> Grants +5 power to your next attack this turn.</li>
            <li><strong>Defusal Kit:</strong> Grants a piece immunity to mines for 1 turn.</li>
            <li><strong>Touch-Me-Not:</strong> Grants a piece complete invincibility for 2 turns.</li>
            <li><strong>Displace:</strong> Swap the positions of one of your pieces and an enemy piece. (Ends your turn).</li>
            <li><strong>Undying (Instant):</strong> Gain an extra life to auto-revive your next dead piece, or immediately revive a fallen piece from your graveyard.</li>
          </ul>
        </div>

      </div>
      <button onClick={() => setShowRules(false)} className="mt-8 bg-yellow-600 hover:bg-yellow-500 px-8 py-3 rounded font-black text-black w-full text-xl shadow-lg transition-transform hover:scale-105">Close Rulebook</button>
    </div>
  );

  if (appState === 'MENU') {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black mb-8 tracking-widest text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]">BREAKTHROUGH</h1>
        <div className="flex flex-col gap-4 w-64">
          <button onClick={() => setAppState('PLAYING')} className="bg-yellow-600 hover:bg-yellow-500 text-black font-black text-2xl py-4 rounded-xl shadow-lg">START GAME</button>
          <button onClick={() => setShowRules(true)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xl py-3 rounded-xl border border-neutral-600">RULES</button>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSeS6dBKg2OGtszmjT0w-wOkoq8MiSSR8fcueb5YbzGAkU1dcA/viewform" target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-3 rounded-xl border border-blue-500 shadow-lg text-center">LEAVE A REVIEW</a>
        </div>

        {showRules && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8">
            {RulesContent}
          </div>
        )}
      </div>
    );
  }

  if (!gameState) return <div className="text-white text-center mt-20">Loading Board...</div>;
  if (gameState.winner && !gameState.diceRolls) return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold mb-4 tracking-wider text-yellow-500">CHECKMATE!</h1>
      <h2 className="text-3xl mb-8">{gameState.winner.toUpperCase()} WINS!</h2>
      <button onClick={() => setGameState(initializeGame())} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded text-xl font-bold">
        Play Again
      </button>
    </div>
  );

  const handleTileClick = (x: number, y: number) => {
    // If pending revive target
    if (gameState.pendingRevive?.selectedPieceId) {
      setGameState(executeRevive(gameState, gameState.pendingRevive.selectedPieceId, x, y));
      return;
    }

    // If playing a card
    if (gameState.activeCardId) {
      setGameState(playCard(gameState, x, y));
      return;
    }

    const tile = gameState.board[y][x];

    // Check if clicking a valid highlighted move
    const isValidMove = gameState.validMoves.some(m => m.x === x && m.y === y);
    if (isValidMove) {
      setGameState(executeMove(gameState, x, y));
      return;
    }

    // If clicking own piece, select it and show moves
    if (tile.piece && tile.piece.color === gameState.currentTurn) {
      const moves = calculateValidMoves(gameState.board, x, y, tile.piece);
      setGameState({
        ...gameState,
        selectedPos: { x, y },
        validMoves: moves
      });
      return;
    }

    // Deselect if clicking elsewhere
    setGameState({
      ...gameState,
      selectedPos: null,
      validMoves: []
    });
  };

  const handleCardClick = (cardId: string, playerColor: string) => {
    if (gameState.currentTurn !== playerColor) return;
    
    // Toggle card selection
    if (gameState.activeCardId === cardId) {
      setGameState({ ...gameState, activeCardId: null });
    } else {
      setGameState({ ...gameState, activeCardId: cardId, selectedPos: null, validMoves: [] });
    }
  };

  const renderHand = (color: 'white' | 'black') => (
    <div className="flex flex-wrap gap-2 p-2 bg-neutral-800 rounded-lg min-h-[116px] w-[240px] md:w-[280px] border border-neutral-700 items-start content-start">
      {gameState.players[color].hand.map(card => {
        const isSelected = gameState.activeCardId === card.id;
        const fileName = card.type === 'SURGE' ? 'Overcharge' : CARD_NAMES[card.type];
        return (
          <img 
            key={card.id}
            onClick={() => handleCardClick(card.id, color)}
            src={`/${fileName}.svg`}
            alt={CARD_NAMES[card.type]}
            className={`w-16 h-24 object-contain cursor-pointer transition-transform 
              ${gameState.currentTurn === color ? 'hover:-translate-y-2' : 'opacity-50 cursor-not-allowed'}
              ${isSelected ? '-translate-y-4 ring-2 ring-yellow-400 rounded' : ''}`}
            title={CARD_NAMES[card.type]}
          />
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 py-12 relative overflow-x-hidden">
      
      {/* Toast Message Popup */}
      {gameState.toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white px-8 py-4 rounded-xl border-2 border-yellow-500 z-[120] text-center shadow-2xl max-w-lg animate-in slide-in-from-top-10">
          {gameState.toastMessage.split('\n').map((line, i) => <p key={i} className="mb-1 font-bold text-lg">{line}</p>)}
          <button onClick={() => setGameState({ ...gameState, toastMessage: null })} className="mt-4 bg-yellow-600 hover:bg-yellow-500 px-8 py-2 rounded font-bold text-black">Dismiss</button>
        </div>
      )}

      {/* Drawn Card Popup */}
      {gameState.drawnCard && (
        <div className="fixed inset-0 bg-black/80 z-[110] flex flex-col items-center justify-center p-4">
          <h2 className="text-4xl font-bold text-yellow-500 mb-8 drop-shadow-lg">VAULT DRAW!</h2>
          <img 
            src={`/${gameState.drawnCard.type === 'SURGE' ? 'Overcharge' : CARD_NAMES[gameState.drawnCard.type]}.svg`}
            alt={CARD_NAMES[gameState.drawnCard.type]}
            className="w-64 h-96 object-contain animate-in zoom-in spin-in-12 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]"
          />
          <button 
            onClick={() => setGameState({ ...gameState, drawnCard: null })} 
            className="mt-12 bg-yellow-600 hover:bg-yellow-500 px-12 py-4 rounded-xl font-black text-black text-2xl shadow-2xl transition-transform hover:scale-110"
          >
            Awesome!
          </button>
        </div>
      )}

      {/* Dice Roll Popup (Right Side) */}
      {gameState.diceRolls && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 bg-neutral-900 border-l-4 border-y-4 border-yellow-500 p-6 rounded-l-2xl z-[80] flex flex-col items-center w-72 shadow-2xl animate-in slide-in-from-right-10">
          <h2 className="text-2xl font-black text-yellow-500 mb-6">COMBAT ROLL</h2>
          <div className="flex justify-between w-full mb-8 font-bold">
            <div className="text-blue-400 flex flex-col items-center text-center w-1/3">
              <span className="text-sm text-neutral-400 uppercase">Atk</span>
              <span className="text-lg">{gameState.diceRolls.atkType}</span>
              <span className={`text-5xl mt-3 ${rollingDice ? 'animate-pulse text-yellow-400' : ''} drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]`}>
                {displayAtk !== null ? displayAtk : '?'}
              </span>
              <span className="text-sm text-neutral-500 mt-2">Max: {gameState.diceRolls.maxAtk}</span>
            </div>
            <div className="flex flex-col justify-center font-black text-yellow-600 text-3xl pb-8 w-1/3 text-center">VS</div>
            <div className="text-red-500 flex flex-col items-center text-center w-1/3">
              <span className="text-sm text-neutral-400 uppercase">Def</span>
              <span className="text-lg">{gameState.diceRolls.defType}</span>
              <span className={`text-5xl mt-3 ${rollingDice ? 'animate-pulse text-yellow-400' : ''} drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]`}>
                {displayDef !== null ? displayDef : '?'}
              </span>
              <span className="text-sm text-neutral-500 mt-2">Max: {gameState.diceRolls.maxDef}</span>
            </div>
          </div>
          
          {displayAtk !== null && !rollingDice ? (
            <>
              <div className="text-center font-black text-2xl mb-6 bg-neutral-800 w-full py-2 rounded text-neutral-200 shadow-inner">
                <span className={gameState.diceRolls.winner === 'white' ? 'text-blue-400' : 'text-red-500'}>
                  {gameState.diceRolls.winner.toUpperCase()}
                </span> WINS!
              </div>
              <button onClick={handleResolveCombat} className="bg-yellow-600 hover:bg-yellow-500 w-full py-3 rounded text-black font-black text-lg shadow-lg">
                Resolve
              </button>
            </>
          ) : (
            <button 
              onClick={handleRollDice} 
              disabled={rollingDice}
              className={`w-full py-3 rounded text-black font-black text-lg shadow-lg ${rollingDice ? 'bg-neutral-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 animate-pulse'}`}
            >
              {rollingDice ? 'Rolling...' : 'ROLL DICE!'}
            </button>
          )}
        </div>
      )}

      <h1 className="text-4xl font-bold mb-4 tracking-wider">BREAKTHROUGH</h1>
      
      {/* Rules Button (Left Side) */}
      <button 
        onClick={() => setShowRules(true)} 
        className="fixed left-4 top-4 bg-neutral-800 hover:bg-neutral-700 text-yellow-500 font-bold px-4 py-2 rounded-xl border border-neutral-600 shadow-lg z-50"
      >
        RULES
      </button>

      {/* Hide/Show Mines Toggle */}
      <button 
        onClick={() => setShowMines(!showMines)} 
        className="fixed left-4 top-16 bg-neutral-800 hover:bg-neutral-700 text-red-500 font-bold px-4 py-2 rounded-xl border border-neutral-600 shadow-lg z-50 flex items-center gap-2"
      >
        {showMines ? '👁️ HIDE MINES' : '👁️‍🗨️ REVEAL MINES'}
      </button>

      {/* Leave a Review Button */}
      <a 
        href="https://docs.google.com/forms/d/e/1FAIpQLSeS6dBKg2OGtszmjT0w-wOkoq8MiSSR8fcueb5YbzGAkU1dcA/viewform"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed left-4 top-28 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl border border-blue-500 shadow-lg z-50 flex items-center gap-2"
      >
        ⭐ LEAVE A REVIEW
      </a>

      {/* Leave Game Button */}
      <button 
        onClick={() => {
          if (window.confirm('Are you sure you want to end the current game and return to the main menu?')) {
            setAppState('MENU');
            setGameState(null); // Reset game entirely
          }
        }}
        className="fixed right-4 top-4 bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl border border-red-500 shadow-lg z-50"
      >
        LEAVE GAME
      </button>

      {/* Rules Modal in Game */}
      {showRules && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8">
          {RulesContent}
        </div>
      )}

      {/* Current Turn Indicator */}
      <div className="mb-4 text-xl">
        Current Turn: <span className={`font-bold ${gameState.currentTurn === 'white' ? 'text-blue-400' : 'text-red-500'}`}>
          {gameState.currentTurn.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-8 max-w-full overflow-x-auto px-4 pb-8">
        
        {/* Left Side: Hands */}
        <div className="flex flex-col justify-between h-[400px] md:h-[528px] z-50 shrink-0">
          {/* Black Player Deck (Top) */}
          <div className="flex flex-col items-center">
            <strong className="text-red-500 mb-2 text-lg drop-shadow">
              Black Player Hand
              {gameState.players.black.activeSurge && <span className="ml-2 px-2 py-1 bg-yellow-500 text-black rounded text-xs animate-pulse">SURGE ACTIVE</span>}
            </strong>
            {renderHand('black')}
          </div>
          
          {/* White Player Deck (Bottom) */}
          <div className="flex flex-col items-center">
            <strong className="text-blue-400 mb-2 text-lg drop-shadow">
              White Player Hand
              {gameState.players.white.activeSurge && <span className="ml-2 px-2 py-1 bg-yellow-500 text-black rounded text-xs animate-pulse">SURGE ACTIVE</span>}
            </strong>
            {renderHand('white')}
          </div>
        </div>

        {/* Center: Board Container */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Row coordinates */}
          <div className="flex flex-col justify-around text-neutral-500 font-bold text-lg select-none h-[400px] md:h-[528px]">
             {[8,7,6,5,4,3,2,1].map(n => <div key={n} className="flex items-center justify-center h-full">{n}</div>)}
          </div>
          
          <div>
          <div className="grid grid-cols-8 grid-rows-8 gap-1 bg-neutral-800 p-2 rounded-lg shadow-2xl border border-neutral-700 relative overflow-hidden">
            
            {/* Cinematic Mine Explosion Overlay */}
            {gameState.pendingExplosion && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="flex flex-col items-center">
                  <div className="text-8xl mb-8 animate-bounce">💣</div>
                  <h2 className="text-6xl font-black text-red-500 mb-8 drop-shadow-[0_0_20px_rgba(220,38,38,1)] animate-pulse uppercase text-center">
                    MINE TRIGGERED!
                  </h2>
                  <img 
                    src={`/${gameState.pendingExplosion.piece.color === 'white' ? 'White' : 'Black'}_${PIECE_NAMES[gameState.pendingExplosion.piece.type]}.svg`}
                    alt={gameState.pendingExplosion.piece.type}
                    className="w-32 h-32 animate-[spin_0.5s_ease-in-out_infinite] brightness-200 sepia hue-rotate-[320deg] saturate-[50]"
                  />
                  <button 
                    onClick={() => setGameState(executeExplosion(gameState))}
                    className="mt-12 bg-red-600 hover:bg-red-500 text-white font-black text-2xl px-12 py-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform hover:scale-110"
                  >
                    RESOLVE DESTRUCTION
                  </button>
                </div>
              </div>
            )}

            {/* Combat Modal Overlay */}
            {gameState.pendingCombat && (
              <div className="absolute inset-0 bg-neutral-900/90 z-[60] flex flex-col items-center justify-center p-4 rounded-lg">
                <h2 className="text-2xl font-bold text-red-500 mb-2">DEFEND YOUR PIECE!</h2>
                <p className="text-center mb-6 text-neutral-300">
                  You are being attacked! You can defend alone, or call an adjacent ally for support.<br/>
                  <span className="text-red-400 font-bold">WARNING: If you support and lose, BOTH pieces die.</span>
                </p>
                <div className="flex flex-col gap-3 w-full max-w-sm">
                  <button 
                    onClick={() => setGameState(resolveCombat(gameState, gameState.pendingCombat!.attackerPos, gameState.pendingCombat!.defenderPos, null))}
                    className="bg-neutral-700 hover:bg-neutral-600 p-3 rounded font-bold border border-neutral-500"
                  >
                    Defend Alone
                  </button>
                  {gameState.pendingCombat.validSupporters.map((supporter, idx) => {
                    const supPiece = gameState.board[supporter.y][supporter.x].piece!;
                    return (
                      <button 
                        key={idx}
                        onClick={() => setGameState(resolveCombat(gameState, gameState.pendingCombat!.attackerPos, gameState.pendingCombat!.defenderPos, supporter))}
                        className="bg-red-900 hover:bg-red-800 p-3 rounded font-bold border border-red-500"
                      >
                        Support with {PIECE_NAMES[supPiece.type].full} at ({['A','B','C','D','E','F','G','H'][supporter.x]}{8 - supporter.y})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Graveyard Revive Modal */}
            {gameState.pendingRevive && !gameState.pendingRevive.selectedPieceId && (
              <div className="absolute inset-0 bg-neutral-900/95 z-[70] flex flex-col items-center justify-center p-4 rounded-lg">
                <h2 className="text-4xl font-bold text-green-500 mb-2">GRAVEYARD</h2>
                <p className="text-center mb-8 text-neutral-300 text-lg">
                  UNDYING activated! Choose a fallen piece to resurrect:
                </p>
                <div className="flex gap-6 overflow-x-auto p-4 max-w-full">
                  {gameState.players[gameState.pendingRevive.color].graveyard.map((piece) => (
                    <div 
                      key={piece.id}
                      onClick={() => setGameState({ ...gameState, pendingRevive: { ...gameState.pendingRevive!, selectedPieceId: piece.id } })}
                      className="flex flex-col items-center gap-2 cursor-pointer hover:-translate-y-2 transition-transform bg-neutral-800 p-4 rounded-xl border border-neutral-600 hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    >
                      <img 
                        src={`/${piece.color.charAt(0).toUpperCase() + piece.color.slice(1)}_${PIECE_NAMES[piece.type].full}.svg`}
                        alt={piece.type}
                        className="w-16 h-16 drop-shadow-lg"
                      />
                      <span className="font-bold text-neutral-300">{PIECE_NAMES[piece.type].full}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gameState.board.map((row, y) => (
              row.map((tile, x) => {
                const isDark = (row.length * y + x + y) % 2 === 1;
                const isSelected = gameState.selectedPos?.x === x && gameState.selectedPos?.y === y;
                const isValidMove = gameState.validMoves.some(m => m.x === x && m.y === y);
                
                const isDisplaceSource = gameState.pendingDisplaceSource?.x === x && gameState.pendingDisplaceSource?.y === y;
                
                const isReviveTarget = gameState.pendingRevive?.selectedPieceId && 
                       (gameState.pendingRevive.color === 'black' ? (y === 0 || y === 1) : (y === 6 || y === 7)) &&
                       !tile.piece && !tile.isVault && !tile.hasMine;

                return (
                  <div 
                    key={`${x}-${y}`}
                    onClick={() => handleTileClick(x, y)}
                    className={`relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-sm 
                      ${isDark ? 'bg-[#5C3A21]' : 'bg-[#D2B48C]'}
                      ${isSelected ? 'ring-4 ring-yellow-400 z-10 scale-105' : ''}
                      ${isDisplaceSource ? 'ring-4 ring-purple-500 z-10 animate-pulse' : ''}
                      ${isReviveTarget ? 'ring-4 ring-green-500 z-10 animate-pulse cursor-pointer' : ''}
                      hover:brightness-110 transition-all duration-200 ${tile.piece || isReviveTarget ? 'cursor-pointer' : ''}`}
                  >
                    {/* Valid Move Highlight */}
                    {isValidMove && (
                      <div className="absolute inset-0 bg-green-500/30 border-2 border-green-400 rounded-sm pointer-events-none z-10" />
                    )}

                    {/* Revive Target Highlight */}
                    {isReviveTarget && (
                      <div className="absolute inset-0 bg-green-500/30 border-2 border-green-400 rounded-sm pointer-events-none z-10" />
                    )}

                    {/* Vault Indicator */}
                    {tile.isVault && !tile.piece && (
                      <div className="absolute w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                    )}

                    {/* Mine Indicator (Toggled by user) */}
                    {tile.hasMine && !tile.piece && showMines && (
                      <div className="absolute w-4 h-4 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse" />
                    )}

                    {/* Piece Rendering - Removed circular background container */}
                    {tile.piece && (
                      <div className={`relative w-10 h-10 md:w-14 md:h-14 flex items-center justify-center z-20 
                        ${isValidMove ? 'opacity-90' : ''}`}
                      >
                        <img 
                          src={`/${tile.piece.color.charAt(0).toUpperCase() + tile.piece.color.slice(1)}_${PIECE_NAMES[tile.piece.type].full}.svg`}
                          alt={PIECE_NAMES[tile.piece.type].full}
                          className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                        />

                        {/* Buff Overlays */}
                        {(tile.piece.defusalTurns || 0) > 0 && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black shadow" title="Defusal Kit Equipped"></div>
                        )}
                        {(tile.piece.invincibleTurns || 0) > 0 && (
                          <div className="absolute inset-0 ring-4 ring-yellow-300 rounded-full animate-pulse pointer-events-none" title="Invincible (Touch-Me-Not)"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>
          
          {/* Col coordinates */}
          <div className="grid grid-cols-8 gap-1 mt-3 px-2 text-neutral-500 font-bold text-lg select-none text-center">
             {['A','B','C','D','E','F','G','H'].map(l => <div key={l} className="w-12 md:w-16">{l}</div>)}
          </div>
        </div>

        {/* Right side info (Deck) */}
        <div className="flex flex-col items-center justify-center h-[400px] md:h-[528px]">
           <div className="text-neutral-400 font-bold bg-neutral-800 px-4 py-8 rounded-xl border border-neutral-700 shadow-xl vertical-text rotate-180" style={{ writingMode: 'vertical-rl' }}>
              DECK: {gameState.deck.length} CARDS
           </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;
