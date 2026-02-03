interface GraphOverlayProps {
    progress: number
}

export default function GraphOverlay({ progress }: GraphOverlayProps) {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 pointer-events-auto">
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Avancement</span>
            <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-white font-bold">{progress}%</span>
        </div>
    )
}
