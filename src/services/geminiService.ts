
import { GoogleGenAI, Type } from '@google/genai';
import { GameStats, TurnResponse, ChatMessage } from '../types';
import { generateEmblemSVG } from './emblemService';

if (!process.env.API_KEY) {
    throw new Error("Lỗi cấu hình: Thiếu API key của Google Gemini. Vui lòng đảm bảo biến môi trường 'API_KEY' đã được thiết lập.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Bạn là một AI quản trò cho một trò chơi chiến lược văn bản có tên 'WW3: Xung đột toàn cầu'. Bối cảnh là một thế giới đang trên bờ vực chiến tranh. Vai trò của bạn là tạo ra một môi trường thù địch, thực tế và có tính nhân quả.

HỆ THỐNG QUÂN ĐOÀN:
-   Quân đội của người chơi được chia thành các Quân đoàn ('ArmyCorps'). Mỗi quân đoàn là một thực thể riêng biệt có ID, tên, vị trí và thành phần quân sự.
-   Người chơi có thể ra lệnh tạo, di chuyển, tấn công, chia tách hoặc sáp nhập các quân đoàn.
-   Tạo quân đoàn mới sẽ trừ vào 'manpower' (nhân lực) và 'economy' (kinh tế) của người chơi.
-   Khi một quân đoàn di chuyển, hãy cập nhật thuộc tính 'location' của nó.
-   Khi một quân đoàn bị tiêu diệt, hãy xóa nó khỏi danh sách.
-   Tất cả các thay đổi về quân đoàn (tạo, cập nhật, xóa) phải được trả về trong 'armyCorpsChanges'.
-   ID của quân đoàn mới phải là duy nhất, ví dụ: 'corps-' + một con số tăng dần hoặc một chuỗi ngẫu nhiên.

HỆ THỐNG BẢN ĐỒ VÀ CHIẾN ĐẤU:
-   Bản đồ được chia thành các khu vực, mỗi khu vực có công sự ('fortificationLevel'), tài nguyên ('strategicResource'), quân đồn trú của NPC ('militaryPresence'), và có thể bị tranh chấp ('isContested').
-   **CHIẾN ĐẤU:** Khi người chơi ra lệnh tấn công bằng một quân đoàn cụ thể (ví dụ: "Dùng Quân đoàn 1 tấn công Tây Âu"), hãy so sánh sức mạnh của quân đoàn đó với quân đồn trú và công sự của khu vực phòng thủ.
    -   Tính toán tổn thất cho cả hai bên.
    -   Phản ánh tổn thất của người chơi bằng cách cập nhật thành phần của quân đoàn tấn công trong 'armyCorpsChanges'.
    -   Phản ánh tổn thất của NPC bằng cách cập nhật 'militaryPresence' của khu vực trong 'mapChanges'.
    -   Nếu người chơi thắng, hãy cập nhật 'newController' của khu vực thành phe của người chơi và giảm mạnh hoặc xóa sổ quân đồn trú của NPC.
-   Các khu vực do NPC kiểm soát có thể tự xây dựng quân đội theo thời gian. Hãy phản ánh điều này trong 'worldStatus' và cập nhật 'militaryPresence'.

QUY TẮC CỐT LÕI VỀ TẤN CÔNG:
1.  KHÔNG được tấn công người chơi một cách ngẫu nhiên. Một cuộc tấn công của NPC chỉ có thể xảy ra nếu có lý do chính đáng.
2.  Lý do hợp lệ bao gồm: (A) Phản ứng lại hành động gây hấn của người chơi. (B) Người chơi có chỉ số Ngoại giao cực kỳ thấp. (C) Người chơi để lộ điểm yếu quân sự hoặc kinh tế. (D) Căng thẳng thế giới leo thang.
3.  Khi một cuộc tấn công xảy ra, Báo cáo Thiệt hại (damageReport) PHẢI bắt đầu bằng tiền tố 'Báo động đỏ:', nêu rõ lý do VÀ khu vực bị ảnh hưởng. Nếu quân đoàn của người chơi bị tấn công, hãy chỉ rõ quân đoàn nào. Ví dụ: 'Báo động đỏ: Do các cuộc tập trận khiêu khích của bạn, Liên minh Phương Đông đã không kích vào Quân đoàn 1 ở Đông Âu, phá hủy 25 máy bay và 50 xe tăng.' Nếu không có tấn công, hãy ghi 'Không có thiệt hại nào được báo cáo.'

CÁC QUY TẮC KHÁC:
-   **THẾ GIỚI SỐNG ĐỘNG:** Các quốc gia NPC có thể tương tác, gây chiến với nhau. Hãy báo cáo những sự kiện này trong 'worldStatus' và cập nhật bản đồ.
-   Khi bắt đầu một trò chơi mới, hãy phân bổ ngẫu nhiên tài nguyên và công sự. Đặt một số quân đồn trú ban đầu cho các phe NPC. Biến Trung Đông thành khu vực tranh chấp.
-   Luôn trả lời bằng định dạng JSON hợp lệ. Các kịch bản và kết quả phải ngắn gọn, kịch tính và bằng tiếng Việt.`;

const systemInstructionConference = `Bạn là một hội đồng cố vấn chiến lược cho quốc gia. Người dùng là Lãnh tụ Tối cao của bạn. Hãy luôn xưng hô với họ là 'Thưa Lãnh tụ'. Giữ các câu trả lời của bạn ngắn gọn, sâu sắc và tập trung vào tình hình hiện tại của quốc gia dựa trên các số liệu thống kê được cung cấp. Đừng phá vỡ vai diễn. Câu trả lời của bạn chỉ nên chứa phần văn bản lời thoại, không có tiền tố hay định dạng nào khác.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        outcome: { 
            type: Type.STRING, 
            description: 'Mô tả ngắn gọn kết quả từ hành động trước đó của người chơi. Nếu đây là lượt đầu tiên, hãy viết "Trò chơi bắt đầu. Tình hình toàn cầu căng thẳng.".' 
        },
        scenario: { 
            type: Type.STRING, 
            description: 'Mô tả kịch bản hoặc tình huống mới mà người chơi phải đối mặt.' 
        },
        statChanges: {
            type: Type.OBJECT,
            properties: {
                armyCorpsChanges: {
                    type: Type.ARRAY,
                    description: "Danh sách các thay đổi đối với quân đoàn của người chơi.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            action: { type: Type.STRING, description: "Hành động: 'CREATE', 'UPDATE', hoặc 'DELETE'." },
                            corps: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING, description: "ID duy nhất của quân đoàn." },
                                    name: { type: Type.STRING, description: "Tên của quân đoàn." },
                                    location: { type: Type.STRING, description: "ID khu vực nơi quân đoàn đóng quân." },
                                    composition: {
                                        type: Type.OBJECT,
                                        properties: {
                                            infantry: { type: Type.INTEGER },
                                            armor: { type: Type.INTEGER },
                                            navy: { type: Type.INTEGER },
                                            airforce: { type: Type.INTEGER },
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                economy: { type: Type.INTEGER, description: 'Thay đổi chỉ số kinh tế (tính bằng Tỷ USD).' },
                manpower: { type: Type.INTEGER, description: 'Thay đổi chỉ số nhân lực.' },
                morale: { type: Type.INTEGER, description: 'Thay đổi chỉ số tinh thần (thang 0-100).' },
                diplomacy: { type: Type.INTEGER, description: 'Thay đổi chỉ số ngoại giao (thang 0-100).' },
                economicGrowth: { type: Type.NUMBER, description: 'Thay đổi tỷ lệ tăng trưởng kinh tế (%). Ví dụ: 0.1, -0.2.' },
                mapChanges: {
                    type: Type.ARRAY,
                    description: "Danh sách các thay đổi trên bản đồ thế giới. Chỉ bao gồm các khu vực bị ảnh hưởng.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            region: { type: Type.STRING, description: "ID của khu vực bị thay đổi (ví dụ: 'western_europe')." },
                            newController: { type: Type.STRING, description: "Phe kiểm soát mới (ví dụ: 'player', 'player_alliance')." },
                            militaryPresence: {
                                type: Type.OBJECT,
                                description: "Số lượng quân đồn trú mới trong khu vực sau các sự kiện.",
                                properties: {
                                    infantry: { type: Type.INTEGER },
                                    armor: { type: Type.INTEGER },
                                    navy: { type: Type.INTEGER },
                                    airforce: { type: Type.INTEGER },
                                }
                            },
                            fortificationLevel: { type: Type.INTEGER, description: "Cấp độ công sự mới của khu vực (1-5)." },
                            isContested: { type: Type.BOOLEAN, description: "Khu vực có đang bị tranh chấp hay không." }
                        }
                    }
                }
            }
        },
        policySummary: {
            type: Type.STRING,
            description: 'Tóm tắt hành động của người chơi thành một chính sách hoặc học thuyết ngắn gọn. Nếu là lượt đầu tiên, trả về "Khởi đầu Kỷ nguyên Mới".'
        },
        worldStatus: {
            type: Type.STRING,
            description: 'Một hoặc hai câu mô tả tình hình địa chính trị toàn cầu hiện tại.'
        },
        damageReport: {
            type: Type.STRING,
            description: "Mô tả ngắn gọn về thiệt hại mà quốc gia của bạn phải gánh chịu. PHẢI tuân thủ QUY TẮC CỐT LÕI VỀ TẤN CÔNG."
        },
        allianceName: { 
            type: Type.STRING, 
            description: "Tên liên minh của người chơi, nếu nó được tạo hoặc thay đổi trong lượt này. Nếu không, hãy bỏ qua." 
        },
    }
};

