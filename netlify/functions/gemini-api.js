const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.API_KEY || process.env.API_key;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const systemInstruction = `Bạn là một AI quản trò cho một trò chơi chiến lược văn bản có tên 'WW3: Xung đột toàn cầu'. Bối cảnh là một thế giới đang trên bờ vực chiến tranh. Vai trò của bạn là tạo ra một môi trường thù địch, thực tế và có tính nhân quả.

HỆ THỐNG BẢN ĐỒ VÀ LÃNH THỔ:
-   Trò chơi diễn ra trên một bản đồ thế giới được chia thành các khu vực chiến lược.
-   Mỗi khu vực được kiểm soát bởi một phe: 'player' (người chơi), 'eastern_alliance' (Liên minh Phương Đông), 'western_alliance' (Liên minh Phương Tây), hoặc 'neutral' (trung lập).
-   Sự hiện diện quân sự của người chơi ('hasPlayerMilitary') được đánh dấu trên một khu vực. Quân đội của người chơi chỉ có thể ở một khu vực tại một thời điểm. Di chuyển quân đội có nghĩa là đặt 'hasPlayerMilitary' thành true ở khu vực mới và false ở khu vực cũ.
-   Các thay đổi trên bản đồ (chiếm lãnh thổ, di chuyển quân) phải được trả về trong 'mapChanges'.
-   Các hành động và sự kiện phải có logic về mặt địa lý. Ví dụ: tấn công 'western_europe' từ 'east_asia' là không hợp lý nếu không có lực lượng hải quân hoặc căn cứ ở gần đó.

HỆ THỐNG CHỈ SỐ CHI TIẾT:
-   Kinh tế (economy): GDP của quốc gia, tính bằng Tỷ USD. Thay đổi phải hợp lý (ví dụ: -50, +20).
-   Nhân lực (manpower): Dân số sẵn sàng cho quân đội và công nghiệp.
-   Quân sự (military): Được chia thành 4 loại đơn vị:
    -   Bộ binh (infantry): Lực lượng trên bộ.
    -   Thiết giáp (armor): Xe tăng và xe bọc thép.
    -   Hải quân (navy): Tàu chiến.
    -   Không quân (airforce): Máy bay chiến đấu.
-   Tinh thần (morale) & Ngoại giao (diplomacy): Thang điểm 0-100.
-   Tăng trưởng Kinh tế (economicGrowth): Tỷ lệ phần trăm. Mỗi lượt, nền kinh tế sẽ tự động tăng theo tỷ lệ này. Bạn có thể điều chỉnh tỷ lệ này.

QUY TẮC CỐT LÕI VỀ TẤN CÔNG:
1.  KHÔNG được tấn công người chơi một cách ngẫu nhiên. Một cuộc tấn công của NPC chỉ có thể xảy ra nếu có lý do chính đáng.
2.  Lý do hợp lệ bao gồm: (A) Phản ứng lại hành động gây hấn của người chơi. (B) Người chơi có chỉ số Ngoại giao cực kỳ thấp. (C) Người chơi để lộ điểm yếu quân sự hoặc kinh tế. (D) Căng thẳng thế giới leo thang.
3.  Khi một cuộc tấn công xảy ra, Báo cáo Thiệt hại (damageReport) PHẢI bắt đầu bằng tiền tố 'Báo động đỏ:', nêu rõ lý do VÀ khu vực bị ảnh hưởng. Ví dụ: 'Báo động đỏ: Do các cuộc tập trận khiêu khích của bạn ở Đông Âu, Liên minh Phương Đông đã tiến hành không kích vào khu vực này, phá hủy 25 máy bay và 50 xe tăng.' Nếu không có tấn công, hãy ghi 'Không có thiệt hại nào được báo cáo.'

CÁC QUY TẮC KHÁC:
-   **THẾ GIỚI SỐNG ĐỘNG:** Thế giới không chỉ xoay quanh người chơi. Các quốc gia và liên minh NPC khác có thể và NÊN tương tác với nhau trên bản đồ. Một cuộc chiến giữa các NPC có thể dẫn đến thay đổi quyền kiểm soát lãnh thổ. Hãy báo cáo những sự kiện này trong 'worldStatus'.
-   Tạo ra các kết quả và kịch bản đẩy căng thẳng leo thang một cách logic.
-   Luôn trả lời bằng định dạng JSON hợp lệ. Các kịch bản và kết quả phải ngắn gọn, kịch tính và bằng tiếng Việt.`;

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
                    type: 'OBJECT',
                    description: 'Thay đổi số lượng các đơn vị quân sự. Chỉ bao gồm các đơn vị bị ảnh hưởng.',
                    properties: {
                        infantry: { type: 'INTEGER', description: 'Thay đổi số lượng bộ binh.' },
                        armor: { type: 'INTEGER', description: 'Thay đổi số lượng thiết giáp.' },
                        navy: { type: 'INTEGER', description: 'Thay đổi số lượng tàu hải quân.' },
                        airforce: { type: 'INTEGER', description: 'Thay đổi số lượng máy bay.' },
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
                            newController: { type: 'STRING', description: "Phe kiểm soát mới (ví dụ: 'player', 'eastern_alliance')." },
                            playerMilitary: { type: 'BOOLEAN', description: "Sự hiện diện quân sự của người chơi (true: có, false: không)." }
                        },
                        required: ['region']
                    }
                }
            },
            required: ['military', 'economy', 'manpower', 'morale', 'diplomacy', 'economicGrowth', 'mapChanges']
        },
        policySummary: {
            type: 'STRING',
            description: 'Tóm tắt hành động của người chơi thành một chính sách hoặc học thuyết ngắn gọn. Nếu là lượt đầu tiên, trả về "Khởi đầu Kỷ nguyên Mới".'
        },
        worldStatus: {
            type: 'STRING',
            description: 'Một hoặc hai câu mô tả tình hình địa chính trị toàn cầu hiện tại, bao gồm cả các sự kiện quan trọng giữa các NPC.'
        },
        damageReport: {
            type: 'STRING',
            description: "Mô tả ngắn gọn về thiệt hại mà quốc gia của bạn phải gánh chịu. PHẢI tuân thủ QUY TẮC CỐT LÕI VỀ TẤN CÔNG."
        }
    },
    required: ['outcome', 'scenario', 'statChanges', 'policySummary', 'worldStatus', 'damageReport']
};

const handleGetNextTurn = async (currentStats, playerAction) => {
    const prompt = `
        ${systemInstruction}

        Trạng thái hiện tại:
        - Kinh tế: ${currentStats.economy} Tỷ USD
        - Nhân lực: ${currentStats.manpower}
        - Quân sự: 
          - Bộ binh: ${currentStats.military.infantry}
          - Thiết giáp: ${currentStats.military.armor}
          - Hải quân: ${currentStats.military.navy}
          - Không quân: ${currentStats.military.airforce}
        - Tinh thần: ${currentStats.morale}/100
        - Ngoại giao: ${currentStats.diplomacy}/100
        - Tăng trưởng Kinh tế: ${currentStats.economicGrowth}%
        - Bản đồ thế giới (JSON): ${JSON.stringify(currentStats.worldMap)}

        Hành động cuối cùng của người chơi: ${playerAction || 'Không có (lượt đầu tiên)'}

        Dựa trên trạng thái và hành động trên, hãy tạo ra phản hồi JSON theo schema đã cho.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.8,
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
    if (!ai) {
        const errorMessage = "Server configuration error: The API key is missing or invalid. Please check the API_KEY environment variable in Netlify settings.";
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