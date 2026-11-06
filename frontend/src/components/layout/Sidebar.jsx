import React from "react"
import {
  BrainIcon,
  HomeIcon,
  SearchIcon,
  FlameIcon,
  CubeIcon,
  PaperIcon,
  PuzzleIcon,
  ChatIcon,
  CheckReportIcon,
  GraphIcon,
  MetricsIcon,
  SettingsIcon,
} from "../common/Icons"
import { Sparkline } from "../common/Sparkline"

export const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "discoveries", label: "Discoveries", icon: SearchIcon },
  { id: "trending", label: "Trending", icon: FlameIcon },
  { id: "models", label: "AI Models & Data", icon: CubeIcon },
  { id: "papers", label: "Research Papers", icon: PaperIcon },
  { id: "skills", label: "Skills & MCP", icon: PuzzleIcon },
  { id: "brainstorming", label: "Brainstorming", icon: ChatIcon },
  { id: "feasibility", label: "Feasibility Reports", icon: CheckReportIcon },
  { id: "graph", label: "Knowledge Graph", icon: GraphIcon },
  { id: "metrics", label: "Activity & Metrics", icon: MetricsIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
]

export function Sidebar({ currentTab, onSelectTab, healthData }) {
  const isOnline = healthData?.ollama_available ?? true
  const modelName = healthData?.ollama_model || "qwen2.5:14b"

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 4px 24px 4px",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 240, 255, 0.3) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(139, 92, 246, 0.4)",
          }}
        >
          <BrainIcon size={24} color="#00f0ff" />
        </div>
        <div className="sidebar-text">
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-bright)",
              letterSpacing: -0.2,
              lineHeight: 1.2,
            }}
          >
            AI Research Intelligence
          </h2>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-dim)",
              fontWeight: 400,
            }}
          >
            Personal AI Tech Agent
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 12px",
                borderRadius: 10,
                border: "none",
                background: isActive
                  ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)"
                  : "transparent",
                color: isActive ? "#ffffff" : "var(--text-dim)",
                fontWeight: isActive ? 600 : 500,
                fontSize: 13.5,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 0 16px rgba(124, 58, 237, 0.45)" : "none",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
                  e.currentTarget.style.color = "var(--text-main)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "var(--text-dim)"
                }
              }}
            >
              <Icon size={18} color={isActive ? "#ffffff" : "currentColor"} />
              <span className="sidebar-text">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom System Status Widget */}
      <div
        className="glass-panel"
        style={{
          padding: 12,
          borderRadius: 12,
          marginTop: 12,
          background: "rgba(10, 15, 28, 0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isOnline ? "var(--accent-emerald)" : "var(--accent-rose)",
                boxShadow: isOnline ? "0 0 8px #10b981" : "0 0 8px #f43f5e",
              }}
            />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-main)" }}>
              {isOnline ? "System Online" : "System Offline"}
            </span>
          </div>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Ollama</span>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--text-dim)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {modelName}
        </div>
        <Sparkline
          data={[10, 12, 14, 18, 16, 20, 24, 22, 28]}
          color={isOnline ? "#10b981" : "#f43f5e"}
          width={190}
          height={26}
        />
      </div>
    </aside>
  )
}
