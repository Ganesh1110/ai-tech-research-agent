import React, { useState } from "react"
import { MetricsIcon, CheckCircleIcon, RefreshIcon, ClockIcon } from "../components/common/Icons"

export function ActivityMetrics({ cycles = [], jobs = [], onRefresh }) {
  const [activeTab, setActiveTab] = useState("cycles")

  // Fallback demo cycles if empty
  const displayCycles = cycles.length > 0 ? cycles : [
    {
      id: 104,
      status: "completed",
      started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      duration_seconds: 98.4,
      items_collected: 34,
      items_new: 12,
      high_potential_count: 3,
      failed_collectors: [],
    },
    {
      id: 103,
      status: "completed",
      started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      duration_seconds: 104.2,
      items_collected: 28,
      items_new: 8,
      high_potential_count: 2,
      failed_collectors: [],
    },
    {
      id: 102,
      status: "completed",
      started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      duration_seconds: 92.0,
      items_collected: 31,
      items_new: 14,
      high_potential_count: 4,
      failed_collectors: [],
    },
  ]

  // Fallback demo jobs if empty
  const displayJobs = jobs.length > 0 ? jobs : [
    { id: 401, job_type: "collection", worker_type: "github_collector", status: "completed", retry_count: 0 },
    { id: 402, job_type: "collection", worker_type: "mcp_collector", status: "completed", retry_count: 0 },
    { id: 403, job_type: "collection", worker_type: "arxiv_collector", status: "completed", retry_count: 0 },
    { id: 404, job_type: "analysis", worker_type: "ai_analysis_worker", status: "running", retry_count: 0 },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
            <MetricsIcon size={22} color="var(--accent-purple-light)" />
            <span>Autonomous Activity & Metrics</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Execution cycles, job queue telemetry, latency profiling, and worker performance
          </p>
        </div>

        <button onClick={onRefresh} className="btn-secondary" style={{ padding: "6px 14px", fontSize: 12.5 }}>
          <RefreshIcon size={14} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab("cycles")}
          style={{
            background: activeTab === "cycles" ? "rgba(139, 92, 246, 0.2)" : "transparent",
            color: activeTab === "cycles" ? "#ffffff" : "var(--text-dim)",
            border: activeTab === "cycles" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid transparent",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Discovery Cycles ({displayCycles.length})
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          style={{
            background: activeTab === "jobs" ? "rgba(139, 92, 246, 0.2)" : "transparent",
            color: activeTab === "jobs" ? "#ffffff" : "var(--text-dim)",
            border: activeTab === "jobs" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid transparent",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Job Queue Telemetry ({displayJobs.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "cycles" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayCycles.map((c) => (
            <div
              key={c.id}
              className="glass-panel"
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleIcon size={18} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)" }}>
                    Cycle #{c.id}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Started: {new Date(c.started_at).toLocaleTimeString()} • Duration: {(c.duration_seconds || 0).toFixed(1)}s
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>
                    {c.items_collected} Collected
                  </div>
                  <div style={{ fontSize: 11, color: "var(--accent-emerald)" }}>
                    +{c.items_new} new ({c.high_potential_count} high potential)
                  </div>
                </div>

                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "var(--accent-emerald)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: "0", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "14px 20px" }}>Job ID</th>
                <th style={{ padding: "14px 20px" }}>Worker Type</th>
                <th style={{ padding: "14px 20px" }}>Job Type</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
                <th style={{ padding: "14px 20px" }}>Retries</th>
              </tr>
            </thead>
            <tbody>
              {displayJobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                  <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-bright)" }}>
                    #{j.id}
                  </td>
                  <td style={{ padding: "12px 20px", fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontSize: 12 }}>
                    {j.worker_type}
                  </td>
                  <td style={{ padding: "12px 20px", color: "var(--text-dim)" }}>
                    {j.job_type}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <span
                      style={{
                        background: j.status === "completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(0, 240, 255, 0.15)",
                        color: j.status === "completed" ? "#10b981" : "#00f0ff",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", color: "var(--text-dim)" }}>
                    {j.retry_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
