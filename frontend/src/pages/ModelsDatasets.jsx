import React, { useState } from "react"
import { CubeIcon, ExternalLinkIcon, StarIcon } from "../components/common/Icons"

export function ModelsDatasets() {
  const [activeTab, setActiveTab] = useState("models")

  const models = [
    {
      name: "Qwen 2.5 14B / 32B Instruct",
      org: "Alibaba Cloud / Qwen",
      context: "128k tokens",
      strengths: "Coding, multilingual, complex reasoning, structured JSON outputs",
      suitability: "Ollama Local Deployment (Q4_K_M)",
      benchmark: "MMLU: 85.3 • HumanEval: 82.6",
      url: "https://huggingface.co/Qwen",
    },
    {
      name: "DeepSeek R1 Distill Qwen",
      org: "DeepSeek AI",
      context: "64k tokens",
      strengths: "Step-by-step reasoning, mathematical problem solving, chain-of-thought",
      suitability: "Agent Planning & Verification",
      benchmark: "MATH 500: 92.8 • Codeforces: 1850",
      url: "https://huggingface.co/deepseek-ai",
    },
    {
      name: "Llama 3.3 70B Instruct",
      org: "Meta AI",
      context: "128k tokens",
      strengths: "General enterprise intelligence, tool orchestration, summarization",
      suitability: "High-spec Local or Remote Host",
      benchmark: "MMLU: 88.6 • GSM8K: 91.2",
      url: "https://llama.meta.com",
    },
    {
      name: "Nomic Embed Text v1.5",
      org: "Nomic AI",
      context: "8,192 tokens",
      strengths: "High dimensional vector embeddings, dynamic matryoshka dimensionality",
      suitability: "Vector Store Knowledge Base",
      benchmark: "MTEB: 62.4 • Retrieval Leaderboard #1 Local",
      url: "https://huggingface.co/nomic-ai/nomic-embed-text-v1.5",
    },
  ]

  const datasets = [
    {
      name: "AgentInstruct",
      org: "Microsoft Research",
      size: "25M tokens",
      desc: "Extensive dataset tailored for fine-tuning agents across web navigation, coding, and multi-step tool use.",
      url: "https://huggingface.co/datasets/AgentInstruct",
    },
    {
      name: "SWE-bench Verified",
      org: "SWE-bench Team",
      size: "500 verified real-world GitHub issues",
      desc: "Gold standard benchmark for evaluating autonomous software engineering agents.",
      url: "https://www.swebench.com",
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)" }}>
            AI Models & Datasets
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Indexed foundation models, reasoning engines, and agent evaluation benchmarks
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: "flex", background: "var(--bg-card)", padding: 4, borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => setActiveTab("models")}
            style={{
              background: activeTab === "models" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
              color: activeTab === "models" ? "#ffffff" : "var(--text-dim)",
              border: "none",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Models ({models.length})
          </button>
          <button
            onClick={() => setActiveTab("datasets")}
            style={{
              background: activeTab === "datasets" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
              color: activeTab === "datasets" ? "#ffffff" : "var(--text-dim)",
              border: "none",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Datasets & Benchmarks ({datasets.length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {activeTab === "models" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
          {models.map((m, i) => (
            <div key={i} className="glass-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--accent-purple-light)", fontWeight: 600, textTransform: "uppercase" }}>
                    {m.org}
                  </span>
                  <span style={{ background: "rgba(0, 240, 255, 0.12)", color: "var(--accent-cyan)", border: "1px solid rgba(0, 240, 255, 0.3)", padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                    {m.context}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
                  {m.name}
                </h3>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12 }}>
                  <strong>Strengths:</strong> {m.strengths}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                  <strong>Local Suitability:</strong> <span style={{ color: "var(--accent-emerald)" }}>{m.suitability}</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{m.benchmark}</span>
                <a href={m.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent-cyan)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                  <span>Weights</span>
                  <ExternalLinkIcon size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
          {datasets.map((d, i) => (
            <div key={i} className="glass-panel" style={{ padding: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "var(--accent-purple-light)", fontWeight: 600 }}>{d.org}</span>
                <span style={{ fontSize: 11, color: "var(--accent-emerald)" }}>{d.size}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", marginBottom: 8 }}>
                {d.name}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 14 }}>
                {d.desc}
              </p>
              <a href={d.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent-cyan)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                <span>View Dataset</span>
                <ExternalLinkIcon size={12} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
