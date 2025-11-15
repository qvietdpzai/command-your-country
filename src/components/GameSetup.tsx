import React, { useState, useMemo } from 'react';
import { WorldMap as WorldMapComponent } from './WorldMap';
import { WorldMap, RegionID, SetupData } from '../types';
import { PREDEFINED_FLAGS } from '../data/flags';
import { PREDEFINED_NATIONS, PredefinedNation } from '../data/nations';
import { Icon } from './icons';

interface GameSetupProps {
    onSetupComplete: (setupData: SetupData) => void;
    onBackToMenu: () => void;
    isLoading: boolean;
}

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


const createBaseMap = (): WorldMap => {
    const REGIONS: RegionID[] = ['north_america', 'south_america', 'western_europe', 'eastern_europe', 'middle_east', 'north_africa', 'sub_saharan_africa', 'central_asia', 'east_asia', 'south_asia', 'southeast_asia', 'oceania'];
    const map: Partial<WorldMap> = {};
    REGIONS.forEach(region => {
        map[region] = { controlledBy: 'neutral', fortificationLevel: 1, isContested: false };
    });
    map['western_europe']!.controlledBy = 'western_alliance';
    map['east_asia']!.controlledBy = 'eastern_alliance';
    map['eastern_europe']!.controlledBy = 'eastern_alliance';
    return map as WorldMap;
};

export const GameSetup: React.FC<GameSetupProps> = ({ onSetupComplete, onBackToMenu, isLoading }) => {
    const [setupStep, setSetupStep] = useState<'choice' | 'predefined' | 'custom'>('choice');

    // State for custom creation
    const [nationName, setNationName] = useState('');
    const [nationalContext, setNationalContext] = useState('');
    const [selectedFlag, setSelectedFlag] = useState<string>('');
    const [selectedTerritory, setSelectedTerritory] = useState<RegionID | null>(null);

    // State for predefined selection
    const [selectedNation, setSelectedNation] = useState<PredefinedNation | null>(null);

    const baseMap = useMemo(() => createBaseMap(), []);
    const selectableRegions = useMemo(() => 
        Object.entries(baseMap)
            .filter(([, state]) => state.controlledBy === 'neutral')
            .map(([regionId]) => regionId as RegionID), 
        [baseMap]
    );

    const isCustomComplete = nationName.trim() && nationalContext.trim() && selectedFlag && selectedTerritory;

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
    
    const handleCustomSubmit = () => {
        if (isCustomComplete) {
            onSetupComplete({
                nationName,
                nationalContext,
                emblemImageUrl: selectedFlag,
                startingTerritory: selectedTerritory!,
            });
        }
    };

    const handlePredefinedSubmit = () => {
        if (selectedNation) {
            onSetupComplete({
                nationName: selectedNation.name,
                nationalContext: selectedNation.nationalContext,
                emblemImageUrl: selectedNation.emblemImageUrl,
                startingTerritory: selectedNation.startingTerritory,
            });
        }
    };

    const renderChoiceStep = () => (
        <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
            <h1 className="text-3xl font-bold text-white mb-4">Thiết lập Chiến dịch</h1>
            <p className="text-gray-400 mb-8 max-w-md">Bạn sẽ lãnh đạo một quốc gia có sẵn với lịch sử và vị trí địa lý riêng, hay sẽ tự tay xây dựng một đế chế mới từ đầu?</p>
            <div className="flex flex-col sm:flex-row gap-6">
                <button onClick={() => setSetupStep('predefined')} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                    <Icon name="load" className="w-6 h-6"/> Chọn Quốc gia có sẵn
                </button>
                <button onClick={() => setSetupStep('custom')} className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                    <Icon name="policy" className="w-6 h-6"/> Tạo Quốc gia Tùy chỉnh
                </button>
            </div>
             <button onClick={onBackToMenu} className="mt-8 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                Quay lại Menu
            </button>
        </div>
    );

    const renderPredefinedStep = () => (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-center text-white mb-6">Chọn Quốc gia</h1>
            <div className="max-h-[50vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-gray-700">
                {PREDEFINED_NATIONS.map(nation => (
                    <button 
                        key={nation.name} 
                        onClick={() => setSelectedNation(nation)}
                        className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${selectedNation?.name === nation.name ? 'bg-blue-900/50 border-blue-400' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'}`}
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <img src={nation.emblemImageUrl} alt={nation.name} className="w-16 h-16 rounded-full border-2 border-gray-500 object-cover bg-gray-800 flex-shrink-0"/>
                            <div>
                                <h3 className="text-xl font-bold text-white">{nation.name}</h3>
                                <p className="text-sm text-yellow-400">Lãnh thổ: {REGION_NAMES[nation.startingTerritory]}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">{nation.nationalContext}</p>
                    </button>
                ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between items-center">
                <button onClick={() => setSetupStep('choice')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                    Quay lại
                </button>
                <button onClick={handlePredefinedSubmit} disabled={!selectedNation || isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg text-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Đang tạo...' : 'Xác nhận & Bắt đầu'}
                </button>
            </div>
        </div>
    );
    
    const renderCustomStep = () => (
        <div className="animate-fade-in text-gray-300">
            <h1 className="text-3xl font-bold text-center text-white mb-6">Tạo Quốc gia Tùy chỉnh</h1>
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
                <button onClick={() => setSetupStep('choice')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                    Quay lại
                </button>
                 {selectedFlag && <div className="flex items-center gap-4">
                    <span className="font-semibold">Quốc huy đã chọn:</span>
                    <img src={selectedFlag} alt="Selected Emblem" className="w-16 h-16 rounded-full border-2 border-gray-500 object-cover bg-gray-800"/>
                </div>}
                <button onClick={handleCustomSubmit} disabled={!isCustomComplete || isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Đang tạo...' : 'Bắt đầu'}
                </button>
            </div>
        </div>
    );
    
    switch(setupStep) {
        case 'choice': return renderChoiceStep();
        case 'predefined': return renderPredefinedStep();
        case 'custom': return renderCustomStep();
        default: return renderChoiceStep();
    }
};
