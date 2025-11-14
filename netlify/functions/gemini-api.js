
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.API_KEY || process.env.API_key;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const systemInstruction = `Bạn là một AI quản trò cho một trò chơi chiến lược theo lượt có tên 'WW3: Xung đột toàn cầu' cho 2-4 người chơi. Bối cảnh là một thế giới đang trên bờ vực chiến tranh. Vai trò của bạn là tạo ra một môi trường thù địch, thực tế và có tính nhân quả, phản ứng với hành động của người chơi hiện tại trong bối cảnh toàn cầu.

QUY TẮC NHIỀU NGƯỜI CHƠI:
-   Trò chơi diễn ra theo lượt. Bạn sẽ được cung cấp trạng thái của tất cả người chơi, nhưng bạn phải tập trung vào hành động của 'currentPlayer'.
-   Mục tiêu của mỗi người chơi là trở thành người sống sót cuối cùng bằng cách chiếm lãnh thổ và loại bỏ những người khác.
-   Người chơi bị loại khi họ không còn kiểm soát bất kỳ lãnh thổ nào.
-   Các phe NPC (Liên minh Đông/Tây) cũng là những người tham gia tích cực. Họ có thể tấn công người chơi hoặc lẫn nhau.

HỆ THỐNG BẢN ĐỒ VÀ QUÂN SỰ:
-   Bản đồ được chia thành các khu vực. Mỗi khu vực do một phe kiểm soát ('controlledBy').
-   Sự hiện diện quân sự của một người chơi trong một khu vực được biểu thị bằng 'militaryPresence' trong 'RegionState'. Một người chơi chỉ có thể có quân ở MỘT khu vực tại một thời điểm.
-   **TẤN CÔNG:** Khi người chơi hiện tại ra lệnh tấn công một khu vực, hãy so sánh tổng sức mạnh quân sự của họ với phe phòng thủ.
    -   Nếu khu vực phòng thủ do NPC kiểm soát, hãy tự quyết định sức mạnh của họ.
    -   Nếu khu vực phòng thủ do người chơi khác kiểm soát, hãy sử dụng sức mạnh quân sự của người chơi đó để tính toán.
    -   Tính toán tổn thất cho cả hai bên. Phản ánh tổn thất của người chơi tấn công trong 'statChanges.military'.
    -   Nếu người chơi tấn công thắng, hãy cập nhật 'newController' của khu vực thành phe của họ trong 'mapChanges'.
-   **DI CHUYỂN:** Khi người chơi di chuyển quân đội đến một khu vực họ kiểm soát, hãy cập nhật 'militaryPresence' trong 'mapChanges' để phản ánh vị trí mới, xóa bỏ vị trí cũ.

QUY TẮC CỐT LÕI VỀ TẤN CÔNG:
1.  KHÔNG được tấn công người chơi một cách ngẫu nhiên. Một cuộc tấn công của NPC chỉ có thể xảy ra nếu có lý do chính đáng.
2.  Lý do hợp lệ bao gồm: (A) Phản ứng lại hành động gây hấn của người chơi. (B) Người chơi có chỉ số Ngoại giao cực kỳ thấp. (C) Người chơi để lộ điểm yếu quân sự hoặc kinh tế. (D) Căng thẳng thế giới leo thang.
3.  Khi một cuộc tấn công xảy ra, Báo cáo Thiệt hại (damageReport) PHẢI bắt đầu bằng tiền tố 'Báo động đỏ:', nêu rõ lý do VÀ khu vực bị ảnh hưởng. Nếu không có tấn công, hãy ghi 'Không có thiệt hại nào được báo cáo.'

CÁC QUY TẮC KHÁC:
-   Luôn trả lời bằng định dạng JSON hợp lệ. Các kịch bản và kết quả phải ngắn gọn, kịch tính và bằng tiếng Việt.
-   'scenario' phải được viết cho người chơi tiếp theo, mô tả tình hình mà họ phải đối mặt sau lượt đi của người chơi hiện tại.
`;

