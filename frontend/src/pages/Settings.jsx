import React, { useState } from "react"
import { SettingsIcon, CheckCircleIcon, PlayIcon, SquareIcon, RefreshIcon, ShieldCheckIcon } from "../components/common/Icons"
import { runAgent, runWorkflow, runOrchestrate, runEvaluate, getStoredApiKey, setStoredApiKey } from "../services/api"

export function Settings({
  healthData,
  schedulerStatus,
  onStartScheduler,
  onStopScheduler,
  onRefreshHealth,
}) {
  const [activeSection, setActiveSection] = useState("general")
  const [manualOutput, setManualOutput] = useState(null)
  const [isManualRunning, setIsManualRunning] = useState(false)

  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey())
  const [authMsg, setAuthMsg] = useState("")

  function handleSaveApiKey(e) {
    e.preventDefault()
    setStoredApiKey(apiKeyInput.trim())
    setAuthMsg("API key saved! Requests will include this key.")
    setTimeout(() => setAuthMsg(""), 4000)
    if (onRefreshHealth) onRefreshHealth()
  }

  const isRunning = schedulerStatus?.running ?? true

  async function handleRunSingleAgent(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const objective = form.get("objective")
    setIsManualRunning(true)
    setManualOutput(null)
    try {
      const data = await runAgent(objective)
      setManualOutput({ title: "Agent Run Result", data })
    } catch (err) {
      setManualOutput({ title: "Error", data: { error: err.message || String(err) } })
    } finally {
      setIsManualRunning(false)
    }
  }

  async function handleRunWorkflow(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const workflowType = form.get("workflow_type")
    const objective = form.get("objective")
    const criteria = form.get("criteria")
    setIsManualRunning(true)
    setManualOutput(null)
    try {
      const data = await runWorkflow({ workflowType, objective, criteria })
      setManualOutput({ title: "Workflow Result", data })
    } catch (err) {
      setManualOutput({ title: "Error", data: { error: err.message || String(err) } })
    } finally {
      setIsManualRunning(false)
    }
  }

  async function handleRunSuite() {
    setIsManualRunning(true)
    setManualOutput(null)
    try {
      const data = await runEvaluate()
      setManualOutput({ title: "Evaluation Report", data })
    } catch (err) {
      setManualOutput({ title: "Error", data: { error: err.message || String(err) } })
    } finally {
      setIsManualRunning(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
            <SettingsIcon size={22} color="var(--accent-purple-light)" />
            <span>Agent Platform Settings & Diagnostic Control</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Manage autonomous scheduler cadence, local Ollama endpoints, scoring factors, and manual test suites
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 10 }}>
        <button
          onClick={() => setActiveSection("general")}
          style={{
            background: activeSection === "general" ? "rgba(139, 92, 246, 0.2)" : "transparent",
            color: activeSection === "general" ? "#ffffff" : "var(--text-dim)",
            border: activeSection === "general" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid transparent",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Scheduler & Connectivity
        </button>
        <button
          onClick={() => setActiveSection("manual")}
          style={{
            background: activeSection === "manual" ? "rgba(139, 92, 246, 0.2)" : "transparent",
            color: activeSection === "manual" ? "#ffffff" : "var(--text-dim)",
            border: activeSection === "manual" ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid transparent",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Manual Agent Executions & Testing
        </button>
      </div>

      {activeSection === "general" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Autonomous Scheduler Card */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)" }}>
                  Autonomous Scheduler (APScheduler)
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
                  Operates background research collection cycles every 5 minutes (300 seconds)
                </p>
              </div>

              <button
                onClick={isRunning ? onStopScheduler : onStartScheduler}
                className={isRunning ? "btn-secondary" : "btn-primary"}
                style={{
                  background: isRunning ? "rgba(244, 63, 94, 0.15)" : undefined,
                  borderColor: isRunning ? "rgba(244, 63, 94, 0.4)" : undefined,
                  color: isRunning ? "var(--accent-rose)" : undefined,
                }}
              >
                {isRunning ? <SquareIcon size={14} color="var(--accent-rose)" /> : <PlayIcon size={14} />}
                <span>{isRunning ? "Stop Scheduler" : "Start Scheduler"}</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Current State</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isRunning ? "var(--accent-emerald)" : "var(--accent-rose)", marginTop: 2 }}>
                  {isRunning ? "Active & Monitoring" : "Stopped"}
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Cycle Cadence</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)", marginTop: 2 }}>
                  5 Minutes (300s)
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Execution Model</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-cyan)", marginTop: 2 }}>
                  Async SQLite Queue
                </div>
              </div>
            </div>
          </div>

          {/* Backend & Ollama Diagnostics */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)" }}>
                  Inference & Backend Health
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
                  FastAPI service and local Ollama model runtime diagnostics
                </p>
              </div>

              <button onClick={onRefreshHealth} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
                <RefreshIcon size={13} />
                <span>Probe Health</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Ollama Model</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", marginTop: 2 }}>
                  {healthData?.ollama_model || "qwen2.5:14b"}
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Ollama Endpoint</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)", marginTop: 2 }}>
                  {healthData?.ollama_base_url || "http://localhost:11434"}
                </div>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Ollama Status</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: healthData?.ollama_available ? "var(--accent-emerald)" : "var(--accent-rose)", marginTop: 2 }}>
                  {healthData?.ollama_available ? "Available (Online)" : "Offline"}
                </div>
              </div>
            </div>
          </div>

          {/* Security & API Key Authentication Card */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheckIcon size={18} color="#38bdf8" />
                  API Authentication & Security
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
                  Configure client API key for protected FastAPI endpoints and remote deployments.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKey} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="password"
                placeholder="Enter API_KEY (optional for local development)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{
                  flex: "1 1 280px",
                  padding: "8px 12px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  color: "var(--text-primary)",
                  fontSize: 13,
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                Save API Key
              </button>
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput("")
                    setStoredApiKey("")
                    setAuthMsg("API key cleared.")
                    setTimeout(() => setAuthMsg(""), 3000)
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "8px 12px", fontSize: 13 }}
                >
                  Clear Key
                </button>
              )}
            </form>

            {authMsg && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#4ade80" }}>
                ✓ {authMsg}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Execution Suite (Preserving all previous functionality) */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
            {/* Run Agent Form */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
                Run Single Autonomous Agent
              </h3>
              <form onSubmit={handleRunSingleAgent} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  name="objective"
                  className="input-field"
                  placeholder="e.g. Find latest multi-agent research items and summarize key discoveries"
                  rows={3}
                  required
                />
                <button type="submit" disabled={isManualRunning} className="btn-primary" style={{ alignSelf: "flex-start" }}>
                  <span>Run Agent</span>
                </button>
              </form>
            </div>

            {/* Run Workflow Form */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
                Run Research Workflow
              </h3>
              <form onSubmit={handleRunWorkflow} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select name="workflow_type" className="input-field" defaultValue="technology_discovery">
                  <option value="technology_discovery">Technology Discovery</option>
                  <option value="framework_comparison">Framework Comparison</option>
                </select>
                <input
                  name="objective"
                  className="input-field"
                  placeholder="e.g. Compare local AI agent frameworks for Ollama"
                  required
                />
                <input
                  name="criteria"
                  className="input-field"
                  placeholder="Optional criteria (e.g. tool-calling, memory)"
                />
                <button type="submit" disabled={isManualRunning} className="btn-primary" style={{ alignSelf: "flex-start" }}>
                  <span>Run Workflow</span>
                </button>
              </form>
            </div>
          </div>

          {/* Run Evaluation Suite */}
          <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)" }}>
                Run Benchmark Evaluation Suite
              </h3>
              <p style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                Executes formal test cases and validates scoring, source attribution, and synthesis
              </p>
            </div>
            <button onClick={handleRunSuite} disabled={isManualRunning} className="btn-secondary">
              <span>Run Suite</span>
            </button>
          </div>

          {/* Results Output */}
          {manualOutput && (
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8 }}>
                {manualOutput.title}
              </h4>
              <pre
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-main)",
                  overflowX: "auto",
                  maxHeight: 300,
                }}
              >
                {JSON.stringify(manualOutput.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
