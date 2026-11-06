import React, { useState } from "react"
import { SendIcon, SparklesIcon } from "../common/Icons"

export function QuickBrainstormBar({ onQuickBrainstorm }) {
  const [input, setInput] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    onQuickBrainstorm(input.trim())
    setInput("")
  }

  const handleChip = (prompt) => {
    onQuickBrainstorm(prompt)
  }

  return (
    <div className="glass-panel" style={{ padding: "20px 22px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SparklesIcon size={16} color="var(--accent-purple-light)" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-bright)" }}>
            Quick Brainstorming
          </h3>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
          Ask our AI specialist team to evaluate any framework or idea
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or architecture objective..."
            aria-label="Quick brainstorm prompt input"
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
            aria-label="Send brainstorm question"
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
        {[
          "Compare LangGraph vs CrewAI",
          "FastMCP server setup",
          "Ollama vs vLLM for local agent hosting",
          "React Native AI audio streaming",
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChip(chip)}
            aria-label={`Brainstorm ${chip}`}
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
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
