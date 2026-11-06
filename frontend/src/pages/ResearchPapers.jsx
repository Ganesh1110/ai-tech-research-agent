import React, { useState } from "react"
import { PaperIcon, ExternalLinkIcon, SearchIcon } from "../components/common/Icons"

export function ResearchPapers({ rawItems = [] }) {
  const [search, setSearch] = useState("")

  // Filter arxiv papers from research db
  const papers = rawItems.filter((i) => i.source === "arxiv" || i.url?.includes("arxiv"))

  const samplePapers = papers.length > 0 ? papers : [
    {
      id: 101,
      title: "Self-Refining Multi-Agent Systems for Complex Software Synthesis",
      category: "agentic-ai",
      authors: "DeepMind Collaborative Research Group",
      published_at: "2026-10-28",
      url: "https://arxiv.org/abs/2610.12345",
      description: "We propose a dual-loop reflexive architecture for autonomous agents that execute recursive planning, memory indexing, and formal verification against test suites.",
    },
    {
      id: 102,
      title: "Matryoshka Representation Learning with Dynamic Pruning for Edge Vector DBs",
      category: "ai-llm",
      authors: "K. Chen, L. Vance, et al.",
      published_at: "2026-10-15",
      url: "https://arxiv.org/abs/2610.09876",
      description: "Enabling scalable on-device semantic search by compressing high-dimensional embeddings into variable-length slices without sacrificing recall accuracy.",
    },
    {
      id: 103,
      title: "Model Context Protocol: Standardizing Multi-Tool Interactions for Frontier AI",
      category: "developer-tools",
      authors: "Anthropic Systems & Architecture",
      published_at: "2026-11-01",
      url: "https://arxiv.org/abs/2611.00012",
      description: "A comprehensive analysis of client-server RPC models connecting LLMs with external resources, stateful databases, and dynamic developer tooling.",
    },
  ]

  const filtered = samplePapers.filter((p) =>
    !search ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)" }}>
            arXiv & Research Papers
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Curated papers analyzed and summarized by our local LLM pipeline ({filtered.length} indexed)
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 10,
            padding: "7px 12px",
          }}
        >
          <SearchIcon size={14} color="var(--text-muted)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search papers or abstracts..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-main)",
              fontSize: 12.5,
              width: 220,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((paper, idx) => (
          <div
            key={paper.id || idx}
            className="glass-panel"
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "var(--accent-emerald)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {paper.category || "Research"}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {paper.published_at ? new Date(paper.published_at).toLocaleDateString() : "Recent"}
                </span>
              </div>

              {paper.url && (
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "var(--accent-cyan)",
                    textDecoration: "none",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span>arXiv PDF / Abstract</span>
                  <ExternalLinkIcon size={12} />
                </a>
              )}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", lineHeight: 1.35 }}>
              {paper.title}
            </h3>

            {paper.authors && (
              <div style={{ fontSize: 12, color: "var(--accent-purple-light)", fontWeight: 500 }}>
                Authors: {paper.authors}
              </div>
            )}

            <p style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.55 }}>
              {paper.description || paper.ai_summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
