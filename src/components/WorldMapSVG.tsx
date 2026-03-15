'use client';

/**
 * Animated World Map — SVG dot-grid with continent masks, animated arcs, pulsing city markers.
 * Pure CSS/SVG animations, no JS runtime cost.
 */
export function WorldMapSVG({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 1000 500" className={className} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {/* Dot grid background — subtle */}
            <defs>
                <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="#2E2E2E" opacity="0.06" />
                </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#dotGrid)" />

            {/* ── Continent outlines (simplified paths, filled with dots) ── */}
            <g fill="none" stroke="#5a8fa3" strokeWidth="1.2" opacity="0.2">
                {/* North America */}
                <path d="M120,80 L140,70 L180,65 L220,60 L240,70 L260,85 L270,100 L265,115 L255,130 L240,145 L225,165 L215,180 L205,195 L195,210 L180,200 L165,185 L155,170 L150,155 L145,140 L135,120 L125,100 Z" />
                {/* Central America */}
                <path d="M205,195 L210,210 L215,225 L220,235 L225,245 L230,250" />
                {/* South America */}
                <path d="M230,250 L245,260 L260,275 L270,295 L275,315 L278,335 L275,355 L265,375 L250,390 L240,395 L235,385 L230,370 L225,350 L222,330 L220,310 L222,290 L225,270 L230,250" />
                {/* Europe */}
                <path d="M440,75 L450,65 L465,60 L480,65 L495,70 L505,80 L510,90 L505,100 L495,110 L485,115 L475,120 L465,115 L455,105 L445,95 L440,85 Z" />
                {/* Africa */}
                <path d="M460,140 L475,135 L490,140 L505,150 L515,165 L520,185 L518,205 L512,225 L505,245 L498,260 L488,275 L478,285 L468,290 L458,282 L450,268 L445,250 L442,230 L445,210 L448,190 L452,170 L455,155 Z" />
                {/* UK/Ireland */}
                <path d="M430,65 L435,60 L438,68 L433,72 Z" />
                {/* Scandinavia */}
                <path d="M475,40 L480,30 L490,25 L495,35 L492,50 L485,60 L478,55 Z" />
                {/* Asia - Russia */}
                <path d="M510,45 L540,35 L580,30 L620,28 L660,30 L700,35 L740,40 L770,50 L790,60 L800,75 L790,85 L770,80 L740,75 L700,72 L660,70 L620,68 L580,65 L540,62 L515,65 L510,55 Z" />
                {/* Middle East */}
                <path d="M530,110 L545,105 L560,110 L570,120 L565,135 L555,140 L540,138 L530,130 L525,120 Z" />
                {/* India */}
                <path d="M615,120 L630,115 L645,125 L650,145 L645,165 L635,180 L625,185 L618,175 L612,160 L610,140 Z" />
                {/* China / East Asia */}
                <path d="M660,75 L690,72 L720,78 L745,90 L755,105 L750,120 L738,130 L720,135 L700,130 L680,125 L665,115 L655,100 L658,85 Z" />
                {/* Japan */}
                <path d="M770,80 L778,75 L785,82 L782,95 L775,102 L768,95 Z" />
                {/* Southeast Asia */}
                <path d="M700,140 L715,145 L725,155 L730,170 L720,180 L708,175 L698,165 L695,150 Z" />
                {/* Indonesia */}
                <path d="M700,200 L720,195 L740,198 L755,205 L745,212 L725,210 L705,208 Z" />
                {/* Australia */}
                <path d="M740,280 L770,270 L800,268 L830,275 L845,290 L840,310 L825,325 L805,335 L780,338 L760,330 L745,315 L738,300 Z" />
                {/* New Zealand */}
                <path d="M870,320 L875,310 L880,318 L878,330 L873,332 Z" />
                {/* Greenland */}
                <path d="M280,30 L310,25 L330,30 L335,45 L325,55 L305,55 L290,48 L282,40 Z" />
            </g>

            {/* ── Continent fills (subtle dot pattern fill) ── */}
            <g fill="#5a8fa3" opacity="0.07">
                <path d="M120,80 L140,70 L180,65 L220,60 L240,70 L260,85 L270,100 L265,115 L255,130 L240,145 L225,165 L215,180 L205,195 L180,200 L165,185 L155,170 L150,155 L145,140 L135,120 L125,100 Z" />
                <path d="M230,250 L245,260 L260,275 L270,295 L275,315 L278,335 L275,355 L265,375 L250,390 L240,395 L235,385 L230,370 L225,350 L222,330 L220,310 L222,290 L225,270 Z" />
                <path d="M440,75 L450,65 L465,60 L480,65 L495,70 L505,80 L510,90 L505,100 L495,110 L485,115 L475,120 L465,115 L455,105 L445,95 L440,85 Z" />
                <path d="M460,140 L475,135 L490,140 L505,150 L515,165 L520,185 L518,205 L512,225 L505,245 L498,260 L488,275 L478,285 L468,290 L458,282 L450,268 L445,250 L442,230 L445,210 L448,190 L452,170 L455,155 Z" />
                <path d="M660,75 L690,72 L720,78 L745,90 L755,105 L750,120 L738,130 L720,135 L700,130 L680,125 L665,115 L655,100 L658,85 Z" />
                <path d="M740,280 L770,270 L800,268 L830,275 L845,290 L840,310 L825,325 L805,335 L780,338 L760,330 L745,315 L738,300 Z" />
            </g>

            {/* ── Animated flight arcs ── */}
            <g fill="none" strokeWidth="1.2">
                {/* Paris → New York */}
                <path d="M470,90 Q350,30 230,120" stroke="#5a8fa3" opacity="0.2">
                    <animate attributeName="stroke-dasharray" values="0,600;300,300;600,0;300,300;0,600" dur="6s" repeatCount="indefinite" />
                </path>
                {/* Paris → Dubai */}
                <path d="M470,90 Q500,70 545,120" stroke="#5a8fa3" opacity="0.2">
                    <animate attributeName="stroke-dasharray" values="0,300;150,150;300,0;150,150;0,300" dur="4s" repeatCount="indefinite" />
                </path>
                {/* Dubai → Tokyo */}
                <path d="M545,120 Q660,60 775,88" stroke="#5a8fa3" opacity="0.15">
                    <animate attributeName="stroke-dasharray" values="0,500;250,250;500,0;250,250;0,500" dur="5.5s" repeatCount="indefinite" />
                </path>
                {/* Paris → Nairobi */}
                <path d="M470,90 Q490,180 485,260" stroke="#5a8fa3" opacity="0.15">
                    <animate attributeName="stroke-dasharray" values="0,400;200,200;400,0;200,200;0,400" dur="5s" repeatCount="indefinite" />
                </path>
                {/* Tokyo → Sydney */}
                <path d="M775,88 Q820,180 790,290" stroke="#5a8fa3" opacity="0.15">
                    <animate attributeName="stroke-dasharray" values="0,450;225,225;450,0;225,225;0,450" dur="5s" repeatCount="indefinite" />
                </path>
                {/* New York → São Paulo */}
                <path d="M230,120 Q260,200 260,310" stroke="#5a8fa3" opacity="0.15">
                    <animate attributeName="stroke-dasharray" values="0,400;200,200;400,0;200,200;0,400" dur="4.5s" repeatCount="indefinite" />
                </path>
            </g>

            {/* ── Pulsing city markers ── */}
            {[
                [230, 120, 'New York'],
                [470, 90, 'Paris'],
                [545, 120, 'Dubai'],
                [635, 155, 'Mumbai'],
                [775, 88, 'Tokyo'],
                [485, 260, 'Nairobi'],
                [790, 290, 'Sydney'],
                [260, 310, 'São Paulo'],
                [730, 160, 'Bangkok'],
            ].map(([x, y, name], i) => (
                <g key={`city-${i}`}>
                    {/* Pulse ring */}
                    <circle cx={x as number} cy={y as number} r="3" fill="none" stroke="#5a8fa3" strokeWidth="1" opacity="0.4">
                        <animate attributeName="r" values="3;10;3" dur={`${2.5 + Number(i) * 0.2}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0;0.4" dur={`${2.5 + Number(i) * 0.2}s`} repeatCount="indefinite" />
                    </circle>
                    {/* City dot */}
                    <circle cx={x as number} cy={y as number} r="3" fill="#5a8fa3" opacity="0.5" />
                    {/* City label */}
                    <text x={(x as number) + 8} y={(y as number) + 3} fontSize="8" fill="#2E2E2E" opacity="0.25" fontFamily="Inter, sans-serif">{name as string}</text>
                </g>
            ))}
        </svg>
    );
}
