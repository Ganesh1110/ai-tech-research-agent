import React, { useState, useEffect, useCallback } from "react"
import {
  BlueprintIcon,
  RefreshIcon,
  CubeIcon,
  ChatIcon,
} from "../components/common/Icons"
import {
  getProductBlueprints,
  createProductBlueprint,
} from "../services/api"

export function ProductLab({ onNavigateToBrainstorm }) {
  const [blueprints, setBlueprints] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBlueprint, setNewBlueprint] = useState({
    name: "",
    tagline: "",
    architecture_summary: "",
    tech_frontend: "React + Vite + Tailwind",
    tech_backend: "FastAPI + Pydantic v2",
    tech_ai: "Ollama (qwen2.5:14b)",
    tech_db: "PostgreSQL / SQLite",
  })

  const loadBlueprints = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getProductBlueprints(30)
      if (res && res.blueprints) {
        setBlueprints(res.blueprints)
        if (res.blueprints.length > 0 && !selectedBlueprint) {
          setSelectedBlueprint(res.blueprints[0])
        }
      }
    } catch (err) {
      console.error("Failed to load blueprints:", err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedBlueprint])

  useEffect(() => {
    loadBlueprints()
  }, [loadBlueprints])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newBlueprint.name) return
    try {
      const created = await createProductBlueprint({
        name: newBlueprint.name,
        tagline: newBlueprint.tagline,
        architecture_summary: newBlueprint.architecture_summary,
        tech_stack: {
          frontend: newBlueprint.tech_frontend,
          backend: newBlueprint.tech_backend,
          ai_engine: newBlueprint.tech_ai,
          database: newBlueprint.tech_db,
        },
        mvp_roadmap: [
          "Phase 1: Database schema, models & migrations",
          "Phase 2: FastAPI ingestion & orchestration endpoints",
          "Phase 3: Real-time React dashboard UI",
          "Phase 4: Docker Compose deployment & automated test suite",
        ],
      })
      setShowCreateModal(false)
      setNewBlueprint({
        name: "",
        tagline: "",
        architecture_summary: "",
        tech_frontend: "React + Vite + Tailwind",
        tech_backend: "FastAPI + Pydantic v2",
        tech_ai: "Ollama (qwen2.5:14b)",
        tech_db: "PostgreSQL / SQLite",
      })
      await loadBlueprints()
      setSelectedBlueprint(created)
    } catch (err) {
      alert(`Failed to create blueprint: ${err.message}`)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                padding: 8,
                borderRadius: 10,
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
              }}
            >
              <BlueprintIcon size={22} />
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              AI Product Architect & Builder
            </h1>
          </div>
          <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            Transforming validated startup opportunities into technical blueprints, system architectures, and MVP epics.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            + New Architecture Blueprint
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>
        {/* Left: Blueprints List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
            Active Blueprints ({blueprints.length})
          </div>

          {isLoading ? (
            <div style={{ color: "var(--text-secondary)", fontSize: 13, padding: 20 }}>
              Loading blueprints...
            </div>
          ) : blueprints.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: "center" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                No product blueprints yet. Convert an opportunity from the Startup Studio or create one manually!
              </div>
            </div>
          ) : (
            blueprints.map((bp) => {
              const isSelected = selectedBlueprint?.id === bp.id
              return (
                <div
                  key={bp.id}
                  onClick={() => setSelectedBlueprint(bp)}
                  className="card"
                  style={{
                    padding: 16,
                    cursor: "pointer",
                    border: isSelected ? "1px solid #38bdf8" : undefined,
                    background: isSelected ? "rgba(56, 189, 248, 0.05)" : undefined,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        textTransform: "uppercase",
                      }}
                    >
                      {bp.status}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {bp.created_at ? new Date(bp.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <h4 style={{ margin: "8px 0 4px 0", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    {bp.name}
                  </h4>
                  {bp.tagline && (
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                      {bp.tagline}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right: Selected Blueprint Detail View */}
        <div>
          {selectedBlueprint ? (
            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
                    {selectedBlueprint.name}
                  </h2>
                  <p style={{ margin: "4px 0 0 0", color: "#38bdf8", fontSize: 14 }}>
                    {selectedBlueprint.tagline}
                  </p>
                </div>

                <button
                  onClick={() =>
                    onNavigateToBrainstorm &&
                    onNavigateToBrainstorm(
                      `Review technical architecture and system design for ${selectedBlueprint.name}: ${selectedBlueprint.architecture_summary}`
                    )
                  }
                  className="btn btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                >
                  <ChatIcon size={14} />
                  Architectural Review
                </button>
              </div>

              {/* Architecture Overview */}
              <div style={{ background: "var(--bg-secondary)", padding: 16, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>
                  System Architecture Summary
                </div>
                <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
                  {selectedBlueprint.architecture_summary || "No architectural description provided."}
                </div>
              </div>

              {/* Tech Stack Matrix */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 12 }}>
                  Selected Technology Stack
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                  }}
                >
                  {Object.entries(selectedBlueprint.tech_stack || {}).map(([layer, tech]) => (
                    <div
                      key={layer}
                      style={{
                        background: "var(--bg-secondary)",
                        padding: 12,
                        borderRadius: 6,
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "capitalize", fontWeight: 600 }}>
                        {layer.replace("_", " ")}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", marginTop: 4 }}>
                        {String(tech)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MVP Execution Epics */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 12 }}>
                  MVP Roadmap & Implementation Epics
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(selectedBlueprint.mvp_roadmap || []).map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "var(--bg-secondary)",
                        padding: "10px 14px",
                        borderRadius: 6,
                        fontSize: 13,
                        color: "var(--text-primary)",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "rgba(56, 189, 248, 0.2)",
                          color: "#38bdf8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
              Select a blueprint from the left or create a new one to inspect architecture details.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 540,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Create New Product Blueprint
            </h3>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Multilingual Receptionist"
                  value={newBlueprint.name}
                  onChange={(e) => setNewBlueprint({ ...newBlueprint, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    marginTop: 4,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Self-hosted AI voice receptionist for regional businesses"
                  value={newBlueprint.tagline}
                  onChange={(e) => setNewBlueprint({ ...newBlueprint, tagline: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    marginTop: 4,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Architecture Summary</label>
                <textarea
                  rows={3}
                  placeholder="Describe topology, microservices, local LLM inference, queue, etc."
                  value={newBlueprint.architecture_summary}
                  onChange={(e) => setNewBlueprint({ ...newBlueprint, architecture_summary: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    marginTop: 4,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Frontend</label>
                  <input
                    type="text"
                    value={newBlueprint.tech_frontend}
                    onChange={(e) => setNewBlueprint({ ...newBlueprint, tech_frontend: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      marginTop: 4,
                      fontSize: 12,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>Backend</label>
                  <input
                    type="text"
                    value={newBlueprint.tech_backend}
                    onChange={(e) => setNewBlueprint({ ...newBlueprint, tech_backend: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      marginTop: 4,
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
