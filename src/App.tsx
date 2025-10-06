
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNextTurn, generateNationalEmblem } from './services/geminiService';
import { GameStats, MilitaryStats, TurnResponse, WorldMap, RegionID, ArmyCorps } from './types';
import { Icon } from './components/icons';
import { WorldMap as WorldMapComponent } from './components/WorldMap';
import { NationalEmblem } from './components/NationalEmblem';
import { soundService, SoundName } from './services/soundService';
import { RegionDetail } from './components/RegionDetail';
import { ArmyCorpsManager } from './components/ArmyCorpsManager';

const REGIONS: RegionID[] = ['north_america', 'south_america', 'western_europe', 'eastern_europe', 'middle_east', 'north_africa', 'sub_saharan_africa', 'central_asia', 'east_asia', 'south_asia', 'southeast_asia', 'oceania'];

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;

const createInitialMap = (): WorldMap => {
    const map: Partial<WorldMap> = {};
    REGIONS.forEach(region => {
        map[region] = { controlledBy: 'neutral', militaryPresence: {}, fortificationLevel: 1, isContested: false, strategicResource: null };
    });
    map['north_america'] = { controlledBy: 'player', militaryPresence: {}, fortificationLevel: 2, isContested: false, strategicResource: 'minerals' };
    map['western_europe'] = { controlledBy: 'western_alliance', militaryPresence: {}, fortificationLevel: 2, isContested: false, strategicResource: 'gas' };
    map['east_asia'] = { controlledBy: 'eastern_alliance', militaryPresence: {}, fortificationLevel: 2, isContested: false, strategicResource: 'minerals' };
    map['eastern_europe'] = { controlledBy: 'eastern_alliance', militaryPresence: {}, fortificationLevel: 1, isContested: false, strategicResource: null };
    map['middle_east'] = { controlledBy: 'neutral', militaryPresence: {}, fortificationLevel: 1, isContested: true, strategicResource: 'oil' };
    return map as WorldMap;
};

const INITIAL_STATS: GameStats = { 
    armyCorps: [
        { id: 'corps-1', name: 'Quân đoàn 1', location: 'north_america', composition: { infantry: 500000, armor: 5000, navy: 500, airforce: 1000 } }
    ],
    economy: 2000,
    manpower: 10000000,
    morale: 70, 
    diplomacy: 60,
    economicGrowth: 0.5,
    worldMap: createInitialMap(), 
    policies: [], 
    nationName: '', 
    emblemImageUrl: null 
};
const MAX_MORALE_DIPLOMACY = 100;
const SAVE_GAME_KEY = 'ww3-savegame-v4'; // New key for army corps structure

type GameState = 'menu' | 'naming' | 'playing' | 'gameOver';

const useTypingEffect = (text: string = '', speed: number = 25): string => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        if (!text) {
            setDisplayedText('');
            return;
        }
        let i = 0;
        setDisplayedText('');
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                if (i % 3 === 0) soundService.playSound('text_typing');
                i++;
            } else {
                clearInterval(intervalId);
            }
        }, speed);
        return () => clearInterval(intervalId);
    }, [text, speed]);

    return displayedText;
};

const formatNumber = (num: number): string => new Intl.NumberFormat('en-US').format(num);

const StatDisplay: React.FC<{ icon: 'economy' | 'manpower' | 'growth'; label: string; value: string | number; unit?: string }> = ({ icon, label, value, unit }) => (
    <div className="flex items-center justify-between text-white bg-gray-900/50 p-2 rounded-md">
        <div className="flex items-center gap-2">
            <Icon name={icon} className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-gray-300">{label}</span>
        </div>
        <span className="font-mono font-bold text-lg">{value} <span className="text-sm text-gray-500">{unit}</span></span>
    </div>
);

