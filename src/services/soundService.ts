// Define sound types
export type SoundName =
    | 'ui_click'
    | 'start_game'
    | 'send_command'
    | 'receive_response'
    | 'stat_increase'
    | 'stat_decrease'
    | 'game_over'
    | 'text_typing'
    | 'background_music';

// Store audio data as base64 to keep it self-contained
// Corrected base64 strings to prevent 'atob' encoding errors.
const sounds: Record<SoundName, string> = {
    ui_click: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
    start_game: 'data:audio/wav;base64,UklGRkgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhGAAAAA8/iIyNj5CRkpOUlZaXmJqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==',
    send_command: 'data:audio/wav;base64,UklGRiIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhPAAAAP////8AAP////8AAP////8AAP////8AAP////8AAP////8AAP////8AAP////8AAP////8AAP////8AAP////8A==',
    receive_response: 'data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhVwAAAP9/AIAAAQGCAAEBBwD/f/5//f/6//f/8//r/+f/5//n/+f/6P/q/+r/7P/u/+7/7//w//H/9P/1/Pb/9v/3//j/+f/7//z//P/9//4//v/+AAAAAA==',
    stat_increase: 'data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhUAAAAH6Ag4SKhYOEg4B+fHx6eXh2dnRzcXBvbm1sbWpqaWhnZ2ZlZmRjZGFgX15dW1tZWFhXVlVUVFNSUU9OTUxLSklIR0ZFRENCQUA/Pjw7Ojk4NzY1NDMyMTAwLy4tLCsmJSQlIiEgICAfHh0cHBsaGRgXFhUUExMRCw==',
    stat_decrease: 'data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhUAAAAA8PERMWFxsZGhscHR4gISIjJCUmKCkqKywtLzEyMzQ1Njc5Ojs8PT5AQUJERUZISUpMTU5QUVJTVFVWV1hZWltcXV5gYWJjZGVmZ2hpago=',
    game_over: 'data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhTAAAAMrKzM7P0NLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=',
    text_typing: 'data:audio/wav;base64,UklGRkYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhBgAAAP8/vw==',
    background_music: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tQxAADB8g/AALeAAAA4AAAnEMlJlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVnaWduZg=='
};

let audioContext: AudioContext | null = null;
const audioBuffers: Partial<Record<SoundName, AudioBuffer>> = {};
let isInitialized = false;
let musicSourceNode: AudioBufferSourceNode | null = null;

// Function to decode Base64
const decodeBase64 = (base64: string) => {
    const base64String = base64.split(',')[1];
    if (!base64String) {
        throw new Error("Invalid base64 string format.");
    }
    const binaryString = window.atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Initialize AudioContext on first user interaction
const init = async () => {
    if (isInitialized || !window.AudioContext) return;
    try {
        audioContext = new AudioContext();
        await Promise.all(
            Object.keys(sounds).map(async (key) => {
                const name = key as SoundName;
                const arrayBuffer = decodeBase64(sounds[name]);
                if(audioContext) {
                    audioBuffers[name] = await audioContext.decodeAudioData(arrayBuffer);
                }
            })
        );
        isInitialized = true;
    } catch (e) {
        console.error("Could not initialize audio context or decode audio data", e);
    }
};

const playSound = (name: SoundName) => {
    if (!isInitialized || !audioContext || !audioBuffers[name]) {
        // Silently fail if not ready, to not interrupt gameplay
        return;
    }

    try {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[name]!;
        source.connect(audioContext.destination);
        source.start(0);
    } catch (e) {
        console.error(`Error playing sound: ${name}`, e);
    }
};

const playMusic = () => {
    if (!isInitialized || !audioContext || !audioBuffers['background_music'] || musicSourceNode) {
        return;
    }
    try {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers['background_music']!;
        source.loop = true;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime); // 25% volume for background
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start(0);
        musicSourceNode = source;
    } catch (e) {
        console.error(`Error playing music`, e);
    }
};

const stopMusic = () => {
    if (musicSourceNode) {
        musicSourceNode.stop();
        musicSourceNode = null;
    }
};

const isMusicPlaying = (): boolean => {
    return !!musicSourceNode;
};

export const soundService = {
    init,
    playSound,
    playMusic,
    stopMusic,
    isMusicPlaying,
};