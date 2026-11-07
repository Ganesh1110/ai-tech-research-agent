import React, { useState, useEffect, useMemo } from "react"
import { CubeIcon, ExternalLinkIcon, StarIcon } from "../components/common/Icons"
import { Pagination } from "../components/common/Pagination"
import {
  fetchTechResources,
} from "../services/api"

export function ModelsDatasets() {
  const [activeTab, setActiveTab] = useState("models")
  const [models, setModels] = useState([])
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [resM, resD] = await Promise.all([
          fetchTechResources("model"),
          fetchTechResources("dataset"),
        ])
        if (!cancelled) {
          setModels(resM.items || [])
          setDatasets(resD.items || [])
          setError(null)
          setPage(1)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const activeItems = useMemo(() => (activeTab === "models" ? models : datasets), [
    activeTab,
    models,
    datasets,
  ])

  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE))
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const start = (currentPage - 1) * PAGE_SIZE
  const paginatedItems = activeItems.slice(start, start + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)" }}>
            AI Models & Datasets
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Indexed foundation models, reasoning engines, and agent evaluation benchmarks
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: "flex", background: "var(--bg-card)", padding: 4, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => setActiveTab("models")}
            style={{
              background: activeTab === "models" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
              color: activeTab === "models" ? "#ffffff" : "var(--text-dim)",
              border: "none",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Models ({models.length})
          </button>
          <button
            onClick={() => setActiveTab("datasets")}
            style={{
              background: activeTab === "datasets" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
              color: activeTab === "datasets" ? "#ffffff" : "var(--text-dim)",
              border: "none",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Datasets & Benchmarks ({datasets.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>
          Loading models & datasets…
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
            {activeTab === "models" ? (
              paginatedItems.map((m, i) => (
                <div key={m.id || i} className="glass-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--accent-purple-light)", fontWeight: 600, textTransform: "uppercase" }}>
                        {m.org}
                      </span>
                      <span style={{ background: "rgba(0, 240, 255, 0.12)", color: "var(--accent-cyan)", border: "1px solid rgba(0, 240, 255, 0.3)", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                        {m.context}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
                      {m.name}
                    </h3>
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12 }}>
                      <strong>Strengths:</strong> {m.strengths}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                      <strong>Local Suitability:</strong> <span style={{ color: "var(--accent-emerald)" }}>{m.suitability}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{m.benchmark}</span>
                    <a href={m.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent-cyan)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                      <span>Weights</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              paginatedItems.map((d, i) => (
                <div key={d.id || i} className="glass-panel" style={{ padding: "22px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--accent-purple-light)", fontWeight: 600 }}>{d.org}</span>
                    <span style={{ fontSize: 11, color: "var(--accent-emerald)" }}>{d.size}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
                    {d.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 14 }}>
                    {d.desc}
                  </p>
                  <a href={d.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent-cyan)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                    <span>View Dataset</span>
                    <ExternalLinkIcon size={12} />
                  </a>
                </div>
              ))
            )}
          </div>

          {activeItems.length > PAGE_SIZE && (
            <Pagination
              total={activeItems.length}
              page={currentPage}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {error && !loading && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#fca5a5" }}>
          <span>⚠️</span>
          <span>Models & datasets unavailable (API error): {error}</span>
        </div>
      )}
    </div>
  )
}
