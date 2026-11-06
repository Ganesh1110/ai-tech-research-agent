import React, { useState } from "react"
import { FlameIcon, GithubIcon, ExternalLinkIcon, StarIcon, SparklesIcon } from "../components/common/Icons"
import { TechFrameworksDirectory } from "../components/common/TechFrameworksDirectory"

export function Trending({ onBrainstormWithFramework }) {
  const [activeTab, setActiveTab] = useState("frameworks") // 'frameworks' or 'repos'

  const trendingRepos = [
    {
      name: "modelcontextprotocol/servers",
      stars: "28.4k",
      forks: "3.2k",
      growth: "+480 stars/day",
      category: "MCP / Integrations",
      desc: "Reference implementations for the Model Context Protocol (MCP) clients and servers.",
      url: "https://github.com/modelcontextprotocol/servers",
    },
    {
      name: "browser-use/browser-use",
      stars: "19.8k",
      forks: "2.1k",
      growth: "+320 stars/day",
      category: "Agentic AI",
      desc: "Make websites accessible for AI agents with headless browser automation.",
      url: "https://github.com/browser-use/browser-use",
    },
    {
      name: "deepseek-ai/DeepSeek-V3",
      stars: "45.1k",
      forks: "6.8k",
      growth: "+1.2k stars/day",
      category: "AI Models",
      desc: "An advanced open-weights mixture-of-experts model with multi-head latent attention.",
      url: "https://github.com/deepseek-ai/DeepSeek-V3",
    },
    {
      name: "ollama/ollama",
      stars: "112k",
      forks: "9.4k",
      growth: "+210 stars/day",
      category: "Local LLM",
      desc: "Get up and running with Llama, Mistral, and other large language models locally.",
      url: "https://github.com/ollama/ollama",
    },
    {
      name: "langchain-ai/langgraph",
      stars: "11.5k",
      forks: "1.8k",
      growth: "+190 stars/day",
      category: "Agentic AI",
      desc: "Build resilient language agents as graphs with stateful multi-actor communication.",
      url: "https://github.com/langchain-ai/langgraph",
    },
    {
      name: "asg017/sqlite-vec",
      stars: "5.8k",
      forks: "290",
      growth: "+140 stars/day",
      category: "Vector & RAG",
      desc: "A vector search SQLite extension that runs anywhere, with zero external infrastructure.",
      url: "https://github.com/asg017/sqlite-vec",
    },
  ]

  const trendingTopics = [
    { name: "Multi-Agent Orchestration", growth: "+64%", count: "1,420 items" },
    { name: "MCP Protocol Standard", growth: "+88%", count: "890 items" },
    { name: "Local LLM Quantization (GGUF)", growth: "+35%", count: "650 items" },
    { name: "Autonomous Tool-Calling", growth: "+42%", count: "510 items" },
    { name: "Hybrid Vector + BM25 RAG", growth: "+29%", count: "480 items" },
  ]

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

      {activeTab === "frameworks" ? (
        <TechFrameworksDirectory
          onBrainstormWithFramework={(item) => {
            const prompt = `Evaluate the ${item.name} framework (${item.framework}) for building autonomous research tools. What are its architectural strengths, tradeoffs compared to alternatives, and local deployment viability?`
            if (onBrainstormWithFramework) {
              onBrainstormWithFramework(prompt)
            }
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Velocity Topics Chips */}
          <div className="glass-panel" style={{ padding: "18px 22px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <FlameIcon size={16} color="var(--accent-amber)" />
              <span>High-Velocity Research Categories</span>
            </h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {trendingTopics.map((topic, i) => (
                <div
                  key={i}
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
                key={i}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
