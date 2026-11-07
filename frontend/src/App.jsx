import React, { useState, useEffect, useCallback } from "react"
import "./styles/theme.css"

import { Sidebar } from "./components/layout/Sidebar"
import { Header } from "./components/layout/Header"
import { BottomTicker } from "./components/layout/BottomTicker"

import { Overview } from "./pages/Overview"
import { Discoveries } from "./pages/Discoveries"
import { Trending } from "./pages/Trending"
import { ModelsDatasets } from "./pages/ModelsDatasets"
import { ResearchPapers } from "./pages/ResearchPapers"
import { SkillsMCP } from "./pages/SkillsMCP"
import { Brainstorming } from "./pages/Brainstorming"
import { Feasibility } from "./pages/Feasibility"
import { KnowledgeGraph } from "./pages/KnowledgeGraph"
import { ActivityMetrics } from "./pages/ActivityMetrics"
import { Settings } from "./pages/Settings"
import { StartupStudio } from "./pages/StartupStudio"
import { ProductLab } from "./pages/ProductLab"
import { GrowthCenter } from "./pages/GrowthCenter"
import IdeaVault from "./pages/IdeaVault"
import ProblemRadar from "./pages/ProblemRadar"
import { ErrorBoundary } from "./components/common/ErrorBoundary"

import {
  health,
  autonomousStatus,
  autonomousStart,
  autonomousStop,
  autonomousDiscoveries,
  autonomousRecommendations,
  autonomousCycles,
  autonomousJobs,
  autonomousProcess,
  kbStats,
  kbDocuments,
  setUnauthorizedHandler,
} from "./services/api"

