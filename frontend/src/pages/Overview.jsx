import React, { useState, useEffect, useMemo } from "react"
import {
  RocketIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ExternalLinkIcon,
  GithubIcon,
  BlueprintIcon,
  TrophyIcon,
  StarIcon,
  RefreshIcon,
} from "../components/common/Icons"
import { Sparkline } from "../components/common/Sparkline"
import { DonutChart } from "../components/common/DonutChart"
import { LineChart } from "../components/common/LineChart"
import { BrainHologram } from "../components/common/BrainHologram"
import { WeeklyBriefingHero } from "../components/overview/WeeklyBriefingHero"
import { KpiCards } from "../components/overview/KpiCards"
import { QuickBrainstormBar } from "../components/overview/QuickBrainstormBar"
import { getLatestWeeklyBriefing, generateWeeklyBriefing } from "../services/api"
import { fetchDashboardMetrics } from "../services/api"

export function Overview({
  stats,
  schedulerStatus,
  discoveries = [],
  recommendations = [],
  cycles = [],
  recentJobs = [],
  onNavigate,
  onQuickBrainstorm,
  onTriggerProcess,
  isProcessing,
}) {
  const isRunning = schedulerStatus?.running ?? true

  const [briefing, setBriefing] = useState(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [donutMetrics, setDonutMetrics] = useState([])

  useEffect(() => {
    let isMounted = true
    getLatestWeeklyBriefing()
      .then((data) => {
        if (isMounted && data) setBriefing(data)
      })
      .catch((err) => console.warn("Failed to load weekly briefing:", err))

    const loadMetrics = async () => {
      try {
        const res = await fetchDashboardMetrics("donut")
        if (isMounted) setDonutMetrics(res.items || [])
      } catch (err) {
        console.warn("Failed to load dashboard metrics:", err)
      }
    }
    loadMetrics()
    return () => {
      isMounted = false
    }
  }, [])

  const handleRegenerateBriefing = async () => {
    setBriefingLoading(true)
    try {
      const data = await generateWeeklyBriefing(true)
      setBriefing(data)
    } catch (err) {
      console.error("Failed to generate briefing:", err)
    } finally {
      setBriefingLoading(false)
    }
  }

  const displayDiscoveries = discoveries.length > 0
    ? discoveries.slice(0, 3)
    : []

  const displayRecommendations = recommendations.length > 0
    ? recommendations.slice(0, 3)
    : []

  const activityItems = useMemo(() => [
    {
      title: "New discovery: MCP Server Toolkit",
      color: "#c084fc",
      time: "2 min ago",
      badge: "High Priority",
    },
    {
      title: "Research cycle completed",
      color: "#22c55e",
      time: "5 min ago",
      badge: "Success",
    },
    {
      title: "New recommendation: Next.js 15",
      color: "#3b82f6",
      time: "8 min ago",
      badge: "Recommended",
    },
    {
      title: "Knowledge base updated",
      color: "#00f0ff",
      time: "10 min ago",
      badge: "Updated",
    },
  ], [])

  const rgbMap = {
    "#c084fc": "168, 85, 247",
    "#22c55e": "34, 197, 94",
    "#3b82f6": "59, 130, 246",
    "#00f0ff": "0, 240, 255",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Weekly Strategic Briefing */}
      <WeeklyBriefingHero
        briefing={briefing}
        loading={briefingLoading}
        onRegenerate={handleRegenerateBriefing}
        onNavigate={onNavigate}
      />

      {/* KPI Cards Row */}
      <KpiCards stats={stats} />

      {/* Central Section: Autonomous Research Engine & Recent Activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr",
          gap: 18,
        }}
      >
        {/* Left: Autonomous Research Engine */}
        <div className="glass-panel" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    boxShadow: "0 0 10px #22c55e",
                  }}
                />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--color-foreground)" }}>
                  Autonomous Research Engine
                </h3>
                <span
                  style={{
                    background: isRunning ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                    color: isRunning ? "var(--color-accent)" : "var(--accent-rose)",
                    border: `1px solid ${isRunning ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {isRunning ? "Active" : "Paused"}
                </span>
              </div>

              <button
                onClick={onTriggerProcess}
                disabled={isProcessing}
                className="btn-secondary"
                style={{ padding: "4px 10px", fontSize: 12 }}
                title="Trigger immediate job worker processing"
              >
                <RefreshIcon size={12} spinning={isProcessing} />
                <span>{isProcessing ? "Processing..." : "Process Next"}</span>
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              Discovering, analyzing and ranking the latest AI & tech innovations...
            </p>
          </div>

          {/* Stepper + Hologram Brain */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              margin: "20px 0",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleIcon size={16} color="#22c55e" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
                    GitHub Discovery
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Completed • 2m ago
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleIcon size={16} color="#22c55e" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
                    MCP & Skills Scan
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Completed • 1m ago
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "rgba(0, 240, 255, 0.15)",
                    border: "1px solid rgba(0, 240, 255, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 10px rgba(0, 240, 255, 0.4)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#00f0ff",
                      animation: "pulseGlow 2s infinite ease-in-out",
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-cyan)" }}>
                    AI Analysis
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    In Progress...
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <BrainHologram isRunning={isRunning} size={300} />
            </div>
          </div>

          {/* Bottom countdown bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--color-border)",
              paddingTop: 14,
              fontSize: 12.5,
              color: "var(--text-muted)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClockIcon size={15} color="var(--accent-cyan)" />
              <span>Next Cycle: <strong style={{ color: "var(--color-foreground)" }}>in 3m 24s</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                Queue: {recentJobs.filter((j) => j.status === "pending").length} pending
              </span>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="glass-panel" style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-foreground)" }}>
              Recent Activity
            </h3>
            <button
              onClick={() => onNavigate("metrics")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-purple-light)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activityItems.map((item, idx) => {
              const rgb = rgbMap[item.color] || "0, 240, 255"
              return (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}`,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
                        {item.title}
                      </div>
                      <span
                        style={{
                          background: `rgba(${rgb}, 0.15)`,
                          color: item.color,
                          border: `1px solid rgba(${rgb}, 0.3)`,
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {item.time}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lower Row: Discoveries, Knowledge Base, Brainstorm */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 18,
        }}
      >
        {/* Card 1: Top Technology Discoveries */}
        <div className="glass-panel" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-foreground)" }}>
              Top Technology Discoveries
            </h3>
            <button
              onClick={() => onNavigate("discoveries")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-purple-light)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayDiscoveries.length > 0 ? (
              displayDiscoveries.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <GithubIcon size={18} color="#f8fafc" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)", maxWidth: 170, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#22c55e",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {item.overall_score || 95}/100 {item.trend || "↑+10%"}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--text-muted)", display: "flex" }}
                      >
                        <ExternalLinkIcon size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
                <p>No discoveries yet. Start the autonomous scheduler to begin collecting research.</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Knowledge Base */}
        <div className="glass-panel" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-foreground)" }}>
              Knowledge Base
            </h3>
            <button
              onClick={() => onNavigate("graph")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-purple-light)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View All →
            </button>
          </div>

          <DonutChart
            data={donutMetrics.map((m) => ({
              label: m.label,
              value: m.value,
              color: m.color,
            }))}
            centerText={`${(stats.totalDocuments || 3.2).toString()}K`}
            centerSubtext="Sources"
            size={130}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 14,
              fontSize: 11.5,
              color: "var(--color-accent)",
              fontWeight: 600,
            }}
          >
            <span>↑ +18% vs last month</span>
          </div>
        </div>

        {/* Card 3: Quick Brainstorming */}
        <QuickBrainstormBar onQuickBrainstorm={onQuickBrainstorm} />
      </div>

      {/* Bottom Row: Top Recommendations & Autonomous Status */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 18,
        }}
      >
        {/* Top Recommendations */}
        <div className="glass-panel" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StarIcon size={16} color="#f59e0b" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-foreground)" }}>
                Top Recommendations
              </h3>
            </div>
            <button
              onClick={() => onNavigate("trending")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-purple-light)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {displayRecommendations.length > 0 ? (
              displayRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#f59e0b",
                        color: "#080b14",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {rec.num}
                    </span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-foreground)" }}>
                        {rec.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                        {rec.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#22c55e",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {rec.score}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--accent-purple-light)", cursor: "pointer" }}>→</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
                <p>No recommendations yet. Generate opportunities from discoveries.</p>
              </div>
            )}
          </div>
        </div>

        {/* Autonomous Status */}
        <div className="glass-panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isRunning ? "var(--color-accent)" : "var(--accent-rose)",
                    boxShadow: isRunning ? "0 0 8px #22c55e" : "0 0 8px #f43f5e",
                  }}
                />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-foreground)" }}>
                  Autonomous Status
                </h3>
              </div>
              <span
                style={{
                  background: isRunning ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                  color: isRunning ? "var(--color-accent)" : "var(--accent-rose)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 10,
                }}
              >
                {isRunning ? "Running" : "Paused"}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>
              Last cycle: 2 min ago • Duration: 98s
            </div>
          </div>

          {/* Pipeline badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
            {["Discovery", "Analysis", "Storage", "Update"].map((stage) => (
              <span
                key={stage}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--text-dim)",
                }}
              >
                <CheckCircleIcon size={12} color="#22c55e" />
                <span>{stage}</span>
              </span>
            ))}
          </div>

          {/* Animated signal equalizer bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 26, alignSelf: "flex-end" }}>
            {[40, 70, 55, 90, 65, 80, 45, 85].map((h, i) => (
              <span
                key={i}
                style={{
                  width: 4,
                  height: `${h}%`,
                  borderRadius: 2,
                  background: "linear-gradient(to top, #7c3aed, #00f0ff)",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
