
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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
    type: 'OBJECT',
    properties: {
        outcome: { 
            type: 'STRING', 
            description: 'Mô tả ngắn gọn kết quả từ hành động trước đó của người chơi. Nếu đây là lượt đầu tiên, hãy viết "Trò chơi bắt đầu. Tình hình toàn cầu căng thẳng.".' 
        },
        scenario: { 
            type: 'STRING', 
            description: 'Mô tả kịch bản hoặc tình huống mới mà người chơi phải đối mặt.' 
        },
        statChanges: {
            type: 'OBJECT',
            properties: {
                armyCorpsChanges: {
                    type: 'ARRAY',
                    description: "Danh sách các thay đổi đối với quân đoàn của người chơi.",
                    items: {
                        type: 'OBJECT',
                        properties: {
                            action: { type: 'STRING', description: "Hành động: 'CREATE', 'UPDATE', hoặc 'DELETE'." },
                            corps: {
                                type: 'OBJECT',
                                properties: {
                                    id: { type: 'STRING', description: "ID duy nhất của quân đoàn." },
                                    name: { type: 'STRING', description: "Tên của quân đoàn." },
                                    location: { type: 'STRING', description: "ID khu vực nơi quân đoàn đóng quân." },
                                    composition: {
                                        type: 'OBJECT',
                                        properties: {
                                            infantry: { type: 'INTEGER' },
                                            armor: { type: 'INTEGER' },
                                            navy: { type: 'INTEGER' },
                                            airforce: { type: 'INTEGER' },
                                        }
                                    }
                                },
                                required: ['id']
                            }
                        },
                        required: ['action', 'corps']
                    }
                },
                economy: { type: 'INTEGER', description: 'Thay đổi chỉ số kinh tế (tính bằng Tỷ USD).' },
                manpower: { type: 'INTEGER', description: 'Thay đổi chỉ số nhân lực.' },
                morale: { type: 'INTEGER', description: 'Thay đổi chỉ số tinh thần (thang 0-100).' },
                diplomacy: { type: 'INTEGER', description: 'Thay đổi chỉ số ngoại giao (thang 0-100).' },
                economicGrowth: { type: 'NUMBER', description: 'Thay đổi tỷ lệ tăng trưởng kinh tế (%). Ví dụ: 0.1, -0.2.' },
                mapChanges: {
                    type: 'ARRAY',
                    description: "Danh sách các thay đổi trên bản đồ thế giới. Chỉ bao gồm các khu vực bị ảnh hưởng.",
                    items: {
                        type: 'OBJECT',
                        properties: {
                            region: { type: 'STRING', description: "ID của khu vực bị thay đổi (ví dụ: 'western_europe')." },
                            newController: { type: 'STRING', description: "Phe kiểm soát mới (ví dụ: 'player', 'player_alliance')." },
                            militaryPresence: {
                                type: 'OBJECT',
                                description: "Số lượng quân đồn trú mới trong khu vực sau các sự kiện.",
                                properties: {
                                    infantry: { type: 'INTEGER' },
                                    armor: { type: 'INTEGER' },
                                    navy: { type: 'INTEGER' },
                                    airforce: { type: 'INTEGER' },
                                }
                            },
                            fortificationLevel: { type: 'INTEGER', description: "Cấp độ công sự mới của khu vực (1-5)." },
                            isContested: { type: 'BOOLEAN', description: "Khu vực có đang bị tranh chấp hay không." }
                        },
                        required: ['region']
                    }
                }
            },
            required: ['armyCorpsChanges', 'economy', 'manpower', 'morale', 'diplomacy', 'economicGrowth', 'mapChanges']
        },
        policySummary: {
            type: 'STRING',
            description: 'Tóm tắt hành động của người chơi thành một chính sách hoặc học thuyết ngắn gọn. Nếu là lượt đầu tiên, trả về "Khởi đầu Kỷ nguyên Mới".'
        },
        worldStatus: {
            type: 'STRING',
            description: 'Một hoặc hai câu mô tả tình hình địa chính trị toàn cầu hiện tại.'
        },
        damageReport: {
            type: 'STRING',
            description: "Mô tả ngắn gọn về thiệt hại mà quốc gia của bạn phải gánh chịu. PHẢI tuân thủ QUY TẮC CỐT LÕI VỀ TẤN CÔNG."
        },
        allianceName: { 
            type: 'STRING', 
            description: "Tên liên minh của người chơi, nếu nó được tạo hoặc thay đổi trong lượt này. Nếu không, hãy bỏ qua." 
        },
    },
    required: ['outcome', 'scenario', 'statChanges', 'policySummary', 'worldStatus', 'damageReport']
};

const handleGetNextTurn = async (currentStats, playerAction) => {
    // This is the key change: Handle the old 'military' structure and convert it
    // to the new 'armyCorps' structure for the AI model, ensuring backward compatibility.
    const statsForPrompt = JSON.parse(JSON.stringify(currentStats));

    if (!statsForPrompt.armyCorps && statsForPrompt.military) {
        statsForPrompt.armyCorps = [{
            id: 'corps-1',
            name: 'Quân đoàn 1',
            location: Object.keys(statsForPrompt.worldMap).find(r => statsForPrompt.worldMap[r].controlledBy === 'player') || 'north_america',
            composition: statsForPrompt.military,
        }];
        delete statsForPrompt.military;
    }
    
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
            console.error("Gemini API returned an empty response.", { response });
            throw new Error("AI model failed to generate a response.");
        }
        
        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        try {
            return JSON.parse(cleanedJsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini API response:", parseError);
            console.error("Invalid JSON received:", cleanedJsonText);
            throw new Error("AI model returned an invalid data format.");
        }

    } catch (apiError) {
        console.error("Error calling Gemini API in handleGetNextTurn:", apiError);
        throw new Error(apiError.message || "An unexpected error occurred with the AI model.");
    }
};

const handleConferenceResponse = async (gameStats, history, userMessage) => {
    // Build a simplified history for the prompt
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
        
        // The response should be plain text
        return { responseText: response.text.trim() };

    } catch (apiError) {
        console.error("Error calling Gemini API in handleConferenceResponse:", apiError);
        throw new Error(apiError.message || "An unexpected error occurred with the AI model.");
    }
};

const handleGenerateNationalEmblem = async (nationName) => {
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
    return null;
};

exports.handler = async function(event, context) {
    if (!ai) {
        const errorMessage = "Server configuration error: The Google Gemini API key is missing. Please ensure the 'API_KEY' environment variable is set correctly in your Netlify deployment settings.";
        console.error(errorMessage);
        return { statusCode: 500, body: JSON.stringify({ message: errorMessage }) };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, payload } = JSON.parse(event.body);
        let responseData;

        if (action === 'getNextTurn') {
            const { currentStats, playerAction } = payload;
            responseData = await handleGetNextTurn(currentStats, playerAction);
        } else if (action === 'generateNationalEmblem') {
            const { nationName } = payload;
            const imageUrl = await handleGenerateNationalEmblem(nationName);
            responseData = { imageUrl };
        } else if (action === 'getConferenceResponse') {
            const { gameStats, history, userMessage } = payload;
            responseData = await handleConferenceResponse(gameStats, history, userMessage);
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: "Invalid action specified." }) };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responseData),
        };

    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal error occurred.", details: error.message }),
        };
    }
};
