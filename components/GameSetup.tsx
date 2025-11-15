import React, { useState, useMemo } from 'react';
import { WorldMap as WorldMapComponent } from './WorldMap';
import { WorldMap, RegionID } from '../types';
import { PREDEFINED_FLAGS } from '../data/flags';

interface SetupData {
    nationName: string;
    nationalContext: string;
    emblemImageUrl: string;
    startingTerritory: RegionID;
}

interface GameSetupProps {
    onSetupComplete: (setupData: SetupData) => void;
    onBackToMenu: () => void;
    isLoading: boolean;
}

const createBaseMap = (): WorldMap => {
    const REGIONS: RegionID[] = ['north_america', 'south_america', 'western_europe', 'eastern_europe', 'middle_east', 'north_africa', 'sub_saharan_africa', 'central_asia', 'east_asia', 'south_asia', 'southeast_asia', 'oceania'];
    const map: Partial<WorldMap> = {};
    REGIONS.forEach(region => {
        map[region] = { controlledBy: 'neutral', hasPlayerMilitary: false };
    });
    map['western_europe']!.controlledBy = 'western_alliance';
    map['east_asia']!.controlledBy = 'eastern_alliance';
    map['eastern_europe']!.controlledBy = 'eastern_alliance';
    return map as WorldMap;
};

export const GameSetup: React.FC<GameSetupProps> = ({ onSetupComplete, onBackToMenu, isLoading }) => {
    const [nationName, setNationName] = useState('');
    const [nationalContext, setNationalContext] = useState('');
    const [selectedFlag, setSelectedFlag] = useState<string>('');
    const [selectedTerritory, setSelectedTerritory] = useState<RegionID | null>(null);

    const baseMap = useMemo(() => createBaseMap(), []);
    const selectableRegions = useMemo(() => 
        Object.entries(baseMap)
            .filter(([, state]) => state.controlledBy === 'neutral')
            .map(([regionId]) => regionId as RegionID), 
        [baseMap]
    );

    const isComplete = nationName.trim() && nationalContext.trim() && selectedFlag && selectedTerritory;

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedFlag(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Vui lòng chọn một tệp hình ảnh hợp lệ.');
        }
    };
    
    const handleSubmit = () => {
        if (isComplete) {
            onSetupComplete({
                nationName,
                nationalContext,
                emblemImageUrl: selectedFlag,
                startingTerritory: selectedTerritory,
            });
        }
    };

    return (
        <div className="animate-fade-in text-gray-300">
            <h1 className="text-3xl font-bold text-center text-white mb-6">Thiết lập Chiến dịch</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Text Inputs & Flag Selection */}
                <div className="space-y-6">
                    <div>
                        <label htmlFor="nation-name" className="block text-lg font-semibold mb-2">1. Tên Quốc gia</label>
                        <input id="nation-name" type="text" value={nationName} onChange={(e) => setNationName(e.target.value)} placeholder="Ví dụ: Cộng hòa Astoria" className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg" />
                    </div>
                    <div>
                        <label htmlFor="national-context" className="block text-lg font-semibold mb-2">2. Bối cảnh Quốc gia</label>
                        <textarea id="national-context" value={nationalContext} onChange={(e) => setNationalContext(e.target.value)} placeholder="Mô tả ngắn gọn về lịch sử, hệ tư tưởng, hoặc thế mạnh của quốc gia bạn..." rows={4} className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-2">3. Chọn Quốc huy</h2>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-48 overflow-y-auto p-2 bg-black/20 rounded-lg border border-gray-700">
                            {PREDEFINED_FLAGS.map(flag => (
                                <button key={flag.name} onClick={() => setSelectedFlag(flag.url)} className={`w-full aspect-square rounded-full border-2 transition-all duration-200 ${selectedFlag === flag.url ? 'border-green-500 scale-110' : 'border-gray-600 hover:border-gray-400'}`}>
                                    <img src={flag.url} alt={flag.name} className="w-full h-full object-cover rounded-full" />
                                </button>
                            ))}
                        </div>
                        <label htmlFor="custom-flag-upload" className="w-full text-center mt-3 inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer">
                            ... hoặc Tải lên ảnh riêng
                        </label>
                        <input id="custom-flag-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </div>
                </div>

                {/* Right Column: Territory Selection */}
                <div>
                    <h2 className="text-lg font-semibold mb-2">4. Chọn Lãnh thổ Khởi đầu</h2>
                    <p className="text-sm text-gray-500 mb-3">Chọn một vùng lãnh thổ <span className="text-gray-400 font-bold">màu xám (Trung lập)</span> trên bản đồ.</p>
                    <WorldMapComponent 
                        mapData={baseMap} 
                        selectableRegions={selectableRegions}
                        selectedRegion={selectedTerritory}
                        onRegionClick={setSelectedTerritory}
                    />
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-8 pt-6 border-t border-gray-700 flex justify-between items-center">
                <button onClick={onBackToMenu} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                    Quay lại Menu
                </button>
                 {selectedFlag && <div className="flex items-center gap-4">
                    <span className="font-semibold">Quốc huy đã chọn:</span>
                    <img src={selectedFlag} alt="Selected Emblem" className="w-16 h-16 rounded-full border-2 border-gray-500 object-cover bg-gray-800"/>
                </div>}
                <button onClick={handleSubmit} disabled={!isComplete || isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Đang tạo...' : 'Bắt đầu'}
                </button>
            </div>
        </div>
    );
};
