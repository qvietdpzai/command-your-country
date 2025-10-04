export interface GameStats {
    military: number;
    economy: number;
    morale: number;
    territoryControl: number;
    policies: string[];
    nationName: string;
    emblemImageUrl: string | null;
}

export interface StatChanges {
    military: number;
    economy: number;
    morale: number;
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