const API_BASE = "/api"

// Helper to handle API responses cleanly
async function handleResponse(res) {
  if (!res.ok) {
    const errorText = await res.text()
    let errorDetail = `Request failed: ${res.status} ${res.statusText}`
    try {
      const json = JSON.parse(errorText)
      if (json.detail) {
        errorDetail = typeof json.detail === "string" ? json.detail : JSON.stringify(json.detail)
      }
    } catch {
      if (errorText) errorDetail = errorText
    }
    throw new Error(errorDetail)
  }
  return res.json()
}

// Health & System
export async function health() {
  const res = await fetch(`${API_BASE}/health`)
  return handleResponse(res)
}

// Autonomous Engine
export async function autonomousStatus() {
  const res = await fetch(`${API_BASE}/autonomous/status`)
  return handleResponse(res)
}

export async function autonomousStart() {
  const res = await fetch(`${API_BASE}/autonomous/start`, {
    method: "POST",
  })
  return handleResponse(res)
}

export async function autonomousStop() {
  const res = await fetch(`${API_BASE}/autonomous/stop`, {
    method: "POST",
  })
  return handleResponse(res)
}

export async function autonomousJobs(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.append("status", params.status)
  if (params.worker_type) query.append("worker_type", params.worker_type)
  if (params.limit) query.append("limit", params.limit)
  const qs = query.toString() ? `?${query.toString()}` : ""
  const res = await fetch(`${API_BASE}/autonomous/jobs${qs}`)
  return handleResponse(res)
}

export async function autonomousProcess() {
  const res = await fetch(`${API_BASE}/autonomous/process`, {
    method: "POST",
  })
  return handleResponse(res)
}

export async function autonomousDiscoveries(limit = 50, minScore = 0.0) {
  const res = await fetch(`${API_BASE}/autonomous/discoveries?limit=${limit}&min_score=${minScore}`)
  return handleResponse(res)
}

export async function autonomousRecommendations(level = null, limit = 50) {
  const query = new URLSearchParams()
  if (level) query.append("level", level)
  if (limit) query.append("limit", limit)
  const qs = query.toString() ? `?${query.toString()}` : ""
  const res = await fetch(`${API_BASE}/autonomous/recommendations${qs}`)
  return handleResponse(res)
}

export async function autonomousCycles(limit = 20) {
  const res = await fetch(`${API_BASE}/autonomous/cycles?limit=${limit}`)
  return handleResponse(res)
}

// Agent, Workflow & Orchestration
export async function runAgent(objective) {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective }),
  })
  return handleResponse(res)
}

export async function runWorkflow({ workflowType, objective, criteria }) {
  const res = await fetch(`${API_BASE}/workflow/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_type: workflowType, objective, criteria }),
  })
  return handleResponse(res)
}

export async function runOrchestrate({ objective, specialists, parallel }) {
  const res = await fetch(`${API_BASE}/orchestrate/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective, specialists, parallel }),
  })
  return handleResponse(res)
}

// Knowledge Base
export async function kbSearch({ query, topK = 10, category }) {
  const res = await fetch(`${API_BASE}/kb/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK, category }),
  })
  return handleResponse(res)
}

export async function kbStats() {
  const res = await fetch(`${API_BASE}/kb/stats`)
  return handleResponse(res)
}

export async function kbDocuments(limit = 50) {
  const res = await fetch(`${API_BASE}/kb/documents?limit=${limit}`)
  return handleResponse(res)
}

// Evaluation Suite
export async function runEvaluate() {
  const res = await fetch(`${API_BASE}/evaluate/run`, {
    method: "POST",
  })
  return handleResponse(res)
}

