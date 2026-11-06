import React from "react"
import {
  RocketIcon,
  StarIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from "../common/Icons"
import { Sparkline } from "../common/Sparkline"

export function KpiCards({ stats = {} }) {
  const totalDiscoveries = stats.totalDiscoveries || 1058
  const highPotential = stats.highPotential || 86
  const newToday = stats.newToday || 24
  const sourceValidity = stats.sourceValidity || 92

  return (
    <section
      aria-label="Overview KPI Metrics"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
      }}
    >
      {/* KPI 1: Total Discoveries */}
      <div className="glass-panel" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RocketIcon size={22} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                {totalDiscoveries.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                Total Discoveries
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +12%</span>
              </div>
            </div>
          </div>
          <Sparkline data={[12, 14, 13, 17, 19, 18, 24, 28]} color="#8b5cf6" width={75} height={32} />
        </div>
      </div>

      {/* KPI 2: High Potential */}
      <div className="glass-panel" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StarIcon size={22} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                {highPotential.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                High Potential
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +8%</span>
              </div>
            </div>
          </div>
          <Sparkline data={[8, 10, 11, 14, 13, 16, 18, 21]} color="#f59e0b" width={75} height={32} />
        </div>
      </div>

      {/* KPI 3: New Today */}
      <div className="glass-panel" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarIcon size={22} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                {newToday.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                New Today
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +20%</span>
              </div>
            </div>
          </div>
          <Sparkline data={[5, 8, 9, 12, 14, 18, 22, 24]} color="#00f0ff" width={75} height={32} />
        </div>
      </div>

      {/* KPI 4: Source Validity */}
      <div className="glass-panel" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheckIcon size={22} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                {sourceValidity}%
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                Source Validity
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +2%</span>
              </div>
            </div>
          </div>
          <Sparkline data={[88, 89, 90, 91, 91, 92, 92, 92]} color="#10b981" width={75} height={32} />
        </div>
      </div>
    </section>
  )
}
