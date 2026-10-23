/**
 * Sezione schematica (illustrativa) di un profilo PVC multicamera: telaio a 5 camere, anta, rinforzi in acciaio,
 * due livelli di guarnizioni, vetrocamera e quota della profondità. I tratti si "disegnano" all'ingresso
 * (classi .draw / .draw-fill / .pop, ferme finché il Reveal che la contiene non entra nel viewport).
 */
type Props = { label: string; interior: string; exterior: string; depth: string };

const ink = "#1f2328";
const steel = "#8a929c";
const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const FRAME_CELLS = [
  [130, 50],
  [186, 64],
  [256, 84],
  [346, 54],
  [406, 54],
] as const;
const SASH_CELLS = [
  [160, 45],
  [211, 54],
  [271, 59],
  [336, 84],
] as const;

export function ProfileDiagram({ label, interior, exterior, depth }: Props) {
  const callouts = [
    { n: 1, cx: 295, cy: 490, x2: 295, y2: 465 },
    { n: 2, cx: 86, cy: 372, x2: 150, y2: 372 },
    { n: 3, cx: 280, cy: 112, x2: 280, y2: 160 },
    { n: 4, cx: 500, cy: 312, x2: 430, y2: 311 },
    { n: 5, cx: 500, cy: 380, x2: 330, y2: 380 },
  ];
  return (
    <svg viewBox="0 0 580 512" className="block h-auto w-full" role="img" aria-label={label}>
      <defs>
        <pattern id="pd-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgba(31,35,40,0.05)" />
        </pattern>
        <linearGradient id="pd-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#cfe3ee" />
          <stop offset="1" stopColor="#e6f0f6" />
        </linearGradient>
        <linearGradient id="pd-warm" x1="0" x2="1">
          <stop offset="0" stopColor="#8794a6" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#cc1f2b" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="580" height="512" fill="url(#pd-grid)" />
      <rect width="580" height="512" fill="url(#pd-warm)" />

      {/* vetrocamera: due lastre, distanziale, intercapedine */}
      <rect className="fade-in" style={d(900)} x="226" y="30" width="108" height="196" fill="#f4f8fb" />
      <rect className="draw-fill" style={d(700)} pathLength={1} x="220" y="30" width="6" height="196" fill="url(#pd-glass)" stroke={ink} strokeWidth="1" />
      <rect className="draw-fill" style={d(780)} pathLength={1} x="334" y="30" width="6" height="196" fill="url(#pd-glass)" stroke={ink} strokeWidth="1" />
      <rect className="pop" style={d(1100)} x="226" y="190" width="108" height="16" rx="2" fill={ink} fillOpacity="0.78" />

      {/* anta: corpo, ferma-vetro esterno e fermavetro interno */}
      <path
        className="draw-fill"
        style={d(300)}
        pathLength={1}
        d="M150 226H430V306H150Z M165 186H214V226H165Z M346 176H398V226H346Z"
        fill="#ffffff"
        stroke={ink}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {SASH_CELLS.map(([x, w], i) => (
        <rect key={x} className="draw-fill" style={d(520 + i * 70)} pathLength={1} x={x} y={236} width={w} height={60} rx={3} fill="#f1f3f5" stroke={ink} strokeOpacity="0.5" />
      ))}

      {/* telaio a 5 camere */}
      <path className="draw-fill" style={d(150)} pathLength={1} d="M120 316H470V430H120Z" fill="#ffffff" stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
      {FRAME_CELLS.map(([x, w], i) => (
        <rect key={x} className="draw-fill" style={d(380 + i * 80)} pathLength={1} x={x} y={326} width={w} height={94} rx={3} fill="#f1f3f5" stroke={ink} strokeOpacity="0.5" />
      ))}

      {/* rinforzi in acciaio (profili a U) nelle camere centrali */}
      <path className="draw" style={d(1150)} pathLength={1} d="M268 338V408H328V338" fill="none" stroke={steel} strokeWidth="3" strokeLinejoin="round" />
      <path className="draw" style={d(1220)} pathLength={1} d="M281 246V286H322V246" fill="none" stroke={steel} strokeWidth="3" strokeLinejoin="round" />

      {/* guarnizioni: vetro/anta e anta/telaio (due livelli) */}
      {[
        [210, 196, 10, 22],
        [340, 190, 10, 22],
        [150, 304, 14, 14],
        [416, 304, 14, 14],
      ].map(([x, y, w, h], i) => (
        <rect key={`${x}-${y}`} className="pop" style={d(1350 + i * 80)} x={x} y={y} width={w} height={h} rx={4} fill={ink} />
      ))}

      {/* quota: profondità costruttiva */}
      <g className="fade-in" style={d(1600)}>
        <line x1="120" y1="457" x2="470" y2="457" stroke={ink} strokeWidth="1" />
        <line x1="120" y1="449" x2="120" y2="465" stroke={ink} strokeWidth="1" />
        <line x1="470" y1="449" x2="470" y2="465" stroke={ink} strokeWidth="1" />
        <text x="295" y="450" textAnchor="middle" fontSize="13" fontWeight="700" fill={ink} fontFamily="Manrope Variable, sans-serif">
          {depth}
        </text>
      </g>

      {/* esterno / interno */}
      <text className="fade-in" style={d(1700)} x="24" y="40" fontSize="10.5" fontWeight="700" letterSpacing="1.6" fill="#667085" fontFamily="Manrope Variable, sans-serif">
        {exterior.toUpperCase()}
      </text>
      <text className="fade-in" style={d(1700)} x="556" y="40" textAnchor="end" fontSize="10.5" fontWeight="700" letterSpacing="1.6" fill="#a3151e" fontFamily="Manrope Variable, sans-serif">
        {interior.toUpperCase()}
      </text>

      {/* richiami numerati (corrispondono all'elenco accanto) */}
      {callouts.map((c, i) => (
        <g key={c.n}>
          <line className="draw" style={d(1750 + i * 110)} pathLength={1} x1={c.cx} y1={c.cy} x2={c.x2} y2={c.y2} stroke={ink} strokeWidth="1" />
          <circle className="pop" style={d(1850 + i * 110)} cx={c.cx} cy={c.cy} r="11" fill="#cc1f2b" />
          <text className="fade-in" style={d(1900 + i * 110)} x={c.cx} y={c.cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontFamily="Manrope Variable, sans-serif">
            {c.n}
          </text>
        </g>
      ))}
    </svg>
  );
}
