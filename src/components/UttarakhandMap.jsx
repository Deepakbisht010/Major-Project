import { useState } from 'react'

const districts = [
    { id: 'uttarkashi', name: 'Uttarkashi', d: 'M120,40 L160,30 L180,60 L170,90 L140,80 L120,50Z' },
    { id: 'chamoli', name: 'Chamoli', d: 'M180,60 L220,45 L240,75 L230,100 L200,95 L170,90Z' },
    { id: 'rudraprayag', name: 'Rudraprayag', d: 'M170,90 L200,95 L210,120 L185,130 L160,115Z' },
    { id: 'tehri', name: 'Tehri Garhwal', d: 'M120,50 L140,80 L170,90 L160,115 L130,110 L110,80Z' },
    { id: 'dehradun', name: 'Dehradun', d: 'M60,50 L120,40 L120,50 L110,80 L80,90 L50,75Z' },
    { id: 'pauri', name: 'Pauri Garhwal', d: 'M110,80 L130,110 L160,115 L160,145 L120,150 L95,130 L90,100Z' },
    { id: 'haridwar', name: 'Haridwar', d: 'M80,90 L110,80 L90,100 L95,130 L70,120 L60,100Z' },
    { id: 'pithoragarh', name: 'Pithoragarh', d: 'M240,75 L280,65 L300,90 L290,120 L260,115 L230,100Z' },
    { id: 'bageshwar', name: 'Bageshwar', d: 'M230,100 L260,115 L260,140 L240,150 L215,140 L210,120Z' },
    { id: 'almora', name: 'Almora', d: 'M185,130 L210,120 L215,140 L240,150 L230,175 L200,170 L180,155Z' },
    { id: 'champawat', name: 'Champawat', d: 'M260,140 L290,120 L310,145 L290,170 L265,165 L260,150Z' },
    { id: 'nainital', name: 'Nainital', d: 'M160,145 L180,155 L200,170 L195,200 L165,200 L145,180 L140,160Z' },
    { id: 'udhamsingh', name: 'U S Nagar', d: 'M95,130 L120,150 L140,160 L145,180 L125,200 L90,195 L70,170 L70,140Z' },
]

export default function UttarakhandMap() {
    const [hovered, setHovered] = useState(null)

    return (
        <div style={{ position: 'relative' }}>
            <svg
                viewBox="30 15 310 210"
                width="100%"
                style={{ maxWidth: 480 }}
            >
                <defs>
                    <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F5C096" />
                        <stop offset="100%" stopColor="#F2D5DA" />
                    </linearGradient>
                    <filter id="shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                    </filter>
                </defs>

                {districts.map(d => (
                    <g key={d.id}>
                        <path
                            d={d.d}
                            fill={hovered === d.id ? (d.id === 'almora' ? '#821D30' : '#E8863A') : (d.id === 'almora' ? '#D4712A' : 'url(#mapGradient)')}
                            stroke="#FDFCF7"
                            strokeWidth="2"
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                            onMouseEnter={() => setHovered(d.id)}
                            onMouseLeave={() => setHovered(null)}
                            filter={hovered === d.id ? 'url(#shadow)' : undefined}
                        />
                    </g>
                ))}

                {/* Labels */}
                {districts.map(d => {
                    const pathParts = d.d.match(/[\d.]+/g).map(Number)
                    const xs = pathParts.filter((_, i) => i % 2 === 0)
                    const ys = pathParts.filter((_, i) => i % 2 === 1)
                    const cx = xs.reduce((a, b) => a + b, 0) / xs.length
                    const cy = ys.reduce((a, b) => a + b, 0) / ys.length

                    return (
                        <text
                            key={`label-${d.id}`}
                            x={cx}
                            y={cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={hovered === d.id ? '#fff' : '#5E1522'}
                            fontSize={d.id === 'almora' ? '8' : '6.5'}
                            fontWeight={d.id === 'almora' ? '700' : '500'}
                            fontFamily="Poppins, sans-serif"
                            style={{ pointerEvents: 'none' }}
                        >
                            {d.id === 'almora' ? '★ ' : ''}{d.name}
                        </text>
                    )
                })}

                {/* Mountain tops decorative */}
                <path d="M140,25 L150,10 L160,25" fill="none" stroke="#821D30" strokeWidth="1" opacity="0.3" />
                <path d="M200,35 L210,18 L220,35" fill="none" stroke="#821D30" strokeWidth="1" opacity="0.3" />
                <path d="M260,50 L270,35 L280,50" fill="none" stroke="#821D30" strokeWidth="1" opacity="0.3" />
            </svg>

            {hovered && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: 8,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #E5E0D5',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#821D30'
                }}>
                    📍 {districts.find(d => d.id === hovered)?.name}
                </div>
            )}
        </div>
    )
}
