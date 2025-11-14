import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNextTurn, generateNationalEmblem, processMultiplayerTurn } from './services/geminiService';
import { createGame, getGameState, joinGame, setPlayerReady } from './services/multiplayerService';
import { SinglePlayerGameStats, MilitaryStats, SinglePlayerTurnResponse, WorldMap, RegionID, MultiplayerGameStats, Player } from './types';
import { Icon } from './components/icons';
import { WorldMap as WorldMapComponent } from './components/WorldMap';
import { NationalEmblem } from './components/NationalEmblem';
import { RegionDetail } from './components/RegionDetail';
import { ArmyCorpsManager } from './components/ArmyCorpsManager';
import { soundService, SoundName } from './services/soundService';

// --- CONSTANTS & HELPERS ---
const REGIONS: RegionID[] = ['north_america', 'south_america', 'western_europe', 'eastern_europe', 'middle_east', 'north_africa', 'sub_saharan_africa', 'central_asia', 'east_asia', 'south_asia', 'southeast_asia', 'oceania'];
const MAX_MORALE_DIPLOMACY = 100;
const SINGLE_PLAYER_SAVE_KEY = 'ww3-savegame-v3';
const POLLING_INTERVAL = 5000; // 5 seconds for multiplayer state sync

const createInitialMap = (): WorldMap => {
    const map: Partial<WorldMap> = {};
    REGIONS.forEach(region => {
        map[region] = { controlledBy: 'neutral', fortificationLevel: 1, isContested: false, militaryPresence: [] };
    });
    map['north_america'] = { ...map['north_america']!, controlledBy: 'player', fortificationLevel: 2, hasPlayerMilitary: true };
    map['western_europe']!.controlledBy = 'western_alliance';
    map['east_asia']!.controlledBy = 'eastern_alliance';
    map['eastern_europe']!.controlledBy = 'eastern_alliance';
    map['middle_east']!.strategicResource = 'oil';
    map['central_asia']!.strategicResource = 'gas';
    map['sub_saharan_africa']!.strategicResource = 'minerals';
    map['south_america']!.strategicResource = 'oil';
    return map as WorldMap;
};

const INITIAL_SP_STATS: SinglePlayerGameStats = {
    military: { infantry: 500000, armor: 5000, navy: 500, airforce: 1000 },
    economy: 2000, manpower: 10000000, morale: 70, diplomacy: 60, economicGrowth: 0.5,
    worldMap: createInitialMap(), policies: [], nationName: '', emblemImageUrl: null, armyCorps: [],
};

type GameMode = 'menu' | 'offline' | 'online';
type OfflineGameState = 'naming' | 'playing' | 'gameOver';
type OnlineGameState = 'entry' | 'lobby' | 'playing' | 'gameOver';

const useTypingEffect = (text: string = '', speed: number = 25): string => {
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
        if (!text) { setDisplayedText(''); return; }
        let i = 0;
        setDisplayedText('');
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                if (i % 3 === 0) soundService.playSound('text_typing');
                i++;
            } else { clearInterval(intervalId); }
        }, speed);
        return () => clearInterval(intervalId);
    }, [text, speed]);
    return displayedText;
};

const formatNumber = (num: number): string => new Intl.NumberFormat('en-US').format(num);

// --- UI Sub-components ---
const StatDisplay: React.FC<{ icon: any; label: string; value: string | number; unit?: string }> = ({ icon, label, value, unit }) => (
    <div className="flex items-center justify-between text-white bg-gray-900/50 p-2 rounded-md">
        <div className="flex items-center gap-2"><Icon name={icon} className="w-5 h-5 text-gray-400" /><span className="font-semibold text-gray-300">{label}</span></div>
        <span className="font-mono font-bold text-lg">{value} <span className="text-sm text-gray-500">{unit}</span></span>
    </div>
);
const MilitaryStat: React.FC<{ icon: any; value: number }> = ({ icon, value }) => (
    <div className="flex flex-col items-center justify-center bg-gray-900/50 p-2 rounded-md text-center">
        <Icon name={icon} className="w-7 h-7 text-gray-400 mb-1" /><span className="font-mono font-bold text-base text-white">{formatNumber(value)}</span>
    </div>
);
const MoraleDiplomacyBar: React.FC<{ value: number; icon: any; label: string }> = ({ value, icon, label }) => {
    const percentage = (value / MAX_MORALE_DIPLOMACY) * 100;
    const barColor = value > 60 ? 'bg-green-500' : value > 30 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-3 w-full" aria-label={`${label}: ${value}`}><Icon name={icon} className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="w-full bg-gray-700 rounded-full h-4" title={`${label}: ${value}`}><div className={`${barColor} h-4 rounded-full transition-all duration-500 ease-in-out`} style={{ width: `${percentage}%` }}></div></div>
            <span className="text-lg font-bold text-white w-12 text-right">{value}</span>
        </div>
    );
};

