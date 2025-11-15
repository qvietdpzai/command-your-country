const { nanoid } = require("nanoid");

// This is an in-memory store. It will be cleared when the serverless function instance is recycled.
// Not suitable for long-running games, but fine for a short demo.
let gameStates = {};

const REGIONS = ['north_america', 'south_america', 'western_europe', 'eastern_europe', 'middle_east', 'north_africa', 'sub_saharan_africa', 'central_asia', 'east_asia', 'south_asia', 'southeast_asia', 'oceania'];

const createInitialMap = () => {
    const map = {};
    REGIONS.forEach(region => {
        map[region] = { controlledBy: 'neutral', fortificationLevel: 1, isContested: false, militaryPresence: [] };
    });
    map['western_europe'].controlledBy = 'western_alliance';
    map['east_asia'].controlledBy = 'eastern_alliance';
    map['eastern_europe'].controlledBy = 'eastern_alliance';
    map['middle_east'].strategicResource = 'oil';
    map['central_asia'].strategicResource = 'gas';
    map['sub_saharan_africa'].strategicResource = 'minerals';
    map['south_america'].strategicResource = 'oil';
    return map;
};

const createInitialPlayer = (id) => ({
    id,
    nationName: `Quốc gia của ${id}`,
    emblemImageUrl: null,
    isReady: false,
    nationalContext: '',
    military: { infantry: 500000, armor: 5000, navy: 500, airforce: 1000 },
    economy: 2000,
    manpower: 10000000,
    morale: 70,
    diplomacy: 60,
    economicGrowth: 0.5,
    policies: [],
    armyCorps: [],
});


exports.handler = async function(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed', headers };
    }

    try {
        const { action, payload } = JSON.parse(event.body);
        let responseData;

        switch (action) {
            case 'create': {
                const gameId = nanoid(6);
                const player1Id = 'player1';
                const player1 = createInitialPlayer(player1Id);
                const map = createInitialMap();
                
                gameStates[gameId] = {
                    gameId,
                    turn: 1,
                    players: [player1],
                    worldMap: map,
                    activePlayerId: player1Id,
                    isStarted: false,
                    isGameOver: false,
                    gameLog: []
                };
                responseData = { gameId, playerId: player1Id };
                break;
            }
            case 'join': {
                const { gameId } = payload;
                const game = gameStates[gameId];
                if (!game) throw new Error("Trận đấu không tồn tại.");
                if (game.players.length >= 2) throw new Error("Trận đấu đã đủ người chơi.");

                const player2Id = 'player2';
                const player2 = createInitialPlayer(player2Id);
                game.players.push(player2);
                
                responseData = { gameState: game, playerId: player2Id };
                break;
            }
             case 'get': {
                const { gameId } = payload;
                if (!gameStates[gameId]) throw new Error("Trận đấu không tồn tại.");
                responseData = gameStates[gameId];
                break;
            }
            case 'setReady': {
                const { gameId, playerId, setupData } = payload;
                const game = gameStates[gameId];
                if (!game) throw new Error("Trận đấu không tồn tại.");
                
                const player = game.players.find(p => p.id === playerId);
                if (!player) throw new Error("Người chơi không tồn tại.");

                const { nationName, emblemImageUrl, nationalContext, startingTerritory } = setupData;

                if (game.worldMap[startingTerritory].controlledBy !== 'neutral') {
                    throw new Error("Lãnh thổ đã bị người chơi khác chọn. Vui lòng chọn lãnh thổ khác.");
                }

                player.isReady = true;
                player.nationName = nationName;
                player.emblemImageUrl = emblemImageUrl;
                player.nationalContext = nationalContext;
                
                game.worldMap[startingTerritory].controlledBy = playerId;

                // Check if all players are ready to start the game
                if (game.players.length === 2 && game.players.every(p => p.isReady)) {
                    game.isStarted = true;
                    game.gameLog.push("Trận đấu bắt đầu! Chúc may mắn, các nhà lãnh đạo.");
                }

                responseData = game;
                break;
            }
            case 'update': {
                const { gameId, newState } = payload;
                if (!gameStates[gameId]) throw new Error("Trận đấu không tồn tại.");
                // A basic validation to prevent malformed state
                if (!newState || !newState.gameId || !newState.players) {
                    throw new Error("Dữ liệu trạng thái không hợp lệ.");
                }
                gameStates[gameId] = newState;
                responseData = gameStates[gameId];
                break;
            }
            default:
                throw new Error("Hành động không hợp lệ.");
        }

        return { statusCode: 200, headers, body: JSON.stringify(responseData) };

    } catch (error) {
        console.error("Lỗi trong hàm multiplayer:", error);
        return { statusCode: 500, headers, body: JSON.stringify({ message: error.message }) };
    }
};
