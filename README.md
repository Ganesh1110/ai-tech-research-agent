# ai-tech-research-agent

A multi-agent AI research platform that discovers, collects, and synthesizes technology research from GitHub, RSS feeds, and arXiv. It coordinates specialist research agents (AI/LLM, Agentic AI, React Native, Developer Tools, Open Source) through an orchestrator, stores findings in a knowledge base, and exposes both a CLI and a FastAPI REST API.

## Features

- **Multi-agent orchestration** — decomposes a research objective into per-specialist tasks, runs them in parallel or sequentially, and synthesizes a unified final answer with traceable citations.
- **Specialist agents** — `ai_llm`, `agentic_ai`, `react_native`, `developer_tools`, `open_source`, plus a `general` fallback.
- **Data collection** — GitHub repositories, RSS feeds, and arXiv papers collectors with deduplication.
- **Knowledge base** — document/vector storage (SQLite default, PostgreSQL via Docker), hybrid search (BM25 + vector + RRF), embedding coverage tracking.
- **Workflows** — `technology_discovery` and `framework_comparison` research workflows.
- **Autonomous mode** — scheduled collection cycles, job queue, discovery manager, recommendation engine.
- **Evaluation** — built-in test suite to score research quality against expected source counts.
- **REST API** — FastAPI backend with health, agent, workflow, orchestration, knowledge base, evaluation, and autonomous endpoints.

## Project structure

```
ai-tech-research-agent/
├── app/
│   ├── agent/
│   │   ├── agent.py              # AutonomousAgent
│   │   ├── orchestration/        # Orchestrator, schemas, shared memory, specialists
│   │   ├── workflows/            # TechnologyDiscovery, FrameworkComparison
│   │   └── schemas.py
│   ├── api/
│   │   ├── routes.py             # FastAPI endpoints
│   │   └── schemas.py            # Request/response models
│   ├── collectors/               # GitHub, RSS, arXiv collectors
│   ├── config.py                 # Settings (env-backed)
│   ├── database/                 # DB session, models
│   ├── knowledge_base/           # storage, retrieval, embeddings, reranker
│   ├── monitoring/               # Evaluator, TestCase
│   ├── services/                 # intelligence, reports
│   ├── autonomous/               # scheduler, job queue, worker, discovery
│   └── main.py                   # CLI entry point
├── frontend/                     # Frontend application
├── docker-compose.yml            # PostgreSQL service
├── requirements.txt              # Python dependencies
└── research.db                   # Default SQLite database
```

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd ai-tech-research-agent

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and adjust environment variables
cp .env.example .env   # if available, otherwise edit .env directly
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `AI Tech Research Agent` | Application name |
| `DATABASE_URL` | `sqlite:///./research.db` | SQLAlchemy database URL |
| `GITHUB_TOKEN` | `""` | GitHub personal access token (for higher rate limits) |
| `RESEARCH_DAYS` | `14` | Lookback window for collection |
| `GITHUB_RESULTS_PER_TOPIC` | `10` | Results per GitHub topic search |
| `TIMEZONE` | `Asia/Kolkata` | Application timezone |
| `LOG_LEVEL` | `INFO` | Logging level |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `llama3.1:8b` | Ollama model |

> **Security:** Never commit real secrets. Do not include actual `GITHUB_TOKEN` values in version control.

## Usage

### CLI (`app/main.py`)

Run orchestrated research:

```bash
python -m app.main --orchestrate --objective "Research local AI agent frameworks for Ollama deployment"
```

Limit to specific specialists (comma-separated):

```bash
python -m app.main --orchestrate --objective "..." --specialists ai_llm,agentic_ai
```

Run evaluation suite:

```bash
python -m app.main --evaluate
```

View knowledge base stats:

```bash
python -m app.main --kb-stats
```

### FastAPI server

```bash
uvicorn app.api.server:app --reload
```

Server runs on `http://localhost:8000` by default.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check + Ollama availability |
| `POST` | `/agent/run` | Run a single autonomous agent |
| `POST` | `/workflow/run` | Run a workflow (`technology_discovery` / `framework_comparison`) |
| `POST` | `/orchestrate/run` | Run multi-agent orchestration |
| `POST` | `/kb/search` | Search the knowledge base |
| `GET` | `/kb/stats` | Knowledge base statistics |
| `GET` | `/kb/documents` | List stored documents |
| `POST` | `/evaluate/run` | Run the evaluation test suite |
| `POST` | `/autonomous/start` | Start autonomous scheduler |
| `POST` | `/autonomous/stop` | Stop autonomous scheduler |
| `GET` | `/autonomous/status` | Autonomous scheduler status |
| `GET` | `/autonomous/jobs` | List jobs |
| `POST` | `/autonomous/process` | Process a single job |
| `GET` | `/autonomous/discoveries` | List discoveries |
| `GET` | `/autonomous/recommendations` | List recommendations |
| `GET` | `/autonomous/cycles` | List collection cycles |

### Orchestrate request body

```json
{
  "objective": "Research local AI agent frameworks",
  "specialists": "ai_llm,agentic_ai",
  "parallel": true
}
```

### Specialist types

`ai_llm`, `agentic_ai`, `react_native`, `developer_tools`, `open_source`, `general`

Invalid specialist strings are ignored; valid ones are normalized automatically.

## Running with PostgreSQL (Docker)

```bash
docker-compose up -d postgres
# Set DATABASE_URL=postgresql+psycopg://research_user:research_password@localhost:5433/tech_research in .env
```

## License

MIT