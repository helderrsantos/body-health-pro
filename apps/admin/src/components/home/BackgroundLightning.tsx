interface BackgroundLightningProps {
  className?: string
}

export function BackgroundLightning({ className }: Readonly<BackgroundLightningProps>) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className || ''}`}
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-intense" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Top-left ray cluster */}
      <g opacity="0.4">
        <line
          x1="20"
          y1="50"
          x2="1050"
          y2="950"
          stroke="rgba(169, 255, 46, 0.6)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        <line
          x1="40"
          y1="20"
          x2="1100"
          y2="1000"
          stroke="rgba(169, 255, 46, 0.4)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />
        <line
          x1="60"
          y1="100"
          x2="1150"
          y2="1050"
          stroke="rgba(169, 255, 46, 0.3)"
          strokeWidth="1"
          filter="url(#glow)"
        />
      </g>

      {/* Bottom-right ray cluster */}
      <g opacity="0.35">
        <line
          x1="1180"
          y1="1150"
          x2="150"
          y2="200"
          stroke="rgba(169, 255, 46, 0.55)"
          strokeWidth="2.5"
          filter="url(#glow-intense)"
        />
        <line
          x1="1160"
          y1="1180"
          x2="80"
          y2="150"
          stroke="rgba(169, 255, 46, 0.35)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />
        <line
          x1="1190"
          y1="1100"
          x2="100"
          y2="100"
          stroke="rgba(169, 255, 46, 0.25)"
          strokeWidth="1"
          filter="url(#glow)"
        />
      </g>

      {/* Center-top ray */}
      <g opacity="0.25">
        <line
          x1="600"
          y1="0"
          x2="580"
          y2="1150"
          stroke="rgba(169, 255, 46, 0.4)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />
        <line
          x1="640"
          y1="20"
          x2="660"
          y2="1170"
          stroke="rgba(169, 255, 46, 0.25)"
          strokeWidth="1"
          filter="url(#glow)"
        />
      </g>

      {/* Right-middle ray */}
      <g opacity="0.3">
        <line
          x1="1200"
          y1="350"
          x2="30"
          y2="450"
          stroke="rgba(169, 255, 46, 0.5)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        <line
          x1="1200"
          y1="420"
          x2="20"
          y2="320"
          stroke="rgba(169, 255, 46, 0.3)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />
      </g>

      {/* Top-right ray */}
      <g opacity="0.28">
        <line
          x1="1100"
          y1="50"
          x2="100"
          y2="850"
          stroke="rgba(169, 255, 46, 0.45)"
          strokeWidth="1.8"
          filter="url(#glow)"
        />
        <line
          x1="1150"
          y1="80"
          x2="150"
          y2="920"
          stroke="rgba(169, 255, 46, 0.28)"
          strokeWidth="1.2"
          filter="url(#glow)"
        />
      </g>

      {/* Bottom-left ray */}
      <g opacity="0.32">
        <line
          x1="50"
          y1="1100"
          x2="1050"
          y2="200"
          stroke="rgba(169, 255, 46, 0.5)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        <line
          x1="100"
          y1="1150"
          x2="1100"
          y2="150"
          stroke="rgba(169, 255, 46, 0.32)"
          strokeWidth="1.3"
          filter="url(#glow)"
        />
      </g>
    </svg>
  )
}
