/**
 * ThailandMap — SVG map of Thailand regions
 * Shows popularity by coloring regions based on data from backend.
 */

interface RegionData {
    name: string
    count: number
    percent: number
}

interface ThailandMapProps {
    regionStats: RegionData[]
    provinceStats: { name: string; count: number; percent: number }[]
}

const REGION_COLORS: Record<string, string> = {
    'ภาคเหนือ': '#3B82F6',
    'ภาคตะวันออกเฉียงเหนือ': '#8B5CF6',
    'ภาคกลาง': '#10B981',
    'ภาคตะวันออก': '#F59E0B',
    'ภาคตะวันตก': '#EF4444',
    'ภาคใต้': '#F5A623',
}

function getRegionFill(regionName: string, percent: number): string {
    const base = REGION_COLORS[regionName] || '#D1D5DB'
    const opacity = Math.max(0.35, Math.min(0.9, percent / 80))
    return base + Math.round(opacity * 255).toString(16).padStart(2, '0')
}

// Realistic Thailand map paths (simplified but recognizable)
// Viewbox is calibrated so the shape looks like Thailand
const REGION_PATHS: { name: string; d: string }[] = [
    {
        name: 'ภาคเหนือ',
        d: `M108,8 L120,5 L135,3 L148,8 L158,15 L170,12 L180,18
        L185,30 L190,45 L192,60 L188,78 L182,92 L175,100
        L165,108 L155,112 L145,110 L132,108 L120,112
        L110,108 L100,98 L95,85 L92,70 L95,55 L98,40 L102,25 Z`,
    },
    {
        name: 'ภาคตะวันออกเฉียงเหนือ',
        d: `M175,100 L182,92 L188,78 L192,60 L198,55 L208,52
        L220,55 L232,60 L242,68 L250,78 L255,90 L258,102
        L256,115 L252,128 L245,138 L235,148 L225,155
        L215,158 L205,155 L195,150 L185,145 L178,138
        L172,128 L168,118 L165,108 Z`,
    },
    {
        name: 'ภาคกลาง',
        d: `M110,108 L120,112 L132,108 L145,110 L155,112
        L165,108 L168,118 L172,128 L178,138 L175,148
        L168,155 L160,160 L150,162 L140,160 L132,155
        L125,150 L118,145 L112,138 L108,128 L106,118 Z`,
    },
    {
        name: 'ภาคตะวันตก',
        d: `M68,85 L75,75 L82,68 L90,62 L95,55 L98,40 L95,55
        L92,70 L95,85 L100,98 L110,108 L106,118 L108,128
        L112,138 L108,148 L100,158 L92,168 L85,175
        L78,178 L72,175 L68,168 L65,158 L62,145
        L58,130 L55,115 L58,100 L62,90 Z`,
    },
    {
        name: 'ภาคตะวันออก',
        d: `M178,138 L185,145 L195,150 L205,155 L215,158
        L220,165 L218,175 L212,182 L205,188 L195,190
        L185,188 L178,182 L172,175 L168,165 L168,155
        L175,148 Z`,
    },
    {
        name: 'ภาคใต้',
        d: `M108,148 L112,138 L118,145 L125,150 L132,155
        L140,160 L150,162 L160,160 L168,155 L168,165
        L172,175 L170,185 L165,195 L160,205 L156,218
        L153,232 L150,248 L148,265 L146,282
        L144,298 L142,315 L140,332 L138,348
        L136,360 L133,370 L130,378 L127,382
        L124,378 L122,370 L120,358 L118,345
        L116,330 L115,315 L114,298 L112,280
        L110,262 L108,245 L105,228 L102,210
        L98,195 L95,182 L92,168 L100,158 Z`,
    },
]

export default function ThailandMap({ regionStats, provinceStats }: ThailandMapProps) {
    const regionMap = new Map(regionStats.map(r => [r.name, r]))

    return (
        <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">แผนที่ความนิยม</h2>
            <div className="flex items-start gap-4">
                {/* SVG Map */}
                <div className="flex-shrink-0">
                    <svg
                        viewBox="40 0 240 400"
                        width="180"
                        height="320"
                        className="drop-shadow-sm"
                    >
                        {REGION_PATHS.map(({ name, d }) => {
                            const region = regionMap.get(name)
                            const percent = region?.percent || 0
                            return (
                                <path
                                    key={name}
                                    d={d}
                                    fill={getRegionFill(name, percent)}
                                    stroke="white"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                    className="cursor-pointer transition-opacity duration-200 hover:opacity-75"
                                >
                                    <title>{name}: {percent}%</title>
                                </path>
                            )
                        })}
                    </svg>
                </div>

                {/* Legend + Province Stats */}
                <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                        {regionStats.map((r) => {
                            const color = REGION_COLORS[r.name] || '#ccc'
                            return (
                                <div key={r.name} className="flex items-center gap-2 text-xs">
                                    <span
                                        className="w-3 h-3 rounded-sm flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-gray-700 flex-1 truncate">{r.name}</span>
                                    <span className="text-gray-500 font-semibold">{r.percent}%</span>
                                </div>
                            )
                        })}
                    </div>

                    <hr className="border-gray-100" />

                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">จังหวัดยอดนิยม</p>
                    <div className="space-y-1">
                        {provinceStats.slice(0, 5).map((p, i) => (
                            <div key={p.name} className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400 w-4 font-mono">{i + 1}.</span>
                                <span className="text-gray-700 flex-1 truncate">{p.name}</span>
                                <span className="text-gray-500 font-medium">{p.percent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
