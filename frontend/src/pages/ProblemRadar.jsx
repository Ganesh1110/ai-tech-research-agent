import React, { useState, useEffect } from "react"
import {
  fetchProblems,
  scanProblems,
  createProblem,
  createIdea,
} from "../services/api"
import {
  RadarIcon,
  RefreshIcon,
  PlusIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  ExternalLinkIcon,
  LightbulbIcon,
  CheckCircleIcon,
} from "../components/common/Icons"

export default function ProblemRadar({ onNavigate }) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedSource, setSelectedSource] = useState("All")
  const [showAddModal, setShowAddModal] = useState(false)
  const [convertingId, setConvertingId] = useState(null)

  // Manual problem form
  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formCat, setFormCat] = useState("SaaS")
  const [formSeverity, setFormSeverity] = useState(7.0)
  const [formQuotes, setFormQuotes] = useState("")
  const [savingProblem, setSavingProblem] = useState(false)

  useEffect(() => {
    loadProblems()
  }, [selectedCategory, selectedSource])

  async function loadProblems() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProblems({
        category: selectedCategory,
        source: selectedSource,
      })
      setProblems(data.problems || [])
    } catch (err) {
      setError(err.message || "Failed to load global problems")
    } finally {
      setLoading(false)
    }
  }

  async function handleScan() {
    setScanning(true)
    try {
      const data = await scanProblems(15)
      setProblems(data.problems || [])
    } catch (err) {
      alert("Radar scan failed: " + err.message)
    } finally {
      setScanning(false)
    }
  }

  async function handleCreateManual(e) {
    e.preventDefault()
    if (!formTitle.trim()) return

    setSavingProblem(true)
    try {
      const quotesArray = formQuotes
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean)

      const payload = {
        title: formTitle.trim(),
        description: formDesc.trim(),
        category: formCat,
        source: "Manual",
        severity_score: parseFloat(formSeverity),
        frequency_score: 7.0,
        commercial_viability: 8.0,
        sentiment_quotes: quotesArray,
      }

      const created = await createProblem(payload)
      setProblems([created, ...problems])
      setFormTitle("")
      setFormDesc("")
      setFormQuotes("")
      setShowAddModal(false)
    } catch (err) {
      alert("Failed to save pain point: " + err.message)
    } finally {
      setSavingProblem(false)
    }
  }

  async function handleConvertToIdea(problem) {
    setConvertingId(problem.id)
    try {
      const ideaPayload = {
        title: `Solution for: ${problem.title.slice(0, 80)}`,
        problem_statement: problem.description || problem.title,
        proposed_solution: `Autonomous system utilizing ${(problem.suggested_tech_stack || ["AI", "FastAPI"]).join(", ")} to solve ${problem.category} friction.`,
        target_audience: `${problem.category} professionals & teams`,
        monetization_hypothesis: "B2B SaaS / Usage-based tier",
        tags: [problem.category, "Problem-Driven", "Radar-Validated"],
      }

      await createIdea(ideaPayload)
      if (confirm("Pain point converted into a draft in your Idea Vault! Open Idea Vault now?")) {
        if (onNavigate) {
          onNavigate("idea-vault")
        }
      }
    } catch (err) {
      alert("Failed to convert to idea: " + err.message)
    } finally {
      setConvertingId(null)
    }
  }

  // Categories list
  const categories = [
    "All",
    "SaaS",
    "DevTools",
    "AI Workflow",
    "Productivity",
    "Security & Compliance",
    "Consumer & SMB",
  ]

  // Multi-source list
  const sources = [
    "All",
    "GitHub",
    "HackerNews",
    "Reddit",
    "AppStore",
    "G2 / Reviews",
    "X / Social",
    "StackOverflow",
    "Manual",
  ]

  const sourceMeta = {
    GitHub: { icon: "🐙", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)" },
    HackerNews: { icon: "🟠", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" },
    Reddit: { icon: "🔴", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
    AppStore: { icon: "📱", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
    "G2 / Reviews": { icon: "⭐", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
    "X / Social": { icon: "🐦", color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.15)" },
    StackOverflow: { icon: "🥞", color: "#eab308", bg: "rgba(234, 179, 8, 0.15)" },
    Manual: { icon: "✍️", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  }

  // KPI Calculations
  const totalCount = problems.length
  const criticalCount = problems.filter((p) => p.severity_score >= 8.0).length
  const matchedCount = problems.filter((p) => p.matched_ideas_count > 0).length
  const avgPainScore = totalCount > 0
    ? Math.round(problems.reduce((acc, curr) => acc + (curr.composite_pain_score || 0), 0) / totalCount)
    : 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#ef4444" }}><RadarIcon size={24} /></span>
            Global Problem & Pain-Point Radar
          </h2>
          <p style={{ margin: 0, color: "var(--text-muted, #94a3b8)", fontSize: 14 }}>
            Autonomous discovery scanning Reddit, Hacker News, and public reviews for real customer friction, complaints, and unmet needs.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <RadarIcon size={14} />
            {scanning ? "Scanning Feeds..." : "Scan Problem Feeds"}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "var(--surface-card, #1e293b)",
              color: "var(--text, #f8fafc)",
              border: "1px solid var(--border, #334155)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <PlusIcon size={14} />
            Log Pain Point
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>Active Pain Points</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{totalCount}</div>
        </div>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>High Severity Gripes</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#ef4444" }}>{criticalCount}</div>
        </div>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>Matched with Your Ideas</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>{matchedCount}</div>
        </div>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>Average Pain Intensity</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#f59e0b" }}>{avgPainScore}%</div>
        </div>
      </div>

      {/* Manual Entry Form */}
      {showAddModal && (
        <form
          onSubmit={handleCreateManual}
          style={{
            background: "var(--surface-card, #1e293b)",
            border: "1px solid #ef4444",
            borderRadius: 12,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Log Observed Pain Point / Complaint</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{ background: "none", border: "none", color: "var(--text-muted, #94a3b8)", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Problem Headline *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Stripe webhook failures silently dropped during high traffic bursts"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--surface, #0f172a)",
                border: "1px solid var(--border, #334155)",
                color: "#fff",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Description & Context
            </label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Explain how users suffer from this and why existing tools fail..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--surface, #0f172a)",
                border: "1px solid var(--border, #334155)",
                color: "#fff",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Category</label>
              <select
                value={formCat}
                onChange={(e) => setFormCat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "var(--surface, #0f172a)",
                  border: "1px solid var(--border, #334155)",
                  color: "#fff",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              >
                <option value="SaaS">SaaS</option>
                <option value="DevTools">DevTools</option>
                <option value="AI Workflow">AI Workflow</option>
                <option value="Productivity">Productivity</option>
                <option value="Security & Compliance">Security & Compliance</option>
                <option value="Fintech">Fintech</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Frustration Severity ({formSeverity}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={formSeverity}
                onChange={(e) => setFormSeverity(e.target.value)}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              User Quote / Verbatim Complaint (one per line)
            </label>
            <textarea
              rows={2}
              value={formQuotes}
              onChange={(e) => setFormQuotes(e.target.value)}
              placeholder='"We lost $8,000 in subscription renewals because webhooks timed out"'
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                background: "var(--surface, #0f172a)",
                border: "1px solid var(--border, #334155)",
                color: "#fff",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                padding: "8px 16px",
                background: "transparent",
                color: "var(--text-muted, #94a3b8)",
                border: "1px solid var(--border, #334155)",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProblem}
              style={{
                padding: "8px 20px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {savingProblem ? "Saving..." : "Save Pain Point"}
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)", fontWeight: 600, marginRight: 4 }}>
          Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              background: selectedCategory === cat ? "#ef4444" : "var(--surface-card, #1e293b)",
              color: selectedCategory === cat ? "#fff" : "var(--text-muted, #94a3b8)",
              border: "1px solid var(--border, #334155)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Multi-Source Filter Pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--border, #334155)", paddingBottom: 14 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)", fontWeight: 600, marginRight: 4 }}>
          Source:
        </span>
        {sources.map((src) => {
          const meta = sourceMeta[src]
          const isSelected = selectedSource === src
          return (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: isSelected ? (meta?.color || "var(--accent, #6366f1)") : "var(--surface-card, #1e293b)",
                color: isSelected ? "#fff" : (meta?.color || "var(--text-muted, #94a3b8)"),
                border: isSelected ? "none" : "1px solid var(--border, #334155)",
              }}
            >
              {meta?.icon && <span>{meta.icon}</span>}
              <span>{src}</span>
            </button>
          )
        })}
      </div>

      {/* Problems Feed */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted, #94a3b8)" }}>
          <RefreshIcon size={28} spinning />
          <div style={{ marginTop: 12 }}>Scanning Global Problem Radar...</div>
        </div>
      ) : problems.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "var(--surface-card, #1e293b)",
            borderRadius: 12,
            border: "1px dashed var(--border, #334155)",
          }}
        >
          <RadarIcon size={36} color="#ef4444" />
          <h3 style={{ margin: "14px 0 6px 0", fontSize: 16 }}>No pain points found for this filter</h3>
          <p style={{ margin: "0 0 16px 0", color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
            Trigger a live scan to pull the latest complaint threads from Reddit & Hacker News.
          </p>
          <button
            onClick={handleScan}
            style={{
              padding: "8px 16px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Scan Problem Feeds Now
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {problems.map((prob) => {
            const isConverting = convertingId === prob.id

            return (
              <div
                key={prob.id}
                style={{
                  background: "var(--surface-card, #1e293b)",
                  border: "1px solid var(--border, #334155)",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                        }}
                      >
                        {prob.category}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: sourceMeta[prob.source]?.bg || "var(--surface, #0f172a)",
                          color: sourceMeta[prob.source]?.color || "var(--text-muted, #94a3b8)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {sourceMeta[prob.source]?.icon && <span>{sourceMeta[prob.source].icon}</span>}
                        <span>{prob.source}</span>
                      </span>

                      {prob.matched_ideas_count > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CheckCircleIcon size={12} /> {prob.matched_ideas_count} Idea Match{prob.matched_ideas_count > 1 ? "es" : ""}
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: "0 0 8px 0", fontSize: 17, fontWeight: 700 }}>
                      {prob.title}
                    </h3>

                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted, #cbd5e1)", lineHeight: 1.5 }}>
                      {prob.description}
                    </p>
                  </div>

                  {/* Pain score badge */}
                  <div
                    style={{
                      background: "var(--surface, #0f172a)",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border, #334155)",
                      textAlign: "center",
                      minWidth: 90,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)", marginBottom: 2 }}>Pain Score</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: prob.composite_pain_score >= 80 ? "#ef4444" : "#f59e0b" }}>
                      {prob.composite_pain_score}%
                    </div>
                  </div>
                </div>

                {/* Sub-scores */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                  <div style={{ background: "var(--surface, #0f172a)", padding: 8, borderRadius: 6, fontSize: 12 }}>
                    <div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 11 }}>Frustration Severity</div>
                    <div style={{ fontWeight: 700, color: "#ef4444" }}>{prob.severity_score} / 10</div>
                  </div>
                  <div style={{ background: "var(--surface, #0f172a)", padding: 8, borderRadius: 6, fontSize: 12 }}>
                    <div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 11 }}>Complaint Frequency</div>
                    <div style={{ fontWeight: 700, color: "#f59e0b" }}>{prob.frequency_score} / 10</div>
                  </div>
                  <div style={{ background: "var(--surface, #0f172a)", padding: 8, borderRadius: 6, fontSize: 12 }}>
                    <div style={{ color: "var(--text-muted, #94a3b8)", fontSize: 11 }}>Commercial Viability</div>
                    <div style={{ fontWeight: 700, color: "#10b981" }}>{prob.commercial_viability} / 10</div>
                  </div>
                </div>

                {/* User Quotes */}
                {prob.sentiment_quotes && prob.sentiment_quotes.length > 0 && (
                  <div
                    style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      borderLeft: "3px solid #ef4444",
                      padding: "8px 12px",
                      borderRadius: "0 6px 6px 0",
                      fontSize: 12,
                      fontStyle: "italic",
                      color: "var(--text-muted, #cbd5e1)",
                    }}
                  >
                    "{prob.sentiment_quotes[0]}"
                  </div>
                )}

                {/* Card footer: Tech Stack & Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>Solvable with:</span>
                    {(prob.suggested_tech_stack || []).map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "var(--surface, #0f172a)",
                          color: "#cbd5e1",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {prob.source_url && (
                      <a
                        href={prob.source_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted, #94a3b8)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          textDecoration: "none",
                        }}
                      >
                        Source <ExternalLinkIcon size={12} />
                      </a>
                    )}

                    <button
                      onClick={() => handleConvertToIdea(prob)}
                      disabled={isConverting}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        background: "var(--accent, #6366f1)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <LightbulbIcon size={14} />
                      {isConverting ? "Converting..." : "Turn into Idea"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
