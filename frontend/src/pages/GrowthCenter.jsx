import React, { useState, useEffect, useCallback } from "react"
import {
  TrophyIcon,
  RefreshIcon,
  CheckReportIcon,
} from "../components/common/Icons"
import {
  getFounderProfile,
  updateFounderProfile,
  getSkillMatrix,
  updateSkill,
} from "../services/api"

export function GrowthCenter() {
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [profData, skillsData] = await Promise.all([
        getFounderProfile().catch(() => null),
        getSkillMatrix().catch(() => ({ skills: [] })),
      ])
      if (profData) setProfile(profData)
      if (skillsData && skillsData.skills) setSkills(skillsData.skills)
    } catch (err) {
      console.error("Failed to load growth data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdateLevel = async (skillId, delta) => {
    const targetSkill = skills.find((s) => s.id === skillId)
    if (!targetSkill) return
    const newLevel = Math.min(100, Math.max(0, targetSkill.proficiency_level + delta))

    try {
      await updateSkill(skillId, { proficiency_level: newLevel })
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, proficiency_level: newLevel } : s))
      )
    } catch (err) {
      console.error("Failed to update skill:", err)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSaving(true)
    try {
      const updated = await updateFounderProfile({
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        weekly_hours: profile.weekly_hours,
        target_domains: profile.target_domains,
        primary_goals: profile.primary_goals,
      })
      setProfile(updated)
      setStatusMessage("Founder profile updated successfully!")
    } catch (err) {
      setStatusMessage(`Failed to update profile: ${err.message}`)
    } finally {
      setIsSaving(false)
      setTimeout(() => setStatusMessage(""), 4000)
    }
  }

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    acc[skill.category] = acc[skill.category] || []
    acc[skill.category].push(skill)
    return acc
  }, {})

  const avgProficiency = skills.length
    ? Math.round(skills.reduce((sum, s) => sum + s.proficiency_level, 0) / skills.length)
    : 0

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
                background: "rgba(234, 179, 8, 0.15)",
                color: "#facc15",
              }}
            >
              <TrophyIcon size={22} />
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Personal Self-Growth & Skill Matrix
            </h1>
          </div>
          <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            Continuous technical mentorship and founder capability tracking linked to your product builds.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <RefreshIcon size={14} spinning={isLoading} />
          Refresh Matrix
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "rgba(74, 222, 128, 0.1)",
            border: "1px solid rgba(74, 222, 128, 0.3)",
            color: "#4ade80",
            fontSize: 13,
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Top Banner Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Overall Competency Index
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#38bdf8" }}>
            {avgProficiency}/100
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Across {skills.length} tracked technical & founder disciplines
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Weekly Growth Commitment
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#facc15" }}>
            {profile?.weekly_hours || 20} hrs/week
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            Dedicated deep-work allocation
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Active Focus Domains
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#c084fc" }}>
            {profile?.target_domains?.length || 4} Domains
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            High-leverage startup areas
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* Left: Skill Matrix by Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(skillsByCategory).map(([category, catSkills]) => (
            <div key={category} className="card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: 12,
                  marginBottom: 16,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                  {category}
                </h3>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {catSkills.length} competencies
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {catSkills.map((s) => {
                  const progressColor =
                    s.proficiency_level >= 80 ? "#4ade80" : s.proficiency_level >= 60 ? "#38bdf8" : "#facc15"

                  return (
                    <div
                      key={s.id}
                      style={{
                        background: "var(--bg-secondary)",
                        padding: 16,
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                            {s.skill_name}
                          </div>
                          {s.notes && (
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                              {s.notes}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => handleUpdateLevel(s.id, -5)}
                            className="btn btn-secondary"
                            style={{ padding: "2px 8px", fontSize: 12 }}
                            title="Decrease proficiency"
                          >
                            -5%
                          </button>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: progressColor,
                              minWidth: 42,
                              textAlign: "center",
                            }}
                          >
                            {s.proficiency_level}%
                          </span>
                          <button
                            onClick={() => handleUpdateLevel(s.id, 5)}
                            className="btn btn-secondary"
                            style={{ padding: "2px 8px", fontSize: 12 }}
                            title="Level up proficiency"
                          >
                            +5%
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar vs Target */}
                      <div style={{ position: "relative", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${s.proficiency_level}%`,
                            height: "100%",
                            background: progressColor,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
                        <span>Current: {s.proficiency_level}%</span>
                        <span>Target Goal: {s.target_level}%</span>
                      </div>

                      {/* Actionable Recommendations */}
                      {s.actionable_recommendations?.length > 0 && (
                        <div
                          style={{
                            marginTop: 4,
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            paddingTop: 8,
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                            Recommended Micro-Learning Activity:
                          </div>
                          {s.actionable_recommendations.map((rec, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: "var(--text-primary)", display: "flex", gap: 6 }}>
                              <span style={{ color: "#38bdf8" }}>›</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Founder Profile & Objectives */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Founder Profile & Goals
            </h3>

            {profile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    Name & Role
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 13,
                    }}
                  />
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    style={{
                      width: "100%",
                      marginTop: 6,
                      padding: "8px 10px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    Weekly Deep-Work Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    value={profile.weekly_hours}
                    onChange={(e) => setProfile({ ...profile, weekly_hours: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "8px 10px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 6,
                      color: "var(--text-primary)",
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    Strategic Focus Domains
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {profile.target_domains?.map((d, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 4,
                          background: "rgba(139, 92, 246, 0.15)",
                          color: "#c084fc",
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    Core Startup Objectives
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {profile.primary_goals?.map((g, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          color: "var(--text-primary)",
                          background: "var(--bg-secondary)",
                          padding: "6px 10px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ color: "#4ade80" }}>✓</span>
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ marginTop: 10, width: "100%" }}
                >
                  {isSaving ? "Saving Profile..." : "Save Profile"}
                </button>
              </div>
            ) : (
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Loading profile...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
