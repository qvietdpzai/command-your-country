import React from 'react';

interface TerritoryMapProps {
    percentage: number;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({ percentage }) => {
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const color = percentage > 60 ? 'stroke-green-500' : percentage > 30 ? 'stroke-yellow-500' : 'stroke-red-500';

    return (
        <div className="flex flex-col items-center gap-2 mt-2">
            <svg
                height={radius * 2}
                width={radius * 2}
                viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                className="-rotate-90"
            >
                {/* Background Circle */}
                <circle
                    stroke="#374151" // gray-700
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                {/* Progress Circle */}
                <circle
                    className={`transition-all duration-500 ease-in-out ${color}`}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    strokeLinecap="round"
                />
                {/* Text */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy=".3em"
                    className="fill-white text-xl font-bold font-mono rotate-90 origin-center"
                >
                    {`${percentage}%`}
                </text>
            </svg>
            <h3 className="text-sm font-bold text-gray-400">KIỂM SOÁT LÃNH THỔ</h3>
        </div>
    );
};
