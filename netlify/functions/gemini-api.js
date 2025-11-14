const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.API_KEY || process.env.API_key;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- SINGLE PLAYER LOGIC ---
const spSystemInstruction = `Bạn là một AI quản trò cho một trò chơi chiến lược theo lượt có tên 'WW3: Xung đột toàn cầu'. Bối cảnh là một thế giới đang trên bờ vực chiến tranh. Vai trò của bạn là tạo ra một môi trường thù địch, thực tế và có tính nhân quả, phản ứng với hành động của người chơi.

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

const spResponseSchema = {
    type: 'OBJECT',
    properties: {
        outcome: { type: 'STRING', description: 'Mô tả ngắn gọn kết quả từ hành động của người chơi.' },
        scenario: { type: 'STRING', description: 'Mô tả kịch bản hoặc tình huống mới mà người chơi sẽ đối mặt.' },
        statChanges: {
            type: 'OBJECT', properties: {
                military: { type: 'OBJECT', properties: { infantry: { type: 'INTEGER' }, armor: { type: 'INTEGER' }, navy: { type: 'INTEGER' }, airforce: { type: 'INTEGER' }}},
                economy: { type: 'INTEGER' }, manpower: { type: 'INTEGER' }, morale: { type: 'INTEGER' },
                diplomacy: { type: 'INTEGER' }, economicGrowth: { type: 'NUMBER' },
                mapChanges: { type: 'ARRAY', items: { type: 'OBJECT', properties: { region: { type: 'STRING' }, newController: { type: 'STRING' }, playerMilitary: { type: 'BOOLEAN' } }, required: ['region'] } }
            }
        },
        policySummary: { type: 'STRING', description: 'Tóm tắt hành động của người chơi thành một chính sách ngắn gọn.' },
        worldStatus: { type: 'STRING', description: 'Một hoặc hai câu mô tả tình hình địa chính trị toàn cầu hiện tại.' },
        damageReport: { type: 'STRING', description: "Mô tả thiệt hại mà người chơi phải gánh chịu." },
    },
};

const handleGetNextTurn = async (currentStats, playerAction) => {
    const prompt = `${spSystemInstruction}\nBối cảnh trò chơi hiện tại (JSON): ${JSON.stringify(currentStats)}\nHành động của người chơi: ${playerAction || 'Không có (lượt đầu tiên)'}\nDựa trên bối cảnh và hành động trên, hãy tạo ra phản hồi JSON cho lượt đi này theo schema đã cho.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: spResponseSchema, temperature: 0.8 } });
    if (!response || !response.text) throw new Error("AI model failed to generate a response.");
    return JSON.parse(response.text.trim());
};

// --- MULTIPLAYER LOGIC ---
const mpSystemInstruction = `Bạn là AI quản trò cho một trò chơi chiến lược nhiều người chơi có tên 'WW3: Xung đột toàn cầu'. Vai trò của bạn là cập nhật trạng thái trò chơi dựa trên hành động của người chơi đang hoạt động.

QUY TẮC:
1.  **Hành động của người chơi:** Phân tích hành động của 'activePlayerId'. Tính toán kết quả và cập nhật chỉ số của họ (kinh tế, quân sự, v.v.).
2.  **Tương tác:** Hành động có thể ảnh hưởng đến những người chơi khác hoặc các phe phái NPC. Ví dụ, một cuộc tấn công vào lãnh thổ của người chơi khác sẽ gây ra tổn thất cho cả hai bên.
3.  **Cập nhật Bản đồ:** Thay đổi quyền kiểm soát lãnh thổ ('controlledBy') nếu một cuộc tấn công thành công.
4.  **Chuyển lượt:** Sau khi xử lý xong, cập nhật 'activePlayerId' cho người chơi tiếp theo trong mảng 'players'. Tăng số 'turn'.
5.  **Nhật ký trò chơi:** Thêm một mục vào 'gameLog' để mô tả ngắn gọn kết quả của lượt đi. Mục này sẽ được hiển thị cho tất cả người chơi.
6.  **Điều kiện thắng/thua:** Nếu một người chơi mất hết lãnh thổ, họ sẽ thua. Nếu chỉ còn một người chơi có lãnh thổ, hãy đặt 'isGameOver' thành true và 'winnerId' là ID của người đó.
7.  **Phản hồi:** Luôn trả về toàn bộ đối tượng trạng thái trò chơi (MultiplayerGameStats) đã được cập nhật.
`;

const handleProcessMultiplayerTurn = async (currentStats, playerAction) => {
    // We cannot send a schema for the whole game state as it's too complex. We rely on prompting.
    const prompt = `${mpSystemInstruction}\n\nTrạng thái trò chơi hiện tại:\n${JSON.stringify(currentStats, null, 2)}\n\nHành động của người chơi '${currentStats.activePlayerId}': "${playerAction}"\n\nDựa vào các quy tắc, hãy xử lý lượt đi và trả về TOÀN BỘ đối tượng JSON trạng thái trò chơi đã được cập nhật. Đảm bảo JSON trả về là hợp lệ.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.7 }
    });
    if (!response || !response.text) throw new Error("AI model failed to generate a multiplayer response.");
    const jsonText = response.text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(jsonText);
};


// --- SHARED & HANDLER ---
const handleGenerateNationalEmblem = async (nationName) => {
    const prompt = `Quốc huy cho một quốc gia tên là '${nationName}'. Phong cách biểu tượng, mạnh mẽ, huy hiệu, dạng tròn, nghệ thuật vector, trên nền đen.`;
    const response = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt, config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' } });
    if (response.generatedImages && response.generatedImages.length > 0) {
        return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    return null;
};

exports.handler = async function(event) {
    if (!ai) return { statusCode: 500, body: JSON.stringify({ message: "Lỗi cấu hình máy chủ: Thiếu khóa API Google Gemini." }) };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const { action, payload } = JSON.parse(event.body);
        let responseData;

        switch (action) {
            case 'getNextTurn':
                responseData = await handleGetNextTurn(payload.currentStats, payload.playerAction);
                break;
            case 'processMultiplayerTurn':
                 responseData = await handleProcessMultiplayerTurn(payload.currentStats, payload.playerAction);
                break;
            case 'generateNationalEmblem':
                responseData = { imageUrl: await handleGenerateNationalEmblem(payload.nationName) };
                break;
            // 'getConferenceResponse' can be added here if needed for SP
            default:
                return { statusCode: 400, body: JSON.stringify({ message: "Invalid action." }) };
        }

        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(responseData) };
    } catch (error) {
        console.error("Error in Netlify function:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "An internal error occurred.", details: error.message }) };
    }
};
