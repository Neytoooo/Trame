'use client'

export default function PulseLoader({ color = 'orange', className = '' }: { color?: 'orange' | 'blue' | 'green', className?: string }) {

    // Explicit Tailwind classes so scanner picks them up
    const classMap = {
        orange: 'bg-orange-500 animate-[pulse-orange_1.5s_infinite_ease-in-out]',
        blue: 'bg-blue-500 animate-[pulse-blue_1.5s_infinite_ease-in-out]',
        green: 'bg-green-500 animate-[pulse-green_1.5s_infinite_ease-in-out]'
    }

    return (
        <div className={`flex items-center justify-center w-8 h-8 ${className}`}>
            <div className={`w-5 h-5 rounded-full ${classMap[color]}`}>
                <style jsx global>{`
                    @keyframes pulse-orange {
                        0% { box-shadow: 0 0 0 0 #f97316; }
                        100% { box-shadow: 0 0 0 14px #f9731600; }
                    }
                    @keyframes pulse-blue {
                         0% { box-shadow: 0 0 0 0 #3b82f6; }
                         100% { box-shadow: 0 0 0 14px #3b82f600; }
                    }
                    @keyframes pulse-green {
                         0% { box-shadow: 0 0 0 0 #22c55e; }
                         100% { box-shadow: 0 0 0 14px #22c55e00; }
                    }
                `}</style>
            </div>
        </div>
    )
}
