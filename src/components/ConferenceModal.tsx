
import React, { useState, useEffect, useRef } from 'react';
import { GameStats, ChatMessage } from '../types';
import { getConferenceResponse } from '../services/geminiService';
import { Icon } from './icons';

interface ConferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameStats: GameStats;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;

export const ConferenceModal: React.FC<ConferenceModalProps> = ({ isOpen, onClose, gameStats }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const recognitionRef = useRef<any | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [history]);

    // Initialize Speech Recognition
    useEffect(() => {
        if (!hasSpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const userMessage = event.results[0][0].transcript;
            const currentHistory = [...history, { role: 'user', text: userMessage }];
            setHistory(currentHistory);
            setIsThinking(true);
            
            getConferenceResponse(gameStats, currentHistory, userMessage).then(response => {
                const modelMessage = response.responseText;
                setHistory(prev => [...prev, { role: 'model', text: modelMessage }]);
                speak(modelMessage);
            }).finally(() => {
                setIsThinking(false);
            });
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;

        return () => recognitionRef.current?.abort();
    }, [gameStats, history]);

    // Initialize Speech Synthesis
    useEffect(() => {
        const utterance = new SpeechSynthesisUtterance();
        utterance.lang = 'vi-VN';
        
        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            const vietnameseVoice = voices.find(voice => voice.lang === 'vi-VN');
            if (vietnameseVoice) {
                utterance.voice = vietnameseVoice;
            }
        };

        setVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = setVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error", e);
            setIsSpeaking(false);
        }
        utteranceRef.current = utterance;

        return () => {
            window.speechSynthesis.cancel();
        }
    }, []);

    const speak = (text: string) => {
        if (utteranceRef.current) {
            window.speechSynthesis.cancel(); // Cancel any previous speech
            utteranceRef.current.text = text;
            window.speechSynthesis.speak(utteranceRef.current);
        }
    };

    const toggleListening = () => {
        if (!hasSpeechRecognition || isThinking || isSpeaking) return;
        
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            // Cancel any speaking before listening
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleClose = () => {
        window.speechSynthesis.cancel();
        recognitionRef.current?.abort();
        setHistory([]);
        onClose();
    };

    if (!isOpen) return null;

    const getMicButtonState = () => {
        if (isThinking) return { text: 'AI đang suy nghĩ...', disabled: true, icon: 'load', className: 'animate-spin' };
        if (isSpeaking) return { text: 'AI đang phát biểu...', disabled: true, icon: 'speaking', className: 'animate-pulse' };
        if (isListening) return { text: 'Đang nghe...', disabled: false, icon: 'microphone', className: 'animate-pulse text-red-500' };
        return { text: 'Bắt đầu nói', disabled: false, icon: 'microphone' };
    };
    const micButtonState = getMicButtonState();

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800/80 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-200 flex items-center gap-3"><Icon name="conference"/>Hội nghị Quốc gia</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-white"><Icon name="close" className="w-6 h-6"/></button>
                </div>
                
                <div className="flex-grow bg-black/30 rounded p-4 overflow-y-auto mb-4 font-mono text-lg">
                    {history.length === 0 && (
                        <div className="text-gray-500 h-full flex items-center justify-center">Bắt đầu cuộc họp bằng cách nhấn nút micro bên dưới.</div>
                    )}
                    {history.map((msg, index) => (
                        <div key={index} className={`mb-4 animate-fade-in ${msg.role === 'user' ? 'text-cyan-400' : 'text-green-300'}`}>
                            <span className="font-bold">{msg.role === 'user' ? 'Bạn' : 'Hội đồng'}: </span>
                            <span>{msg.text}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="flex-shrink-0 text-center">
                    <button 
                        onClick={toggleListening}
                        disabled={micButtonState.disabled || !hasSpeechRecognition}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                        title={!hasSpeechRecognition ? "Trình duyệt không hỗ trợ nhận dạng giọng nói" : ""}
                    >
                        <Icon name={micButtonState.icon as any} className={`w-6 h-6 ${micButtonState.className || ''}`} />
                        {micButtonState.text}
                    </button>
                    {!hasSpeechRecognition && <p className="text-xs text-red-400 mt-2">Tính năng trò chuyện thoại không được trình duyệt của bạn hỗ trợ.</p>}
                </div>
            </div>
        </div>
    );
};
