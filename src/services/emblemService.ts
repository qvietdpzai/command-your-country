// A simple pseudo-random number generator based on a seed
const mulberry32 = (seed: number) => {
    return () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// Simple hash function for the nation name to create a seed
const createSeed = (str: string): number => {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

export const generateEmblemSVG = (nationName: string): string => {
    const seed = createSeed(nationName);
    const rand = mulberry32(seed);

    const width = 128;
    const height = 128;

    const baseHue = rand() * 360;
    const color1 = `hsl(${baseHue}, 70%, 60%)`;
    const color2 = `hsl(${(baseHue + 150 + rand() * 60) % 360}, 70%, 60%)`;
    const bgColor = `hsl(${rand() * 360}, 15%, 10%)`;

    const numShapes = Math.floor(rand() * 4) + 4; // 4 to 7 shapes

    let shapes = '';
    for (let i = 0; i < numShapes; i++) {
        const shapeType = rand();
        const x = rand() * width;
        const y = rand() * height;
        const size = rand() * (width / 5) + 8;
        const color = rand() > 0.5 ? color1 : color2;
        const rotation = rand() * 360;
        
        if (shapeType < 0.5) { // Circle
            shapes += `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${color}" opacity="0.7" />`;
        } else { // Rectangle
            shapes += `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" fill="${color}" transform="rotate(${rotation} ${x} ${y})" opacity="0.7" />`;
        }
    }
    
    // Add a central, more prominent shape
    const centralSize = rand() * (width / 3) + (width / 4);
    const centralColor = rand() > 0.5 ? color1 : color2;
    const centralRotation = rand() * 360;
    if (rand() > 0.5) {
         shapes += `<path d="M ${width/2},${height/2 - centralSize/2} L ${width/2 + centralSize/2},${height/2 + centralSize/2} L ${width/2 - centralSize/2},${height/2 + centralSize/2} Z" fill="${centralColor}" opacity="0.9" transform="rotate(${centralRotation} ${width/2} ${height/2})"/>`;
    } else {
        shapes += `<circle cx="${width/2}" cy="${height/2}" r="${centralSize/3}" fill="none" stroke="${centralColor}" stroke-width="4" opacity="0.9"/>`;
    }


    const svgContent = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <clipPath id="emblemClipPath">
                    <circle cx="${width/2}" cy="${height/2}" r="${width/2}" />
                </clipPath>
            </defs>
            <g clip-path="url(#emblemClipPath)">
                <rect width="100%" height="100%" fill="${bgColor}" />
                ${shapes}
                 <circle cx="${width/2}" cy="${height/2}" r="${width/2 - 2}" fill="none" stroke="hsl(${baseHue}, 30%, 70%)" stroke-width="3" />
            </g>
        </svg>
    `;

    // Minify and encode
    const minifiedSvg = svgContent.trim().replace(/\s+/g, ' ').replace(/> </g, '><');
    const svgBase64 = btoa(minifiedSvg);
    return `data:image/svg+xml;base64,${svgBase64}`;
};