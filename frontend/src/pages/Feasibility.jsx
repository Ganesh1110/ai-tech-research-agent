import React, { useState, useCallback } from "react"
import {
  CheckReportIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  SparklesIcon,
  ShieldCheckIcon,
  RefreshIcon,
} from "../components/common/Icons"
import { runOrchestrate } from "../services/api"

const DEFAULT_SPECIALISTS = "developer_tools,ai_llm,general"

export function Feasibility() {
  const [idea, setIdea] = useState("")
  const [specialists, setSpecialists] = useState(DEFAULT_SPECIALISTS)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleRun = useCallback(async (e) => {
    e.preventDefault()
    if (!idea.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const result = await runOrchestrate({
        objective: `Evaluate the technical feasibility of: ${idea}. Cover architecture, hardware requirements, estimated cost, performance, security considerations, complexity, and implementation recommendation.`,
        specialists,
        parallel: true,
      })
      setReport({
        idea,
        objective: result.objective,
        specialists: result.specialists,
        tasks: result.total_tasks,
        completed: result.completed_tasks,
        failed: result.failed_tasks,
        duration: result.duration_seconds,
        sources: result.sources,
        finalAnswer: result.final_answer || "",
        createdAt: result.created_at,
      })
    } catch (err) {
      setError(err.message || "Feasibility evaluation failed")
    } finally {
      setLoading(false)
    }
  }, [idea, specialists])

  const statusColor = (s) => {
    switch (s) {
      case "Feasible": return "var(--accent-emerald)"
      case "Conditional": return "var(--accent-amber)"
      case "Not Feasible": return "var(--accent-rose)"
      default: return "var(--accent-cyan)"
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
          <CheckReportIcon size={22} color="var(--accent-emerald)" />
          <span>Technical Feasibility Evaluator</span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
          Submit a project idea and the multi-agent research orchestrator will evaluate architecture, hardware, cost, performance, security, and complexity.
        </p>
      </div>

      <form onSubmit={handleRun} style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--bg-card)", padding: 20, borderRadius: 14, border: "1px solid var(--border-subtle)" }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Project idea / technology to evaluate</label>
          <input
            type="text"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. Local MCP server for SQLite knowledge base, or Quantized LLM on Apple Silicon"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              color: "var(--text-main)",
              fontSize: 13,
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>Specialist agents (comma-separated)</label>
          <input
            type="text"
            value={specialists}
            onChange={(e) => setSpecialists(e.target.value)}
            placeholder="developer_tools,ai_llm,general"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              color: "var(--text-main)",
              fontSize: 13,
            }}
          />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            Valid: ai_llm, agentic_ai, react_native, developer_tools, open_source, general
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !idea.trim()}
          className="btn-primary"
          style={{ padding: "10px 18px", fontSize: 13, width: "fit-content", cursor: loading || !idea.trim() ? "not-allowed" : "pointer" }}
        >
          {loading ? <span>Evaluating…</span> : <><SparklesIcon size={14} /> <span>Run Feasibility Evaluation</span></>}
        </button>
      </form>

      {error && (
        <div className="glass-panel" style={{ padding: 14, color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {report && (
        <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)" }}>{report.idea}</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {report.specialists} specialists • {report.completed}/{report.tasks} tasks completed
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--accent-emerald)" }}>{report.completed} done</span>
              {report.failed > 0 && <span style={{ color: "var(--accent-rose)" }}>{report.failed} failed</span>}
              <span style={{ color: "var(--accent-cyan)" }}>{report.duration?.toFixed(1) || 0}s</span>
              <span style={{ color: "var(--text-dim)" }}>{report.sources} sources</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h4 style={{ fontSize: 12.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Feasibility Report</h4>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: 16,
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--text-main)",
                whiteSpace: "pre-wrap",
              }}
            >
              {report.finalAnswer}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={() => setReport(null)}
              className="btn-secondary"
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              <RefreshIcon size={14} /> New Evaluation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
