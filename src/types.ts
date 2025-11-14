
// Factions controlling territories
export type FactionID = 
    | 'player_1' 
    | 'player_2' 
    | 'player_3' 
    | 'player_4' 
    | 'eastern_alliance' 
    | 'western_alliance' 
    | 'neutral';

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

// Fix: Add StrategicResource type for RegionDetail component
export type StrategicResource = 'oil' | 'minerals' | 'gas';

// Fix: Add ArmyCorps interface for RegionDetail and ArmyCorpsManager components
export interface ArmyCorps {
    id: string;
    name: string;
    location: RegionID;
    composition: Partial<MilitaryStats>;
}

// Fix: Add ChatMessage interface for ConferenceModal component
export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface RegionState {
    controlledBy: FactionID;
    militaryPresence: FactionID | null; // Which player's military is here
    // Fix: Add missing properties for RegionDetail component
    fortificationLevel: number;
    strategicResource?: StrategicResource;
    isContested: boolean;
    militaryPresenceForces?: Partial<MilitaryStats>;
}

export type WorldMap = Record<RegionID, RegionState>;

export interface MapChange {
    region: RegionID;
    newController?: FactionID;
    militaryPresence?: FactionID | null; // null to remove military
}

export interface MilitaryStats {
    infantry: number;
    armor: number;
    navy: number;
    airforce: number;
}

export interface PlayerStats {
    playerNumber: 1 | 2 | 3 | 4;
    nationName: string;
    emblemImageUrl: string | null;
    military: MilitaryStats;
    economy: number; // In billions USD
    manpower: number; // Total available personnel
    morale: number; // 0-100 scale
    diplomacy: number; // 0-100 scale
    economicGrowth: number; // Percentage
    policies: string[];
    isEliminated: boolean;
    // Fix: Add armyCorps for ArmyCorpsManager component
    armyCorps: ArmyCorps[];
}

export interface GameStats {
    players: PlayerStats[];
    worldMap: WorldMap;
    currentPlayerIndex: number;
    turnNumber: number;
}

export interface StatChanges {
    military: Partial<MilitaryStats>;
    economy: number;
    manpower: number;
    morale: number;
    diplomacy: number;
    economicGrowth: number;
    mapChanges: MapChange[];
}

export interface TurnResponse {
    scenario: string;
    outcome: string;
    statChanges: StatChanges;
    policySummary: string;
    worldStatus: string;
    damageReport: string;
}