
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: 'military' | 'economy' | 'morale' | 'diplomacy' | 'play' | 'refresh' | 'send' | 'territory' | 'policy' | 'load' | 'warning' | 'manpower' | 'infantry' | 'armor' | 'navy' | 'airforce' | 'growth' | 'music_on' | 'music_off' | 'microphone' | 'fortification' | 'oil' | 'minerals' | 'gas' | 'close' | 'army_corps' | 'conference' | 'speaking';
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
    switch (name) {
        case 'conference': // Chat bubbles icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            );
        case 'speaking': // sound wave
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M2 10v4"/>
                    <path d="M6 7v10"/>
                    <path d="M10 4v16"/>
                    <path d="M14 7v10"/>
                    <path d="M18 10v4"/>
                </svg>
            );
        case 'army_corps': // Shield icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            );
        case 'microphone':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                </svg>
            );
        case 'fortification': // Castle tower icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M3 21h18v-8l-6-4-6 4v8z" />
                    <path d="M3 11V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
                    <path d="M12 21V11" />
                    <path d="M9 7V4h6v3" />
                </svg>
            );
        case 'oil': // Droplet icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z" />
                </svg>
            );
        case 'minerals': // Diamond icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M2.7 10.3a2.4 2.4 0 0 0 0 3.4l7.5 7.5c.9.9 2.5.9 3.4 0l7.5-7.5a2.4 2.4 0 0 0 0-3.4l-7.5-7.5a2.4 2.4 0 0 0-3.4 0Z" />
                    <path d="m12 22 4-4" />
                    <path d="m10 12 2-2 2 2" />
                    <path d="M12 2v4.5" />
                </svg>
            );
        case 'gas': // Flame icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M10.5 5.5a4 4 0 1 0-5 5.5c.3-1.2.6-2.5 1-3.5.4-.8.9-1.6 1.5-2.5C8.8 3.5 9.6 2 12 2c2.4 0 3.2 1.5 4 3 .6.9 1.1 1.7 1.5 2.5.4 1 .7 2.3 1 3.5a4 4 0 1 0-5-5.5" />
                    <path d="M12 22a2 2 0 0 1-2-2c0-1.1.9-2 2-2s2 .9 2 2a2 2 0 0 1-2 2Z" />
                </svg>
            );
        case 'close':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            );
        case 'military': // Bomb icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M14.5 2a2.5 2.5 0 0 1 2.5 2.5V8a.5.5 0 0 1-1 0V4.5a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 8 4.5V8a.5.5 0 0 1-1 0V4.5A2.5 2.5 0 0 1 9.5 2h5Z"/>
                    <path d="M12 21a6 6 0 0 0 6-6c0-3-3-6-6-6s-6 3-6 6a6 6 0 0 0 6 6Z"/>
                    <path d="m10.5 13.5 3 3"/>
                    <path d="m13.5 13.5-3 3"/>
                </svg>
            );
        case 'economy': // Dollar-sign icon
            return (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
            );
        case 'morale': // Shield-check icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
            );
        case 'diplomacy': // Handshake icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M14.5 18H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.5"/>
                    <path d="M9.5 6H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1.5"/>
                    <path d="M16 11.5a2.5 2.5 0 0 0-5 0V18"/>
                    <path d="M8 11.5a2.5 2.5 0 0 1 5 0V18"/>
                </svg>
            );
        case 'manpower': // Users icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            );
        case 'infantry': // Person Standing icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <circle cx="12" cy="5" r="1"/>
                    <path d="m9 20 3-6 3 6"/>
                    <path d="m6 8 6 2 6-2"/>
                    <path d="M12 10v4"/>
                </svg>
            );
        case 'armor': // Tank icon (simplified)
            return (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M2 9.5V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5"/>
                    <path d="M22 14v-1.5"/>
                    <path d="M2 14v-1.5"/>
                    <path d="M4 14h16"/>
                    <path d="M6 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"/>
                    <path d="M12 6V3.5a1.5 1.5 0 0 1 3 0V6"/>
                </svg>
            );
        case 'navy': // Ship icon
            return (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9-.5 2.5-1"/>
                    <path d="M19.38 14.71a1 1 0 0 0 .52-1.6L16 9l-4 4-1.4-1.4"/>
                    <path d="M12 13 2 6l10 1-1 4.5Z"/>
                    <path d="m22 6-10-1"/>
                </svg>
            );
        case 'airforce': // Plane icon
             return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                </svg>
            );
        case 'growth': // Arrow up icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            );
        case 'play':
            return (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
            );
        case 'refresh':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                </svg>
            );
        case 'send':
            return (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            );
        case 'territory': // Globe icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            );
        case 'policy': // Scroll icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"></path>
                    <path d="M19 17V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"></path>
                </svg>
            );
        case 'load': // Download cloud icon
            return (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M12 17V3"/>
                    <path d="m6 11 6 6 6-6"/>
                    <path d="M19.26 13.43a5.03 5.03 0 0 0-2.3-3.42 5.03 5.03 0 0 0-5.53-1.4 5.03 5.03 0 0 0-4.32 4.88 5.03 5.03 0 0 0 2.22 4.24"/>
                </svg>
            );
        case 'warning': // Triangle alert icon
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            );
        case 'music_on':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                </svg>
            );
        case 'music_off':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
                    <line x1="2" y1="2" x2="22" y2="22" />
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                </svg>
            );
        default:
            return null;
    }
};
