
import React from 'react';
import { ArmyCorps, RegionID } from '../types';
import { Icon } from './icons';

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

const formatStrength = (corps: ArmyCorps): string => {
    const total = (corps.composition.infantry || 0) + 
                  (corps.composition.armor || 0) + 
                  (corps.composition.navy || 0) + 
                  (corps.composition.airforce || 0);
    if (total >= 1000) {
        return `${(total / 1000).toFixed(1)}k`;
    }
    return total.toString();
};

interface ArmyCorpsManagerProps {
    armyCorps: ArmyCorps[];
}

export const ArmyCorpsManager: React.FC<ArmyCorpsManagerProps> = ({ armyCorps }) => {
    return (
        <div className="bg-black/30 p-4 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-center text-gray-300 border-b border-gray-600 pb-2 mb-3 flex items-center justify-center gap-2">
                <Icon name="army_corps" /> QUÂN ĐOÀN
            </h2>
            <div className="space-y-2 text-sm text-gray-400 max-h-48 overflow-y-auto pr-2">
                {armyCorps.length > 0 ? (
                    armyCorps.map(corps => (
                        <div key={corps.id} className="bg-gray-900/50 p-2 rounded border-l-2 border-blue-500 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">{corps.name}</p>
                                <p className="text-xs text-gray-500">{REGION_NAMES[corps.location]}</p>
                            </div>
                            <div className="font-mono font-bold text-lg text-white">
                                {formatStrength(corps)}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 italic">Không có quân đoàn nào được triển khai.</p>
                )}
            </div>
        </div>
    );
};
