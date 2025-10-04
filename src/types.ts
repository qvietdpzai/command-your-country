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
    territoryControl: number; // 0-100 percentage
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
    territoryControlChange: number;
}

export interface TurnResponse {
    scenario: string;
    outcome: string;
    statChanges: StatChanges;
    policySummary: string;
    worldStatus: string;
    damageReport: string;
}
