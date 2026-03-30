import clsx from 'clsx';

type MonumWordmarkProps = {
  className?: string;
  animate?: boolean;
  strokeWidth?: number;
};

function StrokeAnim({ animate, begin, dur, values }: { animate: boolean; begin: string; dur: string; values: string }) {
  if (!animate) return null;
  return <animate attributeName="stroke-dashoffset" values={values} keyTimes="0;0.3;1" begin={begin} dur={dur} repeatCount="indefinite" />;
}

function DotAnim({ animate, begin, dur }: { animate: boolean; begin: string; dur: string }) {
  if (!animate) return null;
  return <animate attributeName="opacity" values="0;1;1" keyTimes="0;0.25;1" begin={begin} dur={dur} repeatCount="indefinite" />;
}

export default function MonumWordmark({ className, animate = false, strokeWidth = 2.8 }: MonumWordmarkProps) {
  return (
    <svg
      viewBox="0 0 352 132"
      role="img"
      aria-label="Monum"
      className={clsx('h-auto w-full', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#111111"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(0 0)">
        <path d="M0 118 L0 20 L26 60 L52 20 L52 118" strokeDasharray="220" strokeDashoffset={animate ? 220 : 0}>
          <StrokeAnim animate={animate} begin="0s" dur="3.2s" values="220;0;0" />
        </path>
        <circle cx="0" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.04s" dur="3.2s" /></circle>
        <circle cx="26" cy="60" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.08s" dur="3.2s" /></circle>
        <circle cx="52" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.12s" dur="3.2s" /></circle>
      </g>

      <g transform="translate(72 0)">
        <circle cx="44" cy="69" r="44" strokeDasharray="300" strokeDashoffset={animate ? 300 : 0}>
          <StrokeAnim animate={animate} begin="0.25s" dur="3.2s" values="300;0;0" />
        </circle>
        <circle cx="44" cy="25" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.30s" dur="3.2s" /></circle>
        <circle cx="88" cy="69" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.34s" dur="3.2s" /></circle>
        <circle cx="44" cy="113" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.38s" dur="3.2s" /></circle>
        <circle cx="0" cy="69" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.42s" dur="3.2s" /></circle>
      </g>

      <g transform="translate(178 0)">
        <path d="M0 118 L0 20 L52 118 L52 20" strokeDasharray="260" strokeDashoffset={animate ? 260 : 0}>
          <StrokeAnim animate={animate} begin="0.55s" dur="3.2s" values="260;0;0" />
        </path>
        <circle cx="0" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.58s" dur="3.2s" /></circle>
        <circle cx="52" cy="118" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.62s" dur="3.2s" /></circle>
        <circle cx="52" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.66s" dur="3.2s" /></circle>
      </g>

      <g transform="translate(246 0)">
        <path d="M0 20 L0 102 Q0 118 16 118 L32 118 Q48 118 48 102 L48 20" strokeDasharray="220" strokeDashoffset={animate ? 220 : 0}>
          <StrokeAnim animate={animate} begin="0.85s" dur="3.2s" values="220;0;0" />
        </path>
        <circle cx="0" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.88s" dur="3.2s" /></circle>
        <circle cx="48" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="0.92s" dur="3.2s" /></circle>
      </g>

      <g transform="translate(302 0)">
        <path d="M0 118 L0 20 L24 60 L48 20 L48 118" strokeDasharray="220" strokeDashoffset={animate ? 220 : 0}>
          <StrokeAnim animate={animate} begin="1.1s" dur="3.2s" values="220;0;0" />
        </path>
        <circle cx="0" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="1.14s" dur="3.2s" /></circle>
        <circle cx="24" cy="60" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="1.18s" dur="3.2s" /></circle>
        <circle cx="48" cy="20" r="3.2" fill="#111111" opacity={animate ? 0 : 1}><DotAnim animate={animate} begin="1.22s" dur="3.2s" /></circle>
      </g>
    </svg>
  );
}
