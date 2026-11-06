const API_BASE = "/api"

export async function health() {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}

export async function runAgent(objective) {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective }),
  })
  return res.json()
}

export async function runWorkflow({ workflowType, objective, criteria }) {
  const res = await fetch(`${API_BASE}/workflow/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_type: workflowType, objective, criteria }),
  })
  return res.json()
}

export async function runOrchestrate({ objective, specialists, parallel }) {
  const res = await fetch(`${API_BASE}/orchestrate/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objective, specialists, parallel }),
  })
  return res.json()
}

export async function kbSearch({ query, topK = 10, category }) {
  const res = await fetch(`${API_BASE}/kb/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: topK, category }),
  })
  return res.json()
}

export async function kbStats() {
  const res = await fetch(`${API_BASE}/kb/stats`)
  return res.json()
}

export async function kbDocuments(limit = 50) {
  const res = await fetch(`${API_BASE}/kb/documents?limit=${limit}`)
  return res.json()
}

export async function runEvaluate() {
  const res = await fetch(`${API_BASE}/evaluate/run`, {
    method: "POST",
  })
  return res.json()
}
