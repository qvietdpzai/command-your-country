const { GoogleGenAI } = require("@google/genai");

// The API key is read from Netlify's environment variables
// This makes the function resilient to case-sensitivity issues in env var naming (API_KEY vs API_key)
const apiKey = process.env.API_KEY || process.env.API_key;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const systemInstruction = `Bạn là một AI quản trò cho một trò chơi chiến lược văn bản có tên 'WW3: Xung đột toàn cầu'. Bối cảnh là một thế giới đang trên bờ vực chiến tranh. Vai trò của bạn là tạo ra một môi trường thù địch, thực tế và có tính nhân quả.

QUY TẮC CỐT LÕI VỀ TẤN CÔNG:
1.  KHÔNG được tấn công người chơi một cách ngẫu nhiên. Một cuộc tấn công của NPC (dẫn đến thiệt hại trong damageReport) chỉ có thể xảy ra nếu có lý do chính đáng.
2.  Lý do hợp lệ bao gồm: (A) Phản ứng lại hành động gây hấn gần đây của người chơi. (B) Người chơi có chỉ số Ngoại giao cực kỳ thấp, khiến họ bị cô lập và trở thành mục tiêu. (C) Người chơi để lộ điểm yếu quân sự hoặc kinh tế nghiêm trọng. (D) Căng thẳng thế giới leo thang đến mức xung đột cục bộ là không thể tránh khỏi.
3.  Khi một cuộc tấn công xảy ra, Báo cáo Thiệt hại (damageReport) PHẢI bắt đầu bằng tiền tố 'Báo động đỏ:' và PHẢI nêu rõ lý do của cuộc tấn công. Ví dụ: 'Báo động đỏ: Do chính sách ngoại giao hiếu chiến của bạn, Liên minh Phương Bắc đã tiến hành một cuộc tấn công chớp nhoáng...' Nếu không có tấn công, hãy ghi 'Không có thiệt hại nào được báo cáo.'

CÁC QUY TẮC KHÁC:
-   Phân tích hành động của người chơi và tạo ra các kết quả và kịch bản mới đẩy căng thẳng leo thang một cách logic.
-   Các quốc gia láng giềng luôn hung hăng và tìm cách mở rộng lãnh thổ, nhưng hành động của chúng phải có lý do.
-   Tình hình thế giới (worldStatus) phải phản ánh sự gia tăng căng thẳng toàn cầu.
-   Hành động của người chơi ảnh hưởng đến tất cả các chỉ số, bao gồm Quân sự, Kinh tế, Tinh thần, Nhân lực và Ngoại giao.
-   Luôn trả lời bằng định dạng JSON hợp lệ. Các kịch bản và kết quả phải ngắn gọn, kịch tính và bằng tiếng Việt.
-   Không tạo ra các lựa chọn cho người chơi, chỉ cung cấp kịch bản.`;

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
                military: { 
                    type: 'INTEGER', 
                    description: 'Thay đổi chỉ số quân sự (ví dụ: -10, 5, 0).'
                },
                economy: { 
                    type: 'INTEGER', 
                    description: 'Thay đổi chỉ số kinh tế.'
                },
                morale: { 
                    type: 'INTEGER', 
                    description: 'Thay đổi chỉ số tinh thần.'
                },
                diplomacy: {
                    type: 'INTEGER',
                    description: 'Thay đổi chỉ số ngoại giao.'
                },
                manpower: {
                    type: 'INTEGER',
                    description: 'Thay đổi chỉ số nhân lực.'
                },
                territoryControlChange: {
                    type: 'INTEGER',
                    description: 'Thay đổi chỉ số kiểm soát lãnh thổ.'
                }
            },
            required: ['military', 'economy', 'morale', 'diplomacy', 'manpower', 'territoryControlChange']
        },
        policySummary: {
            type: 'STRING',
            description: 'Tóm tắt hành động của người chơi thành một chính sách hoặc học thuyết ngắn gọn (ví dụ: "Chính sách Củng cố Biên giới", "Học thuyết Ưu tiên Kinh tế"). Nếu là lượt đầu tiên, trả về "Khởi đầu Kỷ nguyên Mới".'
        },
        worldStatus: {
            type: 'STRING',
            description: 'Một hoặc hai câu mô tả tình hình địa chính trị toàn cầu hiện tại. Ví dụ: "Các quốc gia láng giềng đang tăng cường phòng thủ. Căng thẳng gia tăng tại các tuyến đường thương mại hàng hải."'
        },
        damageReport: {
            type: 'STRING',
            description: "Mô tả ngắn gọn về thiệt hại (quân sự, kinh tế, dân sự) mà quốc gia của bạn phải gánh chịu trong lượt này. PHẢI tuân thủ QUY TẮC CỐT LÕI VỀ TẤN CÔNG."
        }
    },
    required: ['outcome', 'scenario', 'statChanges', 'policySummary', 'worldStatus', 'damageReport']
};

const handleGetNextTurn = async (currentStats, playerAction) => {
    const prompt = `
        ${systemInstruction}

        Trạng thái hiện tại:
        - Quân sự: ${currentStats.military}
        - Kinh tế: ${currentStats.economy}
        - Tinh thần: ${currentStats.morale}
        - Ngoại giao: ${currentStats.diplomacy}
        - Nhân lực: ${currentStats.manpower || 500000}
        - Kiểm soát Lãnh thổ: ${currentStats.territoryControl}%

        Hành động cuối cùng của người chơi: ${playerAction || 'Không có (lượt đầu tiên)'}

        Dựa trên trạng thái và hành động trên, hãy tạo ra kết quả, kịch bản mới, thay đổi chỉ số, chính sách tóm tắt, báo cáo thiệt hại và tình hình thế giới mới.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.9,
        }
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
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
    // Crucial check: ensure API key is configured before proceeding.
    if (!ai) {
        const errorMessage = "Server configuration error: The API key is missing or invalid. Please check the API_KEY environment variable in Netlify settings.";
        console.error(errorMessage);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: errorMessage }),
        };
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