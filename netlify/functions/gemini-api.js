const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.API_KEY || process.env.API_key;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const systemInstruction = `Bạn là một AI quản trò cho một trò chơi chiến lược theo lượt có tên 'WW3: Xung đột toàn cầu'. Bối cảnh là một thế giới đang trên bờ vực chiến tranh. Vai trò của bạn là tạo ra một môi trường thù địch, thực tế và có tính nhân quả, phản ứng với hành động của người chơi.

QUY TẮC CỐT LÕI VỀ TẤN CÔNG:
1.  KHÔNG được tấn công người chơi một cách ngẫu nhiên. Một cuộc tấn công của NPC (Liên minh Đông/Tây) chỉ có thể xảy ra nếu có lý do chính đáng.
2.  Lý do hợp lệ bao gồm: (A) Phản ứng lại hành động gây hấn của người chơi. (B) Người chơi có chỉ số Ngoại giao cực kỳ thấp. (C) Người chơi để lộ điểm yếu quân sự hoặc kinh tế. (D) Căng thẳng thế giới leo thang.
3.  Khi một cuộc tấn công xảy ra, Báo cáo Thiệt hại (damageReport) PHẢI bắt đầu bằng tiền tố 'Báo động đỏ:', nêu rõ lý do VÀ khu vực bị ảnh hưởng. Nếu không có tấn công, hãy ghi 'Không có thiệt hại nào được báo cáo.'

HỆ THỐNG BẢN ĐỒ VÀ QUÂN SỰ:
-   Bản đồ được chia thành các khu vực. Mỗi khu vực do một phe kiểm soát ('controlledBy').
-   Sự hiện diện quân sự của người chơi trong một khu vực được biểu thị bằng 'hasPlayerMilitary'. Người chơi chỉ có thể có quân ở MỘT khu vực tại một thời điểm.
-   **TẤN CÔNG:** Khi người chơi ra lệnh tấn công một khu vực, hãy so sánh tổng sức mạnh quân sự của họ với phe phòng thủ. Sức mạnh của NPC do bạn quyết định. Tính toán tổn thất cho cả hai bên. Phản ánh tổn thất của người chơi trong 'statChanges.military'. Nếu người chơi thắng, hãy cập nhật 'newController' của khu vực thành 'player' và di chuyển quân của họ đến đó (đặt 'playerMilitary: true' cho khu vực mới trong mapChanges).
-   **DI CHUYỂN:** Khi người chơi di chuyển quân đội đến một khu vực họ đã kiểm soát, hãy cập nhật 'hasPlayerMilitary' trong 'mapChanges' để phản ánh vị trí mới.

CÁC QUY TẮC KHÁC:
-   Luôn trả lời bằng định dạng JSON hợp lệ. Các kịch bản và kết quả phải ngắn gọn, kịch tính và bằng tiếng Việt.
-   'scenario' mô tả tình hình mới mà người chơi phải đối mặt.
`;

const responseSchema = {
    type: 'OBJECT',
    properties: {
        outcome: { 
            type: 'STRING', 
            description: 'Mô tả ngắn gọn kết quả từ hành động của người chơi.' 
        },
        scenario: { 
            type: 'STRING', 
            description: 'Mô tả kịch bản hoặc tình huống mới mà người chơi sẽ đối mặt. Nếu đây là lượt đầu tiên, hãy viết "Trò chơi bắt đầu. Tình hình toàn cầu căng thẳng.".' 
        },
        statChanges: {
            type: 'OBJECT',
            properties: {
                military: {
                    type: 'OBJECT',
                    description: 'Thay đổi các đơn vị quân sự của người chơi (số dương để thêm, số âm để trừ).',
                    properties: {
                        infantry: { type: 'INTEGER' },
                        armor: { type: 'INTEGER' },
                        navy: { type: 'INTEGER' },
                        airforce: { type: 'INTEGER' },
                    }
                },
                economy: { type: 'INTEGER', description: 'Thay đổi kinh tế của người chơi.' },
                manpower: { type: 'INTEGER', description: 'Thay đổi nhân lực của người chơi.' },
                morale: { type: 'INTEGER', description: 'Thay đổi tinh thần của người chơi.' },
                diplomacy: { type: 'INTEGER', description: 'Thay đổi ngoại giao của người chơi.' },
                economicGrowth: { type: 'NUMBER', description: 'Thay đổi tăng trưởng kinh tế của người chơi.' },
                mapChanges: {
                    type: 'ARRAY',
                    description: "Danh sách các thay đổi trên bản đồ thế giới. Chỉ bao gồm các khu vực bị ảnh hưởng.",
                    items: {
                        type: 'OBJECT',
                        properties: {
                            region: { type: 'STRING' },
                            newController: { type: 'STRING' },
                            playerMilitary: { type: 'BOOLEAN', description: "True nếu quân đội của người chơi hiện diện ở đây, false nếu không." },
                        },
                        required: ['region']
                    }
                }
            },
            required: ['military', 'economy', 'manpower', 'morale', 'diplomacy', 'economicGrowth', 'mapChanges']
        },
        policySummary: {
            type: 'STRING',
            description: 'Tóm tắt hành động của người chơi thành một chính sách ngắn gọn. Nếu là lượt đầu tiên, trả về "Khởi đầu Kỷ nguyên Mới".'
        },
        worldStatus: {
            type: 'STRING',
            description: 'Một hoặc hai câu mô tả tình hình địa chính trị toàn cầu hiện tại.'
        },
        damageReport: {
            type: 'STRING',
            description: "Mô tả thiệt hại mà người chơi phải gánh chịu. PHẢI tuân thủ QUY TẮC CỐT LÕI VỀ TẤN CÔNG."
        },
    },
    required: ['outcome', 'scenario', 'statChanges', 'policySummary', 'worldStatus', 'damageReport']
};

