import React, { useState, useEffect } from "react"
import { FlameIcon, GithubIcon, ExternalLinkIcon, StarIcon, SparklesIcon } from "../components/common/Icons"
import { TechFrameworksDirectory } from "../components/common/TechFrameworksDirectory"
import { fetchTrending } from "../services/api"

export function Trending({ onBrainstormWithFramework }) {
  const [activeTab, setActiveTab] = useState("frameworks")

  const [trendingRepos, setTrendingRepos] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [resR, resT] = await Promise.all([
          fetchTrending("repo"),
          fetchTrending("topic"),
        ])
        if (!cancelled) {
          setTrendingRepos(resR.items || [])
          setTrendingTopics(resT.items || [])
          setError(null)
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Title & View Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
            <FlameIcon size={22} color="var(--accent-amber)" />
            <span>Technologies & Respective Frameworks</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Curated matrix of currently available technologies, runtime frameworks, and trending repositories
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: "flex", background: "var(--bg-card)", padding: 4, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => setActiveTab("frameworks")}
            style={{
              background: activeTab === "frameworks" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
              color: activeTab === "frameworks" ? "#ffffff" : "var(--text-dim)",
              border: "none",
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Technology & Frameworks Matrix
          </button>
          <button
            onClick={() => setActiveTab("repos")}
            style={{
              background: activeTab === "repos" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
              color: activeTab === "repos" ? "#ffffff" : "var(--text-dim)",
              border: "none",
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Trending Repositories & Velocity ({trendingRepos.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>
          Loading trending data…
        </div>
      ) : activeTab === "frameworks" ? (
        <TechFrameworksDirectory
          onBrainstormWithFramework={(item) => {
            const prompt = `Evaluate the ${item.name} framework (${item.framework}) for building autonomous research tools. What are its architectural strengths, tradeoffs compared to alternatives, and local deployment viability?`
            if (onBrainstormWithFramework) {
              onBrainstormWithFramework(prompt)
            }
          }}
        />
      ) : (
        <>
          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#fca5a5" }}>
              <span>⚠️</span>
              <span>Trending data unavailable (API error): {error}</span>
            </div>
          )}

          {/* Velocity Topics Chips */}
          <div className="glass-panel" style={{ padding: "18px 22px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <FlameIcon size={16} color="var(--accent-amber)" />
              <span>High-Velocity Research Categories</span>
            </h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {trendingTopics.map((topic, i) => (
                <div
                  key={topic.id || i}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 12,
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
                    {topic.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--accent-emerald)", fontWeight: 700 }}>
                    {topic.growth}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {topic.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Repositories Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 18,
            }}
          >
            {trendingRepos.map((repo, i) => (
              <div
                key={repo.id || i}
                className="glass-panel"
                style={{
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <GithubIcon size={20} color="var(--text-bright)" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-cyan)" }}>
                        {repo.name}
                      </span>
                    </div>
                    <span
                      style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "var(--accent-emerald)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {repo.growth}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 16 }}>
                    {repo.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: 12,
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  <div style={{ display: "flex", gap: 14 }}>
                    <span>★ <strong style={{ color: "var(--text-main)" }}>{repo.stars}</strong></span>
                    <span>⑂ <strong style={{ color: "var(--text-main)" }}>{repo.forks}</strong></span>
                  </div>

                  {repo.url && (
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--accent-purple-light)",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      <span>Inspect Repo</span>
                      <ExternalLinkIcon size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
