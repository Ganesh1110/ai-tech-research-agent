import React from "react"

export function LineChart({
  data = [
    { label: "Mon", value: 15 },
    { label: "Tue", value: 45 },
    { label: "Wed", value: 38 },
    { label: "Thu", value: 72 },
    { label: "Fri", value: 50 },
    { label: "Sat", value: 65 },
    { label: "Sun", value: 85 },
  ],
  height = 140,
  lineColor = "#3b82f6",
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 100)
  const minVal = 0

  const width = 360
  const padX = 24
  const padY = 20

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (width - 2 * padX)
    const y = height - padY - ((d.value - minVal) / (maxVal - minVal)) * (height - 2 * padY)
    return { x, y, ...d }
  })

  // Create smooth bezier curve path
  let pathD = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cpX1 = p0.x + (p1.x - p0.x) / 2
    const cpY1 = p0.y
    const cpX2 = cpX1
    const cpY2 = p1.y
    pathD += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p1.x},${p1.y}`
  }

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padY} L ${points[0].x},${height - padY} Z`

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = padY + pct * (height - 2 * padY)
          return (
            <line
              key={i}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="4 4"
            />
          )
        })}

        {/* Gradient area */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Glowing trend curve */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${lineColor})` }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#0d1321" stroke={lineColor} strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="2.5" fill="#ffffff" />
            {/* Label */}
            <text
              x={p.x}
              y={height - 4}
              fontSize="10"
              fill="var(--text-dim)"
              textAnchor="middle"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
