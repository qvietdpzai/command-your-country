import { SinglePlayerGameStats, SinglePlayerTurnResponse, MultiplayerGameStats, ChatMessage } from '../types';
import { generateEmblemSVG } from './emblemService';

const API_ENDPOINT = '/.netlify/functions/gemini-api';

const callApi = async (action: string, payload: any) => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        console.error(`API Error (${action}):`, errorData);
        throw new Error(errorData.message || 'Failed to fetch from API');
    }
    return response.json();
};

// --- Single Player ---
export const getNextTurn = async (currentStats: SinglePlayerGameStats, playerAction: string | null): Promise<SinglePlayerTurnResponse> => {
    try {
        const payload = { currentStats, playerAction };
        return await callApi('getNextTurn', payload);
    } catch (error) {
        console.error("Error fetching next turn from API function:", error);
        const outcome = error instanceof Error ? `Lỗi: ${error.message}` : "Lỗi kết nối máy chủ";
        const scenario = "Không thể kết nối đến máy chủ điều khiển trò chơi. Vui lòng kiểm tra lại kết nối mạng và thử lại.";
        return {
            outcome, scenario,
            statChanges: { military: {}, economy: 0, manpower: 0, morale: 0, diplomacy: 0, economicGrowth: 0, mapChanges: [] },
            policySummary: "Lỗi Hệ thống",
            worldStatus: "Thông tin tình báo bị gián đoạn do lỗi kết nối.",
            damageReport: "Báo cáo thiệt hại không có sẵn do lỗi kết nối."
        };
    }
};

// --- Multiplayer ---
export const processMultiplayerTurn = async (currentStats: MultiplayerGameStats, playerAction: string): Promise<MultiplayerGameStats> => {
    try {
        const payload = { currentStats, playerAction };
        // This action returns the entire new game state
        return await callApi('processMultiplayerTurn', payload);
    } catch (error) {
        console.error("Error processing multiplayer turn:", error);
        // In case of an error, return the original state with an error message in the log
        const errorMessage = error instanceof Error ? `Lỗi: ${error.message}` : "Lỗi kết nối máy chủ khi xử lý lượt đi.";
        return {
            ...currentStats,
            gameLog: [errorMessage, ...currentStats.gameLog],
        };
    }
};


export const getConferenceResponse = async (
    currentStats: SinglePlayerGameStats,
    history: ChatMessage[],
    playerAction: string
): Promise<{ responseText: string }> => {
    try {
        const payload = { currentStats, history, playerAction };
        const result = await callApi('getConferenceResponse', payload);
        return result;
    } catch (error) {
        console.error("Error fetching conference response from API function:", error);
        const responseText = error instanceof Error ? `Lỗi: ${error.message}` : "Lỗi kết nối máy chủ";
        return { responseText };
    }
};

export const generateNationalEmblem = async (nationName: string): Promise<string> => {
    try {
        const payload = { nationName };
        const result = await callApi('generateNationalEmblem', payload);
        if (result && result.imageUrl) {
            return result.imageUrl;
        }
        console.warn("API did not return an image, generating SVG fallback.");
        return generateEmblemSVG(nationName);
    } catch (error) {
        console.error("Error generating national emblem via API, generating SVG fallback:", error);
        return generateEmblemSVG(nationName);
    }
};
