const API_BASE = "/api"

// Helper to retrieve configured API key from localStorage or Vite environment
export function getStoredApiKey() {
  if (typeof window !== "undefined") {
    return (
      window.localStorage?.getItem("research_agent_api_key") ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY) ||
      ""
    )
  }
  return ""
}

export function setStoredApiKey(key) {
  if (typeof window !== "undefined") {
    if (key) {
      window.localStorage?.setItem("research_agent_api_key", key)
    } else {
      window.localStorage?.removeItem("research_agent_api_key")
    }
  }
}

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

// Centralized authenticated request dispatcher
async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const apiKey = getStoredApiKey()
  if (apiKey && !headers.has("X-API-Key") && !headers.has("Authorization")) {
    headers.set("X-API-Key", apiKey)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  return handleResponse(res)
}

// Health & System
export async function health() {
  return apiFetch("/health")
}

// Autonomous Engine
export async function autonomousStatus() {
  return apiFetch("/autonomous/status")
}

export async function autonomousStart() {
  return apiFetch("/autonomous/start", {
    method: "POST",
  })
}

export async function autonomousStop() {
  return apiFetch("/autonomous/stop", {
    method: "POST",
  })
}

export async function autonomousJobs(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.append("status", params.status)
  if (params.worker_type) query.append("worker_type", params.worker_type)
  if (params.limit) query.append("limit", params.limit)
  const qs = query.toString() ? `?${query.toString()}` : ""
  return apiFetch(`/autonomous/jobs${qs}`)
}

export async function autonomousProcess() {
  return apiFetch("/autonomous/process", {
    method: "POST",
  })
}

export async function autonomousDiscoveries(limit = 50, minScore = 0.0) {
  return apiFetch(`/autonomous/discoveries?limit=${limit}&min_score=${minScore}`)
}

export async function autonomousRecommendations(level = null, limit = 50) {
  const query = new URLSearchParams()
  if (level) query.append("level", level)
  if (limit) query.append("limit", limit)
  const qs = query.toString() ? `?${query.toString()}` : ""
  return apiFetch(`/autonomous/recommendations${qs}`)
}

export async function autonomousCycles(limit = 20) {
  return apiFetch(`/autonomous/cycles?limit=${limit}`)
}

// Agent, Workflow & Orchestration
export async function runAgent(objective) {
  return apiFetch("/agent/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective }),
  })
}

export async function runWorkflow({ workflowType, objective, criteria }) {
  return apiFetch("/workflow/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_type: workflowType, objective, criteria }),
  })
}

export async function runOrchestrate({ objective, specialists, parallel }) {
  return apiFetch("/orchestrate/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective, specialists, parallel }),
  })
}

// Knowledge Base
export async function kbSearch({ query, topK = 10, category }) {
  return apiFetch("/kb/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK, category }),
  })
}

export async function kbStats() {
  return apiFetch("/kb/stats")
}

export async function kbDocuments(limit = 50) {
  return apiFetch(`/kb/documents?limit=${limit}`)
}

// Evaluation Suite
export async function runEvaluate() {
  return apiFetch("/evaluate/run", {
    method: "POST",
  })
}

// Tech Frameworks Directory
export async function fetchFrameworks() {
  return apiFetch("/frameworks")
}

// Founder OS: Startup Intelligence, Briefings & Growth
export async function getStartupOpportunities(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.append("status", params.status)
  if (params.min_score) query.append("min_score", params.min_score)
  if (params.limit) query.append("limit", params.limit)
  const qs = query.toString() ? `?${query.toString()}` : ""
  return apiFetch(`/startup/opportunities${qs}`)
}

export async function scanStartupOpportunities(limit = 10, minScore = 65) {
  return apiFetch(`/startup/opportunities/scan?limit=${limit}&min_score=${minScore}`, {
    method: "POST",
  })
}

export async function updateOpportunityStatus(oppId, status, notes = null) {
  return apiFetch(`/startup/opportunities/${oppId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes }),
  })
}

export async function getWeeklyBriefings(limit = 10) {
  return apiFetch(`/startup/briefings?limit=${limit}`)
}

export async function getLatestWeeklyBriefing() {
  return apiFetch("/startup/briefings/latest")
}

export async function generateWeeklyBriefing(forceNew = true) {
  return apiFetch(`/startup/briefings/generate?force_new=${forceNew}`, {
    method: "POST",
  })
}

export async function getProductBlueprints(limit = 20) {
  return apiFetch(`/product/blueprints?limit=${limit}`)
}

export async function createProductBlueprint(blueprintData) {
  return apiFetch("/product/blueprints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blueprintData),
  })
}

export async function getFounderProfile() {
  return apiFetch("/growth/profile")
}

export async function updateFounderProfile(profileData) {
  return apiFetch("/growth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  })
}

export async function getSkillMatrix() {
  return apiFetch("/growth/skills")
}

export async function updateSkill(skillId, skillData) {
  return apiFetch(`/growth/skills/${skillId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(skillData),
  })
}
