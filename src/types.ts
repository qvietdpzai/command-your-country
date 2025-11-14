// Factions controlling territories
export type FactionID = 
    | 'player' // Used in single-player
    | 'eastern_alliance' 
    | 'western_alliance' 
    | 'neutral'
    | string; // Allows for player IDs like 'player1', 'player2' in multiplayer

// Definable regions on the world map
export type RegionID = 
    | 'north_america' 
    | 'south_america' 
    | 'western_europe' 
    | 'eastern_europe' 
    | 'middle_east' 
    | 'north_africa' 
    | 'sub_saharan_africa' 
    | 'central_asia' 
    | 'east_asia' 
    | 'south_asia' 
    | 'southeast_asia' 
    | 'oceania';

export type StrategicResource = 'oil' | 'minerals' | 'gas';

export interface MilitaryStats {
    infantry: number;
    armor: number;
    navy: number;
    airforce: number;
}

export interface ArmyCorps {
    id: string;
    name: string;
    location: RegionID;
    composition: Partial<MilitaryStats>;
}

export interface RegionState {
    controlledBy: FactionID;
    fortificationLevel: number;
    strategicResource?: StrategicResource;
    isContested: boolean;
    // Military presence is now tracked per-player in multiplayer
    hasPlayerMilitary?: boolean; // Kept for single-player
    militaryPresence?: FactionID[]; // For multiplayer
}

export type WorldMap = Record<RegionID, RegionState>;

export interface MapChange {
    region: RegionID;
    newController?: FactionID;
    // Single-player specific
    playerMilitary?: boolean; 
    // Multiplayer specific
    addMilitaryPresence?: FactionID;
    removeMilitaryPresence?: FactionID;
}

// --- SINGLE PLAYER ---
export interface SinglePlayerGameStats {
    nationName: string;
    emblemImageUrl: string | null;
    military: MilitaryStats;
    economy: number;
    manpower: number;
    morale: number;
    diplomacy: number;
    economicGrowth: number;
    worldMap: WorldMap;
    policies: string[];
    armyCorps: ArmyCorps[];
}

export interface SinglePlayerStatChanges {
    military: Partial<MilitaryStats>;
    economy: number;
    manpower: number;
    morale: number;
    diplomacy: number;
    economicGrowth: number;
    mapChanges: MapChange[];
}

export interface SinglePlayerTurnResponse {
    scenario: string;
    outcome: string;
    statChanges: SinglePlayerStatChanges;
    policySummary: string;
    worldStatus: string;
    damageReport: string;
}

// --- MULTIPLAYER ---
export interface Player {
    id: string; // e.g., 'player1'
    nationName: string;
    emblemImageUrl: string | null;
    isReady: boolean;
    military: MilitaryStats;
    economy: number;
    manpower: number;
    morale: number;
    diplomacy: number;
    economicGrowth: number;
    policies: string[];
    armyCorps: ArmyCorps[];
}

export interface MultiplayerGameStats {
    gameId: string;
    turn: number;
    players: Player[];
    worldMap: WorldMap;
    activePlayerId: string;
    isStarted: boolean;
    isGameOver: boolean;
    winnerId?: string;
    gameLog: string[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}
