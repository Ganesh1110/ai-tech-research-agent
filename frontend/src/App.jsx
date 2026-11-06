import { useState, useEffect } from "react"
import {
  health,
  runAgent,
  runWorkflow,
  runOrchestrate,
  kbSearch,
  kbStats,
  kbDocuments,
  runEvaluate,
} from "./services/api"

const TAB_LABELS = [
  "Overview",
  "Agent",
  "Workflow",
  "Orchestrate",
  "Knowledge Base",
  "Evaluation",
]

function App() {
  const [tab, setTab] = useState("Overview")
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadHealth()
  }, [])

  async function loadHealth() {
    try {
      const data = await health()
      setHealthData(data)
    } catch (e) {
      setError("Ollama/API not reachable: " + (e.message || String(e)))
    }
  }

  async function handleAgent(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const objective = fd.get("objective")
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await runAgent(objective)
      setResult({ kind: "agent", data })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleWorkflow(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const objective = fd.get("objective")
    const wf = fd.get("workflow_type")
    const criteria = fd.get("criteria") || undefined
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await runWorkflow({ workflowType: wf, objective, criteria })
      setResult({ kind: "workflow", data })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleOrchestrate(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const objective = fd.get("objective")
    const specialists = fd.get("specialists") || undefined
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await runOrchestrate({ objective, specialists, parallel: true })
      setResult({ kind: "orchestrate", data })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleKbSearch(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const query = fd.get("query")
    const topK = parseInt(fd.get("top_k") || "10", 10)
    const category = fd.get("category") || undefined
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await kbSearch({ query, topK, category })
      setResult({ kind: "kbsearch", data })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleEvaluate(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await runEvaluate()
      setResult({ kind: "evaluate", data })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function loadKbStats() {
    setLoading(true)
    try {
      const data = await kbStats()
      setResult({ kind: "kbstats", data })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  async function loadKbDocs() {
    setLoading(true)
    try {
      const data = await kbDocuments()
      setResult({ kind: "kbdocs", data })
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>AI Tech Research Dashboard</h1>
        <div style={styles.subtitle}>
          Multi-Agent Research • Knowledge Base • RAG
        </div>
      </header>

      <nav style={styles.nav}>
        {TAB_LABELS.map((label) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            style={tab === label ? styles.navActive : styles.navItem}
          >
            {label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {healthData && (
          <div style={styles.healthBar}>
            <span
              style={{
                ...styles.pill,
                background: healthData.ollama_available
                  ? "#10b981"
                  : "#ef4444",
              }}
            >
              Ollama:{" "}
              {healthData.ollama_available ? "online" : "offline"} ({healthData.ollama_model})
            </span>
          </div>
        )}
        {error && (
          <div style={styles.errorBox}>Error: {error}</div>
        )}
        {loading && <div style={styles.loading}>Loading…</div>}

        {tab === "Overview" && <Overview health={healthData} />}
        {tab === "Agent" && <AgentForm onSubmit={handleAgent} />}
        {tab === "Workflow" && <WorkflowForm onSubmit={handleWorkflow} />}
        {tab === "Orchestrate" && <OrchestrateForm onSubmit={handleOrchestrate} />}
        {tab === "Knowledge Base" && (
          <KbPanel
            onSearch={handleKbSearch}
            onStats={loadKbStats}
            onDocs={loadKbDocs}
          />
        )}
        {tab === "Evaluation" && (
          <div>
            <button onClick={handleEvaluate} style={styles.btn}>
              Run Evaluation Suite
            </button>
          </div>
        )}

        {result && <ResultPanel result={result} />}
      </main>
    </div>
  )
}

function Overview({ health }) {
  return (
    <section style={styles.section}>
      <h2>Overview</h2>
      <p>
        Autonomous AI Tech Research Platform. Collects research from GitHub,
        arXiv and RSS; analyzes with a local Ollama LLM; coordinates multiple
        specialist agents; and stores findings in a persistent knowledge base
        with hybrid semantic/keyword search.
      </p>
      <h3>Quick actions</h3>
      <div style={styles.buttonRow}>
        <button onClick={() => {}} disabled style={styles.btnDisabled}>
          Coming soon: One-click collection
        </button>
      </div>
      {health && (
        <div style={styles.meta}>
          <p><strong>Model:</strong> {health.ollama_model}</p>
          <p><strong>Base URL:</strong> {health.ollama_base_url}</p>
          <p><strong>Ollama online:</strong> {String(health.ollama_available)}</p>
        </div>
      )}
    </section>
  )
}

function AgentForm({ onSubmit }) {
  return (
    <section style={styles.section}>
      <h2>Autonomous Agent</h2>
      <p>Run a single-agent research task against your database.</p>
      <form onSubmit={onSubmit} style={styles.form}>
        <label style={styles.label}>Research objective</label>
        <textarea
          name="objective"
          style={styles.textarea}
          placeholder="e.g. Find the latest AI and LLM research items and summarize key discoveries"
          required
        />
        <button type="submit" style={styles.btn}>
          Run Agent
        </button>
      </form>
    </section>
  )
}

function WorkflowForm({ onSubmit }) {
  return (
    <section style={styles.section}>
      <h2>Research Workflow</h2>
      <p>Run a reusable multi-step workflow.</p>
      <form onSubmit={onSubmit} style={styles.form}>
        <label style={styles.label}>Workflow type</label>
        <select
          name="workflow_type"
          style={styles.select}
          defaultValue="technology_discovery"
        >
          <option value="technology_discovery">Technology Discovery</option>
          <option value="framework_comparison">Framework Comparison</option>
        </select>
        <label style={styles.label}>Research objective</label>
        <textarea
          name="objective"
          style={styles.textarea}
          placeholder="e.g. Compare local AI agent frameworks for Ollama deployment"
          required
        />
        <label style={styles.label}>Optional criteria</label>
        <input
          name="criteria"
          style={styles.input}
          placeholder="e.g. architecture, tool-calling, memory, Ollama suitability"
        />
        <button type="submit" style={styles.btn}>
          Run Workflow
        </button>
      </form>
    </section>
  )
}

function OrchestrateForm({ onSubmit }) {
  return (
    <section style={styles.section}>
      <h2>Multi-Agent Orchestration</h2>
      <p>Delegate research to coordinated specialist agents.</p>
      <form onSubmit={onSubmit} style={styles.form}>
        <label style={styles.label}>Research objective</label>
        <textarea
          name="objective"
          style={styles.textarea}
          placeholder="e.g. Find the latest AI and LLM research and summarize key discoveries"
          required
        />
        <label style={styles.label}>Specialists (comma-separated)</label>
        <input
          name="specialists"
          style={styles.input}
          defaultValue="ai_llm,agentic_ai,developer_tools"
          placeholder="ai_llm,agentic_ai,developer_tools"
        />
        <p style={styles.hint}>
          Valid types: ai_llm, agentic_ai, react_native, developer_tools, open_source
        </p>
        <button type="submit" style={styles.btn}>
          Run Orchestration
        </button>
      </form>
    </section>
  )
}

function KbPanel({ onSearch, onStats, onDocs }) {
  const [showStats, setShowStats] = useState(false)
  const [showDocs, setShowDocs] = useState(false)

  return (
    <section style={styles.section}>
      <h2>Knowledge Base</h2>
      <div style={styles.buttonRow}>
        <button onClick={onStats} style={styles.btn}>
          KB Stats
        </button>
        <button onClick={onDocs} style={styles.btn}>
          Documents
        </button>
      </div>
      <form onSubmit={onSearch} style={styles.form}>
        <label style={styles.label}>Semantic + keyword search</label>
        <div style={styles.searchRow}>
          <input
            name="query"
            style={styles.inputWide}
            placeholder="e.g. LLM inference quantization"
            required
          />
          <input
            name="top_k"
            type="number"
            defaultValue="10"
            style={styles.inputSmall}
          />
          <input
            name="category"
            style={styles.inputWide}
            placeholder="optional category filter"
          />
          <button type="submit" style={styles.btn}>
            Search
          </button>
        </div>
      </form>
      {showStats && <div style={styles.meta}>KB stats loaded above.</div>}
      {showDocs && <div style={styles.meta}>Document list loaded above.</div>}
    </section>
  )
}

function ResultPanel({ result }) {
  const { kind, data } = result
  return (
    <section style={styles.resultSection}>
      <h2>
        {kind === "agent"
          ? "Agent Result"
          : kind === "workflow"
          ? "Workflow Result"
          : kind === "orchestrate"
          ? "Orchestration Result"
          : kind === "kbsearch"
          ? "KB Search Results"
          : kind === "kbstats"
          ? "KB Statistics"
          : kind === "kbdocs"
          ? "KB Documents"
          : kind === "evaluate"
          ? "Evaluation Report"
          : "Result"}
      </h2>
      {kind === "agent" && <AgentResult data={data} />}
      {kind === "workflow" && <WorkflowResult data={data} />}
      {kind === "orchestrate" && <OrchestrateResult data={data} />}
      {kind === "kbsearch" && <KbSearchResult data={data} />}
      {kind === "kbstats" && <KbStatsResult data={data} />}
      {kind === "kbdocs" && <KbDocsResult data={data} />}
      {kind === "evaluate" && <EvaluateResult data={data} />}
      <pre style={styles.raw}>{JSON.stringify(data, null, 2)}</pre>
    </section>
  )
}

function AgentResult({ data }) {
  return (
    <div style={styles.card}>
      <p><strong>Objective:</strong> {data.objective}</p>
      <p><strong>Status:</strong> {data.status}</p>
      <p><strong>Steps:</strong> {data.total_steps}</p>
      <p><strong>Sources:</strong> {data.sources}</p>
      <h3>Final Answer</h3>
      <div style={styles.answer}>{data.final_answer}</div>
    </div>
  )
}

function WorkflowResult({ data }) {
  return (
    <div style={styles.card}>
      <p><strong>Objective:</strong> {data.objective}</p>
      <p><strong>Workflow:</strong> {data.workflow_type}</p>
      <p><strong>Steps completed:</strong> {data.steps_completed}</p>
      <p><strong>Sources:</strong> {data.sources}</p>
      <h3>Final Answer</h3>
      <div style={styles.answer}>{data.final_answer}</div>
    </div>
  )
}

function OrchestrateResult({ data }) {
  return (
    <div style={styles.card}>
      <p><strong>Objective:</strong> {data.objective}</p>
      <p><strong>Specialists:</strong> {data.specialists}</p>
      <p><strong>Tasks:</strong> {data.completed_tasks}/{data.total_tasks} completed ({data.failed_tasks} failed)</p>
      <p><strong>Duration:</strong> {(data.duration_seconds || 0).toFixed(2)}s</p>
      <p><strong>Sources:</strong> {data.sources}</p>
      <h3>Final Answer</h3>
      <div style={styles.answer}>{data.final_answer}</div>
    </div>
  )
}

function KbSearchResult({ data }) {
  return (
    <div style={styles.card}>
      <p><strong>Query:</strong> {data.query}</p>
      <p><strong>Results:</strong> {data.count}</p>
      {data.results.map((r, i) => (
        <div key={i} style={styles.searchItem}>
          <div style={styles.searchTitle}>
            {i + 1}. {r.title}
            {r.category && <span style={styles.badge}>[{r.category}]</span>}
          </div>
          <div style={styles.searchMeta}>
            {r.source_url && <span>Source: {r.source_url}</span>}
            {r.rrf_score != null && <span>RRF: {r.rrf_score}</span>}
            {r.vector_similarity != null && <span>Vector: {r.vector_similarity}</span>}
            {r.bm25_score != null && <span>BM25: {r.bm25_score}</span>}
          </div>
          <div style={styles.searchContent}>{r.content}</div>
        </div>
      ))}
    </div>
  )
}

function KbStatsResult({ data }) {
  return (
    <div style={styles.card}>
      <p><strong>Documents:</strong> {data.total_documents}</p>
      <p><strong>Chunks:</strong> {data.total_chunks}</p>
      <p><strong>Embedded:</strong> {data.embedded_chunks}</p>
      <p><strong>Coverage:</strong> {(data.embedding_coverage * 100).toFixed(1)}%</p>
      <p><strong>Stale:</strong> {data.stale_documents}</p>
    </div>
  )
}

function KbDocsResult({ data }) {
  return (
    <div style={styles.card}>
      <p><strong>Documents:</strong> {data.count}</p>
      <ul style={styles.docList}>
        {data.documents.map((d) => (
          <li key={d.id} style={styles.docItem}>
            <strong>{d.title}</strong> ({d.run_type}){" "}
            {d.category && <span style={styles.badge}>[{d.category}]</span>}
            {d.source_url && <span> • {d.source_url}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EvaluateResult({ data }) {
  return (
    <div style={styles.card}>
      <p><strong>Total tests:</strong> {data.total_tests}</p>
      <p><strong>Passed:</strong> {data.passed}</p>
      <p><strong>Failed:</strong> {data.failed}</p>
      <p><strong>Average score:</strong> {data.average_score}</p>
      <ul style={styles.docList}>
        {data.results.map((r, i) => (
          <li key={i} style={styles.evalItem}>
            {r.status} — {r.test} (score: {r.score})
          </li>
        ))}
      </ul>
    </div>
  )
}

const styles = {
  page: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: 980,
    margin: "0 auto",
    padding: 24,
    color: "#1f2937",
    lineHeight: 1.5,
  },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  title: { fontSize: 26, margin: 0, fontWeight: 700 },
  subtitle: { color: "#6b7280", fontSize: 13 },
  nav: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 8,
  },
  navItem: {
    background: "transparent",
    border: "1px solid #e5e7eb",
    color: "#4b5563",
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  navActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "#fff",
  },
  main: {},
  healthBar: { marginBottom: 12 },
  pill: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 13,
  },
  loading: { color: "#6b7280", fontStyle: "italic", marginBottom: 12 },
  section: { marginBottom: 24 },
  buttonRow: { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  btn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  btnDisabled: {
    background: "#9ca3af",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "not-allowed",
    fontSize: 14,
  },
  meta: { color: "#4b5563", fontSize: 13, marginTop: 6 },
  label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 },
  textarea: {
    width: "100%",
    minHeight: 90,
    padding: 8,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "inherit",
  },
  input: {
    width: "100%",
    padding: 8,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
  },
  select: {
    width: "100%",
    padding: 8,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
  },
  inputSmall: {
    width: 90,
    padding: 8,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
  },
  inputWide: { flex: 1 },
  searchRow: { display: "flex", gap: 8, alignItems: "flex-end" },
  hint: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  resultSection: {},
  card: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  answer: {
    whiteSpace: "pre-wrap",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    maxHeight: 400,
    overflowY: "auto",
  },
  searchItem: {
    borderBottom: "1px solid #e5e7eb",
    padding: "10px 0",
  },
  searchTitle: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 4,
  },
  badge: {
    display: "inline-block",
    background: "#e5e7eb",
    color: "#374151",
    fontSize: 11,
    padding: "1px 6px",
    borderRadius: 4,
    marginLeft: 6,
  },
  searchMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 4,
  },
  searchContent: { fontSize: 13, color: "#374151" },
  docList: { listStyle: "disc inside", paddingLeft: 0 },
  docItem: { marginBottom: 6, fontSize: 13 },
  evalItem: { marginBottom: 4, fontSize: 13 },
  raw: {
    marginTop: 12,
    background: "#111827",
    color: "#10b981",
    padding: 12,
    borderRadius: 6,
    fontSize: 11,
    overflowX: "auto",
    maxHeight: 300,
  },
}

export default App
