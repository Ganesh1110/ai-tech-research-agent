import React, { useState, useEffect, useCallback, useMemo } from "react"
import { PuzzleIcon, ExternalLinkIcon, CheckCircleIcon, StarIcon, TrendingUpIcon, RefreshIcon } from "../components/common/Icons"
import { getSkillMatrix, updateSkill } from "../services/api"

export function SkillsMCP() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(new Set())

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getSkillMatrix()
        if (!cancelled) setSkills(data.skills || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleUpdate = useCallback(async (skill, field, value) => {
    setSaving((prev) => new Set(prev).add(skill.id))
    try {
      const updated = await updateSkill(skill.id, { [field]: value })
      setSkills((prev) => prev.map((s) => (s.id === skill.id ? { ...s, ...updated } : s)))
    } catch (err) {
      alert("Failed to update skill: " + err.message)
    } finally {
      setSaving((prev) => { const n = new Set(prev); n.delete(skill.id); return n })
    }
  }, [])

  const categories = useMemo(() => [...new Set(skills.map((s) => s.category))], [skills])

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, color: "var(--text-dim)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 20, height: 20, border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-purple-light)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Loading skill matrix…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: 24, textAlign: "center", color: "#fca5a5" }}>
        <span>⚠️</span> <strong>Unable to load skills:</strong> {error}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
            <PuzzleIcon size={22} color="var(--accent-purple-light)" />
            <span>Skill Matrix</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Track proficiencies across {skills.length} skills. Update levels to reflect your growth.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary"
          style={{ padding: "6px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {categories.map((cat) => {
        const catSkills = skills.filter((s) => s.category === cat)
        return (
          <div key={cat} className="glass-panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "var(--accent-purple-light)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {cat}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginLeft: "auto" }}>
                {catSkills.length} skill{(catSkills.length !== 1 ? "s" : "")}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {catSkills.map((s) => {
                const pct = Math.round((s.proficiency_level / Math.max(s.target_level, 1)) * 100)
                return (
                  <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)" }}>{s.skill_name}</span>
                        {s.last_assessed_at && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            assessed {new Date(s.last_assessed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                        <span style={{ color: "var(--accent-cyan)" }}>{s.proficiency_level}</span>
                        <span style={{ color: "var(--text-muted)" }}>/</span>
                        <span style={{ color: "var(--text-dim)" }}>{s.target_level}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "rgba(255, 255, 255, 0.05)",
                          borderRadius: 3,
                          overflow: "hidden",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, var(--accent-purple-light), var(--accent-cyan))`,
                            borderRadius: 3,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 30, textAlign: "right" }}>{pct}% of target</span>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.proficiency_level}
                        onChange={(e) => handleUpdate(s, "proficiency_level", parseInt(e.target.value, 10) || 0)}
                        disabled={saving.has(s.id)}
                        style={{
                          width: 70,
                          padding: "4px 8px",
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 6,
                          color: "var(--text-main)",
                          fontSize: 12,
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.target_level}
                        onChange={(e) => handleUpdate(s, "target_level", parseInt(e.target.value, 10) || 0)}
                        disabled={saving.has(s.id)}
                        style={{
                          width: 70,
                          padding: "4px 8px",
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 6,
                          color: "var(--text-main)",
                          fontSize: 12,
                        }}
                      />
                      {saving.has(s.id) && (
                        <span style={{ fontSize: 11, color: "var(--accent-cyan)", animation: "pulseGlow 1.5s ease-in-out infinite" }}>(updating)</span>
                      )}
                    </div>

                    {s.notes && (
                      <div style={{ fontSize: 11.5, color: "var(--text-dim)", paddingLeft: 2 }}>
                        <em>{s.notes}</em>
                      </div>
                    )}

                    {s.actionable_recommendations && s.actionable_recommendations.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        <strong style={{ color: "var(--accent-cyan)" }}>Next steps:</strong> {s.actionable_recommendations.join(" ")}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="glass-panel" style={{ padding: 16, fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}>
        <span>💡</span> Proficiency and target levels are persisted to the backend via <code>/growth/skills</code>. Changes save automatically.
      </div>
    </div>
  )
}