const responseSchema = {
    type: 'OBJECT',
    properties: {
        outcome: { 
            type: 'STRING', 
            description: 'Mô tả ngắn gọn kết quả từ hành động của người chơi hiện tại.' 
        },
        scenario: { 
            type: 'STRING', 
            description: 'Mô tả kịch bản hoặc tình huống mới mà người chơi TIẾP THEO sẽ đối mặt. Nếu đây là lượt đầu tiên của trò chơi, hãy viết "Trò chơi bắt đầu. Tình hình toàn cầu căng thẳng.".' 
        },
        statChanges: {
            type: 'OBJECT',
            properties: {
                military: {
                    type: 'OBJECT',
                    description: 'Thay đổi các đơn vị quân sự của người chơi HIỆN TẠI (số dương để thêm, số âm để trừ).',
                    properties: {
                        infantry: { type: 'INTEGER' },
                        armor: { type: 'INTEGER' },
                        navy: { type: 'INTEGER' },
                        airforce: { type: 'INTEGER' },
                    }
                },
                economy: { type: 'INTEGER', description: 'Thay đổi kinh tế của người chơi hiện tại.' },
                manpower: { type: 'INTEGER', description: 'Thay đổi nhân lực của người chơi hiện tại.' },
                morale: { type: 'INTEGER', description: 'Thay đổi tinh thần của người chơi hiện tại.' },
                diplomacy: { type: 'INTEGER', description: 'Thay đổi ngoại giao của người chơi hiện tại.' },
                economicGrowth: { type: 'NUMBER', description: 'Thay đổi tăng trưởng kinh tế của người chơi hiện tại.' },
                mapChanges: {
                    type: 'ARRAY',
                    description: "Danh sách các thay đổi trên bản đồ thế giới. Chỉ bao gồm các khu vực bị ảnh hưởng.",
                    items: {
                        type: 'OBJECT',
                        properties: {
                            region: { type: 'STRING' },
                            newController: { type: 'STRING' },
                            militaryPresence: { type: 'STRING', description: "FactionID của người chơi có quân ở đây, hoặc null để xóa." },
                        },
                        required: ['region']
                    }
                }
            },
            required: ['military', 'economy', 'manpower', 'morale', 'diplomacy', 'economicGrowth', 'mapChanges']
        },
        policySummary: {
            type: 'STRING',
            description: 'Tóm tắt hành động của người chơi hiện tại thành một chính sách ngắn gọn. Nếu là lượt đầu tiên, trả về "Khởi đầu Kỷ nguyên Mới".'
        },
        worldStatus: {
            type: 'STRING',
            description: 'Một hoặc hai câu mô tả tình hình địa chính trị toàn cầu hiện tại.'
        },
        damageReport: {
            type: 'STRING',
            description: "Mô tả thiệt hại mà người chơi HIỆN TẠI phải gánh chịu. PHẢI tuân thủ QUY TẮC CỐT LÕI VỀ TẤN CÔNG."
        },
    },
    required: ['outcome', 'scenario', 'statChanges', 'policySummary', 'worldStatus', 'damageReport']
};

const handleGetNextTurn = async (currentStats, playerAction, currentPlayerIndex) => {
    const currentPlayer = currentStats.players[currentPlayerIndex];
    
    const playerSummaries = currentStats.players.map((p, index) => 
        `- ${p.nationName} (${`player_${p.playerNumber}`}): ${p.isEliminated ? 'Đã bị loại' : 'Còn chơi'}. Quân sự: ${Object.values(p.military).reduce((a,b)=>a+b,0)}. Kinh tế: ${p.economy}. Tinh thần: ${p.morale}.`
    ).join('\n');

    const prompt = `
        ${systemInstruction}

        Bối cảnh trò chơi:
        - Lượt số: ${currentStats.turnNumber}
        - Tổng quan người chơi:
        ${playerSummaries}
        - Bản đồ thế giới (JSON): ${JSON.stringify(currentStats.worldMap)}

        Lượt của người chơi hiện tại:
        - Quốc gia: ${currentPlayer.nationName} (${`player_${currentPlayer.playerNumber}`})
        - Hành động: ${playerAction || 'Không có (lượt đầu tiên)'}

        Dựa trên bối cảnh và hành động trên, hãy tạo ra phản hồi JSON cho lượt của người chơi hiện tại theo schema đã cho.
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

const handleGenerateNationalEmblem = async (nationName) => {
    // This function remains unchanged for multiplayer
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
            const { currentStats, playerAction, currentPlayerIndex } = payload;
            responseData = await handleGetNextTurn(currentStats, playerAction, currentPlayerIndex);
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
