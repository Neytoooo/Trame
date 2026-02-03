interface GraphBackgroundProps {
    viewPos: { x: number; y: number }
}

export default function GraphBackground({ viewPos }: GraphBackgroundProps) {
    return (
        <div
            className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-75 ease-out"
            style={{
                backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: `${viewPos.x}px ${viewPos.y}px`
            }}
        />
    )
}
