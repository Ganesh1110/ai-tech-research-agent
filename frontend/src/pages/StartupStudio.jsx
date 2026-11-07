import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  RocketIcon,
  RefreshIcon,
  SearchIcon,
  FilterIcon,
  ChatIcon,
  BlueprintIcon,
  ExternalLinkIcon,
} from "../components/common/Icons"
import {
  getStartupOpportunities,
  scanStartupOpportunities,
  updateOpportunityStatus,
  createProductBlueprint,
} from "../services/api"
import { Pagination } from "../components/common/Pagination"

export function StartupStudio({ onNavigateToBrainstorm, onNavigateToProductLab }) {
  const [opportunities, setOpportunities] = useState([])
  const [totalOpportunities, setTotalOpportunities] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [minScore, setMinScore] = useState(0)
  const [selectedOpp, setSelectedOpp] = useState(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const loadOpportunities = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getStartupOpportunities({
        status: statusFilter === "all" ? null : statusFilter,
        min_score: minScore > 0 ? minScore : null,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
      if (res && res.items) {
        setOpportunities(res.items)
        setTotalOpportunities(res.total || 0)
      }
    } catch (err) {
      console.error("Failed to load opportunities:", err)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, minScore, page])

  useEffect(() => {
    setPage(1)
    loadOpportunities()
  }, [loadOpportunities])

  const handleScanNow = async () => {
    setIsScanning(true)
    setStatusMessage("Scanning recent technical discoveries for startup opportunities...")
    try {
      const res = await scanStartupOpportunities(8, 60)
      setStatusMessage(`Scan complete: identified ${res.total || res.items?.length || 0} opportunities.`)
      await loadOpportunities()
    } catch (err) {
      setStatusMessage(`Scan failed: ${err.message}`)
    } finally {
      setIsScanning(false)
      setTimeout(() => setStatusMessage(""), 5000)
    }
  }

  const handleStatusChange = async (oppId, newStatus) => {
    try {
      await updateOpportunityStatus(oppId, newStatus)
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, status: newStatus } : o))
      )
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const handleConvertToBlueprint = async (opp) => {
    try {
      await createProductBlueprint({
        opportunity_id: opp.id,
        name: opp.title,
        tagline: opp.tagline,
        architecture_summary: `MVP architecture designed for ${opp.title}. Solves: ${opp.problem_statement}`,
        tech_stack: {
          frontend: "React + Vite + Tailwind",
          backend: "FastAPI + Pydantic v2",
          ai_engine: opp.technologies?.[0] || "Ollama / local LLM",
          database: "PostgreSQL / SQLite",
        },
        mvp_roadmap: opp.mvp_features?.length
          ? opp.mvp_features
          : ["1. Core engine", "2. API", "3. Dashboard UI"],
      })
      if (onNavigateToProductLab) {
        onNavigateToProductLab()
      }
    } catch (err) {
      alert(`Could not create blueprint: ${err.message}`)
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      opp.title.toLowerCase().includes(q) ||
      opp.problem_statement.toLowerCase().includes(q) ||
      opp.proposed_solution.toLowerCase().includes(q) ||
      opp.business_model.toLowerCase().includes(q)
    )
  })

  // Metric stats
  const totalCount = opportunities.length
  const watchlistCount = opportunities.filter((o) => o.status === "watchlist").length
  const buildingCount = opportunities.filter((o) => o.status === "building").length
  const avgScore = totalCount
    ? Math.round(opportunities.reduce((acc, o) => acc + (o.overall_score || 0), 0) / totalCount)
    : 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                padding: 8,
                borderRadius: 10,
                background: "rgba(139, 92, 246, 0.15)",
                color: "#a78bfa",
              }}
            >
              <RocketIcon size={22} />
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Startup Opportunity Intelligence
            </h1>
          </div>
          <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            Autonomous discovery-to-startup pipeline: turning research breakthroughs into validated business concepts.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleScanNow}
            disabled={isScanning}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <RefreshIcon size={16} spinning={isScanning} />
            {isScanning ? "Scanning Tech Signals..." : "Scan Tech for Opportunities"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "rgba(0, 240, 255, 0.1)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            color: "#00f0ff",
            fontSize: 13,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Total Opportunities
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "var(--text-primary)" }}>
            {totalCount}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            On Watchlist
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#38bdf8" }}>
            {watchlistCount}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            In Active MVP Build
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#4ade80" }}>
            {buildingCount}
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Avg Opportunity Score
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#facc15" }}>
            {avgScore}/100
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className="card"
        style={{
          padding: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 280px" }}>
          <SearchIcon size={18} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search opportunities, problems, business models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              width: "100%",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 13,
              }}
            >
              <option value="all">All Statuses</option>
              <option value="discovered">Discovered</option>
              <option value="watchlist">Watchlist</option>
              <option value="evaluating">Evaluating</option>
              <option value="building">Building MVP</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Min Score:</span>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <span style={{ fontSize: 13, color: "var(--text-primary)", minWidth: 28 }}>
              {minScore}
            </span>
          </div>
        </div>
      </div>

      {/* Opportunity Grid */}
      {isLoading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          Loading startup opportunities...
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 48,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <RocketIcon size={40} color="var(--text-secondary)" />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            No Startup Opportunities Match Your Filters
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 440 }}>
            Click "Scan Tech for Opportunities" to analyze recent research items and generate high-potential business concepts.
          </p>
          <button onClick={handleScanNow} className="btn btn-primary" style={{ marginTop: 8 }}>
            Scan Discoveries Now
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 20,
          }}
        >
          {filteredOpportunities.map((opp) => {
            const scoreColor =
              opp.overall_score >= 80 ? "#4ade80" : opp.overall_score >= 70 ? "#facc15" : "#fb923c"

            return (
              <div
                key={opp.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  padding: 20,
                  transition: "transform 0.2s, border-color 0.2s",
                  border: opp.status === "watchlist" ? "1px solid rgba(56, 189, 248, 0.4)" : undefined,
                }}
              >
                {/* Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(139, 92, 246, 0.15)",
                          color: "#c084fc",
                          textTransform: "uppercase",
                        }}
                      >
                        {opp.business_model}
                      </span>
                      <select
                        value={opp.status}
                        onChange={(e) => handleStatusChange(opp.id, e.target.value)}
                        style={{
                          fontSize: 11,
                          background: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 4,
                          padding: "2px 6px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="discovered">Discovered</option>
                        <option value="watchlist">★ Watchlist</option>
                        <option value="evaluating">Evaluating</option>
                        <option value="building">Building MVP</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                      {opp.title}
                    </h3>
                  </div>

                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.3)",
                      border: `1px solid ${scoreColor}`,
                      borderRadius: 8,
                      padding: "4px 10px",
                      textAlign: "center",
                      minWidth: 54,
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor }}>
                      {opp.overall_score}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      Score
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic" }}>
                  "{opp.tagline}"
                </div>

                {/* Problem & Solution */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                  <div style={{ background: "var(--bg-secondary)", padding: "10px 12px", borderRadius: 6 }}>
                    <span style={{ fontWeight: 600, color: "#f87171" }}>Problem: </span>
                    <span style={{ color: "var(--text-secondary)" }}>{opp.problem_statement}</span>
                  </div>

                  <div style={{ background: "var(--bg-secondary)", padding: "10px 12px", borderRadius: 6 }}>
                    <span style={{ fontWeight: 600, color: "#4ade80" }}>Solution: </span>
                    <span style={{ color: "var(--text-secondary)" }}>{opp.proposed_solution}</span>
                  </div>
                </div>

                {/* 4-Axis Feasibility Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
                    <span>Technical Feasibility</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{opp.technical_feasibility}/100</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${opp.technical_feasibility}%`, height: "100%", background: "#38bdf8" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    <span>Market Opportunity</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{opp.market_opportunity}/100</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${opp.market_opportunity}%`, height: "100%", background: "#4ade80" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    <span>Cost Feasibility</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{opp.cost_feasibility}/100</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${opp.cost_feasibility}%`, height: "100%", background: "#facc15" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    <span>Differentiation</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{opp.differentiation}/100</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${opp.differentiation}%`, height: "100%", background: "#c084fc" }} />
                  </div>
                </div>

                {/* Target Audience & Tech */}
                <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Target ICP: </span>
                    {opp.target_audience}
                  </div>
                  {opp.technologies?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {opp.technologies.slice(0, 4).map((tech, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <button
                    onClick={() => handleConvertToBlueprint(opp)}
                    className="btn"
                    style={{
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(139, 92, 246, 0.2)",
                      border: "1px solid rgba(139, 92, 246, 0.4)",
                      color: "#c084fc",
                      padding: "6px 12px",
                    }}
                  >
                    <BlueprintIcon size={14} />
                    Create MVP Blueprint
                  </button>

                  <button
                    onClick={() => onNavigateToBrainstorm && onNavigateToBrainstorm(`Brainstorm startup execution strategy for: ${opp.title}. Problem: ${opp.problem_statement}`)}
                    className="btn btn-secondary"
                    style={{
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                    }}
                  >
                    <ChatIcon size={14} />
                    Brainstorm
                  </button>
                </div>
              </div>
            )
          })}
          {totalOpportunities > PAGE_SIZE && (
            <Pagination
              total={totalOpportunities}
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
