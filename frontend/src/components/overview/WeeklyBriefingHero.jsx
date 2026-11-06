import React from "react"
import { RefreshIcon } from "../common/Icons"

export function WeeklyBriefingHero({
  briefing,
  loading,
  onRegenerate,
  onNavigate,
}) {
  if (!briefing) return null

  return (
    <section
      aria-label="Weekly Founder Intelligence Briefing"
      className="glass-panel"
      style={{
        padding: "24px 28px",
        background: "linear-gradient(135deg, rgba(24, 24, 38, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(139, 92, 246, 0.35)",
        boxShadow: "0 8px 32px rgba(139, 92, 246, 0.12)",
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(139, 92, 246, 0.2)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                color: "#c084fc",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              🚀 Personal AI Founder OS
            </span>
            <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
              {briefing.week_identifier} · Autonomous Synthesis
            </span>
          </div>
          <h2
            style={{
              margin: "8px 0 0 0",
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-bright)",
              letterSpacing: "-0.5px",
            }}
          >
            What Should I Build Next? Weekly Briefing
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="btn btn-secondary"
            aria-label="Regenerate weekly intelligence briefing"
            style={{
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
            }}
          >
            <RefreshIcon size={14} spinning={loading} />
            {loading ? "Synthesizing..." : "Regenerate Briefing"}
          </button>
          <button
            onClick={() => onNavigate && onNavigate("startup_studio")}
            className="btn btn-primary"
            aria-label="Navigate to Startup Studio"
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            Open Startup Studio →
          </button>
        </div>
      </div>

      <p style={{ margin: "0 0 20px 0", color: "var(--text-dim)", fontSize: 14, lineHeight: 1.5 }}>
        {briefing.summary}
      </p>

      {/* 4 Pillars Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {/* Pillar 1: 3 Tech to Explore */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 13 }} aria-hidden="true">①</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", textTransform: "uppercase" }}>
              3 Tech to Explore
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(briefing.top_technologies || []).slice(0, 3).map((tech, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  padding: "8px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-bright)" }}>
                    {tech.name?.length > 28 ? tech.name.slice(0, 26) + "…" : tech.name}
                  </span>
                  <span style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700 }}>
                    {tech.score}/100
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                  {tech.category}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 2: 3 Startup Opportunities */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }} aria-hidden="true">②</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", textTransform: "uppercase" }}>
              3 Startup Ideas
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(briefing.top_opportunities || []).slice(0, 3).map((opp, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  padding: "8px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-bright)" }}>
                    {opp.title?.length > 28 ? opp.title.slice(0, 26) + "…" : opp.title}
                  </span>
                  <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 700 }}>
                    {opp.overall_score}/100
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                  {opp.business_model} · {opp.target_audience?.slice(0, 24)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pillar 3: 1 Recommended MVP Blueprint */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#facc15", fontWeight: 700, fontSize: 13 }} aria-hidden="true">③</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", textTransform: "uppercase" }}>
              1 Recommended MVP
            </span>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              padding: 10,
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--text-bright)", fontSize: 13 }}>
              {briefing.recommended_mvp?.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", fontStyle: "italic" }}>
              "{briefing.recommended_mvp?.tagline}"
            </div>
            <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>
              Stack: {briefing.recommended_mvp?.tech_stack?.backend || "FastAPI"} + {briefing.recommended_mvp?.tech_stack?.frontend || "React"}
            </div>
            <button
              onClick={() => onNavigate && onNavigate("product_lab")}
              className="btn"
              aria-label="Inspect MVP blueprint in Product Lab"
              style={{
                fontSize: 11,
                padding: "4px 8px",
                marginTop: 4,
                background: "rgba(250, 204, 21, 0.15)",
                color: "#facc15",
                border: "1px solid rgba(250, 204, 21, 0.3)",
              }}
            >
              View Blueprint Epics →
            </button>
          </div>
        </div>

        {/* Pillar 4: 1 High-Leverage Skill Focus */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#c084fc", fontWeight: 700, fontSize: 13 }} aria-hidden="true">④</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-bright)", textTransform: "uppercase" }}>
              1 Skill to Develop
            </span>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              padding: 10,
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--text-bright)", fontSize: 13 }}>
              {briefing.skill_focus?.skill_name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
              {briefing.skill_focus?.category}
            </div>
            <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>
              Target: {briefing.skill_focus?.target_proficiency || 90}% · ~{briefing.skill_focus?.estimated_hours || 4} hrs
            </div>
            <button
              onClick={() => onNavigate && onNavigate("growth_center")}
              className="btn"
              aria-label="Navigate to Growth Center for skill practice"
              style={{
                fontSize: 11,
                padding: "4px 8px",
                marginTop: 4,
                background: "rgba(192, 132, 252, 0.15)",
                color: "#c084fc",
                border: "1px solid rgba(192, 132, 252, 0.3)",
              }}
            >
              Practice Micro-Tasks →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
