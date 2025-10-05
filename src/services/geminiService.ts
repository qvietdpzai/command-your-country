import { GameStats, TurnResponse } from '../types';
import { generateEmblemSVG } from './emblemService';

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
        const errorMessage = errorData.details ? `${errorData.message} (${errorData.details})` : errorData.message || 'Failed to fetch from API';
        throw new Error(errorMessage);
    }

    return response.json();
};

export const getNextTurn = async (currentStats: GameStats, playerAction: string | null): Promise<TurnResponse> => {
    try {
        const payload = { currentStats, playerAction };
        return await callApi('getNextTurn', payload);
    } catch (error) {
        console.error("Error fetching next turn from API function:", error);
        
        let errorMessage = error instanceof Error ? error.message : "Lỗi kết nối máy chủ không xác định";
        let outcome = `Lỗi: ${errorMessage}`;
        let scenario = `Không thể kết nối đến máy chủ điều khiển trò chơi. Đã xảy ra lỗi khi xử lý mệnh lệnh của bạn. Vui lòng thử lại. (Chi tiết: ${errorMessage})`;

        // Check for specific quota/rate limit error from Gemini API
        if (errorMessage.includes('429') && (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED'))) {
             outcome = "Lỗi: Đã đạt đến giới hạn yêu cầu API";
             scenario = "Bạn đã vượt quá hạn ngạch yêu cầu API miễn phí cho ngày hôm nay. Máy chủ chỉ huy tạm thời không thể xử lý mệnh lệnh mới. Vui lòng thử lại sau khi hạn ngạch của bạn được làm mới (thường là sau 24 giờ).";
        }

        return {
            outcome,
            scenario,
            statChanges: { 
                // Fix: Replaced 'military: {}' with 'armyCorpsChanges: []' to align with the StatChanges type.
                armyCorpsChanges: [],
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
        console.warn("API did not return an image, generating SVG fallback.");
        return generateEmblemSVG(nationName);
    } catch (error) {
        console.error("Error generating national emblem via API, generating SVG fallback:", error);
        return generateEmblemSVG(nationName);
    }
};