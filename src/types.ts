
// Factions controlling territories
export type FactionID = 'player' | 'player_alliance' | 'eastern_alliance' | 'western_alliance' | 'neutral';

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
    composition: MilitaryStats;
}

export interface RegionState {
    controlledBy: FactionID;
    militaryPresence?: Partial<MilitaryStats>; // Troops stationed in the region
    fortificationLevel: number; // e.g., 1-5
    strategicResource?: StrategicResource | null;
    isContested: boolean;
}

export type WorldMap = Record<RegionID, RegionState>;

export interface MapChange {
    region: RegionID;
    newController?: FactionID;
    militaryPresence?: Partial<MilitaryStats>; // New troop numbers in the region after events
    fortificationLevel?: number;
    isContested?: boolean;
}

export interface ArmyCorpsChange {
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    corps: Partial<ArmyCorps> & { id: string }; // For DELETE, only id is needed. For UPDATE, id and changed fields. For CREATE, full object.
}

export interface GameStats {
    armyCorps: ArmyCorps[];
    economy: number; // In billions USD
    manpower: number; // Total available personnel
    morale: number; // 0-100 scale
    diplomacy: number; // 0-100 scale
    economicGrowth: number; // Percentage
    worldMap: WorldMap; 
    policies: string[];
    nationName: string;
    emblemImageUrl: string | null;
    allianceName?: string;
}

export interface StatChanges {
    armyCorpsChanges: ArmyCorpsChange[];
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
    allianceName?: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}
