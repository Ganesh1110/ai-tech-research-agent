import React, { useState, useMemo } from "react"
import { SearchIcon, ExternalLinkIcon, StarIcon, FilterIcon, GithubIcon } from "../components/common/Icons"

export function Discoveries({ discoveries = [], rawItems = [], onSelectCategory }) {
  const [filterCategory, setFilterCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [minScore, setMinScore] = useState(0)
  const [selectedItem, setSelectedItem] = useState(null)

  // Merge discoveries and raw research items if needed
  const allItems = useMemo(() => {
    if (discoveries.length > 0) return discoveries
    // fallback or combine with rawItems
    return rawItems.map((r, i) => ({
      id: r.id || i + 1,
      title: r.title,
      description: r.description || r.ai_summary || "Autonomous discovery item collected from research sources.",
      category: r.category || "AI/LLM",
      source: r.source || "github",
      url: r.url || r.source_url || "https://github.com",
      overall_score: r.relevance_score || 85,
      recommendation_level: r.overall_score >= 85 ? "high" : "keep",
      first_seen_at: r.discovered_at || r.published_at || new Date().toISOString(),
    }))
  }, [discoveries, rawItems])

  const categories = useMemo(() => {
    const cats = new Set(allItems.map((i) => i.category).filter(Boolean))
    return ["all", ...Array.from(cats)]
  }, [allItems])

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      const matchCat = filterCategory === "all" || item.category?.toLowerCase() === filterCategory.toLowerCase()
      const matchSearch =
        !search ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      const matchScore = (item.overall_score || 0) >= minScore
      return matchCat && matchSearch && matchScore
    })
  }, [allItems, filterCategory, search, minScore])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)" }}>
            Technology Discoveries
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Explored and indexed by the autonomous AI research engine ({filtered.length} items)
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10,
              padding: "7px 12px",
            }}
          >
            <SearchIcon size={14} color="var(--text-muted)" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discoveries..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-main)",
                fontSize: 12.5,
                width: 180,
              }}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10,
              color: "var(--text-main)",
              padding: "7px 12px",
              fontSize: 12.5,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of discoveries */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((item) => {
          const score = Math.round(item.overall_score || 85)
          const isHigh = score >= 85

          return (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "20px",
                cursor: "pointer",
              }}
              onClick={() => setSelectedItem(item)}
            >
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      background: "rgba(139, 92, 246, 0.15)",
                      color: "var(--accent-purple-light)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      textTransform: "capitalize",
                    }}
                  >
                    {item.category}
                  </span>

                  <span
                    style={{
                      background: isHigh ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                      color: isHigh ? "#10b981" : "#60a5fa",
                      border: `1px solid ${isHigh ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                    }}
                  >
                    {score}/100
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-bright)",
                    lineHeight: 1.35,
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--text-dim)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.description}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: 12,
                  marginTop: 14,
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                }}
              >
                <span>Source: <strong style={{ color: "var(--text-dim)" }}>{item.source}</strong></span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "var(--accent-cyan)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <span>Visit</span>
                    <ExternalLinkIcon size={12} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Item Drawer / Modal */}
      {selectedItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: 620,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <span
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "var(--accent-purple-light)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                {selectedItem.category}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-bright)", marginBottom: 12 }}>
              {selectedItem.title}
            </h2>

            <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 13, color: "var(--text-dim)" }}>
              <div>Score: <strong style={{ color: "var(--accent-emerald)" }}>{selectedItem.overall_score || 85}/100</strong></div>
              <div>Source: <strong style={{ color: "var(--text-main)" }}>{selectedItem.source}</strong></div>
              <div>Priority: <strong style={{ color: "var(--accent-purple-light)" }}>{selectedItem.recommendation_level || "Standard"}</strong></div>
            </div>

            <div style={{ fontSize: 14, color: "var(--text-main)", lineHeight: 1.6, marginBottom: 20 }}>
              {selectedItem.description}
            </div>

            {selectedItem.url && (
              <a
                href={selectedItem.url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ textDecoration: "none" }}
              >
                <span>Open Original Resource</span>
                <ExternalLinkIcon size={14} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
