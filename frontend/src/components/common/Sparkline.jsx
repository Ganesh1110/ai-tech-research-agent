import React from "react"

export function Sparkline({
  data = [12, 14, 11, 16, 18, 15, 22, 26],
  color = "#8b5cf6",
  width = 90,
  height = 34,
}) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 4) + 2
    const y = height - 4 - ((val - min) / range) * (height - 8)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pathD = `M ${points.join(" L ")}`
  const areaD = `M ${points[0]} L ${points.join(" L ")} L ${width - 2},${height} L 2,${height} Z`

  const gradId = `sparkline-grad-${color.replace("#", "")}`

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}
