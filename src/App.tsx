
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNextTurn, generateNationalEmblem } from './services/geminiService';
import { GameStats, MilitaryStats, TurnResponse, WorldMap, RegionID, FactionID, PlayerStats } from './types';
import { Icon } from './components/icons';
import { WorldMap as WorldMapComponent } from './components/WorldMap';
import { NationalEmblem } from './components/NationalEmblem';
import { soundService, SoundName } from './services/soundService';

const REGIONS: RegionID[] = ['north_america', 'south_america', 'western_europe', 'eastern_europe', 'middle_east', 'north_africa', 'sub_saharan_africa', 'central_asia', 'east_asia', 'south_asia', 'southeast_asia', 'oceania'];

const createInitialMap = (playerFactions: FactionID[]): WorldMap => {
    const map: Partial<WorldMap> = {};
    // Fix: Initialize new RegionState properties
    REGIONS.forEach(region => {
        map[region] = { 
            controlledBy: 'neutral', 
            militaryPresence: null,
            fortificationLevel: 1,
            isContested: false,
        };
    });

    const startingRegions: RegionID[] = ['north_america', 'east_asia', 'western_europe', 'south_america'];
    playerFactions.forEach((factionId, index) => {
        const startRegion = startingRegions[index];
        // Fix: Initialize new RegionState properties for starting regions
        map[startRegion] = { 
            controlledBy: factionId, 
            militaryPresence: factionId,
            fortificationLevel: 2,
            isContested: false,
        };
    });

    // Fix: Initialize new RegionState properties
    map['eastern_europe'] = { 
        controlledBy: 'eastern_alliance', 
        militaryPresence: null,
        fortificationLevel: 1,
        isContested: false,
    };
    return map as WorldMap;
};

const INITIAL_PLAYER_STATS: Omit<PlayerStats, 'playerNumber' | 'nationName' | 'emblemImageUrl'> = {
    military: { infantry: 500000, armor: 5000, navy: 500, airforce: 1000 },
    economy: 2000,
    manpower: 10000000,
    morale: 70,
    diplomacy: 60,
    economicGrowth: 0.5,
    policies: [],
    isEliminated: false,
    // Fix: Initialize new PlayerStats property
    armyCorps: [],
};

const SAVE_GAME_KEY = 'ww3-savegame-v3-hotseat';

type GameState = 'menu' | 'player_setup' | 'naming' | 'playing' | 'turn_transition' | 'gameOver';

