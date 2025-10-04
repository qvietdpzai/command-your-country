// Factions controlling territories
export type FactionID = 'player' | 'eastern_alliance' | 'western_alliance' | 'neutral';

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

export interface RegionState {
    controlledBy: FactionID;
    hasPlayerMilitary: boolean;
}

export type WorldMap = Record<RegionID, RegionState>;

export interface MapChange {
    region: RegionID;
    newController?: FactionID;
    playerMilitary?: boolean; // true to place/move, false to remove, undefined to not change
}

export interface MilitaryStats {
    infantry: number;
    armor: number;
    navy: number;
    airforce: number;
}

export interface GameStats {
    military: MilitaryStats;
    economy: number; // In billions USD
    manpower: number; // Total available personnel
    morale: number; // 0-100 scale
    diplomacy: number; // 0-100 scale
    economicGrowth: number; // Percentage
    worldMap: WorldMap; // Replaces territoryControl
    policies: string[];
    nationName: string;
    emblemImageUrl: string | null;
}

export interface StatChanges {
    military: Partial<MilitaryStats>;
    economy: number;
    manpower: number;
    morale: number;
    diplomacy: number;
    economicGrowth: number;
    mapChanges: MapChange[]; // Replaces territoryControlChange
}

export interface TurnResponse {
    scenario: string;
    outcome: string;
    statChanges: StatChanges;
    policySummary: string;
    worldStatus: string;
    damageReport: string;
}