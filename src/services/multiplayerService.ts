import { MultiplayerGameStats, SetupData } from '../types';

const API_ENDPOINT = '/.netlify/functions/multiplayer';

const callApi = async (action: string, payload: any = {}) => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        console.error(`Multiplayer API Error (${action}):`, errorData);
        throw new Error(errorData.message || 'Failed to fetch from Multiplayer API');
    }
    return response.json();
};

export const createGame = async (): Promise<{ gameId: string, playerId: string }> => {
    return callApi('create');
};

export const joinGame = async (gameId: string): Promise<{ gameState: MultiplayerGameStats, playerId: string }> => {
    return callApi('join', { gameId });
};

export const getGameState = async (gameId: string): Promise<MultiplayerGameStats> => {
    return callApi('get', { gameId });
};

export const setPlayerReady = async (gameId: string, playerId: string, setupData: SetupData): Promise<MultiplayerGameStats> => {
    return callApi('setReady', { gameId, playerId, setupData });
};

export const updateGameState = async (gameId: string, newState: MultiplayerGameStats): Promise<MultiplayerGameStats> => {
    return callApi('update', { gameId, newState });
};