const useTypingEffect = (text: string = '', speed: number = 25): string => {
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
        soundService.init();
    }, []);
    useEffect(() => {
        if (!text) { setDisplayedText(''); return; }
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
    const percentage = (value / 100) * 100;
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
// Fix: Corrected component definition (though the error was caused by bad JSX later)
const App: React.FC = () => {
    const [stats, setStats] = useState<GameStats | null>(null);
    const [turnData, setTurnData] = useState<TurnResponse | null>(null);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [gameState, setGameState] = useState<GameState>('menu');
    const [gameOverMessage, setGameOverMessage] = useState('');
    const [playerInput, setPlayerInput] = useState('');
    const [playerNames, setPlayerNames] = useState<string[]>(['']);
    const [numPlayers, setNumPlayers] = useState(2);
    const [hasSaveGame, setHasSaveGame] = useState(false);
    const audioInitialized = useRef(false);
    
    const currentPlayerData = stats ? stats.players[stats.currentPlayerIndex] : null;
    const animatedScenario = useTypingEffect(isLoading ? '' : turnData?.scenario);

    useEffect(() => {
        const savedGame = localStorage.getItem(SAVE_GAME_KEY);
        setHasSaveGame(!!savedGame);
    }, []);

    const initializeAudio = () => {
        if (!audioInitialized.current) {
            soundService.init();
            audioInitialized.current = true;
        }
    };

    const playSoundWithInit = (sound: SoundName) => {
        initializeAudio();
        soundService.playSound(sound);
    };

    const saveGame = (currentStats: GameStats | null, currentTurnData: TurnResponse | null, currentEventLog: string[]) => {
        if (!currentTurnData || !currentStats) return;
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
                if (savedGame.stats.players && typeof savedGame.stats.currentPlayerIndex === 'number') {
                    setStats(savedGame.stats);
                    setTurnData(savedGame.turnData);
                    setEventLog(savedGame.eventLog);
                    setGameState('playing');
                } else {
                    clearSaveGame();
                    alert("Dữ liệu lưu không tương thích, bắt đầu chiến dịch mới.");
                    setGameState('menu');
                }
            } catch {
                clearSaveGame();
                alert("Lỗi dữ liệu lưu, bắt đầu chiến dịch mới.");
                setGameState('menu');
            }
        }
    };

    const handleGameSetup = useCallback(async () => {
        if (playerNames.some(name => !name.trim()) || isLoading) return;
        
        playSoundWithInit('start_game');
        clearSaveGame();
        setIsLoading(true);
        setGameState('playing');
        setEventLog([]);
        setPlayerInput('');

        const playerFactions = playerNames.map((_, index) => `player_${index + 1}` as FactionID);

        let initialPlayers: PlayerStats[] = playerNames.map((name, index) => ({
            ...INITIAL_PLAYER_STATS,
            playerNumber: (index + 1) as (1 | 2 | 3 | 4),
            nationName: name,
            emblemImageUrl: null
        }));

        let currentStats: GameStats = {
            players: initialPlayers,
            worldMap: createInitialMap(playerFactions),
            currentPlayerIndex: 0,
            turnNumber: 1,
        };
        setStats(currentStats);

        const emblemPromises = initialPlayers.map(p => generateNationalEmblem(p.nationName));
        const emblems = await Promise.all(emblemPromises);
        initialPlayers.forEach((p, i) => p.emblemImageUrl = emblems[i]);

        const initialTurn = await getNextTurn(currentStats, null, 0);

        initialPlayers[0].policies = [initialTurn.policySummary];

        currentStats = { ...currentStats, players: initialPlayers };

        setStats(currentStats);
        setTurnData(initialTurn);
        const newLog = [initialTurn.outcome];
        setEventLog(newLog);
    
        saveGame(currentStats, initialTurn, newLog);
        setIsLoading(false);
        playSoundWithInit('receive_response');
    }, [playerNames, isLoading]);

    const resetGame = () => {
        playSoundWithInit('ui_click');
        clearSaveGame();
        setStats(null);
        setGameState('menu');
        setTurnData(null);
        setEventLog([]);
        setPlayerNames(['']);
    }

    const handleAction = useCallback(async () => {
        if (isLoading || gameState !== 'playing' || !playerInput.trim() || !stats || !currentPlayerData) return;

        playSoundWithInit('send_command');
        setIsLoading(true);
        const actionToSubmit = playerInput;
        const newEventLog = [`> [${currentPlayerData.nationName}] ${actionToSubmit}`, ...eventLog];
        setEventLog(newEventLog);

        const nextTurnData = await getNextTurn(stats, actionToSubmit, stats.currentPlayerIndex);
        
        setPlayerInput('');

        const changes = nextTurnData.statChanges;
        const incomeFromGrowth = Math.floor(currentPlayerData.economy * (currentPlayerData.economicGrowth / 100));

        const updatedPlayers = [...stats.players];
        const playerToUpdate = { ...updatedPlayers[stats.currentPlayerIndex] };

        const newMilitary: MilitaryStats = { ...playerToUpdate.military };
        for (const key in changes.military) {
            const unit = key as keyof MilitaryStats;
            newMilitary[unit] = Math.max(0, (newMilitary[unit] || 0) + (changes.military[unit] || 0));
        }
        playerToUpdate.military = newMilitary;
        playerToUpdate.economy = Math.max(0, playerToUpdate.economy + incomeFromGrowth + changes.economy);
        playerToUpdate.manpower = Math.max(0, playerToUpdate.manpower + changes.manpower);
        playerToUpdate.morale = Math.max(0, Math.min(100, playerToUpdate.morale + changes.morale));
        playerToUpdate.diplomacy = Math.max(0, Math.min(100, playerToUpdate.diplomacy + changes.diplomacy));
        playerToUpdate.economicGrowth = playerToUpdate.economicGrowth + changes.economicGrowth;
        playerToUpdate.policies = [nextTurnData.policySummary, ...playerToUpdate.policies];

        updatedPlayers[stats.currentPlayerIndex] = playerToUpdate;
        
        const newWorldMap = { ...stats.worldMap };
        changes.mapChanges.forEach(change => {
            if (newWorldMap[change.region]) {
                if (change.newController) newWorldMap[change.region].controlledBy = change.newController;
                if (change.militaryPresence !== undefined) newWorldMap[change.region].militaryPresence = change.militaryPresence;
            }
        });
        
        let newStats: GameStats = { ...stats, players: updatedPlayers, worldMap: newWorldMap };
        const finalEventLog = [nextTurnData.outcome, ...newEventLog];

        // Check for eliminated players
        const activePlayers: PlayerStats[] = [];
        let winner: PlayerStats | null = null;
        newStats.players.forEach(p => {
            const hasTerritory = Object.values(newWorldMap).some(r => r.controlledBy === `player_${p.playerNumber}`);
            if (!hasTerritory) {
                p.isEliminated = true;
            }
            if (!p.isEliminated) {
                activePlayers.push(p);
            }
        });

        setStats(newStats);
        setTurnData(nextTurnData);
        setEventLog(finalEventLog);
        setIsLoading(false);
        playSoundWithInit('receive_response');

        // Fix: Corrected game over and save logic
        if (activePlayers.length === 1) {
            winner = activePlayers[0];
            setGameOverMessage(`Tất cả các quốc gia khác đã bị đánh bại! ${winner.nationName} là người chiến thắng tuyệt đối!`);
            setGameState('gameOver');
            clearSaveGame();
            playSoundWithInit('game_over');
        } else if (activePlayers.length === 0) {
            setGameOverMessage("Một kết cục nghiệt ngã, không còn quốc gia nào do người chơi kiểm soát. Thế giới chìm trong hỗn loạn.");
            setGameState('gameOver');
            clearSaveGame();
            playSoundWithInit('game_over');
        } else {
             setGameState('turn_transition');
             saveGame(newStats, nextTurnData, finalEventLog);
        }

    }, [isLoading, stats, playerInput, eventLog, gameState, currentPlayerData]);

    const handleNextTurn = () => {
        if (!stats) return;
        let nextIndex = (stats.currentPlayerIndex + 1) % stats.players.length;
        // Skip eliminated players
        while (stats.players[nextIndex].isEliminated) {
            nextIndex = (nextIndex + 1) % stats.players.length;
        }

        const newStats = { ...stats, currentPlayerIndex: nextIndex };
        if (nextIndex === 0) {
            newStats.turnNumber += 1;
        }
        setStats(newStats);
        setGameState('playing');
        playSoundWithInit('ui_click');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAction();
    };
    
    const renderContent = () => {
        if (!stats && (gameState === 'playing' || gameState === 'turn_transition' || gameState === 'gameOver')) {
            // Failsafe for invalid state
            return <div className="text-center">Lỗi trạng thái trò chơi. Đang tải lại...</div>;
        }
        
        switch (gameState) {
            case 'menu': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-yellow-400 text-transparent bg-clip-text mb-4 animate-fade-in">WW3: Xung đột toàn cầu</h1>
                    <p className="text-gray-400 mb-8 max-w-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>Bạn là nhà lãnh đạo tối cao. Mỗi quyết định đều có thể dẫn đến chiến thắng hoặc thất bại.</p>
                    <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        {hasSaveGame && <button onClick={loadGame} className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105"><Icon name="load"/> Tiếp tục chiến dịch</button>}
                        <button onClick={() => { playSoundWithInit('ui_click'); setGameState('player_setup'); }} className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105"><Icon name="play"/> {hasSaveGame ? 'Chiến dịch mới' : 'Bắt đầu chiến dịch'}</button>
                    </div>
                </div>
            );
            
            case 'player_setup': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-3xl font-bold text-gray-200 mb-4 animate-slide-in-up">Thiết lập Trận đấu</h2>
                    <label className="text-gray-400 mb-4">Số lượng người chơi:</label>
                    <select value={numPlayers} onChange={e => {
                        const count = parseInt(e.target.value);
                        setNumPlayers(count);
                        setPlayerNames(Array(count).fill(''));
                    }} className="bg-gray-900 border-2 border-gray-600 rounded-lg p-2 mb-8 text-white">
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                    </select>
                    <button onClick={() => { playSoundWithInit('ui_click'); setGameState('naming'); }} className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                        Tiếp tục
                    </button>
                </div>
            );

            case 'naming': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-3xl font-bold text-gray-200 mb-4">Đặt tên cho các Quốc gia</h2>
                    <form onSubmit={(e) => { e.preventDefault(); handleGameSetup(); }} className="w-full max-w-sm flex flex-col gap-4">
                        {playerNames.map((name, index) => (
                            <input key={index} type="text" value={name} onChange={(e) => {
                                const newNames = [...playerNames];
                                newNames[index] = e.target.value;
                                setPlayerNames(newNames);
                            }} placeholder={`Tên quốc gia của Người chơi ${index + 1}`} className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-xl" autoFocus={index === 0} />
                        ))}
                        <button type="submit" disabled={playerNames.some(name => !name.trim()) || isLoading} className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                             {isLoading ? 'Đang tạo thế giới...' : 'Bắt đầu'}
                        </button>
                    </form>
                 </div>
            );

            case 'turn_transition':
                const nextPlayerIndex = (stats!.currentPlayerIndex + 1) % stats!.players.length;
                const nextPlayer = stats!.players.find((_, i) => i === nextPlayerIndex && !stats!.players[i].isEliminated) || stats!.players.find(p => !p.isEliminated);
                
                return (
                     <div className="text-center flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
                        <h2 className="text-3xl font-bold text-gray-200 mb-4">Lượt đi kết thúc</h2>
                        <p className="text-gray-400 mb-8 max-w-md">Chuyển thiết bị cho <span className="text-yellow-400 font-bold">{nextPlayer!.nationName}</span>.</p>
                        <button onClick={handleNextTurn} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                            Bắt đầu lượt
                        </button>
                    </div>
                );

            case 'gameOver': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-3xl font-bold text-red-500 mb-4 animate-fade-in">TRÒ CHƠI KẾT THÚC</h2>
                    <p className="text-gray-300 mb-8 max-w-md animate-fade-in" style={{ animationDelay: '0.3s' }}>{gameOverMessage}</p>
                    <button onClick={resetGame} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 animate-fade-in" style={{ animationDelay: '0.5s' }}><Icon name="refresh"/> Chơi lại</button>
                </div>
            );
            
            case 'playing':
                if (!stats || !currentPlayerData) return null;
                const isTyping = animatedScenario.length < (turnData?.scenario || '').length;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="bg-black/30 p-4 rounded-lg border border-gray-700 flex flex-col gap-4">
                                <NationalEmblem nationName={currentPlayerData.nationName} imageUrl={currentPlayerData.emblemImageUrl} isLoading={isLoading && !currentPlayerData.emblemImageUrl} />
                                <h2 className="text-xl font-bold text-center text-gray-300 border-b border-gray-600 pb-2 -mt-2">TRẠNG THÁI QUỐC GIA</h2>
                                <div className="space-y-3">
                                    <StatDisplay icon="economy" label="Kinh tế" value={formatNumber(currentPlayerData.economy)} unit="Tỷ USD" />
                                    <StatDisplay icon="manpower" label="Nhân lực" value={formatNumber(currentPlayerData.manpower)} />
                                    <StatDisplay icon="growth" label="Tăng trưởng KT" value={currentPlayerData.economicGrowth.toFixed(2)} unit="%" />
                                    <div className="pt-2">
                                        <h3 className="text-sm font-bold text-gray-400 mb-2 text-center">LỰC LƯỢNG VŨ TRANG</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            <MilitaryStat icon="infantry" value={currentPlayerData.military.infantry} />
                                            <MilitaryStat icon="armor" value={currentPlayerData.military.armor} />
                                            <MilitaryStat icon="navy" value={currentPlayerData.military.navy} />
                                            <MilitaryStat icon="airforce" value={currentPlayerData.military.airforce} />
                                        </div>
                                    </div>
                                    <MoraleDiplomacyBar value={currentPlayerData.morale} icon="morale" label="Tinh thần" />
                                    <MoraleDiplomacyBar value={currentPlayerData.diplomacy} icon="diplomacy" label="Ngoại giao" />
                                </div>
                                <WorldMapComponent mapData={stats.worldMap} />
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-black/30 p-4 rounded-lg border border-gray-700 flex flex-col">
                            <h2 className="text-xl font-bold text-center text-gray-300 border-b border-gray-600 pb-2 mb-2">TRUNG TÂM CHỈ HUY - Lượt {stats.turnNumber}</h2>
                            {/* Fix: Restored event log JSX */}
                            <div className="font-mono bg-black/50 p-3 rounded h-40 overflow-y-auto text-sm text-gray-300 mb-4 flex flex-col-reverse border border-gray-700">
                                <div>
                                    {eventLog.map((event, index) => (
                                        <p key={index} className={event.startsWith('>') ? 'text-cyan-400' : event.startsWith('Lỗi') ? 'text-yellow-400' : 'text-gray-300'}>{event}</p>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Fix: Restored loading state JSX */}
                            {isLoading ? ( 
                                <div className="flex flex-col items-center justify-center flex-grow text-gray-400">
                                    <svg className="animate-spin h-8 w-8 text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Đang xử lý diễn biến...
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col">
                                    {/* Fix: Restored report sections JSX */}
                                    <div className="bg-black/30 p-3 rounded-lg border border-yellow-700/50 mb-4 animate-slide-in-up">
                                        <h3 className="font-bold text-yellow-400 text-sm mb-1 flex items-center gap-2"><Icon name="warning" className="w-4 h-4"/>BÁO CÁO THIỆT HẠI</h3>
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
                                        <div className="flex items-center gap-2 bg-black/50 border rounded-lg p-2 form-input-glow">
                                            <span className="font-mono text-cyan-400 pl-2">{'>'}</span>
                                            <input id="player-action" type="text" value={playerInput} onChange={(e) => setPlayerInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAction(); } }} placeholder={`Mệnh lệnh cho ${currentPlayerData.nationName}...`} className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500" disabled={isLoading} autoFocus />
                                            <button type="submit" disabled={isLoading || !playerInput.trim()} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end"><Icon name="send" className="w-5 h-5"/></button>
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
            <footer className="absolute bottom-4 text-center text-gray-600 text-xs z-10">
                <p>Một trải nghiệm chiến lược được cung cấp bởi Google Gemini API.</p>
            </footer>
        </div>
    );
};

export default App;