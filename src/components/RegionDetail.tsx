import React from 'react';
import { RegionID, WorldMap, GameStats, FactionID, StrategicResource } from '../types';
import { Icon } from './icons';

const formatNumber = (num: number): string => new Intl.NumberFormat('en-US').format(num);

const ForceStat: React.FC<{ icon: 'infantry' | 'armor' | 'navy' | 'airforce'; value: number | undefined }> = ({ icon, value }) => (
    <div className="flex items-center gap-2 text-sm">
        <Icon name={icon} className="w-4 h-4 text-gray-400" />
        <span className="font-mono text-white w-20 text-right">{value !== undefined ? formatNumber(value) : '---'}</span>
    </div>
);

const FACTION_NAMES: Record<FactionID, string> = {
    player: 'Quốc gia của bạn',
    player_alliance: 'Liên minh của bạn',
    eastern_alliance: 'Liên minh Phương Đông',
    western_alliance: 'Liên minh Phương Tây',
    neutral: 'Trung lập'
};

const REGION_NAMES: Record<RegionID, string> = {
    north_america: "Bắc Mỹ",
    south_america: "Nam Mỹ",
    western_europe: "Tây Âu",
    eastern_europe: "Đông Âu",
    north_africa: "Bắc Phi",
    middle_east: "Trung Đông",
    sub_saharan_africa: "Hạ Sahara",
    central_asia: "Trung Á",
    south_asia: "Nam Á",
    east_asia: "Đông Á",
    southeast_asia: "Đông Nam Á",
    oceania: "Châu Đại Dương"
};

const RESOURCE_ICONS: Record<StrategicResource, 'oil' | 'minerals' | 'gas'> = {
    oil: 'oil',
    minerals: 'minerals',
    gas: 'gas'
};

interface RegionDetailProps {
    selectedRegion: RegionID;
    mapData: WorldMap;
    playerStats: GameStats;
    onClose: () => void;
}

export const RegionDetail: React.FC<RegionDetailProps> = ({ selectedRegion, mapData, playerStats, onClose }) => {
    const regionState = mapData[selectedRegion];
    if (!regionState) return null;

    const regionName = REGION_NAMES[selectedRegion];
    const controllingFaction = regionState.controlledBy;
    
    const playerForces = regionState.hasPlayerMilitary ? playerStats.military : null;
    const defenderForces = regionState.militaryPresence || {};

    const hasDefenderForces = Object.values(defenderForces).some(val => typeof val === 'number' && val > 0);

    return (
        <div className="bg-black/40 p-4 rounded-lg border border-gray-700 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-3">
                <h3 className="text-lg font-bold text-gray-300 flex items-center gap-2">
                    <Icon name="territory" className="w-5 h-5" />
                    {regionName}
                </h3>
                <button 
                    onClick={onClose} 
                    className="text-gray-500 hover:text-white"
                    aria-label="Đóng chi tiết khu vực"
                >
                    <Icon name="close" className="w-5 h-5"/>
                </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-2">Kiểm soát bởi: <span className="font-semibold text-white">{FACTION_NAMES[controllingFaction]}</span></p>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                 <div className="flex items-center gap-2" title={`Cấp độ công sự: ${regionState.fortificationLevel}/5`}>
                    <Icon name="fortification" className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-white">Công sự: {regionState.fortificationLevel} / 5</span>
                </div>
                {regionState.strategicResource && (
                    <div className="flex items-center gap-2" title={`Tài nguyên chiến lược: ${regionState.strategicResource}`}>
                        <Icon name={RESOURCE_ICONS[regionState.strategicResource]} className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-white capitalize">{regionState.strategicResource}</span>
                    </div>
                )}
            </div>

             {regionState.isContested && (
                <p className="text-sm font-bold text-red-400 animate-pulse mb-3 text-center bg-red-900/50 py-1 rounded">VÙNG TRANH CHẤP</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-bold text-blue-400 mb-2 border-b border-blue-400/30 pb-1">Lực lượng của bạn</h4>
                    {playerForces ? (
                         <div className="space-y-1 mt-2">
                            <ForceStat icon="infantry" value={playerForces.infantry} />
                            <ForceStat icon="armor" value={playerForces.armor} />
                            <ForceStat icon="navy" value={playerForces.navy} />
                            <ForceStat icon="airforce" value={playerForces.airforce} />
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-sm mt-2">Chưa triển khai tại đây</p>
                    )}
                </div>

                <div>
                    <h4 className="font-bold text-red-400 mb-2 border-b border-red-400/30 pb-1">Lực lượng phòng thủ</h4>
                    {hasDefenderForces ? (
                        <div className="space-y-1 mt-2">
                            <ForceStat icon="infantry" value={defenderForces.infantry} />
                            <ForceStat icon="armor" value={defenderForces.armor} />
                            <ForceStat icon="navy" value={defenderForces.navy} />
                            <ForceStat icon="airforce" value={defenderForces.airforce} />
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-sm mt-2">Không có hoặc không xác định</p>
                    )}
                </div>
            </div>
        </div>
    );
};