export type PlayerColor = 'white' | 'black';
export type PieceType = 'GENERAL' | 'MAGE' | 'SEPOY';

export interface Piece {
  id: string;
  type: PieceType;
  color: PlayerColor;
  defusalTurns?: number;
  invincibleTurns?: number;
}

export type CardType = 
  | 'DEFUSAL_KIT' 
  | 'SURGE' 
  | 'MINE' 
  | 'TOUCH_ME_NOT' 
  | 'DISPLACE' 
  | 'UNDYING' 
  | 'BLANK' 
  | 'SKILL_ISSUE';

export interface Card {
  id: string;
  type: CardType;
}

export interface BoardTile {
  x: number;
  y: number;
  piece: Piece | null;
  hasMine: boolean;
  isVault: boolean;
}

export interface PlayerState {
  color: PlayerColor;
  hand: Card[];
  graveyard: Piece[];
  extraLife: boolean;
  activeSurge?: boolean;
}

export interface CombatState {
  attackerPos: { x: number; y: number };
  defenderPos: { x: number; y: number };
  validSupporters: { x: number; y: number }[];
}

export interface GameState {
  board: BoardTile[][]; // 2D array [y][x]
  deck: Card[];
  players: Record<PlayerColor, PlayerState>;
  currentTurn: PlayerColor;
  winner: PlayerColor | null;
  selectedPos: { x: number; y: number } | null;
  validMoves: { x: number; y: number }[];
  pendingCombat: CombatState | null;
  activeCardId: string | null;
  pendingDisplaceSource?: { x: number; y: number } | null;
  pendingRevive: { color: PlayerColor, selectedPieceId?: string } | null;
  pendingExplosion: { x: number; y: number; piece: Piece } | null;
  toastMessage: string | null;
  drawnCard: Card | null;
  turnCount: number;
  diceRolls: { 
    atk: number; 
    def: number; 
    maxAtk: number; 
    maxDef: number; 
    atkType: string; 
    defType: string; 
    winner: PlayerColor;
  } | null;
}
