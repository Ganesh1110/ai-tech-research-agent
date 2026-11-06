import React from "react"

export function DonutChart({
  data = [
    { label: "Research Papers", value: 35, color: "#10b981" },
    { label: "GitHub Projects", value: 40, color: "#a855f7" },
    { label: "Tools & Skills", value: 15, color: "#3b82f6" },
    { label: "Datasets", value: 10, color: "#ec4899" },
  ],
  centerText = "3.2K",
  centerSubtext = "Sources",
  size = 140,
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = 54
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius
  let accumulatedPercent = 0

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {data.map((item, idx) => {
            const fraction = item.value / total
            const strokeDasharray = `${fraction * circumference} ${circumference}`
            const strokeDashoffset = -accumulatedPercent * circumference
            accumulatedPercent += fraction

            return (
              <circle
                key={idx}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 5px ${item.color}88)`,
                  transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease",
                }}
              />
            )
          })}
        </svg>

        {/* Center label */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", letterSpacing: -0.5 }}>
            {centerText}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {centerSubtext}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 140 }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}`,
                }}
              />
              <span style={{ color: "var(--text-dim)" }}>{item.label}</span>
            </div>
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
