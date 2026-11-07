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
  RocketIcon,
  TrophyIcon,
  BlueprintIcon,
  LightbulbIcon,
  RadarIcon,
} from "../common/Icons"
import { Sparkline } from "../common/Sparkline"
import { fetchDashboardMetrics } from "../../services/api"

export const NAV_ITEMS = [
  { id: "overview", label: "Command Center", icon: HomeIcon },
  { id: "idea_vault", label: "Idea Vault", icon: LightbulbIcon },
  { id: "problem_radar", label: "Problem Radar", icon: RadarIcon },
  { id: "startup_studio", label: "Startup Studio", icon: RocketIcon },
  { id: "product_lab", label: "Product Lab", icon: BlueprintIcon },
  { id: "growth_center", label: "Growth & Skills", icon: TrophyIcon },
  { id: "discoveries", label: "Discoveries", icon: SearchIcon },
  { id: "trending", label: "Tech & Frameworks", icon: FlameIcon },
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
  const [sidebarMetrics, setSidebarMetrics] = React.useState([
    10, 12, 14, 18, 16, 20, 24, 22, 28,
  ])

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetchDashboardMetrics("sparkline")
        if (!cancelled && res.items && res.items.length > 0) {
          setSidebarMetrics(res.items.map((m) => m.value))
        }
      } catch (err) {
        console.warn("Sidebar sparkline load failed:", err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Brand Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 4px 24px 4px",
          borderBottom: `1px solid var(--color-border)`,
          marginBottom: "var(--space-6)",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 240, 255, 0.3) 100%)",
            border: `1px solid rgba(139, 92, 246, 0.5)`,
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
              color: "var(--color-foreground)",
              letterSpacing: -0.2,
              lineHeight: 1.2,
            }}
          >
            AI Research Intelligence
          </h2>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
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
        aria-label="Navigation"
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
                padding: `var(--space-3) var(--space-4)`,
                borderRadius: "var(--radius-md)",
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
                minHeight: 44, /* touch target */
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
          borderRadius: "var(--radius-lg)",
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
                background: isOnline ? "var(--color-accent)" : "var(--color-destructive)",
                boxShadow: isOnline ? "0 0 8px #22c55e" : "0 0 8px #ef4444",
              }}
            />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--color-foreground)" }}>
              {isOnline ? "System Online" : "System Offline"}
            </span>
          </div>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Ollama</span>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {modelName}
        </div>
        <Sparkline
          data={sidebarMetrics}
          color={isOnline ? "#10b981" : "#ef4444"}
          width={190}
          height={26}
        />
      </div>
    </aside>
  )
}
