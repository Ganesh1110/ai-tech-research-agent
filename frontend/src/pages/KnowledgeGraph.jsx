import React, { useState } from "react"
import { GraphIcon, SearchIcon, ExternalLinkIcon, RefreshIcon } from "../components/common/Icons"
import { kbSearch } from "../services/api"

export function KnowledgeGraph({ kbStatsData, onSelectNode }) {
  const [query, setQuery] = useState("Agentic AI and MCP Tooling")
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")

  // Graph nodes representation
  const nodes = [
    { id: "node-1", label: "Model Context Protocol", type: "Protocol", color: "#a855f7", x: 220, y: 130 },
    { id: "node-2", label: "Autonomous Agent Core", type: "Architecture", color: "#00f0ff", x: 420, y: 90 },
    { id: "node-3", label: "Ollama / Local LLM", type: "Inference", color: "#10b981", x: 140, y: 260 },
    { id: "node-4", label: "SQLite Vector Store", type: "Storage", color: "#3b82f6", x: 380, y: 250 },
    { id: "node-5", label: "GitHub Collectors", type: "Ingestion", color: "#f59e0b", x: 580, y: 140 },
    { id: "node-6", label: "arXiv Research Ingestion", type: "Ingestion", color: "#ec4899", x: 560, y: 280 },
  ]

  const edges = [
    { from: "node-1", to: "node-2", label: "exposes tools to" },
    { from: "node-3", to: "node-2", label: "powers reasoning of" },
    { from: "node-2", to: "node-4", label: "queries & indexes" },
    { from: "node-5", to: "node-4", label: "populates" },
    { from: "node-6", to: "node-4", label: "populates" },
    { from: "node-1", to: "node-5", label: "integrates" },
  ]

  async function handleSearch(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const res = await kbSearch({ query: query.trim(), topK: 6, category: activeCategory !== "all" ? activeCategory : undefined })
      setResults(res.results || [])
    } catch (err) {
      console.error("KB Search failed:", err)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
          <GraphIcon size={22} color="var(--accent-cyan)" />
          <span>Knowledge Graph & Cross-Entity Explorer</span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
          Semantic relationships across repositories, AI models, research papers, and technical concepts
        </p>
      </div>

      {/* Visual Interactive Graph Canvas */}
      <div
        className="glass-panel"
        style={{
          height: 380,
          position: "relative",
          overflow: "hidden",
          background: "radial-gradient(circle at 50% 50%, rgba(13, 20, 38, 0.9) 0%, rgba(7, 9, 14, 0.95) 100%)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 720 360" style={{ overflow: "visible" }}>
          {/* Edges */}
          {edges.map((e, idx) => {
            const source = nodes.find((n) => n.id === e.from)
            const target = nodes.find((n) => n.id === e.to)
            if (!source || !target) return null
            return (
              <g key={idx}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((n) => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`} style={{ cursor: "pointer" }}>
              <circle
                r="24"
                fill="rgba(13, 19, 33, 0.9)"
                stroke={n.color}
                strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 10px ${n.color}88)` }}
              />
              <circle r="4" fill={n.color} />
              <text
                y="38"
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="600"
                fill="#ffffff"
                style={{ pointerEvents: "none" }}
              >
                {n.label}
              </text>
              <text
                y="50"
                textAnchor="middle"
                fontSize="9.5"
                fill="var(--text-dim)"
                style={{ pointerEvents: "none" }}
              >
                {n.type}
              </text>
            </g>
          ))}
        </svg>

        {/* Overlay instruction */}
        <div style={{ position: "absolute", top: 16, right: 20, fontSize: 11.5, color: "var(--text-muted)" }}>
          Interactive topological projection
        </div>
      </div>

      {/* Semantic KB Retrieval Exploration */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", marginBottom: 12 }}>
          Semantic Query Explorer
        </h3>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10,
              padding: "8px 14px",
              minWidth: 260,
            }}
          >
            <SearchIcon size={16} color="var(--text-muted)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query knowledge base (e.g. LLM quantization, MCP servers)..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-main)",
                fontSize: 13,
                width: "100%",
              }}
            />
          </div>

          <button type="submit" disabled={isSearching} className="btn-primary">
            <RefreshIcon size={14} spinning={isSearching} />
            <span>{isSearching ? "Searching..." : "Retrieve Entities"}</span>
          </button>
        </form>

        {results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--accent-purple-light)", fontWeight: 600 }}>
                    {r.category || "General"}
                  </span>
                  {r.rrf_score && (
                    <span style={{ fontSize: 10, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                      RRF: {r.rrf_score.toFixed(3)}
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-bright)" }}>
                  {r.title}
                </h4>
                <p style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
                  {r.content}
                </p>
                {r.source_url && (
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11.5, color: "var(--accent-cyan)", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", marginTop: 4 }}
                  >
                    <span>Source document</span>
                    <ExternalLinkIcon size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
