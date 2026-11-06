import React, { useState } from "react"
import { CheckReportIcon, CheckCircleIcon, ExternalLinkIcon, SparklesIcon, ShieldCheckIcon } from "../components/common/Icons"

export function Feasibility() {
  const reports = [
    {
      id: 1,
      title: "Model Context Protocol (MCP) Server for Local SQLite Knowledge Base",
      status: "Feasible",
      confidence: "94%",
      architecture: "Python AsyncIO / FastMCP daemon with stdio / SSE transport",
      hardware: "Low (< 100MB RAM, 1 CPU core)",
      cost: "$0 (Local open-source runtime)",
      performance: "< 15ms latency per query lookup via indexed sqlite3 tables",
      security: "Read-only database mode recommended to prevent SQL injection in autonomous workflows",
      complexity: "Low",
      recommendation: "Implement immediately as a secondary transport for research agent tools.",
    },
    {
      id: 2,
      title: "Local Quantized LLM (Qwen 2.5 14B) on Apple Silicon / M-Series",
      status: "Feasible",
      confidence: "98%",
      architecture: "Ollama / llama.cpp Metal GPU Acceleration",
      hardware: "Requires 16GB Unified Memory minimum (32GB recommended for context window > 16k)",
      cost: "$0 recurring inference cost",
      performance: "32-45 tokens/sec generation speed with Q4_K_M quantization",
      security: "Full on-prem data privacy, zero telemetry, air-gapped capability",
      complexity: "Minimal",
      recommendation: "Optimal foundation model for autonomous research synthesis and scoring.",
    },
    {
      id: 3,
      title: "Autonomous 24/7 Agent Daemon with APScheduler & Telegram Notifications",
      status: "Feasible",
      confidence: "92%",
      architecture: "Background worker loop with APScheduler and SQLite job queue persistence",
      hardware: "Minimal idle footprint (< 0.5% CPU)",
      cost: "Free Telegram Bot API",
      performance: "5-minute interval cycle with graceful deduplication",
      security: "Store Telegram bot token in local .env, restrict chat ID authorization",
      complexity: "Moderate",
      recommendation: "Ready for scheduled automation once Telegram bot credentials are provided.",
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
          <CheckReportIcon size={22} color="var(--accent-emerald)" />
          <span>Technical Feasibility Evaluations</span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
          Architectural compatibility, hardware profiles, security considerations, and implementation complexity
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
        {reports.map((rep) => (
          <div key={rep.id} className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "var(--accent-emerald)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {rep.status} • {rep.confidence} Confidence
              </span>

              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                Complexity: <strong style={{ color: "var(--accent-cyan)" }}>{rep.complexity}</strong>
              </span>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.35 }}>
              {rep.title}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12.5 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: 10, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>Architecture:</div>
                <div style={{ color: "var(--text-main)", fontWeight: 500 }}>{rep.architecture}</div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: 10, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>Hardware & RAM:</div>
                <div style={{ color: "var(--text-main)", fontWeight: 500 }}>{rep.hardware}</div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: 10, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>Performance Latency:</div>
                <div style={{ color: "var(--text-main)", fontWeight: 500 }}>{rep.performance}</div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: 10, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>Estimated Cost:</div>
                <div style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>{rep.cost}</div>
              </div>
            </div>

            <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5, borderLeft: "3px solid var(--accent-purple-light)", paddingLeft: 10 }}>
              <strong style={{ color: "var(--text-main)" }}>Security Considerations:</strong> {rep.security}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: 12,
                fontSize: 12.5,
                color: "var(--accent-cyan)",
                lineHeight: 1.4,
              }}
            >
              <strong>Recommendation:</strong> {rep.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
