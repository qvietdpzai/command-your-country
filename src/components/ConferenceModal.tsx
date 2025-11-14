
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
const hasSpeechSynthesis = 'speechSynthesis' in window;

export const ConferenceModal: React.FC<ConferenceModalProps> = ({ isOpen, onClose, gameStats }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [hasVietnameseVoice, setHasVietnameseVoice] = useState(true);
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
            const userMessageText = event.results[0][0].transcript;
            const newUserMessage: ChatMessage = { role: 'user', text: userMessageText };
            
            const currentHistory = [...history, newUserMessage];
            setHistory(currentHistory);
            setIsThinking(true);
            
            getConferenceResponse(gameStats, currentHistory, userMessageText).then(response => {
                const modelMessageText = response.responseText;
                const newModelMessage: ChatMessage = { role: 'model', text: modelMessageText };
                setHistory(prev => [...prev, newModelMessage]);
                speak(modelMessageText);
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
        if (!isOpen || !hasSpeechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance();
        utterance.lang = 'vi-VN';
        
        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return; 

            const vietnameseVoice = voices.find(voice => voice.lang === 'vi-VN');
            if (vietnameseVoice) {
                utterance.voice = vietnameseVoice;
                setHasVietnameseVoice(true);
            } else {
                console.warn("Không tìm thấy giọng nói tiếng Việt. Sử dụng giọng mặc định của trình duyệt.");
                setHasVietnameseVoice(false);
            }
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.addEventListener('voiceschanged', setVoice);
        } else {
            setVoice();
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("Speech synthesis error", e);
            setIsSpeaking(false);
        }
        utteranceRef.current = utterance;

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', setVoice);
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isOpen]);

    const speak = (text: string) => {
        if (utteranceRef.current && hasSpeechSynthesis) {
            window.speechSynthesis.cancel(); 
            utteranceRef.current.text = text;
            window.speechSynthesis.speak(utteranceRef.current);
        }
    };

    const toggleListening = () => {
        if (!hasSpeechRecognition || isThinking || isSpeaking) return;
        
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            if(hasSpeechSynthesis) window.speechSynthesis.cancel();
            setIsSpeaking(false);
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleClose = () => {
        if(hasSpeechSynthesis) window.speechSynthesis.cancel();
        recognitionRef.current?.abort();
        setHistory([]);
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setHistory([{role: 'model', text: 'Chào mừng Tổng tư lệnh. Hội đồng cố vấn sẵn sàng lắng nghe và đưa ra ý kiến về tình hình hiện tại. Xin hãy cho biết chúng tôi có thể giúp gì cho ngài?'}]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getMicButtonState = () => {
        if (isThinking) return { text: 'AI đang suy nghĩ...', disabled: true, icon: 'load' as const, className: 'animate-spin' };
        if (isSpeaking) return { text: 'AI đang phát biểu...', disabled: true, icon: 'speaking' as const, className: 'animate-pulse' };
        if (isListening) return { text: 'Đang nghe...', disabled: false, icon: 'microphone' as const, className: 'animate-pulse text-red-500' };
        return { text: 'Bắt đầu nói', disabled: false, icon: 'microphone' as const };
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
                    {history.map((msg, index) => (
                        <div key={index} className={`mb-4 animate-slide-in-up ${msg.role === 'user' ? 'text-cyan-400' : 'text-green-300'}`} style={{animationDelay: `${index * 100}ms`}}>
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
                        {/* Fix: Removed 'as any' since icon names are now correctly typed */}
                        <Icon name={micButtonState.icon} className={`w-6 h-6 ${micButtonState.className || ''}`} />
                        {micButtonState.text}
                    </button>
                    {!hasSpeechRecognition && <p className="text-xs text-red-400 mt-2">Tính năng trò chuyện thoại không được trình duyệt của bạn hỗ trợ.</p>}
                     {!hasVietnameseVoice && hasSpeechSynthesis && <p className="text-xs text-yellow-400 mt-2">Cảnh báo: Không tìm thấy giọng nói tiếng Việt trên trình duyệt. AI có thể phát âm không chính xác.</p>}
                </div>
            </div>
        </div>
    );
};