import React from "react"
import { PuzzleIcon, ExternalLinkIcon, CheckCircleIcon, StarIcon } from "../components/common/Icons"

export function SkillsMCP() {
  const mcpServers = [
    {
      name: "GitHub MCP Server",
      provider: "Official / Anthropic",
      category: "Developer Tools",
      compatibility: "Antigravity, Claude Desktop, Cursor",
      tools: ["get_file_contents", "create_or_update_file", "search_repositories", "create_pull_request"],
      status: "Verified",
      url: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    },
    {
      name: "PostgreSQL & SQLite MCP",
      provider: "ModelContextProtocol",
      category: "Databases",
      compatibility: "All MCP Clients",
      tools: ["read_query", "list_tables", "describe_table"],
      status: "Verified",
      url: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    },
    {
      name: "Puppeteer / Browser MCP",
      provider: "Official / Anthropic",
      category: "Automation & Web",
      compatibility: "Headless Chrome / Puppeteer",
      tools: ["navigate", "screenshot", "click", "fill", "evaluate_js"],
      status: "Verified",
      url: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    },
    {
      name: "Memory & Knowledge Graph MCP",
      provider: "Community / Open Source",
      category: "Memory / Knowledge",
      compatibility: "Local Vector Store / SQLite",
      tools: ["create_entities", "search_nodes", "open_nodes", "add_observations"],
      status: "Verified",
      url: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)" }}>
          Model Context Protocol (MCP) & AI Skills
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
          Standardized tool integrations, server specifications, and agent capability extensions
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
        {mcpServers.map((s, i) => (
          <div
            key={i}
            className="glass-panel"
            style={{
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span
                  style={{
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "var(--accent-purple-light)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {s.category}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent-emerald)", fontSize: 11.5, fontWeight: 600 }}>
                  <CheckCircleIcon size={14} color="#10b981" />
                  <span>{s.status}</span>
                </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", marginBottom: 4 }}>
                {s.name}
              </h3>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 12 }}>
                Provider: {s.provider}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginBottom: 6, fontWeight: 600 }}>
                  Exposed MCP Tools:
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {s.tools.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 6,
                        padding: "2px 6px",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                        color: "var(--accent-cyan)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                <strong>Client Compatibility:</strong> {s.compatibility}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--accent-cyan)",
                  fontSize: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                <span>Server Repo & Spec</span>
                <ExternalLinkIcon size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
