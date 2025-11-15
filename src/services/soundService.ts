

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
    | 'background_music'
    | 'background_music_2'
    | 'background_music_3';

// Use a single, valid, minimal WAV file for all sounds to prevent decoding errors.
// This ensures the app doesn't crash, even if sounds are repetitive placeholders.
const validTinyWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

const sounds: Record<SoundName, string> = {
    ui_click: validTinyWav,
    start_game: validTinyWav,
    send_command: validTinyWav,
    receive_response: validTinyWav,
    stat_increase: validTinyWav,
    stat_decrease: validTinyWav,
    game_over: validTinyWav,
    text_typing: validTinyWav,
    background_music: validTinyWav,
    background_music_2: validTinyWav,
    background_music_3: validTinyWav
};

let audioContext: AudioContext | null = null;
const audioBuffers: Partial<Record<SoundName, AudioBuffer>> = {};
let isInitialized = false;
let musicSourceNode: AudioBufferSourceNode | null = null;
const musicPlaylist: SoundName[] = ['background_music', 'background_music_2', 'background_music_3'];
let lastPlayedMusicIndex = -1;

const decodeBase64 = (base64: string) => {
    const base64String = base64.split(',')[1];
    if (!base64String) throw new Error("Invalid base64 string format.");
    const binaryString = window.atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

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
        return;
    }
    // Create a local constant to help TypeScript's control flow analysis
    const safeAudioContext = audioContext;
    try {
        const source = safeAudioContext.createBufferSource();
        source.buffer = audioBuffers[name]!;
        source.connect(safeAudioContext.destination);
        source.start(0);
    } catch (e) {
        console.error(`Error playing sound: ${name}`, e);
    }
};

const playMusic = () => {
    if (!isInitialized || !audioContext || musicSourceNode) return;
    const safeAudioContext = audioContext;

    let trackIndex;
    if (musicPlaylist.length > 1) {
        do {
            trackIndex = Math.floor(Math.random() * musicPlaylist.length);
        } while (trackIndex === lastPlayedMusicIndex);
    } else {
        trackIndex = 0;
    }
    lastPlayedMusicIndex = trackIndex;
    const trackToPlay = musicPlaylist[trackIndex];

    if (!audioBuffers[trackToPlay]) return;

    try {
        const source = safeAudioContext.createBufferSource();
        source.buffer = audioBuffers[trackToPlay]!;
        source.loop = true;
        
        const gainNode = safeAudioContext.createGain();
        gainNode.gain.setValueAtTime(0.25, safeAudioContext.currentTime); // 25% volume
        source.connect(gainNode);
        gainNode.connect(safeAudioContext.destination);

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

const isMusicPlaying = (): boolean => !!musicSourceNode;

export const soundService = {
    init,
    playSound,
    playMusic,
    stopMusic,
    isMusicPlaying,
};