import React from "react"

export function BrainHologram({ isRunning = false, size = 320 }) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 0.75,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      {/* Soft background radial neon glow */}
      <div
        style={{
          position: "absolute",
          width: size * 0.8,
          height: size * 0.8,
          background: "radial-gradient(circle, rgba(0, 240, 255, 0.28) 0%, rgba(139, 92, 246, 0.22) 45%, transparent 70%)",
          filter: "blur(28px)",
          borderRadius: "50%",
          pointerEvents: "none",
          transform: isRunning ? "scale(1.15)" : "scale(1)",
          transition: "transform 1s ease",
        }}
      />

      <svg
        width={size}
        height={size * 0.75}
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="beamGradient" x1="160" y1="140" x2="160" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="brainGradient" x1="80" y1="40" x2="240" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="9" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric Pedestal Rings (Holographic Base) */}
        <g transform="translate(0, 10)">
          {/* Outer ring */}
          <ellipse
            cx="160"
            cy="200"
            rx="110"
            ry="26"
            stroke="#8b5cf6"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            strokeDasharray="6 4"
          />
          {/* Mid ring */}
          <ellipse
            cx="160"
            cy="200"
            rx="85"
            ry="20"
            stroke="#00f0ff"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            filter="url(#subtleGlow)"
          />
          {/* Inner ring */}
          <ellipse
            cx="160"
            cy="200"
            rx="55"
            ry="13"
            stroke="#c084fc"
            strokeWidth="1.75"
            strokeOpacity="0.8"
            strokeDasharray="12 4"
          />
          {/* Core ring */}
          <ellipse
            cx="160"
            cy="200"
            rx="30"
            ry="7"
            fill="#00f0ff"
            fillOpacity="0.25"
            stroke="#00f0ff"
            strokeWidth="1.5"
            filter="url(#neonGlow)"
          />
        </g>

        {/* Holographic Projection Light Beams */}
        <polygon
          points="160,150 115,205 205,205"
          fill="url(#beamGradient)"
          opacity="0.55"
          filter="url(#subtleGlow)"
        />
        <line x1="160" y1="145" x2="160" y2="202" stroke="#00f0ff" strokeWidth="2" strokeOpacity="0.8" filter="url(#subtleGlow)" />
        <line x1="145" y1="145" x2="135" y2="202" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.4" />
        <line x1="175" y1="145" x2="185" y2="202" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.4" />

        {/* Floating Hologram AI Brain (Neural Network / Wireframe) */}
        <g className="animate-float" filter="url(#neonGlow)">
          {/* Main Brain Lobes Outlines */}
          <path
            d="M 120 75 
               C 105 60, 95 80, 95 100 
               C 95 120, 105 135, 125 140 
               C 140 145, 155 135, 160 145 
               C 165 135, 180 145, 195 140 
               C 215 135, 225 120, 225 100 
               C 225 80, 215 60, 200 75 
               C 185 65, 175 75, 160 70 
               C 145 75, 135 65, 120 75 Z"
            fill="none"
            stroke="url(#brainGradient)"
            strokeWidth="2.2"
          />

          {/* Left Hemisphere Gyri and Connections */}
          <path
            d="M 120 75 Q 135 90 125 110 T 110 130"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />
          <path
            d="M 105 95 Q 120 100 135 115 T 145 135"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          <path
            d="M 140 75 Q 145 95 135 115"
            fill="none"
            stroke="#c084fc"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Right Hemisphere Gyri and Connections */}
          <path
            d="M 200 75 Q 185 90 195 110 T 210 130"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />
          <path
            d="M 215 95 Q 200 100 185 115 T 175 135"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
          <path
            d="M 180 75 Q 175 95 185 115"
            fill="none"
            stroke="#c084fc"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Central Corpus Callosum / Bridge */}
          <path
            d="M 160 70 Q 155 105 160 145"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.75"
            strokeDasharray="4 2"
          />

          {/* Synaptic Neural Nodes (Glowing dots) */}
          <circle cx="120" cy="75" r="3.2" fill="#00f0ff" />
          <circle cx="140" cy="73" r="2.5" fill="#c084fc" />
          <circle cx="160" cy="70" r="3.5" fill="#ffffff" />
          <circle cx="180" cy="73" r="2.5" fill="#c084fc" />
          <circle cx="200" cy="75" r="3.2" fill="#00f0ff" />

          <circle cx="98" cy="98" r="2.8" fill="#00f0ff" />
          <circle cx="125" cy="100" r="3" fill="#ffffff" />
          <circle cx="145" cy="102" r="2.5" fill="#818cf8" />
          <circle cx="175" cy="102" r="2.5" fill="#818cf8" />
          <circle cx="195" cy="100" r="3" fill="#ffffff" />
          <circle cx="222" cy="98" r="2.8" fill="#00f0ff" />

          <circle cx="110" cy="128" r="3" fill="#818cf8" />
          <circle cx="135" cy="122" r="2.5" fill="#00f0ff" />
          <circle cx="160" cy="126" r="3.2" fill="#c084fc" />
          <circle cx="185" cy="122" r="2.5" fill="#00f0ff" />
          <circle cx="210" cy="128" r="3" fill="#818cf8" />

          <circle cx="125" cy="140" r="2.5" fill="#00f0ff" />
          <circle cx="160" cy="145" r="3.5" fill="#00f0ff" />
          <circle cx="195" cy="140" r="2.5" fill="#00f0ff" />

          {/* Neural Wireframe Cross Lines */}
          <line x1="120" y1="75" x2="160" y2="70" stroke="#00f0ff" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="160" y1="70" x2="200" y2="75" stroke="#00f0ff" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="98" y1="98" x2="125" y2="100" stroke="#818cf8" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="125" y1="100" x2="160" y2="102" stroke="#c084fc" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="160" y1="102" x2="195" y2="100" stroke="#c084fc" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="195" y1="100" x2="222" y2="98" stroke="#818cf8" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="125" y1="100" x2="135" y2="122" stroke="#00f0ff" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1="195" y1="100" x2="185" y2="122" stroke="#00f0ff" strokeWidth="0.75" strokeOpacity="0.4" />
        </g>
      </svg>
    </div>
  )
}
