import React from 'react';
import { WorldMap as WorldMapData, RegionID, FactionID } from '../types';

const FACTION_COLORS: Record<FactionID, string> = {
    player: 'fill-blue-500/80 stroke-blue-300',
    player_alliance: 'fill-purple-500/80 stroke-purple-300',
    eastern_alliance: 'fill-red-500/80 stroke-red-300',
    western_alliance: 'fill-green-500/80 stroke-green-300',
    neutral: 'fill-gray-600/70 stroke-gray-400',
};

const FACTION_NAMES: Record<FactionID, string> = {
    player: 'Quốc gia của bạn',
    player_alliance: 'Liên minh của bạn',
    eastern_alliance: 'Liên minh Phương Đông',
    western_alliance: 'Liên minh Phương Tây',
    neutral: 'Trung lập'
};

const REGION_DATA: Record<RegionID, { path: string, center: [number, number], name: string }> = {
    north_america: { path: "M 48,93 L 48,50 L 115,10 L 175,30 L 180,95 L 125,125 Z", center: [115, 75], name: "Bắc Mỹ" },
    south_america: { path: "M 125,125 L 180,95 L 200,120 L 170,180 L 140,160 Z", center: [160, 140], name: "Nam Mỹ" },
    western_europe: { path: "M 255,50 L 290,50 L 295,90 L 260,95 Z", center: [275, 70], name: "Tây Âu" },
    eastern_europe: { path: "M 290,50 L 340,45 L 345,95 L 295,90 Z", center: [318, 70], name: "Đông Âu" },
    north_africa: { path: "M 240,105 L 345,95 L 330,130 L 250,135 Z", center: [290, 115], name: "Bắc Phi" },
    middle_east: { path: "M 340,80 L 390,85 L 380,125 L 345,110 Z", center: [365, 100], name: "Trung Đông" },
    sub_saharan_africa: { path: "M 250,135 L 330,130 L 320,180 L 270,185 Z", center: [290, 155], name: "Hạ Sahara" },
    central_asia: { path: "M 340,45 L 450,55 L 440,90 L 345,95 Z", center: [395, 70], name: "Trung Á" },
    south_asia: { path: "M 390,85 L 450,90 L 460,130 L 420,135 Z", center: [430, 110], name: "Nam Á" },
    east_asia: { path: "M 450,55 L 530,50 L 520,110 L 450,90 Z", center: [485, 75], name: "Đông Á" },
    southeast_asia: { path: "M 450,110 L 520,110 L 510,160 L 460,140 Z", center: [485, 130], name: "Đông Nam Á" },
    oceania: { path: "M 490,165 L 540,160 L 550,190 L 510,195 Z", center: [520, 180], name: "Châu Đại Dương" }
};

const LegendItem: React.FC<{ colorClass: string, name: string }> = ({ colorClass, name }) => (
    <div className="flex items-center gap-1.5">
        <div className={`w-3 h-3 rounded-sm ${colorClass.split(' ')[0]}`}></div>
        <span className="text-xs text-gray-400">{name}</span>
    </div>
);

interface WorldMapProps {
    mapData: WorldMapData;
    onRegionSelect: (regionId: RegionID) => void;
    selectedRegion: RegionID | null;
}

export const WorldMap: React.FC<WorldMapProps> = ({ mapData, onRegionSelect, selectedRegion }) => {
    const playerMilitaryRegion = Object.keys(mapData).find(key => mapData[key as RegionID].hasPlayerMilitary) as RegionID | undefined;

    return (
        <div className="mt-4 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-400 mb-2">BẢN ĐỒ CHIẾN LƯỢC TOÀN CẦU</h3>
            <div className="bg-gray-900/50 p-2 rounded-md w-full">
                <svg viewBox="0 0 560 210" className="w-full h-auto">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {Object.keys(REGION_DATA).map(key => {
                        const regionId = key as RegionID;
                        const region = REGION_DATA[regionId];
                        const faction = mapData[regionId]?.controlledBy || 'neutral';
                        const isSelected = selectedRegion === regionId;
                        return (
                            <g key={regionId} className="group cursor-pointer" onClick={() => onRegionSelect(regionId)}>
                                <path
                                    d={region.path}
                                    className={`${FACTION_COLORS[faction]} transition-all duration-300 group-hover:stroke-white ${isSelected ? 'stroke-yellow-300' : ''}`}
                                    strokeWidth={isSelected ? 2.5 : 1.5}
                                />
                                <title>{`${region.name} - Kiểm soát bởi: ${FACTION_NAMES[faction]}`}</title>
                            </g>
                        );
                    })}
                    {playerMilitaryRegion && (
                        <g transform={`translate(${REGION_DATA[playerMilitaryRegion].center[0]}, ${REGION_DATA[playerMilitaryRegion].center[1]})`} className="pointer-events-none">
                             <path d="M0 -8 L2 -2 H8 L4 2 L6 8 L0 4 L-6 8 L-4 2 L-8 -2 H-2 Z" 
                                className="fill-yellow-300 stroke-black" 
                                strokeWidth="0.5"
                                style={{ filter: 'url(#glow)' }}
                            />
                             <title>Sự hiện diện quân sự của bạn</title>
                        </g>
                    )}
                </svg>
            </div>
            <div className="w-full mt-2 px-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">CHÚ GIẢI BẢN ĐỒ</h4>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                    <LegendItem colorClass={FACTION_COLORS.player} name={FACTION_NAMES.player} />
                    <LegendItem colorClass={FACTION_COLORS.player_alliance} name={FACTION_NAMES.player_alliance} />
                    <LegendItem colorClass={FACTION_COLORS.western_alliance} name={FACTION_NAMES.western_alliance} />
                    <LegendItem colorClass={FACTION_COLORS.eastern_alliance} name={FACTION_NAMES.eastern_alliance} />
                    <LegendItem colorClass={FACTION_COLORS.neutral} name={FACTION_NAMES.neutral} />
                </div>
            </div>
        </div>
    );
};