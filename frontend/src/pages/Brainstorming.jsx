import React, { useState, useEffect, useRef } from "react"
import { SendIcon, SparklesIcon, BrainIcon, ExternalLinkIcon, RefreshIcon } from "../components/common/Icons"
import { runAgent, runOrchestrate } from "../services/api"

export function Brainstorming({ initialQuery = "", onGenerateFeasibility }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("ai_brainstorm_history")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return [
      {
        id: 1,
        role: "agent",
        content:
          "Hello! I am your AI Tech Research Agent. I continuously explore GitHub, arXiv, and developer ecosystems. Ask me to brainstorm new system architectures, evaluate MCP servers, analyze repository technical feasibility, or synthesize research discoveries.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: [],
      },
    ]
  })

  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [mode, setMode] = useState("agent") // 'agent' or 'orchestrate'
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    localStorage.setItem("ai_brainstorm_history", JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend(textToSend) {
    const text = textToSend || input
    if (!text.trim() || isSending) return

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput("")
    setIsSending(true)

    try {
      let responseText = ""
      let sourcesCount = 0

      if (mode === "orchestrate") {
        const data = await runOrchestrate({
          objective: text.trim(),
          specialists: "ai_llm,agentic_ai,developer_tools",
          parallel: true,
        })
        responseText = data.final_answer || "Orchestration synthesis complete."
        sourcesCount = data.sources || 0
      } else {
        const data = await runAgent(text.trim())
        responseText = data.final_answer || "Research analysis complete."
        sourcesCount = data.sources || 0
      }

      const agentMsg = {
        id: Date.now() + 1,
        role: "agent",
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sourcesCount,
      }

      setMessages((prev) => [...prev, agentMsg])
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: "agent",
        content: `Error communicating with research agent: ${err.message || String(err)}. Check that the FastAPI backend and Ollama are reachable.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  function handleClear() {
    if (confirm("Clear brainstorming session history?")) {
      const initial = [
        {
          id: 1,
          role: "agent",
          content: "Brainstorming workspace reset. What technology, architecture, or repository should we explore next?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]
      setMessages(initial)
      localStorage.setItem("ai_brainstorm_history", JSON.stringify(initial))
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 170px)", gap: 16 }}>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 10 }}>
            <SparklesIcon size={22} color="var(--accent-purple-light)" />
            <span>Interactive Research Brainstorming</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>
            Real-time technical dialogue with multi-agent research memory and database retrieval
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Mode Switcher */}
          <div style={{ display: "flex", background: "var(--bg-card)", padding: 3, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setMode("agent")}
              style={{
                background: mode === "agent" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                color: mode === "agent" ? "#ffffff" : "var(--text-dim)",
                border: "none",
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Single Agent
            </button>
            <button
              onClick={() => setMode("orchestrate")}
              style={{
                background: mode === "orchestrate" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                color: mode === "orchestrate" ? "#ffffff" : "var(--text-dim)",
                border: "none",
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Multi-Specialist
            </button>
          </div>

          <button onClick={handleClear} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === "user"

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
                <span>{isUser ? "You" : "AI Research Agent"}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
                {m.sourcesCount > 0 && (
                  <span
                    style={{
                      background: "rgba(0, 240, 255, 0.12)",
                      color: "var(--accent-cyan)",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {m.sourcesCount} citations verified
                  </span>
                )}
              </div>

              <div
                style={{
                  maxWidth: "80%",
                  padding: "14px 18px",
                  borderRadius: 16,
                  borderTopRightRadius: isUser ? 4 : 16,
                  borderTopLeftRadius: !isUser ? 4 : 16,
                  background: isUser
                    ? "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)"
                    : m.isError
                    ? "rgba(244, 63, 94, 0.15)"
                    : "rgba(18, 26, 45, 0.9)",
                  border: isUser
                    ? "1px solid rgba(124, 58, 237, 0.4)"
                    : m.isError
                    ? "1px solid rgba(244, 63, 94, 0.4)"
                    : "1px solid var(--border-subtle)",
                  color: isUser ? "#ffffff" : m.isError ? "var(--accent-rose)" : "var(--text-main)",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  boxShadow: isUser ? "0 4px 18px rgba(124, 58, 237, 0.3)" : "none",
                }}
              >
                {m.content}
              </div>
            </div>
          )
        })}

        {isSending && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent-cyan)", fontSize: 13 }}>
            <RefreshIcon size={16} spinning={true} color="var(--accent-cyan)" />
            <span>AI Research Agent analyzing database and reasoning...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 14,
          padding: "8px 12px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a technical question, evaluate an architecture idea, or explore repos..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-main)",
            fontSize: 13.5,
            padding: "6px 8px",
          }}
          disabled={isSending}
        />

        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="btn-primary"
          style={{
            padding: "8px 18px",
            opacity: isSending || !input.trim() ? 0.5 : 1,
          }}
        >
          <span>Send</span>
          <SendIcon size={14} />
        </button>
      </form>
    </div>
  )
}