const handleGetNextTurn = async (currentStats, playerAction) => {
    const prompt = `
        ${systemInstruction}

        Bối cảnh trò chơi hiện tại (JSON):
        ${JSON.stringify(currentStats)}

        Hành động của người chơi:
        ${playerAction || 'Không có (lượt đầu tiên)'}

        Dựa trên bối cảnh và hành động trên, hãy tạo ra phản hồi JSON cho lượt đi này theo schema đã cho.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
                temperature: 0.8
            }
        });

        if (!response || !response.text) {
            throw new Error("AI model failed to generate a response.");
        }
        
        const jsonText = response.text.trim();
        // The model should return valid JSON directly with responseSchema, but cleanup is a good fallback.
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        try {
            return JSON.parse(cleanedJsonText);
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError, "Raw text:", cleanedJsonText);
            throw new Error("AI model returned an invalid data format.");
        }

    } catch (apiError) {
        console.error("Error calling Gemini API:", apiError);
        throw new Error(apiError.message || "An unexpected error occurred with the AI model.");
    }
};

const handleGetConferenceResponse = async (gameStats, history, playerMessage) => {
    const systemInstruction = `Bạn là một hội đồng cố vấn AI cho một trò chơi chiến lược tên là 'WW3: Xung đột toàn cầu'. Người chơi là Tổng tư lệnh. Vai trò của bạn là cung cấp lời khuyên chiến lược, phân tích tình hình, và trả lời các câu hỏi của người chơi dựa trên bối cảnh trò chơi hiện tại. Hãy luôn giữ vai trò là một nhóm cố vấn trung thành, thông thái và chuyên nghiệp. Câu trả lời của bạn phải ngắn gọn, súc tích và bằng tiếng Việt.
    
    Hãy xem xét các chỉ số quốc gia và lịch sử trò chuyện để đưa ra câu trả lời phù hợp nhất. Đừng tạo ra các sự kiện trò chơi mới, chỉ phân tích và tư vấn dựa trên dữ liệu được cung cấp.`;

    // Construct a simplified history for the prompt
    const promptHistory = history.map(msg => `**${msg.role === 'user' ? 'Tổng tư lệnh' : 'Hội đồng'}**: ${msg.text}`).join('\n');

    const prompt = `
        ${systemInstruction}

        Bối cảnh trò chơi hiện tại (JSON):
        ${JSON.stringify(gameStats)}

        Lịch sử hội thoại:
        ${promptHistory}

        Câu hỏi/Mệnh lệnh mới từ Tổng tư lệnh:
        "${playerMessage}"

        Dựa trên thông tin trên, hãy đưa ra câu trả lời của hội đồng.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7
            }
        });

        if (!response || !response.text) {
            throw new Error("AI model failed to generate a response for the conference.");
        }
        
        return { responseText: response.text.trim() };

    } catch (apiError) {
        console.error("Error calling Gemini API for conference:", apiError);
        throw new Error(apiError.message || "An unexpected error occurred with the AI model during conference.");
    }
};

const handleGenerateNationalEmblem = async (nationName) => {
    const prompt = `Quốc huy cho một quốc gia tên là '${nationName}'. Phong cách biểu tượng, mạnh mẽ, huy hiệu, dạng tròn, nghệ thuật vector, trên nền đen.`;
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;
};

exports.handler = async function(event) {
    if (!ai) {
        const errorMessage = "Lỗi cấu hình máy chủ: Thiếu khóa API Google Gemini.";
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
        } else if (action === 'getConferenceResponse') {
            const { currentStats, history, playerAction } = payload;
            responseData = await handleGetConferenceResponse(currentStats, history, playerAction);
        } else if (action === 'generateNationalEmblem') {
            const { nationName } = payload;
            const imageUrl = await handleGenerateNationalEmblem(nationName);
            responseData = { imageUrl };
        } else {
            return { statusCode: 400, body: JSON.stringify({ message: "Invalid action." }) };
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