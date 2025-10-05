import React from 'react';
import { WorldMap as WorldMapData, RegionID, FactionID, MilitaryStats, StrategicResource } from '../types';
import { Icon } from './icons';

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

const RESOURCE_ICONS: Record<StrategicResource, 'oil' | 'minerals' | 'gas'> = {
    oil: 'oil',
    minerals: 'minerals',
    gas: 'gas'
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
    playerMilitaryStats: MilitaryStats;
}

const formatTotalStrength = (military: Partial<MilitaryStats> | undefined): string => {
    if (!military) return '';
    const total = (military.infantry || 0) + (military.armor || 0) + (military.navy || 0) + (military.airforce || 0);
    if (total <= 0) return '';
    if (total < 1000) return total.toString();
    return `${Math.floor(total / 1000)}k`;
};

export const WorldMap: React.FC<WorldMapProps> = ({ mapData, onRegionSelect, selectedRegion, playerMilitaryStats }) => {
    const playerMilitaryRegion = Object.keys(mapData).find(key => mapData[key as RegionID].hasPlayerMilitary) as RegionID | undefined;

    return (
        <div className="mt-4 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-400 mb-2">BẢN ĐỒ CHIẾN LƯỢC TOÀN CẦU</h3>
            <div className="bg-gray-900/50 p-2 rounded-md w-full">
                <svg viewBox="0 0 560 210" className="w-full h-auto" style={{ fontSize: '10px' }}>
                    <defs>
                        <pattern id="land-texture" patternUnits="userSpaceOnUse" width="4" height="4">
                           <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" strokeWidth="0.5" stroke="rgba(0,0,0,0.2)" />
                        </pattern>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <rect x="0" y="0" width="560" height="210" fill="#1a202c" />

                    {/* Region Paths and Icons */}
                    {Object.keys(REGION_DATA).map(key => {
                        const regionId = key as RegionID;
                        const region = REGION_DATA[regionId];
                        const regionState = mapData[regionId];
                        if (!regionState) return null;

                        const faction = regionState.controlledBy;
                        const isSelected = selectedRegion === regionId;
                        
                        const title = `${region.name} - ${FACTION_NAMES[faction]}\nCông sự: ${regionState.fortificationLevel}/5${regionState.strategicResource ? `\nTài nguyên: ${regionState.strategicResource}` : ''}${regionState.isContested ? '\nTình trạng: Đang tranh chấp' : ''}`;

                        return (
                            <g key={regionId} className="group cursor-pointer" onClick={() => onRegionSelect(regionId)}>
                                <path
                                    d={region.path}
                                    className={`${FACTION_COLORS[faction]} transition-all duration-300 group-hover:stroke-white ${isSelected ? 'stroke-yellow-300' : ''}`}
                                    strokeWidth={isSelected ? 2.5 : 1.5}
                                />
                                <path d={region.path} fill="url(#land-texture)" className="pointer-events-none" opacity="0.5" />

                                {regionState.isContested && <path d={region.path} className="fill-none contested-zone pointer-events-none" />}
                                <title>{title}</title>
                                
                                {/* Icons inside region */}
                                <g transform={`translate(${region.center[0]}, ${region.center[1]})`} className="pointer-events-none">
                                    {regionState.fortificationLevel > 1 && (
                                        // FIX: Replaced `title` attribute with a `<title>` element for SVG tooltip.
                                        <g transform="translate(-20, 8)">
                                            <title>{`Cấp độ công sự: ${regionState.fortificationLevel}`}</title>
                                            <Icon name="fortification" className="w-4 h-4 text-gray-200" stroke="black" strokeWidth={1}/>
                                            <text x="5" y="4" textAnchor="middle" className="fill-white font-bold" stroke='black' strokeWidth="0.2" style={{ fontSize: '10px' }}>{regionState.fortificationLevel}</text>
                                        </g>
                                    )}
                                    {regionState.strategicResource && (
                                        // FIX: Replaced `title` attribute with a `<title>` element for SVG tooltip.
                                        <g transform="translate(12, 8)">
                                            <title>{`Tài nguyên: ${regionState.strategicResource}`}</title>
                                            <Icon name={RESOURCE_ICONS[regionState.strategicResource]} className="w-4 h-4 text-yellow-300" stroke="black" strokeWidth={1} />
                                        </g>
                                    )}
                                </g>
                            </g>
                        );
                    })}

                    {/* NPC Military Presence */}
                    {Object.keys(mapData).map(key => {
                        const regionId = key as RegionID;
                        const regionState = mapData[regionId];
                        const regionDisplayData = REGION_DATA[regionId];
                        const isPlayerControlled = regionState.controlledBy === 'player' || regionState.controlledBy === 'player_alliance';
                        
                        if (!isPlayerControlled && regionState.militaryPresence) {
                            const totalStrength = formatTotalStrength(regionState.militaryPresence);
                            if (totalStrength) {
                                return (
                                    <text
                                        key={`${regionId}-strength`}
                                        x={regionDisplayData.center[0]}
                                        y={regionDisplayData.center[1] + 4}
                                        textAnchor="middle"
                                        className="fill-white font-bold pointer-events-none"
                                        stroke="black"
                                        strokeWidth="0.4"
                                    >
                                        {totalStrength}
                                    </text>
                                );
                            }
                        }
                        return null;
                    })}
                    
                    {/* Player Military Presence (Star + Count) */}
                    {playerMilitaryRegion && (
                        <g transform={`translate(${REGION_DATA[playerMilitaryRegion].center[0]}, ${REGION_DATA[playerMilitaryRegion].center[1]})`} className="pointer-events-none">
                            <g transform="translate(-8, 0)">
                                <path 
                                    d="M0 -8 L2 -2 H8 L4 2 L6 8 L0 4 L-6 8 L-4 2 L-8 -2 H-2 Z"
                                    className="fill-yellow-300 stroke-black" 
                                    strokeWidth="0.5"
                                    style={{ filter: 'url(#glow)' }}
                                />
                            </g>
                            <text
                                x="4"
                                y="4"
                                textAnchor="start"
                                className="fill-yellow-300 font-bold"
                                stroke="black"
                                strokeWidth="0.4"
                            >
                                {formatTotalStrength(playerMilitaryStats)}
                            </text>
                            <title>Sự hiện diện quân sự của bạn: {formatTotalStrength(playerMilitaryStats).replace('k', ',000')}</title>
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