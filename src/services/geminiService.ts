import { GameStats, TurnResponse } from '../types';

// The endpoint for our Netlify function
const API_ENDPOINT = '/.netlify/functions/gemini-api';

// Helper function to call our backend function
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
        throw new Error(errorData.message || 'Failed to fetch from API');
    }

    return response.json();
};

export const getNextTurn = async (currentStats: GameStats, playerAction: string | null): Promise<TurnResponse> => {
    try {
        const payload = { currentStats, playerAction };
        return await callApi('getNextTurn', payload);
    } catch (error) {
        console.error("Error fetching next turn from API function:", error);
        
        const outcome = error instanceof Error ? `Lỗi: ${error.message}` : "Lỗi kết nối máy chủ";
        const scenario = "Không thể kết nối đến máy chủ điều khiển trò chơi. Vui lòng kiểm tra lại kết nối mạng hoặc cấu hình máy chủ và thử lại.";

        return {
            outcome,
            scenario,
            statChanges: { 
                military: {}, 
                economy: 0, 
                manpower: 0,
                morale: 0, 
                diplomacy: 0, 
                territoryControlChange: 0 
            },
            policySummary: "Lỗi Hệ thống",
            worldStatus: "Thông tin tình báo bị gián đoạn do lỗi kết nối.",
            damageReport: "Báo cáo thiệt hại không có sẵn do lỗi kết nối."
        };
    }
};

export const generateNationalEmblem = async (nationName: string): Promise<string | null> => {
    try {
        const payload = { nationName };
        const result = await callApi('generateNationalEmblem', payload);
        return result.imageUrl;
    } catch (error) {
        console.error("Error generating national emblem from API function:", error);
        return null;
    }
};
