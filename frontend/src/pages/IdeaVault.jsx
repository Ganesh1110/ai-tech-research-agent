import React, { useState, useEffect, useMemo } from "react"
import {
  fetchIdeas,
  createIdea,
  validateIdea,
  promoteIdea,
  deleteIdea,
} from "../services/api"
import {
  LightbulbIcon,
  SparklesIcon,
  RocketIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  TrendingUpIcon,
  ExternalLinkIcon,
} from "../components/common/Icons"
import { Pagination } from "../components/common/Pagination"

export default function IdeaVault({ onNavigate }) {
  const [ideas, setIdeas] = useState([])
  const [totalIdeas, setTotalIdeas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedIdeaId, setExpandedIdeaId] = useState(null)
  const [validatingId, setValidatingId] = useState(null)
  const [promotingId, setPromotingId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formProblem, setFormProblem] = useState("")
  const [formSolution, setFormSolution] = useState("")
  const [formAudience, setFormAudience] = useState("")
  const [formMonetization, setFormMonetization] = useState("")
  const [formTags, setFormTags] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadIdeas()
  }, [filterStatus, page])

  async function loadIdeas() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchIdeas(filterStatus === "all" ? "" : filterStatus, PAGE_SIZE, (page - 1) * PAGE_SIZE)
      setIdeas(data.ideas || [])
      setTotalIdeas(data.total || 0)
    } catch (err) {
      setError(err.message || "Failed to load ideas from Idea Vault")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!formTitle.trim()) return

    setSubmitting(true)
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        title: formTitle.trim(),
        problem_statement: formProblem.trim(),
        proposed_solution: formSolution.trim(),
        target_audience: formAudience.trim(),
        monetization_hypothesis: formMonetization.trim(),
        tags: tagsArray,
      }

      const created = await createIdea(payload)
      setIdeas([created, ...ideas])
      setFormTitle("")
      setFormProblem("")
      setFormSolution("")
      setFormAudience("")
      setFormMonetization("")
      setFormTags("")
      setShowCreateForm(false)
    } catch (err) {
      alert("Failed to save idea: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleValidate(id) {
    setValidatingId(id)
    try {
      const updated = await validateIdea(id)
      setIdeas(ideas.map((item) => (item.id === id ? updated : item)))
      setExpandedIdeaId(id)
    } catch (err) {
      alert("Validation failed: " + err.message)
    } finally {
      setValidatingId(null)
    }
  }

  async function handlePromote(id) {
    setPromotingId(id)
    try {
      await promoteIdea(id)
      setIdeas(
        ideas.map((item) => (item.id === id ? { ...item, status: "promoted" } : item))
      )
      if (onNavigate) {
        if (confirm("Idea promoted to Startup Opportunity! Jump to Startup Studio now?")) {
          onNavigate("startup-studio")
        }
      }
    } catch (err) {
      alert("Promotion failed: " + err.message)
    } finally {
      setPromotingId(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this idea?")) return
    try {
      await deleteIdea(id)
      setIdeas(ideas.filter((i) => i.id !== id))
    } catch (err) {
      alert("Failed to delete idea: " + err.message)
    }
  }

  const filteredIdeas = ideas.filter((item) => {
    if (filterStatus === "all") return true
    return item.status === filterStatus
  })

  // KPI Calculations
  const totalCount = totalIdeas
  const validatedCount = ideas.filter((i) => i.status === "validated").length
  const promotedCount = ideas.filter((i) => i.status === "promoted").length
  const avgScore = totalCount > 0
    ? Math.round(ideas.reduce((acc, curr) => acc + (curr.validation_score || 0), 0) / ideas.length)
    : 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--accent, #6366f1)" }}><LightbulbIcon size={24} /></span>
            Founder Idea Vault
          </h2>
          <p style={{ margin: 0, color: "var(--text-muted, #94a3b8)", fontSize: 14 }}>
            Capture brainstormed concepts, run rigorous multi-dimensional AI validation, and match ideas with real-world consumer pain points.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => loadIdeas()}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "var(--surface-raised, #1e293b)",
              color: "var(--text, #f8fafc)",
              border: "1px solid var(--border, #334155)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <RefreshIcon size={14} spinning={loading} />
            Refresh
          </button>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "var(--accent, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <PlusIcon size={16} />
            {showCreateForm ? "Close Form" : "Capture Idea"}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>Total Ideas</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{totalCount}</div>
        </div>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>Validated Concepts</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>{validatedCount}</div>
        </div>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>Promoted to Studio</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#8b5cf6" }}>{promotedCount}</div>
        </div>
        <div style={{ background: "var(--surface-card, #1e293b)", padding: 18, borderRadius: 12, border: "1px solid var(--border, #334155)" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted, #94a3b8)", marginBottom: 4 }}>Avg Validation Score</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: avgScore >= 70 ? "#10b981" : "#f59e0b" }}>{avgScore}%</div>
        </div>
      </div>

      {/* Create Idea Form Modal / Drawer */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "var(--surface-card, #1e293b)",
            border: "1px solid var(--accent, #6366f1)",
            borderRadius: 12,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Log a New Brainstorm Idea</h3>
            <span style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)" }}>Structured Idea Capture</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Idea Title *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. AI-Powered Meeting Action Item Dispatcher for Dev Teams"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--surface, #0f172a)",
                border: "1px solid var(--border, #334155)",
                color: "#fff",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Problem Statement (What pain does this cure?)
              </label>
              <textarea
                rows={3}
                value={formProblem}
                onChange={(e) => setFormProblem(e.target.value)}
                placeholder="Engineers spend 40 mins after standups writing Jira tickets manually..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
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
                Proposed Solution (How does it work?)
              </label>
              <textarea
                rows={3}
                value={formSolution}
                onChange={(e) => setFormSolution(e.target.value)}
                placeholder="A lightweight bot that listens to meeting audio, extracts code action items, and drafts PRs..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--surface, #0f172a)",
                  border: "1px solid var(--border, #334155)",
                  color: "#fff",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Target Audience
              </label>
              <input
                type="text"
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value)}
                placeholder="e.g. Remote engineering leads, Seed startups"
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
                Monetization Hypothesis
              </label>
              <input
                type="text"
                value={formMonetization}
                onChange={(e) => setFormMonetization(e.target.value)}
                placeholder="e.g. $15/seat/month B2B SaaS"
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
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="e.g. AI Agents, DevTools, Productivity"
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
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
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
              disabled={submitting}
              style={{
                padding: "8px 20px",
                background: "var(--accent, #6366f1)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {submitting ? "Saving..." : "Save to Vault"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border, #334155)", paddingBottom: 12 }}>
        {["all", "draft", "validated", "promoted", "pivoted"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              textTransform: "capitalize",
              cursor: "pointer",
              background: filterStatus === st ? "var(--accent, #6366f1)" : "var(--surface-card, #1e293b)",
              color: filterStatus === st ? "#fff" : "var(--text-muted, #94a3b8)",
              border: "1px solid var(--border, #334155)",
            }}
          >
            {st} ({st === "all" ? ideas.length : ideas.filter((i) => i.status === st).length})
          </button>
        ))}
      </div>

      {/* Ideas Feed */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted, #94a3b8)" }}>
          <RefreshIcon size={28} spinning />
          <div style={{ marginTop: 12 }}>Loading Founder Idea Vault...</div>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "var(--surface-card, #1e293b)",
            borderRadius: 12,
            border: "1px dashed var(--border, #334155)",
          }}
        >
          <LightbulbIcon size={36} color="var(--text-muted, #94a3b8)" />
          <h3 style={{ margin: "14px 0 6px 0", fontSize: 16 }}>No ideas in this category</h3>
          <p style={{ margin: "0 0 16px 0", color: "var(--text-muted, #94a3b8)", fontSize: 13 }}>
            Capture a new brainstorm concept or check out the Global Problem Radar for inspiration.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: "8px 16px",
              background: "var(--accent, #6366f1)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Create First Idea
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredIdeas.map((idea) => {
            const isExpanded = expandedIdeaId === idea.id
            const isValidating = validatingId === idea.id
            const isPromoting = promotingId === idea.id
            const feedback = idea.validation_feedback || {}
            const matchedProblems = feedback.supporting_global_problems || []

            const statusColors = {
              draft: { bg: "rgba(148, 163, 184, 0.15)", text: "#94a3b8" },
              validating: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
              validated: { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981" },
              promoted: { bg: "rgba(139, 92, 246, 0.15)", text: "#a78bfa" },
              pivoted: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
            }
            const stColor = statusColors[idea.status] || statusColors.draft

            return (
              <div
                key={idea.id}
                style={{
                  background: "var(--surface-card, #1e293b)",
                  border: isExpanded ? "1px solid var(--accent, #6366f1)" : "1px solid var(--border, #334155)",
                  borderRadius: 12,
                  padding: 20,
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Idea Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: stColor.bg,
                          color: stColor.text,
                        }}
                      >
                        {idea.status}
                      </span>

                      {idea.validation_score > 0 && (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 6,
                            background: idea.validation_score >= 70 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: idea.validation_score >= 70 ? "#10b981" : "#f59e0b",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <TrendingUpIcon size={12} />
                          {idea.validation_score}% Validation Score
                        </span>
                      )}

                      {(idea.tags || []).map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted, #94a3b8)",
                            background: "var(--surface, #0f172a)",
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ margin: "0 0 10px 0", fontSize: 18, fontWeight: 700 }}>
                      {idea.title}
                    </h3>

                    {idea.problem_statement && (
                      <div style={{ fontSize: 13, color: "var(--text-muted, #cbd5e1)", marginBottom: 6 }}>
                        <strong style={{ color: "#f8fafc" }}>Problem: </strong>
                        {idea.problem_statement}
                      </div>
                    )}

                    {idea.proposed_solution && (
                      <div style={{ fontSize: 13, color: "var(--text-muted, #cbd5e1)", marginBottom: 8 }}>
                        <strong style={{ color: "#f8fafc" }}>Solution: </strong>
                        {idea.proposed_solution}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted, #94a3b8)", marginTop: 6, flexWrap: "wrap" }}>
                      {idea.target_audience && <span>🎯 <strong>Audience:</strong> {idea.target_audience}</span>}
                      {idea.monetization_hypothesis && <span>💰 <strong>Monetization:</strong> {idea.monetization_hypothesis}</span>}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 150 }}>
                    <button
                      onClick={() => handleValidate(idea.id)}
                      disabled={isValidating}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "7px 12px",
                        background: idea.status === "validated" ? "var(--surface-raised, #334155)" : "var(--accent, #6366f1)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <SparklesIcon size={14} />
                      {isValidating ? "Validating..." : idea.status === "validated" ? "Re-validate" : "Validate with AI"}
                    </button>

                    {idea.status === "validated" && (
                      <button
                        onClick={() => handlePromote(idea.id)}
                        disabled={isPromoting}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "7px 12px",
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <RocketIcon size={14} />
                        {isPromoting ? "Promoting..." : "Promote to Studio"}
                      </button>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <button
                        onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent, #6366f1)",
                          fontSize: 12,
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                        }}
                      >
                        {isExpanded ? "Hide Report ▲" : "View Report ▼"}
                      </button>

                      <button
                        onClick={() => handleDelete(idea.id)}
                        title="Delete Idea"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted, #94a3b8)",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation Report Details (Accordion) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 18,
                      borderTop: "1px solid var(--border, #334155)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {/* Rubric Score Breakdown */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                      <div style={{ background: "var(--surface, #0f172a)", padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>Demand Urgency</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>
                          {feedback.demand_score || 0}%
                        </div>
                      </div>
                      <div style={{ background: "var(--surface, #0f172a)", padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>Feasibility</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#6366f1" }}>
                          {feedback.technical_feasibility || 0}%
                        </div>
                      </div>
                      <div style={{ background: "var(--surface, #0f172a)", padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>Market Moat</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>
                          {feedback.market_competition || 0}%
                        </div>
                      </div>
                      <div style={{ background: "var(--surface, #0f172a)", padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>Founder Synergy</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#a78bfa" }}>
                          {feedback.founder_fit || 0}%
                        </div>
                      </div>
                    </div>

                    {/* Verdict */}
                    {feedback.verdict && (
                      <div
                        style={{
                          background: "rgba(99, 102, 241, 0.1)",
                          borderLeft: "4px solid var(--accent, #6366f1)",
                          padding: "10px 14px",
                          borderRadius: "0 8px 8px 0",
                          fontSize: 13,
                        }}
                      >
                        <strong>AI Validation Verdict: </strong> {feedback.verdict}
                      </div>
                    )}

                    {/* Analysis Text */}
                    {feedback.demand_analysis && (
                      <div style={{ fontSize: 13, color: "var(--text-muted, #cbd5e1)" }}>
                        <strong style={{ color: "#fff" }}>Demand Rationale: </strong> {feedback.demand_analysis}
                      </div>
                    )}

                    {/* Strengths & Risks */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {feedback.strengths && feedback.strengths.length > 0 && (
                        <div style={{ background: "var(--surface, #0f172a)", padding: 14, borderRadius: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircleIcon size={14} /> Core Advantages
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text-muted, #cbd5e1)" }}>
                            {feedback.strengths.map((s, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {feedback.critical_risks && feedback.critical_risks.length > 0 && (
                        <div style={{ background: "var(--surface, #0f172a)", padding: 14, borderRadius: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                            <AlertCircleIcon size={14} /> Critical Risks
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text-muted, #cbd5e1)" }}>
                            {feedback.critical_risks.map((r, idx) => (
                              <li key={idx} style={{ marginBottom: 4 }}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* MVP Action Plan */}
                    {feedback.mvp_action_plan && feedback.mvp_action_plan.length > 0 && (
                      <div style={{ background: "var(--surface, #0f172a)", padding: 14, borderRadius: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 8 }}>
                          📋 Recommended MVP Validation Roadmap
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {feedback.mvp_action_plan.map((step, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: "var(--text-muted, #cbd5e1)", display: "flex", gap: 8 }}>
                              <span style={{ color: "var(--accent, #6366f1)", fontWeight: 700 }}>{idx + 1}.</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supporting Global Problems */}
                    {matchedProblems.length > 0 && (
                      <div style={{ background: "var(--surface, #0f172a)", padding: 14, borderRadius: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                          <span>🌍 Substantive Global User Complaints ({matchedProblems.length})</span>
                          <span style={{ fontSize: 11, fontWeight: 400 }}>Matches from Global Problem Radar</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {matchedProblems.map((p, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "var(--surface-card, #1e293b)",
                                padding: 10,
                                borderRadius: 6,
                                border: "1px solid var(--border, #334155)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                <span style={{ fontWeight: 600, color: "#fff" }}>{p.title}</span>
                                <span style={{ color: "#f59e0b", fontWeight: 700 }}>Pain {p.composite_pain_score}%</span>
                              </div>
                              <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--text-muted, #94a3b8)" }}>
                                {p.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {totalIdeas > PAGE_SIZE && (
            <Pagination
              total={totalIdeas}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  )
}
