import React from "react"
import { BoltIcon } from "../common/Icons"

export function BottomTicker({
  isSchedulerRunning = true,
  lastRunText = "2 min ago",
  version = "v2.0.0",
  insightText = "AI agents and MCP toolkits are trending with 2.4K+ new projects analyzed this week",
}) {
  return (
    <div className="bottom-ticker">
      <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--accent-purple-light)",
            fontWeight: 700,
            fontSize: 11.5,
            flexShrink: 0,
          }}
        >
          <BoltIcon size={14} color="var(--accent-purple-light)" />
          <span>Live Research Insight</span>
        </div>
        <span style={{ color: "var(--border-subtle)" }}>•</span>
        <span
          style={{
            color: "var(--text-dim)",
            fontSize: 11.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {insightText}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-dim)" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isSchedulerRunning ? "var(--accent-emerald)" : "var(--accent-muted)",
              boxShadow: isSchedulerRunning ? "0 0 6px #10b981" : "none",
            }}
          />
          <span>Scheduler: <strong style={{ color: "var(--text-main)" }}>{isSchedulerRunning ? "Active" : "Stopped"}</strong></span>
          <span style={{ color: "var(--text-muted)" }}>|</span>
          <span>Last Run: {lastRunText}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 11 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>{version}</span>
        </div>
      </div>
    </div>
  )
}
