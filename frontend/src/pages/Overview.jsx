import React, { useState } from "react"
import {
  RocketIcon,
  StarIcon,
  CalendarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  SendIcon,
  ExternalLinkIcon,
  RefreshIcon,
  GithubIcon,
} from "../components/common/Icons"
import { Sparkline } from "../components/common/Sparkline"
import { DonutChart } from "../components/common/DonutChart"
import { LineChart } from "../components/common/LineChart"
import { BrainHologram } from "../components/common/BrainHologram"

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
  const [quickInput, setQuickInput] = useState("")

  const totalDiscoveries = stats.totalDiscoveries || 1058
  const highPotential = stats.highPotential || 86
  const newToday = stats.newToday || 24
  const sourceValidity = stats.sourceValidity || 92

  const isRunning = schedulerStatus?.running ?? true

  const handleQuickSubmit = (e) => {
    e.preventDefault()
    if (!quickInput.trim()) return
    onQuickBrainstorm(quickInput.trim())
    setQuickInput("")
  }

  const handleChipClick = (text) => {
    onQuickBrainstorm(text)
  }

  // Display top items
  const displayDiscoveries = discoveries.length > 0
    ? discoveries.slice(0, 3)
    : [
        {
          id: 1,
          title: "GitHub Copilot Enterprise Multi-Agent",
          category: "Developer Tools",
          overall_score: 98,
          trend: "+12%",
          url: "https://github.com",
        },
        {
          id: 2,
          title: "Model Context Protocol (MCP) 2.0 Spec",
          category: "AI / LLM",
          overall_score: 95,
          trend: "+10%",
          url: "https://github.com/modelcontextprotocol",
        },
        {
          id: 3,
          title: "Llama 4 Scout Deep Reasoning Architecture",
          category: "AI Models",
          overall_score: 93,
          trend: "+8%",
          url: "https://arxiv.org",
        },
      ]

  // Display top recommendations
  const displayRecommendations = recommendations.length > 0
    ? recommendations.slice(0, 3)
    : [
        {
          id: 1,
          num: 1,
          title: "New AI Agent Framework",
          subtitle: "Multi-agent orchestration",
          score: "96/100",
        },
        {
          id: 2,
          num: 2,
          title: "MCP Integration Toolkit",
          subtitle: "Model Context Protocol",
          score: "92/100",
        },
        {
          id: 3,
          num: 3,
          title: "Local Inference Engine",
          subtitle: "Efficient deployment",
          score: "88/100",
        },
      ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* 1. KPI Cards Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {/* KPI 1: Total Discoveries */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(139, 92, 246, 0.15)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RocketIcon size={22} color="#a855f7" />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                  {totalDiscoveries.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                  Total Discoveries
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +12%</span>
                </div>
              </div>
            </div>
            <Sparkline data={[12, 14, 13, 17, 19, 18, 24, 28]} color="#8b5cf6" width={75} height={32} />
          </div>
        </div>

        {/* KPI 2: High Potential */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StarIcon size={22} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                  {highPotential.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                  High Potential
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +8%</span>
                </div>
              </div>
            </div>
            <Sparkline data={[8, 10, 11, 14, 13, 16, 18, 21]} color="#f59e0b" width={75} height={32} />
          </div>
        </div>

        {/* KPI 3: New Today */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CalendarIcon size={22} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                  {newToday.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                  New Today
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +20%</span>
                </div>
              </div>
            </div>
            <Sparkline data={[5, 8, 9, 12, 14, 18, 22, 24]} color="#00f0ff" width={75} height={32} />
          </div>
        </div>

        {/* KPI 4: Source Validity */}
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheckIcon size={22} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.1 }}>
                  {sourceValidity}%
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                  Source Validity
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 600 }}>↑ +2%</span>
                </div>
              </div>
            </div>
            <Sparkline data={[88, 89, 90, 91, 91, 92, 92, 92]} color="#10b981" width={75} height={32} />
          </div>
        </div>
      </div>

      {/* 2. Central Section: Autonomous Research Engine & Recent Activity */}
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
                    background: "var(--accent-purple-light)",
                    boxShadow: "0 0 10px #a855f7",
                  }}
                />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-bright)" }}>
                  Autonomous Research Engine
                </h3>
                <span
                  style={{
                    background: isRunning ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                    color: isRunning ? "var(--accent-emerald)" : "var(--accent-rose)",
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
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 4 }}>
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
            {/* Stage Stepper */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 200 }}>
              {/* Step 1 */}
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
                  <CheckCircleIcon size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                    GitHub Discovery
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Completed • 2m ago
                  </div>
                </div>
              </div>

              {/* Step 2 */}
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
                  <CheckCircleIcon size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                    MCP & Skills Scan
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Completed • 1m ago
                  </div>
                </div>
              </div>

              {/* Step 3 */}
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

            {/* Central Hologram Brain */}
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
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: 14,
              fontSize: 12.5,
              color: "var(--text-dim)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ClockIcon size={15} color="var(--accent-cyan)" />
              <span>Next Cycle: <strong style={{ color: "var(--text-main)" }}>in 3m 24s</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                Queue: {recentJobs.filter(j => j.status === "pending").length} pending
              </span>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="glass-panel" style={{ padding: "24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)" }}>
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
            {/* Timeline item 1 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#f59e0b",
                  boxShadow: "0 0 6px #f59e0b",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                    New discovery: MCP Server Toolkit
                  </div>
                  <span
                    style={{
                      background: "rgba(168, 85, 247, 0.15)",
                      color: "#c084fc",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    High Priority
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  2 min ago
                </div>
              </div>
            </div>

            {/* Timeline item 2 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px #10b981",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                    Research cycle completed
                  </div>
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Success
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  5 min ago
                </div>
              </div>
            </div>

            {/* Timeline item 3 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  boxShadow: "0 0 6px #3b82f6",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                    New recommendation: Next.js 15
                  </div>
                  <span
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#60a5fa",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Recommended
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  8 min ago
                </div>
              </div>
            </div>

            {/* Timeline item 4 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#00f0ff",
                  boxShadow: "0 0 6px #00f0ff",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                    Knowledge base updated
                  </div>
                  <span
                    style={{
                      background: "rgba(0, 240, 255, 0.15)",
                      color: "#00f0ff",
                      border: "1px solid rgba(0, 240, 255, 0.3)",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    Updated
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  10 min ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lower Row: Top Technology Discoveries, Knowledge Base, Brainstorm with Your Agent */}
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
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)" }}>
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
            {displayDiscoveries.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)", maxWidth: 170, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                      color: "#10b981",
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
            ))}
          </div>
        </div>

        {/* Card 2: Knowledge Base */}
        <div className="glass-panel" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)" }}>
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
            data={[
              { label: "Research Papers", value: 35, color: "#10b981" },
              { label: "GitHub Projects", value: 40, color: "#a855f7" },
              { label: "Tools & Skills", value: 15, color: "#3b82f6" },
              { label: "Datasets", value: 10, color: "#ec4899" },
            ]}
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
              color: "var(--accent-emerald)",
              fontWeight: 600,
            }}
          >
            <span>↑ +18% vs last month</span>
          </div>
        </div>

        {/* Card 3: Brainstorm with Your Agent */}
        <div className="glass-panel" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <SparklesIcon size={18} color="#a855f7" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)" }}>
                Brainstorm with Your Agent
              </h3>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.4 }}>
              Discuss an idea, ask for feasibility analysis, or explore new possibilities...
            </p>
          </div>

          <form onSubmit={handleQuickSubmit} style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(10, 15, 28, 0.85)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "6px 10px",
              }}
            >
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Type your question here..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-main)",
                  fontSize: 12.5,
                  width: "100%",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                  border: "none",
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "0 0 10px rgba(124, 58, 237, 0.4)",
                }}
              >
                <SendIcon size={14} />
              </button>
            </div>
          </form>

          {/* Prompt Chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {["Check this MCP server", "Architecture idea", "New tools?"].map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 14,
                  padding: "4px 10px",
                  fontSize: 11,
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-purple-light)"
                  e.currentTarget.style.color = "var(--text-bright)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)"
                  e.currentTarget.style.color = "var(--text-dim)"
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Top Recommendations & Autonomous Status */}
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
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)" }}>
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
            {displayRecommendations.map((rec) => (
              <div
                key={rec.id}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
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
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-main)" }}>
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
                      color: "#10b981",
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
            ))}
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
                    background: isRunning ? "var(--accent-emerald)" : "var(--accent-rose)",
                    boxShadow: isRunning ? "0 0 8px #10b981" : "0 0 8px #f43f5e",
                  }}
                />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)" }}>
                  Autonomous Status
                </h3>
              </div>
              <span
                style={{
                  background: isRunning ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                  color: isRunning ? "var(--accent-emerald)" : "var(--accent-rose)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 10,
                }}
              >
                {isRunning ? "Running" : "Paused"}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 6 }}>
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
                <CheckCircleIcon size={12} color="#10b981" />
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