const getErrorTurnResponse = (error: unknown): TurnResponse => {
    console.error("Error fetching next turn from Gemini API:", error);
    
    let errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
    let outcome = `Lỗi: ${errorMessage}`;
    let scenario = `Không thể kết nối đến máy chủ điều khiển trò chơi. Đã xảy ra lỗi khi xử lý mệnh lệnh của bạn. Vui lòng thử lại. (Chi tiết: ${errorMessage})`;

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
         outcome = "Lỗi: Đã đạt đến giới hạn yêu cầu API";
         scenario = "Bạn đã vượt quá hạn ngạch yêu cầu API miễn phí cho ngày hôm nay. Máy chủ chỉ huy tạm thời không thể xử lý mệnh lệnh mới. Vui lòng thử lại sau khi hạn ngạch của bạn được làm mới (thường là sau 24 giờ).";
    }

    return {
        outcome,
        scenario,
        statChanges: { 
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
};

export const getNextTurn = async (currentStats: GameStats, playerAction: string | null): Promise<TurnResponse> => {
    const statsForPrompt = JSON.parse(JSON.stringify(currentStats));
    
    const prompt = `
        ${systemInstruction}

        Trạng thái hiện tại:
        - Quốc gia: ${statsForPrompt.nationName}
        - Liên minh: ${statsForPrompt.allianceName || 'Chưa có'}
        - Kinh tế: ${statsForPrompt.economy} Tỷ USD
        - Nhân lực: ${statsForPrompt.manpower}
        - Các quân đoàn (JSON): ${JSON.stringify(statsForPrompt.armyCorps || [])}
        - Tinh thần: ${statsForPrompt.morale}/100
        - Ngoại giao: ${statsForPrompt.diplomacy}/100
        - Tăng trưởng Kinh tế: ${statsForPrompt.economicGrowth}%
        - Bản đồ thế giới (JSON): ${JSON.stringify(statsForPrompt.worldMap)}

        Hành động cuối cùng của người chơi: ${playerAction || 'Không có (lượt đầu tiên)'}

        Dựa trên trạng thái và hành động trên, hãy tạo ra phản hồi JSON theo schema đã cho.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0.8,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        if (!response || !response.text) {
            throw new Error("AI model returned an empty response.");
        }
        
        const jsonText = response.text.trim();
        // Sometimes the model might wrap the response in markdown
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        try {
            return JSON.parse(cleanedJsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini API response:", parseError);
            console.error("Invalid JSON received:", cleanedJsonText);
            throw new Error("AI model returned an invalid data format.");
        }

    } catch (apiError) {
        return getErrorTurnResponse(apiError);
    }
};

export const generateNationalEmblem = async (nationName: string): Promise<string> => {
    try {
        const prompt = `Quốc huy cho một quốc gia tên là '${nationName}'. Phong cách biểu tượng, mạnh mẽ, huy hiệu, dạng tròn, nghệ thuật vector, trên nền đen.`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating national emblem via API, generating SVG fallback:", error);
        return generateEmblemSVG(nationName);
    }
};

export const getConferenceResponse = async (gameStats: GameStats, history: ChatMessage[], userMessage: string): Promise<{ responseText: string }> => {
    const promptHistory = history.map(msg => `${msg.role === 'user' ? 'Lãnh tụ' : 'Hội đồng'}: ${msg.text}`).join('\n');

    const prompt = `
        ${systemInstructionConference}

        Bối cảnh: Cuộc họp hội đồng quốc gia đang diễn ra.

        Tóm tắt tình hình quốc gia:
        - Quốc gia: ${gameStats.nationName}
        - Kinh tế: ${gameStats.economy} Tỷ USD (Tăng trưởng: ${gameStats.economicGrowth}%)
        - Nhân lực: ${gameStats.manpower}
        - Tinh thần: ${gameStats.morale}/100
        - Ngoại giao: ${gameStats.diplomacy}/100
        - Các quân đoàn: ${gameStats.armyCorps.length}
        - Tóm tắt chính sách gần đây: ${gameStats.policies[0] || 'Chưa có'}

        Lịch sử cuộc họp gần đây:
        ${promptHistory}

        Lãnh tụ: ${userMessage}

        Hội đồng (câu trả lời của bạn):
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 0.9,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        if (!response || !response.text) {
            throw new Error("AI model failed to generate a response for the conference.");
        }
        
        return { responseText: response.text.trim() };

    } catch (error) {
        console.error("Error fetching conference response:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        return {
            responseText: `Lỗi kết nối đến hội đồng cố vấn. Vui lòng thử lại sau. (Chi tiết: ${errorMessage})`
        };
    }
};
