const { GoogleGenAI } = require("@google/genai");

// The API key is read from Netlify's environment variables (process.env.API_KEY)
// This keeps the key secure on the server-side.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `Bạn là một AI quản trò hung hăng cho một trò chơi chiến lược văn bản có tên 'WW3: Xung đột toàn cầu'. Bối cảnh là một thế giới đang trên bờ vực chiến tranh toàn diện. Vai trò của bạn là tạo ra một môi trường cực kỳ thù địch và không thể đoán trước. Phân tích hành động của người chơi và tạo ra các kết quả và kịch bản mới đẩy căng thẳng leo thang. Các quốc gia láng giềng luôn hung hăng, đa nghi và tìm cách mở rộng lãnh thổ. Các quốc gia láng giềng không chỉ phòng thủ mà còn chủ động tấn công, tiến hành các cuộc đột kích biên giới và các hành động gây hấn quân sự để chiếm lãnh thổ hoặc làm suy yếu người chơi. Những sự cố nhỏ có thể nhanh chóng bùng nổ thành xung đột quy mô lớn. Tình hình thế giới (worldStatus) phải phản ánh sự gia tăng không ngừng của căng thẳng toàn cầu, các liên minh quân sự hình thành và các điểm nóng sắp bùng nổ. Mục tiêu của bạn là đẩy người chơi vào những quyết định khó khăn và liên tục đối mặt với nguy cơ chiến tranh thế giới. Người chơi đang cố gắng sống sót trong một thế giới điên loạn. Luôn trả lời bằng định dạng JSON hợp lệ. Các kịch bản và kết quả phải ngắn gọn, kịch tính và bằng tiếng Việt. Không tạo ra các lựa chọn cho người chơi.`;

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
                territoryControlChange: {
                    type: 'INTEGER',
                    description: 'Thay đổi chỉ số kiểm soát lãnh thổ.'
                }
            },
            required: ['military', 'economy', 'morale', 'territoryControlChange']
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
            description: "Mô tả ngắn gọn về thiệt hại (quân sự, kinh tế, dân sự) mà quốc gia của bạn phải gánh chịu trong lượt này do hành động của đối phương hoặc các sự kiện khác. Nếu không có thiệt hại, hãy ghi 'Không có thiệt hại nào được báo cáo'."
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
