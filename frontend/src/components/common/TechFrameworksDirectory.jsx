import React, { useState, useMemo, useEffect } from "react"
import { SearchIcon, ExternalLinkIcon, SparklesIcon, CheckCircleIcon, FlameIcon } from "./Icons"
import { fetchFrameworks } from "../../services/api"

export function TechFrameworksDirectory({ onBrainstormWithFramework }) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const result = await fetchFrameworks()
        if (!cancelled) {
          setData(result.frameworks || [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setData([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const frameworks = useMemo(() => data || [], [data])

  const categories = useMemo(() => {
    const set = new Set(frameworks.map((item) => item.category))
    return ["all", ...Array.from(set)]
  }, [frameworks])

  const filtered = useMemo(() => {
    return frameworks.filter((item) => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.framework.toLowerCase().includes(search.toLowerCase()) ||
        item.tagline.toLowerCase().includes(search.toLowerCase()) ||
        item.bestFor.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [selectedCategory, search, frameworks])

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, color: "var(--text-dim)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 20, height: 20, border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-purple-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Loading frameworks directory…</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Search & Category Pills */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "rgba(255, 255, 255, 0.04)",
                color: selectedCategory === cat ? "#ffffff" : "var(--text-dim)",
                border: selectedCategory === cat ? "1px solid rgba(124, 58, 237, 0.4)" : "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "6px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat === "all" ? "All Technologies" : cat}
            </button>
          ))}
        </div>

        {/* Search input */}
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
            placeholder="Filter frameworks, runtimes, stacks..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-main)",
              fontSize: 12.5,
              width: 220,
            }}
          />
        </div>
      </div>

      {error && !loading && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#fca5a5", display: "flex", alignItems: "center", gap: 8 }}>
          <span>⚠️</span>
          <span>Framework directory unavailable (API error): {error}</span>
        </div>
      )}

      {/* Grid of Frameworks */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: 18,
        }}
      >
        {filtered.map((item) => (
          <div
            key={item.id}
            className="glass-panel"
            style={{
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span
                  style={{
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "var(--accent-purple-light)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {item.category}
                </span>

                <span
                  style={{
                    background: `${item.maturityColor}22`,
                    color: item.maturityColor,
                    border: `1px solid ${item.maturityColor}44`,
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {item.maturity}
                </span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-bright)", marginBottom: 2 }}>
                {item.name}
              </h3>
              <div style={{ fontSize: 12, color: "var(--accent-cyan)", marginBottom: 10 }}>
                {item.framework} • <span style={{ color: "var(--text-muted)" }}>{item.runtime}</span>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 14 }}>
                {item.tagline}
              </p>

              {/* Key Features */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>
                  Key Architectural Strengths:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {item.keyFeatures.map((feat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-main)" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent-cyan)" }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best for */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11.5,
                  color: "var(--text-dim)",
                }}
              >
                <strong style={{ color: "var(--text-bright)" }}>Best Fit:</strong> {item.bestFor}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: 14,
                marginTop: 6,
              }}
            >
              <button
                onClick={() => onBrainstormWithFramework && onBrainstormWithFramework(item)}
                style={{
                  background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  color: "var(--accent-purple-light)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(99, 102, 241, 0.4) 100%)"
                  e.currentTarget.style.color = "#ffffff"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)"
                  e.currentTarget.style.color = "var(--accent-purple-light)"
                }}
              >
                <SparklesIcon size={13} color="currentColor" />
                <span>Brainstorm with Agent</span>
              </button>

              <a
                href={item.docsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--accent-cyan)",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <span>Docs</span>
                <ExternalLinkIcon size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
