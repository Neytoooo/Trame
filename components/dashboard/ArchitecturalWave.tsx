'use client'

export default function ArchitecturalWave() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Soft Ambient Light Glows */}
            <div className="absolute top-10 right-1/4 w-[600px] h-[350px] bg-gradient-to-br from-blue-300/25 via-indigo-200/20 to-purple-200/10 blur-[90px] rounded-full transform -rotate-12" />
            <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-gradient-to-tr from-cyan-300/20 via-blue-400/15 to-transparent blur-[100px] rounded-full" />
            <div className="absolute -bottom-10 left-10 w-[500px] h-[400px] bg-gradient-to-tr from-indigo-200/20 via-blue-200/15 to-transparent blur-[120px] rounded-full" />

            {/* 3D Fluid Architectural Ribbon Wave (SVG) */}
            <svg
                className="absolute top-0 right-0 w-full h-[600px] opacity-75 max-w-[1500px] mix-blend-multiply"
                viewBox="0 0 1440 600"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.35" />
                        <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.4" />
                        <stop offset="40%" stopColor="#6366F1" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#818CF8" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="waveGrad3" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {/* Primary dynamic wave path */}
                <path
                    d="M300 280 C 500 120, 800 380, 1100 180 C 1280 60, 1400 140, 1500 180 C 1500 180, 1500 320, 1440 340 C 1240 400, 950 180, 750 320 C 550 460, 380 400, 300 280 Z"
                    fill="url(#waveGrad1)"
                    className="animate-pulse duration-1000"
                />

                {/* Secondary intertwining ribbon */}
                <path
                    d="M450 320 C 650 180, 950 420, 1250 220 C 1380 140, 1440 180, 1520 200 C 1520 220, 1480 360, 1380 380 C 1150 440, 900 240, 700 360 C 520 480, 420 420, 450 320 Z"
                    fill="url(#waveGrad2)"
                />

                {/* Fine structural helical accent line */}
                <path
                    d="M200 300 Q 550 80, 900 300 T 1500 180"
                    stroke="url(#waveGrad3)"
                    strokeWidth="3.5"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    opacity="0.6"
                />
                <path
                    d="M220 320 Q 570 110, 920 320 T 1520 200"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.4"
                />
            </svg>
        </div>
    )
}