// --- MAIN APP ---
const App: React.FC = () => {
    // Shared State
    const [gameMode, setGameMode] = useState<GameMode>('menu');
    const [isLoading, setIsLoading] = useState(false);
    const [playerInput, setPlayerInput] = useState('');
    const [tempNationName, setTempNationName] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<RegionID | null>(null);
    const audioInitialized = useRef(false);

    // Single-Player State
    const [spStats, setSpStats] = useState<SinglePlayerGameStats>(INITIAL_SP_STATS);
    const [spTurnData, setSpTurnData] = useState<SinglePlayerTurnResponse | null>(null);
    const [spEventLog, setSpEventLog] = useState<string[]>([]);
    const [spGameState, setSpGameState] = useState<OfflineGameState>('naming');
    const [spGameOverMessage, setSpGameOverMessage] = useState('');
    const [hasSaveGame, setHasSaveGame] = useState(false);

    // Multi-Player State
    const [mpGameState, setMpGameState] = useState<OnlineGameState>('entry');
    const [mpGameStats, setMpGameStats] = useState<MultiplayerGameStats | null>(null);
    const [mpGameId, setMpGameId] = useState('');
    const [mpPlayerId, setMpPlayerId] = useState<string | null>(null);
    const [mpJoinId, setMpJoinId] = useState('');
    const pollingTimeoutRef = useRef<number | null>(null);

    const animatedScenario = useTypingEffect(isLoading ? '' : (spTurnData?.scenario || ''));

    // --- Sound Management ---
    const initializeAudio = useCallback(() => {
        if (!audioInitialized.current) {
            soundService.init();
            audioInitialized.current = true;
        }
    }, []);
    const playSoundWithInit = useCallback((sound: SoundName) => { initializeAudio(); soundService.playSound(sound); }, [initializeAudio]);

    // --- Single-Player Logic ---
    useEffect(() => {
        const savedGame = localStorage.getItem(SINGLE_PLAYER_SAVE_KEY);
        setHasSaveGame(!!savedGame);
    }, []);

    const saveSpGame = (stats: SinglePlayerGameStats, turnData: SinglePlayerTurnResponse, eventLog: string[]) => {
        localStorage.setItem(SINGLE_PLAYER_SAVE_KEY, JSON.stringify({ stats, turnData, eventLog }));
        setHasSaveGame(true);
    };

    const clearSpSaveGame = () => { localStorage.removeItem(SINGLE_PLAYER_SAVE_KEY); setHasSaveGame(false); };

    const loadSpGame = () => {
        playSoundWithInit('ui_click');
        const savedGameString = localStorage.getItem(SINGLE_PLAYER_SAVE_KEY);
        if (savedGameString) {
            try {
                const savedGame = JSON.parse(savedGameString);
                setSpStats(savedGame.stats);
                setSpTurnData(savedGame.turnData);
                setSpEventLog(savedGame.eventLog);
                setSpGameState('playing');
                setGameMode('offline');
            } catch { clearSpSaveGame(); alert("Lỗi dữ liệu lưu, bắt đầu chiến dịch mới."); }
        }
    };

    const handleSpNationCreation = useCallback(async () => {
        if (!tempNationName.trim() || isLoading) return;
        playSoundWithInit('start_game');
        clearSpSaveGame();
        setIsLoading(true);
        setSpGameState('playing');
        setSpEventLog([]);
        setPlayerInput('');
        let currentStats: SinglePlayerGameStats = { ...INITIAL_SP_STATS, nationName: tempNationName };
        setSpStats(currentStats);
        const [emblemUrl, initialTurn] = await Promise.all([generateNationalEmblem(tempNationName), getNextTurn(currentStats, null)]);
        currentStats = { ...currentStats, emblemImageUrl: emblemUrl, policies: [initialTurn.policySummary] };
        setSpStats(currentStats);
        setSpTurnData(initialTurn);
        const newLog = [initialTurn.outcome];
        setSpEventLog(newLog);
        saveSpGame(currentStats, initialTurn, newLog);
        setIsLoading(false);
        playSoundWithInit('receive_response');
    }, [tempNationName, isLoading, playSoundWithInit]);

    const handleSpAction = useCallback(async () => {
        if (isLoading || spGameState !== 'playing' || !playerInput.trim()) return;
        playSoundWithInit('send_command');
        setIsLoading(true);
        const newEventLog = [`> ${playerInput}`, ...spEventLog];
        setSpEventLog(newEventLog);
        const nextTurnData = await getNextTurn(spStats, playerInput);
        playSoundWithInit('receive_response');
        setPlayerInput('');
        const changes = nextTurnData.statChanges;
        const incomeFromGrowth = Math.floor(spStats.economy * (spStats.economicGrowth / 100));
        const newMilitary: MilitaryStats = { ...spStats.military };
        for (const key in changes.military) { newMilitary[key as keyof MilitaryStats] = Math.max(0, (newMilitary[key as keyof MilitaryStats] || 0) + (changes.military[key as keyof MilitaryStats] || 0)); }
        const newWorldMap = { ...spStats.worldMap };
        changes.mapChanges.forEach(change => {
            if (change.newController) newWorldMap[change.region].controlledBy = change.newController;
            if (typeof change.playerMilitary === 'boolean') {
                if (change.playerMilitary) REGIONS.forEach(r => newWorldMap[r].hasPlayerMilitary = false);
                newWorldMap[change.region].hasPlayerMilitary = change.playerMilitary;
            }
        });
        const newStats: SinglePlayerGameStats = {
            ...spStats, military: newMilitary,
            economy: Math.max(0, spStats.economy + incomeFromGrowth + changes.economy),
            manpower: Math.max(0, spStats.manpower + changes.manpower),
            morale: Math.max(0, Math.min(MAX_MORALE_DIPLOMACY, spStats.morale + changes.morale)),
            diplomacy: Math.max(0, Math.min(MAX_MORALE_DIPLOMACY, spStats.diplomacy + changes.diplomacy)),
            economicGrowth: spStats.economicGrowth + changes.economicGrowth, worldMap: newWorldMap,
            policies: [nextTurnData.policySummary, ...spStats.policies],
        };
        setSpStats(newStats);
        setSpTurnData(nextTurnData);
        const finalEventLog = [nextTurnData.outcome, ...newEventLog];
        setSpEventLog(finalEventLog);
        setIsLoading(false);
        if (!Object.values(newStats.worldMap).some(r => r.controlledBy === 'player')) {
            setSpGameState('gameOver');
            setSpGameOverMessage("Bạn đã mất quyền kiểm soát tất cả các vùng lãnh thổ. Quốc gia của bạn đã bị xóa sổ khỏi bản đồ thế giới.");
            clearSpSaveGame();
            playSoundWithInit('game_over');
        } else {
            saveSpGame(newStats, nextTurnData, finalEventLog);
        }
    }, [isLoading, spStats, playerInput, spEventLog, spGameState, playSoundWithInit]);

    // --- Multi-Player Logic ---
    const pollGameState = useCallback(async () => {
        if (gameMode !== 'online' || !mpGameId || (mpGameStats?.activePlayerId === mpPlayerId && mpGameStats.isStarted)) {
            return;
        }
        try {
            const updatedState = await getGameState(mpGameId);
            if (updatedState) {
                setMpGameStats(updatedState);
                if (updatedState.isStarted) setMpGameState('playing');
            }
        } catch (error) {
            console.error("Polling error:", error);
        } finally {
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = window.setTimeout(pollGameState, POLLING_INTERVAL);
        }
    }, [gameMode, mpGameId, mpPlayerId, mpGameStats]);

    useEffect(() => {
        if (gameMode === 'online' && mpGameId) {
            pollGameState();
        }
        return () => {
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        };
    }, [gameMode, mpGameId, pollGameState]);

    const handleCreateMpGame = async () => {
        setIsLoading(true);
        try {
            const { gameId, playerId } = await createGame();
            setMpGameId(gameId);
            setMpPlayerId(playerId);
            setMpGameState('lobby');
        } catch (error) { alert("Không thể tạo trận đấu."); }
        setIsLoading(false);
    };

    const handleJoinMpGame = async () => {
        if (!mpJoinId.trim()) return;
        setIsLoading(true);
        try {
            const { gameState, playerId } = await joinGame(mpJoinId.trim());
            setMpGameStats(gameState);
            setMpGameId(gameState.gameId);
            setMpPlayerId(playerId);
            setMpGameState('lobby');
        } catch (error) { alert("Không thể tham gia trận đấu. Kiểm tra lại ID."); }
        setIsLoading(false);
    };

    const handleSetMpReady = async () => {
        if (!tempNationName.trim() || !mpGameId || !mpPlayerId) return;
        setIsLoading(true);
        try {
            const emblemImageUrl = await generateNationalEmblem(tempNationName);
            const updatedState = await setPlayerReady(mpGameId, mpPlayerId, tempNationName, emblemImageUrl);
            setMpGameStats(updatedState);
        } catch (error) { alert("Lỗi khi sẵn sàng."); }
        setIsLoading(false);
    };

    const handleMpAction = async () => {
        if (isLoading || !playerInput.trim() || !mpGameStats || mpGameStats.activePlayerId !== mpPlayerId) return;
        setIsLoading(true);
        playSoundWithInit('send_command');
        const newState = await processMultiplayerTurn(mpGameStats, playerInput);
        playSoundWithInit('receive_response');
        setPlayerInput('');
        setMpGameStats(newState);
        setIsLoading(false);
    };


    // --- RENDER LOGIC ---
    const renderMenu = () => (
        <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-yellow-400 text-transparent bg-clip-text mb-4 animate-fade-in">WW3: Xung đột toàn cầu</h1>
            <p className="text-gray-400 mb-8 max-w-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>Bạn là nhà lãnh đạo tối cao. Mỗi quyết định đều có thể dẫn đến chiến thắng hoặc thất bại.</p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <button onClick={() => { playSoundWithInit('ui_click'); setGameMode('online'); }} className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                    <Icon name="diplomacy" className="w-6 h-6" /> Đối kháng Trực tuyến
                </button>
                <button onClick={() => { playSoundWithInit('ui_click'); setGameMode('offline'); setSpGameState(hasSaveGame ? 'naming' : 'naming'); }} className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                    <Icon name="play" className="w-6 h-6" /> Chiến dịch Ngoại tuyến
                </button>
            </div>
             {hasSaveGame && (
                <button onClick={loadSpGame} className="mt-4 flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105">
                    <Icon name="load" className="w-6 h-6"/> Tiếp tục chiến dịch đã lưu
                </button>
            )}
        </div>
    );
    
    const renderOffline = () => {
        switch (spGameState) {
            case 'naming': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-3xl font-bold text-gray-200 mb-4">Đặt tên cho quốc gia của bạn</h2>
                    <form onSubmit={(e) => { e.preventDefault(); handleSpNationCreation(); }} className="w-full max-w-sm flex flex-col gap-4">
                        <input type="text" value={tempNationName} onChange={(e) => setTempNationName(e.target.value)} placeholder="Ví dụ: Cộng hòa Astoria" className="w-full bg-gray-900 border-2 border-gray-600 rounded-lg p-4 text-white text-center text-xl" autoFocus />
                        <button type="submit" disabled={!tempNationName.trim()} className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl disabled:opacity-50">
                            <Icon name="play" className="w-6 h-6" /> Bắt đầu
                        </button>
                    </form>
                </div>
            );
            case 'gameOver': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-3xl font-bold text-red-500 mb-4">TRÒ CHƠI KẾT THÚC</h2>
                    <p className="text-gray-300 mb-8 max-w-md">{spGameOverMessage}</p>
                    <button onClick={() => { playSoundWithInit('ui_click'); setGameMode('menu'); }} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                        <Icon name="refresh" className="w-5 h-5" /> Trở về Menu
                    </button>
                </div>
            );
            case 'playing': return renderPlayingUI(spStats, spEventLog, spTurnData?.damageReport || '', spTurnData?.worldStatus || '', animatedScenario);
        }
    }

    const renderOnline = () => {
         switch (mpGameState) {
            case 'entry': return (
                <div className="text-center flex flex-col items-center justify-center min-h-[400px] gap-8">
                     <div>
                        <h2 className="text-3xl font-bold text-gray-200 mb-4">Tạo Trận đấu Mới</h2>
                        <button onClick={handleCreateMpGame} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl disabled:opacity-50">
                            {isLoading ? 'Đang tạo...' : 'Tạo trận'}
                        </button>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-200 mb-4">Tham gia Trận đấu</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleJoinMpGame(); }} className="flex gap-2">
                            <input type="text" value={mpJoinId} onChange={e => setMpJoinId(e.target.value)} placeholder="Nhập ID trận đấu" className="bg-gray-900 border-2 border-gray-600 rounded-lg p-4 text-white" />
                            <button type="submit" disabled={isLoading || !mpJoinId} className="bg-green-600 hover:bg-green-700 text-white font-bold p-4 rounded-lg disabled:opacity-50">Tham gia</button>
                        </form>
                    </div>
                </div>
            );
            case 'lobby':
                const me = mpGameStats?.players.find(p => p.id === mpPlayerId);
                const opponent = mpGameStats?.players.find(p => p.id !== mpPlayerId);
                return (
                    <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                        <h2 className="text-3xl font-bold text-gray-200 mb-2">Phòng chờ Trực tuyến</h2>
                        <p className="text-gray-400 mb-4">ID Trận đấu: <strong className="text-yellow-400 font-mono cursor-pointer" onClick={() => navigator.clipboard.writeText(mpGameId)}>{mpGameId}</strong> (nhấn để sao chép)</p>
                        <p className="text-gray-500 mb-8">Chia sẻ ID này với đối thủ của bạn. Trò chơi sẽ bắt đầu khi cả hai sẵn sàng.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                            {/* Player 1 (Me) */}
                            <div className="bg-black/30 p-4 rounded-lg">
                                <h3 className="text-xl font-bold text-blue-400 mb-4">Bạn ({me?.isReady ? "Sẵn sàng" : "Chưa sẵn sàng"})</h3>
                                {me?.isReady ? <p className="text-2xl font-bold">{me.nationName}</p> :
                                    <form onSubmit={e => { e.preventDefault(); handleSetMpReady(); }} className="flex flex-col gap-2">
                                        <input type="text" value={tempNationName} onChange={e => setTempNationName(e.target.value)} placeholder="Tên quốc gia của bạn" className="bg-gray-900 border-2 border-gray-600 rounded-lg p-3 text-white text-center" />
                                        <button type="submit" disabled={isLoading || !tempNationName} className="bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg disabled:opacity-50">Sẵn sàng</button>
                                    </form>
                                }
                            </div>
                            {/* Player 2 (Opponent) */}
                            <div className="bg-black/30 p-4 rounded-lg">
                                <h3 className="text-xl font-bold text-purple-400 mb-4">Đối thủ ({opponent?.isReady ? "Sẵn sàng" : "Đang chờ..."})</h3>
                                {opponent ? <p className="text-2xl font-bold">{opponent.isReady ? opponent.nationName : "..."}</p> : <p>Đang chờ người chơi...</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'playing':
                const mePlayer = mpGameStats?.players.find(p => p.id === mpPlayerId);
                if (!mePlayer || !mpGameStats) return <div>Đang tải...</div>;
                const isMyTurn = mpGameStats.activePlayerId === mpPlayerId;
                const opponentPlayer = mpGameStats.players.find(p => p.id !== mpPlayerId);
                const gameLog = mpGameStats.gameLog || [];
                const latestLog = gameLog.length > 0 ? gameLog[0] : "Trận đấu bắt đầu.";
                const animatedLog = useTypingEffect(isLoading ? '' : latestLog);
                return renderPlayingUI(mePlayer, gameLog, isMyTurn ? "Đến lượt của bạn." : `Đang chờ ${opponentPlayer?.nationName || 'đối thủ'}...`, `Lượt ${mpGameStats.turn}`, animatedLog, mpGameStats);
            case 'gameOver': 
                 const winner = mpGameStats?.players.find(p => p.id === mpGameStats?.winnerId);
                 const message = winner?.id === mpPlayerId ? `Chúc mừng! Bạn đã chiến thắng!` : `Thất bại. ${winner?.nationName} đã giành chiến thắng.`;
                 return (
                    <div className="text-center flex flex-col items-center justify-center min-h-[400px]">
                        <h2 className="text-3xl font-bold text-red-500 mb-4">TRÒ CHƠI KẾT THÚC</h2>
                        <p className="text-gray-300 mb-8 max-w-md">{message}</p>
                        <button onClick={() => { playSoundWithInit('ui_click'); setGameMode('menu'); }} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                            <Icon name="refresh" className="w-5 h-5" /> Trở về Menu
                        </button>
                    </div>
                 );
        }
    };
    
    const renderPlayingUI = (
        stats: SinglePlayerGameStats | Player,
        eventLog: string[],
        damageReport: string,
        worldStatus: string,
        animatedScenario: string,
        mpStats?: MultiplayerGameStats
    ) => {
        const isMultiplayer = !!mpStats;
        const isMyTurn = isMultiplayer ? mpStats.activePlayerId === mpPlayerId : true;
        const players = isMultiplayer ? mpStats.players : [];
        const singlePlayerMilitaryRegion = !isMultiplayer ? Object.keys((stats as SinglePlayerGameStats).worldMap).find(key => (stats as SinglePlayerGameStats).worldMap[key as RegionID].hasPlayerMilitary) as RegionID | undefined : undefined;
        
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
                                <h3 className="text-sm font-bold text-gray-400 mb-2 text-center">LỰC LƯỢNG VŨ TRANG</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <MilitaryStat icon="infantry" value={stats.military.infantry} />
                                    <MilitaryStat icon="armor" value={stats.military.armor} />
                                    <MilitaryStat icon="navy" value={stats.military.navy} />
                                    <MilitaryStat icon="airforce" value={stats.military.airforce} />
                                </div>
                            </div>
                            <MoraleDiplomacyBar value={stats.morale} icon="morale" label="Tinh thần" />
                            <MoraleDiplomacyBar value={stats.diplomacy} icon="diplomacy" label="Ngoại giao" />
                        </div>
                        <WorldMapComponent mapData={isMultiplayer ? mpStats.worldMap : (stats as SinglePlayerGameStats).worldMap} onRegionClick={setSelectedRegion} players={players} singlePlayerMilitaryRegion={singlePlayerMilitaryRegion}/>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-black/30 p-4 rounded-lg border border-gray-700 flex flex-col">
                     <h2 className="text-xl font-bold text-center text-gray-300 border-b border-gray-600 pb-2 mb-2">TRUNG TÂM CHỈ HUY</h2>
                    <div className="font-mono bg-black/50 p-3 rounded h-40 overflow-y-auto text-sm text-gray-300 mb-4 flex flex-col-reverse border border-gray-700">
                        <div>{eventLog.map((event, index) => <p key={index} className={event.startsWith('>') ? 'text-cyan-400' : 'text-gray-300'}>{event}</p>)}</div>
                    </div>
                    {isLoading ? <div className="flex-grow flex items-center justify-center text-gray-400">Đang xử lý...</div> :
                        <div className="flex-grow flex flex-col">
                            <div className="bg-black/30 p-3 rounded-lg border border-yellow-700/50 mb-4"><h3 className="font-bold text-yellow-400 text-sm mb-1 flex items-center gap-2"><Icon name="warning" className="w-4 h-4" />THÔNG BÁO</h3><p className="text-gray-300 text-sm">{damageReport}</p></div>
                            <div className="bg-black/30 p-3 rounded-lg border border-gray-700 mb-4"><h3 className="font-bold text-gray-400 text-sm mb-1">TÌNH BÁO</h3><p className="text-gray-300 text-sm">{worldStatus}</p></div>
                            <p className="text-green-300 mb-4 text-lg flex-grow min-h-[4.5rem]">{animatedScenario}{!animatedScenario.endsWith('.') && <span className="typing-cursor">_</span>}</p>
                            <form onSubmit={e => { e.preventDefault(); isMultiplayer ? handleMpAction() : handleSpAction(); }} className="mt-auto">
                                <div className="flex items-center gap-2 bg-black/50 border rounded-lg p-2 form-input-glow">
                                    <span className="font-mono text-cyan-400 pl-2">{'>'}</span>
                                    <input type="text" value={playerInput} onChange={(e) => setPlayerInput(e.target.value)} placeholder={isMyTurn ? "Nhập mệnh lệnh..." : "Đang chờ đối thủ..."} className="w-full bg-transparent border-none focus:ring-0 text-white" disabled={isLoading || !isMyTurn} autoFocus />
                                    <button type="submit" disabled={isLoading || !playerInput.trim() || !isMyTurn} className="bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded-md disabled:opacity-50"><Icon name="send" className="w-5 h-5" /></button>
                                </div>
                            </form>
                        </div>
                    }
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (gameMode) {
            case 'menu': return renderMenu();
            case 'offline': return renderOffline();
            case 'online': return renderOnline();
            default: return <div>Lỗi</div>;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 selection:bg-green-500 selection:text-black relative overflow-hidden scanline-overlay">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-black z-0 opacity-80"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-10 z-0"></div>
            <main className="w-full max-w-7xl bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 z-10 border border-gray-700 glow-border">
                {renderContent()}
            </main>
            <footer className="absolute bottom-4 text-center text-gray-600 text-xs z-10"><p>Một trải nghiệm chiến lược được cung cấp bởi Google Gemini API.</p></footer>
        </div>
    );
};

export default App;