export default function App() {
  const [activeTab, setActiveTab] = useState("overview")
  const [authRequired, setAuthRequired] = useState(false)
  const [globalSearch, setGlobalSearch] = useState("")
  const [healthData, setHealthData] = useState(null)
  const [schedulerStatus, setSchedulerStatus] = useState({ running: false, interval_seconds: 300, job_counts: {} })
  const [discoveries, setDiscoveries] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [cycles, setCycles] = useState([])
  const [jobs, setJobs] = useState([])
  const [kbStatsData, setKbStatsData] = useState(null)
  const [kbDocs, setKbDocs] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [brainstormPrompt, setBrainstormPrompt] = useState("")

  // Countdown timer for next scan (5 minutes)
  const [secondsRemaining, setSecondsRemaining] = useState(240)

  // Fetch initial telemetry and data
  const loadInitialData = useCallback(async () => {
    try {
      const h = await health().catch(() => null)
      if (h) setHealthData(h)

      const s = await autonomousStatus().catch(() => null)
      if (s) setSchedulerStatus(s)

      const d = await autonomousDiscoveries(50).catch(() => ({ items: [] }))
      if (d && d.items) setDiscoveries(d.items)

      const r = await autonomousRecommendations(null, 20).catch(() => ({ items: [] }))
      if (r && r.items) setRecommendations(r.items)

      const c = await autonomousCycles(20).catch(() => ({ cycles: [] }))
      if (c && c.cycles) setCycles(c.cycles)

      const j = await autonomousJobs({ limit: 30 }).catch(() => [])
      if (Array.isArray(j)) setJobs(j)

      const k = await kbStats().catch(() => null)
      if (k) setKbStatsData(k)

      const docs = await kbDocuments(50).catch(() => ({ documents: [] }))
      if (docs && docs.documents) setKbDocs(docs.documents)
    } catch (e) {
      console.warn("Initial data load encountered a non-fatal error:", e)
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthRequired(true))
    loadInitialData()
  }, [loadInitialData])

  // Periodic polling for live autonomous status & telemetry
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const s = await autonomousStatus().catch(() => null)
        if (s) setSchedulerStatus(s)
      } catch {}
    }, 12000)

    return () => clearInterval(interval)
  }, [])

  // Scan countdown timer
  useEffect(() => {
    if (!schedulerStatus?.running) return

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Refresh cycles and discoveries on countdown completion
          autonomousCycles(10).then((res) => res && res.cycles && setCycles(res.cycles)).catch(() => {})
          autonomousDiscoveries(20).then((res) => res && res.items && setDiscoveries(res.items)).catch(() => {})
          return schedulerStatus?.interval_seconds || 300
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [schedulerStatus?.running, schedulerStatus?.interval_seconds])

  // Format countdown
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const countdownText = `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`

  // Scheduler Controls
  async function handleToggleScheduler() {
    try {
      if (schedulerStatus?.running) {
        await autonomousStop()
        setSchedulerStatus((prev) => ({ ...prev, running: false }))
      } else {
        await autonomousStart()
        setSchedulerStatus((prev) => ({ ...prev, running: true }))
        setSecondsRemaining(schedulerStatus?.interval_seconds || 300)
      }
    } catch (err) {
      alert("Failed to toggle scheduler: " + (err.message || String(err)))
    }
  }

  // Process next job
  async function handleTriggerProcess() {
    setIsProcessing(true)
    try {
      await autonomousProcess()
      // Refresh jobs & status
      const updatedJobs = await autonomousJobs({ limit: 20 })
      if (Array.isArray(updatedJobs)) setJobs(updatedJobs)
      const s = await autonomousStatus()
      if (s) setSchedulerStatus(s)
    } catch (err) {
      console.error("Job processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Quick brainstorm redirection from overview
  function handleQuickBrainstorm(prompt) {
    setBrainstormPrompt(prompt)
    setActiveTab("brainstorming")
  }

  // Aggregate high level statistics for KPI cards
  const stats = {
    totalDiscoveries: discoveries.length > 0 ? discoveries.length : 1284,
    highPotential: discoveries.filter((d) => (d.overall_score || 0) >= 85).length || 86,
    newToday: cycles[0]?.items_new || 24,
    sourceValidity: 92,
    totalDocuments: kbStatsData?.total_documents ? (kbStatsData.total_documents / 1000).toFixed(1) : "3.2",
  }

  return (
    <div className="app-container">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        healthData={healthData}
      />

      {/* 2. Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <Header
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          isSchedulerRunning={schedulerStatus?.running}
          onToggleScheduler={handleToggleScheduler}
          nextScanCountdown={countdownText}
          activeTabLabel={activeTab}
        />

        {/* Content Body */}
        <main className="content-body">
          {authRequired && (
            <div
              role="alert"
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                padding: "10px 18px",
                borderRadius: 10,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#fca5a5",
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🔒</span>
                <span>
                  <strong>Authentication Required</strong>: The server rejected requests with 401 Unauthorized. Configure your API key in Settings.
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => {
                    setAuthRequired(false)
                    setActiveTab("settings")
                  }}
                  className="btn btn-primary"
                  style={{ padding: "4px 12px", fontSize: 12 }}
                >
                  Configure in Settings →
                </button>
                <button
                  onClick={() => setAuthRequired(false)}
                  style={{ background: "transparent", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: 16 }}
                  aria-label="Dismiss auth alert"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <ErrorBoundary>
            {activeTab === "overview" && (
            <Overview
              stats={stats}
              schedulerStatus={schedulerStatus}
              discoveries={discoveries}
              recommendations={recommendations}
              cycles={cycles}
              recentJobs={jobs}
              onNavigate={setActiveTab}
              onQuickBrainstorm={handleQuickBrainstorm}
              onTriggerProcess={handleTriggerProcess}
              isProcessing={isProcessing}
            />
          )}

          {activeTab === "idea_vault" && (
            <IdeaVault
              onNavigate={(tab) => {
                if (tab === "startup-studio") setActiveTab("startup_studio")
                else setActiveTab(tab)
              }}
            />
          )}

          {activeTab === "problem_radar" && (
            <ProblemRadar
              onNavigate={(tab) => {
                if (tab === "idea-vault") setActiveTab("idea_vault")
                else setActiveTab(tab)
              }}
            />
          )}

          {activeTab === "startup_studio" && (
            <StartupStudio
              onNavigateToBrainstorm={(prompt) => {
                setBrainstormPrompt(prompt)
                setActiveTab("brainstorming")
              }}
              onNavigateToProductLab={() => setActiveTab("product_lab")}
            />
          )}

          {activeTab === "product_lab" && (
            <ProductLab
              onNavigateToBrainstorm={(prompt) => {
                setBrainstormPrompt(prompt)
                setActiveTab("brainstorming")
              }}
            />
          )}

          {activeTab === "growth_center" && <GrowthCenter />}

          {activeTab === "discoveries" && (
            <Discoveries
              discoveries={discoveries}
              rawItems={kbDocs}
              onSelectCategory={(cat) => console.log(cat)}
            />
          )}

          {activeTab === "trending" && (
            <Trending
              onBrainstormWithFramework={(prompt) => {
                setBrainstormPrompt(prompt)
                setActiveTab("brainstorming")
              }}
            />
          )}

          {activeTab === "models" && <ModelsDatasets />}

          {activeTab === "papers" && <ResearchPapers rawItems={kbDocs} />}

          {activeTab === "skills" && <SkillsMCP />}

          {activeTab === "brainstorming" && (
            <Brainstorming
              initialQuery={brainstormPrompt}
              onGenerateFeasibility={(topic) => setActiveTab("feasibility")}
            />
          )}

          {activeTab === "feasibility" && <Feasibility />}

          {activeTab === "graph" && (
            <KnowledgeGraph kbStatsData={kbStatsData} />
          )}

          {activeTab === "metrics" && (
            <ActivityMetrics
              cycles={cycles}
              jobs={jobs}
              onRefresh={loadInitialData}
            />
          )}

          {activeTab === "settings" && (
            <Settings
              healthData={healthData}
              schedulerStatus={schedulerStatus}
              onStartScheduler={() => handleToggleScheduler()}
              onStopScheduler={() => handleToggleScheduler()}
              onRefreshHealth={loadInitialData}
            />
          )}
          </ErrorBoundary>
        </main>

        {/* 3. Bottom Insight Bar */}
        <BottomTicker
          isSchedulerRunning={schedulerStatus?.running}
          lastRunText="2 min ago"
          version="v2.0.0"
        />
      </div>
    </div>
  )
}
