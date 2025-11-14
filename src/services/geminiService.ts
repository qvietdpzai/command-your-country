
import { GameStats, TurnResponse, ChatMessage } from '../types';

// The endpoint for our local Python server
const API_ENDPOINT = 'http://localhost:8000/api';

// Helper function to call our backend server
const callApi = async (action: string, payload: any) => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        console.error(`API Error (${action}):`, errorData);
        throw new Error(errorData.message || `Failed to fetch from API at ${API_ENDPOINT}`);
    }

    return response.json();
};

export const getNextTurn = async (currentStats: GameStats, playerAction: string | null, currentPlayerIndex: number): Promise<TurnResponse> => {
    try {
        const payload = { currentStats, playerAction, currentPlayerIndex };
        return await callApi('getNextTurn', payload);
    } catch (error) {
        console.error("Error fetching next turn from Python server:", error);
        
        const outcome = error instanceof Error ? `Lỗi: ${error.message}` : "Lỗi kết nối máy chủ";
        const scenario = "Không thể kết nối đến máy chủ điều khiển trò chơi. Hãy chắc chắn rằng máy chủ Python của bạn đang chạy và thử lại.";

        return {
            outcome,
            scenario,
            statChanges: { 
                military: {}, 
                economy: 0, 
                manpower: 0,
                morale: 0, 
                diplomacy: 0, 
                economicGrowth: 0,
                mapChanges: []
            },
            policySummary: "Lỗi Hệ thống",
            worldStatus: "Thông tin tình báo bị gián đoạn do lỗi kết nối.",
            damageReport: "Báo cáo thiệt hại không có sẵn do lỗi kết nối."
        };
    }
};

export const generateNationalEmblem = async (nationName: string): Promise<string> => {
    try {
        const payload = { nationName };
        const result = await callApi('generateNationalEmblem', payload);
        if (result && result.imageUrl) {
            return result.imageUrl;
        }
        // Fallback in case the server doesn't return an image
        console.warn("API did not return an image URL.");
        return ''; // Return an empty string to prevent errors
    } catch (error) {
        console.error("Error generating national emblem via API:", error);
        // Return an empty string on error
        return '';
    }
};

export const getConferenceResponse = async (
    gameStats: GameStats,
    history: ChatMessage[],
    userMessage: string
): Promise<{ responseText: string }> => {
    try {
        const payload = { gameStats, history, userMessage };
        // This assumes a 'getConferenceResponse' action will be added to the Python server
        const result = await callApi('getConferenceResponse', payload);
        return result;
    } catch (error) {
        console.error("Error getting conference response from API function:", error);
        return { responseText: "Xin lỗi, đã xảy ra lỗi khi kết nối với hội đồng cố vấn. Vui lòng thử lại sau." };
    }
};