const MilitaryStat: React.FC<{ icon: 'infantry' | 'armor' | 'navy' | 'airforce'; value: number }> = ({ icon, value }) => (
    <div className="flex flex-col items-center justify-center bg-gray-900/50 p-2 rounded-md text-center">
        <Icon name={icon} className="w-7 h-7 text-gray-400 mb-1" />
        <span className="font-mono font-bold text-base text-white">{formatNumber(value)}</span>
    </div>
);

const MoraleDiplomacyBar: React.FC<{ value: number; icon: 'morale' | 'diplomacy'; label: string }> = ({ value, icon, label }) => {
    const percentage = (value / MAX_MORALE_DIPLOMACY) * 100;
    const barColor = value > 60 ? 'bg-green-500' : value > 30 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-3 w-full" aria-label={`${label}: ${value}`}>
            <Icon name={icon} className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="w-full bg-gray-700 rounded-full h-4" title={`${label}: ${value}`}>
                <div className={`${barColor} h-4 rounded-full transition-all duration-500 ease-in-out`} style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="text-lg font-bold text-white w-12 text-right">{value}</span>
        </div>
    );
};

interface SavedGameData {
    stats: GameStats;
    turnData: TurnResponse;
    eventLog: string[];
}

const App: React.FC = () => {
    const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
    const [turnData, setTurnData] = useState<TurnResponse | null>(null);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [gameState, setGameState] = useState<GameState>('menu');
    const [gameOverMessage, setGameOverMessage] = useState('');
    const [playerInput, setPlayerInput] = useState('');
    const [tempNationName, setTempNationName] = useState('');
    const [hasSaveGame, setHasSaveGame] = useState(false);
    const [isMusicOn, setIsMusicOn] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<RegionID | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any | null>(null);
    const audioInitialized = useRef(false);
    const animatedScenario = useTypingEffect(isLoading ? '' : turnData?.scenario);

    useEffect(() => {
        const savedGame = localStorage.getItem(SAVE_GAME_KEY);
        setHasSaveGame(!!savedGame);

        if (hasSpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'vi-VN';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                setPlayerInput(event.results[0][0].transcript);
                setIsListening(false);
            };
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }

        return () => recognitionRef.current?.abort();
    }, []);

    const toggleListening = () => {
        if (isLoading || !hasSpeechRecognition) return;
        initializeAudio();
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
        setIsListening(!isListening);
    };

    const initializeAudio = useCallback(() => {
        if (!audioInitialized.current) {
            soundService.init();
            audioInitialized.current = true;
        }
    }, []);

    const playSoundWithInit = useCallback((sound: SoundName) => {
        initializeAudio();
        soundService.playSound(sound);
    }, [initializeAudio]);

    const toggleMusic = () => {
        initializeAudio();
        if (soundService.isMusicPlaying()) {
            soundService.stopMusic();
            setIsMusicOn(false);
        } else {
            soundService.playMusic();
            setIsMusicOn(true);
        }
    };

    const saveGame = (currentStats: GameStats, currentTurnData: TurnResponse | null, currentEventLog: string[]) => {
        if (!currentTurnData) return;
        const gameData: SavedGameData = { stats: currentStats, turnData: currentTurnData, eventLog: currentEventLog };
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameData));
        setHasSaveGame(true);
    };
    
    const clearSaveGame = () => {
        localStorage.removeItem(SAVE_GAME_KEY);
        setHasSaveGame(false);
    };

    const loadGame = () => {
        playSoundWithInit('ui_click');
        const savedGameString = localStorage.getItem(SAVE_GAME_KEY);
        if (savedGameString) {
            try {
                const savedGame: SavedGameData = JSON.parse(savedGameString);
                if (savedGame.stats.armyCorps) { // Check for new structure
                    setStats(savedGame.stats);
                    setTurnData(savedGame.turnData);
                    setEventLog(savedGame.eventLog);
                    setGameState('playing');
                } else {
                    clearSaveGame();
                    setGameState('naming');
                }
            } catch {
                clearSaveGame();
                alert("Lỗi dữ liệu lưu, bắt đầu chiến dịch mới.");
                setGameState('menu');
            }
        }
    };

    const handleNationCreation = useCallback(async () => {
        if (!tempNationName.trim() || isLoading) return;
        playSoundWithInit('start_game');
        clearSaveGame();
        setIsLoading(true);
        setGameState('playing');
        setEventLog([]);
        setPlayerInput('');
        setSelectedRegion(null);
    
        let currentStats: GameStats = { ...INITIAL_STATS, nationName: tempNationName, emblemImageUrl: null };
        setStats(currentStats);
        
        const [emblemUrl, initialTurn] = await Promise.all([
            generateNationalEmblem(tempNationName),
            getNextTurn(currentStats, null)
        ]);

        const newWorldMap = { ...currentStats.worldMap };
        initialTurn.statChanges.mapChanges.forEach(change => {
            if (newWorldMap[change.region]) {
                if (change.militaryPresence) newWorldMap[change.region].militaryPresence = change.militaryPresence;
                if (change.newController) newWorldMap[change.region].controlledBy = change.newController;
                if (typeof change.fortificationLevel === 'number') newWorldMap[change.region].fortificationLevel = change.fortificationLevel;
                if (typeof change.isContested === 'boolean') newWorldMap[change.region].isContested = change.isContested;
            }
        });
    
        currentStats = { 
            ...currentStats, 
            worldMap: newWorldMap,
            emblemImageUrl: emblemUrl, 
            policies: [initialTurn.policySummary] 
        };
        
        if (initialTurn.allianceName) {
            currentStats.allianceName = initialTurn.allianceName;
        }

        setStats(currentStats);
        setTurnData(initialTurn);
        const newLog = [initialTurn.outcome];
        setEventLog(newLog);
    
        saveGame(currentStats, initialTurn, newLog);
        setIsLoading(false);
        playSoundWithInit('receive_response');
    }, [tempNationName, isLoading, playSoundWithInit]);

    const resetGame = () => {
        playSoundWithInit('ui_click');
        clearSaveGame();
        setStats(INITIAL_STATS);
        setGameState('menu');
        setTurnData(null);
        setEventLog([]);
        setTempNationName('');
        setSelectedRegion(null);
    }

    const handleAction = useCallback(async () => {
        if (isLoading || gameState !== 'playing' || !playerInput.trim()) return;

        playSoundWithInit('send_command');
        setIsLoading(true);
        const actionToSubmit = playerInput;
        const newEventLog = [`> ${actionToSubmit}`, ...eventLog];
        setEventLog(newEventLog);
        setSelectedRegion(null);

        const nextTurnData = await getNextTurn(stats, actionToSubmit);
        
        playSoundWithInit('receive_response');
        setPlayerInput('');

        const changes = nextTurnData.statChanges;
        const incomeFromGrowth = Math.floor(stats.economy * (stats.economicGrowth / 100));

        const newArmyCorps = [...stats.armyCorps];
        changes.armyCorpsChanges.forEach(change => {
            const index = newArmyCorps.findIndex(c => c.id === change.corps.id);
            if (change.action === 'CREATE' && index === -1) {
                newArmyCorps.push(change.corps as ArmyCorps);
            } else if (change.action === 'UPDATE' && index !== -1) {
                newArmyCorps[index] = { ...newArmyCorps[index], ...change.corps };
            } else if (change.action === 'DELETE' && index !== -1) {
                newArmyCorps.splice(index, 1);
            }
        });

        const newWorldMap = JSON.parse(JSON.stringify(stats.worldMap)); // Deep copy
        changes.mapChanges.forEach(change => {
            if (newWorldMap[change.region]) {
                if (change.newController) newWorldMap[change.region].controlledBy = change.newController;
                if (change.militaryPresence) newWorldMap[change.region].militaryPresence = { ...newWorldMap[change.region].militaryPresence, ...change.militaryPresence };
                if (typeof change.fortificationLevel === 'number') newWorldMap[change.region].fortificationLevel = change.fortificationLevel;
                if (typeof change.isContested === 'boolean') newWorldMap[change.region].isContested = change.isContested;
            }
        });

        const newStats: GameStats = {
            ...stats,
            armyCorps: newArmyCorps,
            economy: Math.max(0, stats.economy + incomeFromGrowth + changes.economy),
            manpower: Math.max(0, stats.manpower + changes.manpower),
            morale: Math.max(0, Math.min(MAX_MORALE_DIPLOMACY, stats.morale + changes.morale)),
            diplomacy: Math.max(0, Math.min(MAX_MORALE_DIPLOMACY, stats.diplomacy + changes.diplomacy)),
            economicGrowth: stats.economicGrowth + changes.economicGrowth,
            worldMap: newWorldMap,
            policies: [nextTurnData.policySummary, ...stats.policies],
            allianceName: nextTurnData.allianceName || stats.allianceName,
        };
        
        const totalMilitaryChange = calculateTotalMilitary(newStats.armyCorps).infantry - calculateTotalMilitary(stats.armyCorps).infantry; // Simplification for sound effect
        const totalChangeValue = totalMilitaryChange + incomeFromGrowth + changes.economy + changes.manpower + changes.morale + changes.diplomacy;
        if (totalChangeValue > 0) setTimeout(() => playSoundWithInit('stat_increase'), 200);
        else if (totalChangeValue < 0) setTimeout(() => playSoundWithInit('stat_decrease'), 200);

        setStats(newStats);
        setTurnData(nextTurnData);
        const finalEventLog = [nextTurnData.outcome, ...newEventLog];
        setEventLog(finalEventLog);
        setIsLoading(false);

        const playerTerritories = Object.values(newStats.worldMap).filter(r => r.controlledBy === 'player' || r.controlledBy === 'player_alliance').length;
        if (playerTerritories === 0) {
            setGameState('gameOver');
            setGameOverMessage("Bạn đã mất quyền kiểm soát tất cả các vùng lãnh thổ. Quốc gia của bạn đã bị xóa sổ khỏi bản đồ thế giới.");
            clearSaveGame();
            playSoundWithInit('game_over');
        } else {
            saveGame(newStats, nextTurnData, finalEventLog);
        }
    }, [isLoading, stats, playerInput, eventLog, gameState, playSoundWithInit]);

    const calculateTotalMilitary = (corps: ArmyCorps[]): MilitaryStats => {
        return corps.reduce((total, currentCorps) => {
            total.infantry += currentCorps.composition.infantry || 0;
            total.armor += currentCorps.composition.armor || 0;
            total.navy += currentCorps.composition.navy || 0;
            total.airforce += currentCorps.composition.airforce || 0;
            return total;
        }, { infantry: 0, armor: 0, navy: 0, airforce: 0 });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAction();
    };
    
    const renderContent = () => {
        const totalMilitary = calculateTotalMilitary(stats.armyCorps);
        switch (gameState) {
            case 'menu': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-yellow-400 text-transparent bg-clip-text mb-4 animate-fade-in">WW3: Xung đột toàn cầu</h1>
                    <p className="text-gray-400 mb-8 max-w-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>Bạn là nhà lãnh đạo tối cao. Mỗi quyết định đều có thể dẫn đến chiến thắng hoặc thất bại.</p>
                    <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        {hasSaveGame && (
                            <button onClick={loadGame} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                                <Icon name="load" className="w-6 h-6"/> Tiếp tục chiến dịch
                            </button>
                        )}
                        <button onClick={() => { playSoundWithInit('ui_click'); setGameState('naming'); }} className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                            <Icon name="play" className="w-6 h-6"/> {hasSaveGame ? 'Chiến dịch mới' : 'Bắt đầu chiến dịch'}
                        </button>
                    </div>
                </div>
            );
            
            case 'naming': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-3xl font-bold text-gray-200 mb-4 animate-slide-in-up">Đặt tên cho quốc gia của bạn</h2>
                    <p className="text-gray-400 mb-8 max-w-md animate-slide-in-up" style={{ animationDelay: '0.3s' }}>Tên quốc gia sẽ định hình vận mệnh và biểu tượng của dân tộc bạn.</p>
                    <form onSubmit={(e) => { e.preventDefault(); handleNationCreation(); }} className="w-full max-w-sm flex flex-col gap-4 animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
                        <input type="text" value={tempNationName} onChange={(e) => setTempNationName(e.target.value)} placeholder="Ví dụ: Cộng hòa Astoria" className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-xl" autoFocus />
                        <button type="submit" disabled={!tempNationName.trim()} className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Icon name="play" className="w-6 h-6"/> Bắt đầu
                        </button>
                    </form>
                 </div>
            );

            case 'gameOver': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-3xl font-bold text-red-500 mb-4 animate-fade-in">TRÒ CHƠI KẾT THÚC</h2>
                    <p className="text-gray-300 mb-8 max-w-md animate-fade-in" style={{ animationDelay: '0.3s' }}>{gameOverMessage}</p>
                    <button onClick={resetGame} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        <Icon name="refresh" className="w-5 h-5"/> Chơi lại
                    </button>
                </div>
            );
            
            case 'playing':
                const isTyping = animatedScenario.length < (turnData?.scenario || '').length;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="bg-black/30 p-4 rounded-lg border border-gray-700 flex flex-col gap-4">
                                <NationalEmblem nationName={stats.nationName} imageUrl={stats.emblemImageUrl} isLoading={isLoading && !stats.emblemImageUrl} />
                                <h2 className="text-xl font-bold text-center text-gray-300 border-b border-gray-600 pb-2 -mt-2">TRẠNG THÁI QUỐC GIA</h2>
                                <div className="space-y-3">
                                    <StatDisplay icon="economy" label="Kinh tế" value={formatNumber(stats.economy)} unit="Tỷ USD" />
                                    <StatDisplay icon="manpower" label="Nhân lực" value={formatNumber(stats.manpower)} />
                                    <StatDisplay icon="growth" label="Tăng trưởng KT" value={stats.economicGrowth.toFixed(2)} unit="%" />
                                    <div className="pt-2">
                                        <h3 className="text-sm font-bold text-gray-400 mb-2 text-center">TỔNG LỰC LƯỢNG VŨ TRANG</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <MilitaryStat icon="infantry" value={totalMilitary.infantry} />
                                            <MilitaryStat icon="armor" value={totalMilitary.armor} />
                                            <MilitaryStat icon="navy" value={totalMilitary.navy} />
                                            <MilitaryStat icon="airforce" value={totalMilitary.airforce} />
                                        </div>
                                    </div>
                                    <MoraleDiplomacyBar value={stats.morale} icon="morale" label="Tinh thần" />
                                    <MoraleDiplomacyBar value={stats.diplomacy} icon="diplomacy" label="Ngoại giao" />
                                </div>
                                <WorldMapComponent 
                                    mapData={stats.worldMap} 
                                    armyCorps={stats.armyCorps}
                                    onRegionSelect={setSelectedRegion} 
                                    selectedRegion={selectedRegion}
                                />
                            </div>
                            {selectedRegion && !isLoading && (
                                <RegionDetail 
                                    selectedRegion={selectedRegion} 
                                    mapData={stats.worldMap} 
                                    playerArmyCorps={stats.armyCorps}
                                    onClose={() => setSelectedRegion(null)} 
                                />
                            )}
                            <ArmyCorpsManager armyCorps={stats.armyCorps} />
                        </div>

                        <div className="lg:col-span-3 bg-black/30 p-4 rounded-lg border border-gray-700 flex flex-col">
                            <h2 className="text-xl font-bold text-center text-gray-300 border-b border-gray-600 pb-2 mb-2">TRUNG TÂM CHỈ HUY</h2>
                            <div className="font-mono bg-black/50 p-3 rounded h-80 overflow-y-auto text-sm text-gray-300 mb-4 flex flex-col-reverse border border-gray-700">
                                <div>
                                    {eventLog.map((event, index) => (
                                        <p key={index} className={event.startsWith('>') ? 'text-cyan-400' : event.startsWith('Lỗi') ? 'text-yellow-400' : 'text-gray-300'}>{event}</p>
                                    ))}
                                </div>
                            </div>
                            
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center flex-grow text-gray-400">
                                    <svg className="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Đang xử lý diễn biến...
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col">
                                    <div className="bg-black/30 p-3 rounded-lg border border-yellow-700/50 mb-4 animate-slide-in-up">
                                        <h3 className="font-bold text-yellow-400 text-sm mb-1 flex items-center gap-2"><Icon name="warning" className="w-4 h-4" />BÁO CÁO THIỆT HẠI</h3>
                                        <p className="text-gray-300 text-sm">{turnData?.damageReport}</p>
                                    </div>
                                    <div className="bg-black/30 p-3 rounded-lg border border-gray-700 mb-4 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                                        <h3 className="font-bold text-gray-400 text-sm mb-1">TÌNH BÁO TOÀN CẦU</h3>
                                        <p className="text-gray-300 text-sm">{turnData?.worldStatus}</p>
                                    </div>
                                    <p className="text-green-300 mb-4 text-lg flex-grow min-h-[4.5rem] animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                                        {animatedScenario}
                                        {isTyping && <span className="typing-cursor">_</span>}
                                    </p>
                                    <form onSubmit={handleFormSubmit} className="mt-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                        <label htmlFor="player-action" className="sr-only">Hành động của bạn</label>
                                        <div className="flex items-center gap-2 bg-black/50 border rounded-lg p-2 form-input-glow relative">
                                            <span className="font-mono text-cyan-400 pl-2">{'>'}</span>
                                            {isListening && <span className="text-sm text-red-400 animate-pulse absolute left-10 -top-6">Đang nghe...</span>}
                                            <input id="player-action" type="text" value={playerInput} onChange={(e) => setPlayerInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAction(); } }} placeholder="Nhập mệnh lệnh của bạn ở đây..." className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 pr-10" disabled={isLoading} autoFocus />
                                            {hasSpeechRecognition && (
                                                <button type="button" onClick={toggleListening} disabled={isLoading} className={`p-2 rounded-md transition-colors disabled:opacity-50 ${isListening ? 'text-red-500' : 'text-gray-400 hover:text-white'}`} aria-label="Bắt đầu ghi âm mệnh lệnh">
                                                    <Icon name="microphone" className="w-5 h-5"/>
                                                </button>
                                            )}
                                            <button type="submit" disabled={isLoading || !playerInput.trim()} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Gửi mệnh lệnh">
                                                <Icon name="send" className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 selection:bg-green-500 selection:text-black relative overflow-hidden scanline-overlay">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-black z-0 opacity-80"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-10 z-0"></div>
            <main className="w-full max-w-6xl bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 z-10 border border-gray-700 glow-border">
                {renderContent()}
            </main>
            <button
                onClick={toggleMusic}
                className="absolute top-4 right-4 z-20 p-2 bg-black/30 rounded-full text-gray-400 hover:text-white hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label={isMusicOn ? "Tắt nhạc" : "Bật nhạc"}
                title={isMusicOn ? "Tắt nhạc" : "Bật nhạc"}
            >
                {isMusicOn ? <Icon name="music_on" className="w-6 h-6" /> : <Icon name="music_off" className="w-6 h-6" />}
            </button>
            <footer className="absolute bottom-4 text-center text-gray-600 text-xs z-10">
                <p>Một trải nghiệm chiến lược được cung cấp bởi Google Gemini API.</p>
            </footer>
        </div>
    );
};

export default App;
