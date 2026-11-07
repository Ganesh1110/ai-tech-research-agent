# Personal AI Founder & Growth OS (ai-tech-research-agent)

An autonomous personal AI ecosystem that continuously discovers technology, identifies commercial business opportunities, generates startup concepts, architects product MVPs, and tracks personal technical growth.

It combines a **Technology Research Analyst**, **AI Startup Co-Founder**, **Product Architect**, and **Personal Learning Mentor** into one interconnected intelligence loop: **Discover → Think → Build → Learn → Grow**.

## Key Capabilities

- **Founder Idea Vault & Validation Engine** — Persistent idea capture with multi-dimensional AI scoring (Demand Urgency, Technical Feasibility, Market Moat, Founder Fit), actionable MVP roadmaps, and 1-click promotion to Startup Studio.
- **Global Problem & Pain-Point Radar** — Autonomous scanner collecting real customer friction, complaints, and unmet needs from Reddit, Hacker News, and review signals, matched directly to founder brainstorm ideas.
- **Startup Opportunity Intelligence** — Automatically scans research discoveries to extract commercial business opportunities with 4-axis scoring (Technical Feasibility, Market Opportunity, Cost Feasibility, Differentiation) and ICP targeting.
- **Weekly "What Should I Build Next?" Briefing** — Scheduled autonomous synthesis providing 3 technologies to explore, 3 startup ideas to validate, 1 recommended MVP architecture, and 1 high-leverage skill to develop.
- **AI Product Architect & Builder** — Translates validated startup opportunities into technical blueprints, system topologies, tech stack selections, and MVP implementation epics.
- **Personal Self-Growth & Skill Matrix** — Tracks competencies across AI/LLM, Agentic AI, Backend Systems, Frontend, and Startup Strategy, dynamically recommending micro-learning exercises to close knowledge gaps.
- **Multi-Agent Research Orchestration** — Coordinates specialist agents (`ai_llm`, `agentic_ai`, `react_native`, `developer_tools`, `open_source`) with shared context and traceable evidence.
- **Hybrid Knowledge Base & Vector Store** — Hybrid search (BM25 + vector embeddings + RRF reranking) with entity knowledge graphs.
- **Autonomous Execution Engine** — Background APScheduler cron jobs, persistent SQLite/PostgreSQL job queue, and worker daemons.
- **React Cyber-Telemetry Command Center** — High-density dashboard with Command Center, Startup Studio, Product Lab, Growth Center, Tech Radar, and live system telemetry.

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
│   ├── data/                     # Tech frameworks directory data
│   │   └── tech_frameworks.py    # Static + versioned framework registry
│   ├── database/                 # DB session, models
│   ├── knowledge_base/           # storage, retrieval, embeddings, reranker
│   ├── monitoring/               # Evaluator, TestCase
│   ├── services/                 # intelligence, reports
│   ├── autonomous/               # scheduler, job queue, worker, discovery
│   └── main.py                   # CLI entry point
├── frontend/                     # React dashboard (Vite)
│   ├── src/
│   │   ├── components/common/TechFrameworksDirectory.jsx
│   │   ├── pages/Trending.jsx
│   │   └── services/api.js       # fetchFrameworks()
│   └── package.json
├── docker-compose.yml            # PostgreSQL service
├── requirements.txt              # Python dependencies
└── research.db                   # Default SQLite database
```

## Installation

**Prerequisites:** Python 3.10+ (compatible with Python 3.10, 3.11, 3.12, and 3.14) and Node.js 18+.

```bash
# Clone the repository
git clone <repo-url>
cd ai-tech-research-agent

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env

# Install and build frontend
cd frontend
npm install
npm run build
cd ..
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `AI Tech Research Agent` | Application name |
| `DATABASE_URL` | `sqlite:///./research.db` | SQLAlchemy database URL (SQLite or PostgreSQL) |
| `API_KEY` | `""` | API key for protected endpoints (leave empty for unauthenticated local development) |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated list of allowed CORS origins |
| `HOST` | `127.0.0.1` | Server binding host |
| `PORT` | `8000` | Server binding port |
| `ENVIRONMENT` | `development` | Runtime environment (`development`, `test`, `production`) |
| `GITHUB_TOKEN` | `""` | GitHub personal access token (for higher rate limits) |
| `RESEARCH_DAYS` | `14` | Lookback window for collection |
| `GITHUB_RESULTS_PER_TOPIC` | `10` | Results per GitHub topic search |
| `TIMEZONE` | `Asia/Kolkata` | Application timezone |
| `LOG_LEVEL` | `INFO` | Logging level |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `llama3.1:8b` | Ollama model |

> **Security:** Never commit real secrets. Do not include actual `GITHUB_TOKEN` or `API_KEY` values in version control.

### Authentication & API Key Flow

- **Local Development (`npm run dev`)**: The Vite proxy automatically reads `API_KEY` from the root `.env` and injects the `X-API-Key` header into `/api` calls. No manual browser configuration is needed.
- **Production Builds (`npm run build`)**: To prevent secrets from leaking into client-side JS bundles, keys are **never baked into the production bundle**. In production or remote deployments, enter your key once in the dashboard under **Settings > API Authentication**, where it is stored in your browser's `localStorage` and sent with every request.
- **Unauthorized Handling**: If the server is protected and no key is configured, an interactive alert banner appears with a direct link to the Settings tab.

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
| `GET` | `/frameworks` | List tech frameworks + categories (Tech Frameworks Directory) |
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

## Tech Frameworks Directory

The directory (`frontend/src/components/common/TechFrameworksDirectory.jsx`) is now **dynamic**: it fetches frameworks from `GET /api/frameworks` at render time instead of relying on hardcoded data. The backend source of truth lives in `app/data/tech_frameworks.py` and can be updated without redeploying the frontend.

When the API is unavailable, the component gracefully falls back to `STATIC_FRAMEWORKS_DATA` and shows a notice.

Available categories: `Agentic AI`, `Local LLM Serving`, `Model Context Protocol`, `Vector & RAG`, `Mobile & React Native`, `Backend & Web`.

### Frontend setup

```bash
cd frontend
npm install          # or yarn install
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # production build
```

The frontend proxies API calls to `http://localhost:8000/api`. Ensure the FastAPI backend is running before using live data.

## Running with PostgreSQL (Docker)

```bash
docker-compose up -d postgres
# Set DATABASE_URL=postgresql+psycopg://research_user:research_password@localhost:5433/tech_research in .env
```

## License

MIT