"""Phase 6.2 — Dynamic tech frameworks directory data.

Central, versioned source of truth for the frameworks shown in the
TechFrameworksDirectory UI. Kept here (instead of hardcoded in the
frontend) so the directory can be served dynamically via the REST API
and updated without a frontend redeploy.
"""

from typing import Any, Dict, List

TECH_FRAMEWORKS_DATA: List[Dict[str, Any]] = [
    # --- 1. Agentic AI & Autonomous Systems ---
    {
        "id": "langgraph",
        "category": "Agentic AI",
        "name": "LangGraph",
        "framework": "LangChain Ecosystem (Python / TypeScript)",
        "runtime": "Python 3.10+ / Node.js",
        "maturity": "Production Ready",
        "maturityColor": "#10b981",
        "tagline": "Stateful, multi-actor applications with cyclic graphs and human-in-the-loop controls",
        "keyFeatures": [
            "Cyclic graph execution",
            "Persistent checkpointing & memory",
            "Human-in-the-loop approval workflows",
            "Streaming multi-agent communication",
        ],
        "bestFor": "Enterprise multi-agent systems requiring strict state management and auditability",
        "docsUrl": "https://langchain-ai.github.io/langgraph/",
    },
    {
        "id": "crewai",
        "category": "Agentic AI",
        "name": "CrewAI",
        "framework": "CrewAI Framework",
        "runtime": "Python 3.10+",
        "maturity": "High Velocity",
        "maturityColor": "#f59e0b",
        "tagline": "Role-playing, autonomous AI agents working collaboratively in crews",
        "keyFeatures": [
            "Role-based agent design (Researcher, Writer, Reviewer)",
            "Sequential and hierarchical task execution",
            "Native tool delegation between agents",
            "Local model support via Ollama",
        ],
        "bestFor": "Collaborative agent teams with defined responsibilities and task pipelines",
        "docsUrl": "https://docs.crewai.com/",
    },
    {
        "id": "autogen",
        "category": "Agentic AI",
        "name": "Microsoft AutoGen 0.4",
        "framework": "Microsoft Research Ecosystem",
        "runtime": "Python 3.10+ / .NET",
        "maturity": "Industry Standard",
        "maturityColor": "#3b82f6",
        "tagline": "Event-driven, distributed multi-agent conversational framework",
        "keyFeatures": [
            "Asynchronous actor-based messaging",
            "Human-in-the-loop chat integration",
            "Code execution sandbox",
            "Multi-agent group chat managers",
        ],
        "bestFor": "Complex multi-agent dialogues, code generation, and distributed workflows",
        "docsUrl": "https://microsoft.github.io/autogen/",
    },
    {
        "id": "browser-use",
        "category": "Agentic AI",
        "name": "Browser-Use",
        "framework": "Playwright / Chromium AI Bridge",
        "runtime": "Python 3.11+",
        "maturity": "Trending",
        "maturityColor": "#ec4899",
        "tagline": "Enables AI agents to autonomously navigate, click, extract, and operate the web",
        "keyFeatures": [
            "Visual and DOM-based element extraction",
            "Autonomous cookie and auth management",
            "Multi-tab parallel scraping & form submission",
            "Vision model integration (Claude 3.5, GPT-4o)",
        ],
        "bestFor": "Autonomous web research, end-to-end task automation, and dynamic data extraction",
        "docsUrl": "https://github.com/browser-use/browser-use",
    },
    {
        "id": "smolagents",
        "category": "Agentic AI",
        "name": "Smolagents",
        "framework": "Hugging Face Ecosystem",
        "runtime": "Python 3.10+",
        "maturity": "Emerging",
        "maturityColor": "#8b5cf6",
        "tagline": "Lightweight, code-first agent library prioritizing executable Python actions",
        "keyFeatures": [
            "CodeAgent: writes actions in clean Python rather than JSON",
            "Minimalist footprint (< 1,000 lines of core code)",
            "Hub tool integration from Hugging Face",
            "Built-in secure code interpreter",
        ],
        "bestFor": "Developers wanting pure Python code execution without heavy framework abstraction",
        "docsUrl": "https://github.com/huggingface/smolagents",
    },

    # --- 2. Local Inference & LLM Serving ---
    {
        "id": "ollama",
        "category": "Local LLM Serving",
        "name": "Ollama",
        "framework": "Go / llama.cpp Core",
        "runtime": "macOS / Linux / Windows",
        "maturity": "Production Ready",
        "maturityColor": "#10b981",
        "tagline": "Run open-weights models (Llama 3.3, Qwen 2.5, DeepSeek, Mistral) locally with one command",
        "keyFeatures": [
            "OpenAI-compatible REST API endpoints",
            "GPU acceleration (Metal on Apple Silicon, CUDA, ROCm)",
            "Modelfile customization & system prompt baking",
            "Local embedding generation (Nomic, BGE)",
        ],
        "bestFor": "Local AI development, offline agent runtimes, and privacy-first pipelines",
        "docsUrl": "https://ollama.com",
    },
    {
        "id": "vllm",
        "category": "Local LLM Serving",
        "name": "vLLM",
        "framework": "vLLM Engine",
        "runtime": "Python / CUDA / ROCm",
        "maturity": "Production Ready",
        "maturityColor": "#10b981",
        "tagline": "High-throughput and memory-efficient LLM serving engine with PagedAttention",
        "keyFeatures": [
            "PagedAttention: near-zero memory waste in KV cache",
            "Continuous batching of incoming requests",
            "Fast tensor-parallel execution for multi-GPU",
            "Specular decoding and chunked prefill",
        ],
        "bestFor": "High-concurrency production deployments and enterprise inference endpoints",
        "docsUrl": "https://docs.vllm.ai/",
    },
    {
        "id": "llamacpp",
        "category": "Local LLM Serving",
        "name": "llama.cpp",
        "framework": "Pure C/C++ Foundation",
        "runtime": "Universal (Apple Silicon, CPU, x86, ARM)",
        "maturity": "Industry Standard",
        "maturityColor": "#3b82f6",
        "tagline": "Hyper-optimized inference of GGUF quantized models with zero external dependencies",
        "keyFeatures": [
            "4-bit, 5-bit, 8-bit, and dynamic K-quantizations",
            "Native Apple Metal & NEON instruction set optimization",
            "Ultra-low latency memory footprint",
            "Embedded HTTP server with tool calling support",
        ],
        "bestFor": "Resource-constrained environments, embedded hardware, and edge deployment",
        "docsUrl": "https://github.com/ggerganov/llama.cpp",
    },

    # --- 3. Model Context Protocol (MCP) & Agent Tools ---
    {
        "id": "fastmcp",
        "category": "Model Context Protocol",
        "name": "FastMCP",
        "framework": "Python FastMCP SDK",
        "runtime": "Python 3.10+",
        "maturity": "Production Ready",
        "maturityColor": "#10b981",
        "tagline": "High-level, ergonomic Python framework for building MCP servers and tools",
        "keyFeatures": [
            "Decorator-based tool and resource definition (@mcp.tool)",
            "Automatic Pydantic schema generation and docstring parsing",
            "Stdio and SSE (Server-Sent Events) network transports",
            "Built-in test runner and CLI inspector",
        ],
        "bestFor": "Rapidly exposing databases, APIs, and CLI tools to Antigravity, Claude, and agents",
        "docsUrl": "https://github.com/jlowin/fastmcp",
    },
    {
        "id": "mcp-official-sdk",
        "category": "Model Context Protocol",
        "name": "MCP TypeScript & Python SDK",
        "framework": "Anthropic / Open Protocol Standard",
        "runtime": "TypeScript (Node/Bun) / Python",
        "maturity": "Protocol Standard",
        "maturityColor": "#00f0ff",
        "tagline": "Official standard specifications and SDKs for client-server agent tool interactions",
        "keyFeatures": [
            "Bi-directional RPC communication over standard I/O and HTTP/SSE",
            "Resources, prompts, and tool registries",
            "Dynamic permission prompts and capability negotiation",
            "Ecosystem servers: GitHub, Postgres, SQLite, Puppeteer, Slack",
        ],
        "bestFor": "Building interoperable plugins and tools compatible with all frontier AI clients",
        "docsUrl": "https://modelcontextprotocol.io/",
    },

    # --- 4. Vector Stores & RAG Frameworks ---
    {
        "id": "sqlite-vec",
        "category": "Vector & RAG",
        "name": "sqlite-vec & ChromaDB",
        "framework": "SQLite Extension / Embedded Store",
        "runtime": "C / Python / Node.js",
        "maturity": "Production Ready",
        "maturityColor": "#10b981",
        "tagline": "Embedded vector search engine running directly inside SQLite files",
        "keyFeatures": [
            "Zero-daemon setup: stored inside your existing SQLite database file",
            "Fast SIMD-accelerated cosine, L2, and dot product distances",
            "Hybrid metadata filtering with standard SQL queries",
            "Pure local data privacy",
        ],
        "bestFor": "Self-contained research agent knowledge bases without external DB dependencies",
        "docsUrl": "https://github.com/asg017/sqlite-vec",
    },
    {
        "id": "qdrant",
        "category": "Vector & RAG",
        "name": "Qdrant",
        "framework": "Rust Vector Engine",
        "runtime": "Rust / Docker / Python client",
        "maturity": "Production Ready",
        "maturityColor": "#10b981",
        "tagline": "Enterprise-grade vector similarity search engine with advanced payload filtering",
        "keyFeatures": [
            "HNSW index for fast approximate nearest neighbor search",
            "Rich payload filtering with boolean conditions",
            "Quantization support (scalar & binary) for 4x memory reduction",
            "Distributed clustering and snapshot backups",
        ],
        "bestFor": "Large-scale RAG systems with millions of document chunks and rich metadata",
        "docsUrl": "https://qdrant.tech/",
    },

    # --- 5. Mobile & React Native AI ---
    {
        "id": "react-native-new-arch",
        "category": "Mobile & React Native",
        "name": "React Native 0.76+ (New Architecture)",
        "framework": "React Native / Meta",
        "runtime": "iOS / Android",
        "maturity": "Industry Standard",
        "maturityColor": "#3b82f6",
        "tagline": "Hermes engine, TurboModules, and Fabric renderer for native mobile AI apps",
        "keyFeatures": [
            "Direct synchronous C++ bindings with JSI (JavaScript Interface)",
            "Zero-bridge serialization overhead for AI streaming tokens",
            "React 19 support with useActionState and concurrent rendering",
            "Expo SDK 52 compatibility",
        ],
        "bestFor": "Building mobile research dashboards and cross-platform native client interfaces",
        "docsUrl": "https://reactnative.dev/",
    },
    {
        "id": "executorch",
        "category": "Mobile & React Native",
        "name": "ExecuTorch",
        "framework": "PyTorch Edge / Meta",
        "runtime": "iOS / Android / Embedded",
        "maturity": "High Velocity",
        "maturityColor": "#f59e0b",
        "tagline": "On-device PyTorch model execution for mobile and edge AI applications",
        "keyFeatures": [
            "Hardware acceleration across Apple Neural Engine (ANE) and Qualcomm NPU",
            "Lightweight C++ runtime with minimal memory footprint",
            "Direct export from PyTorch models into .pte binary formats",
            "Zero cloud latency and complete offline privacy",
        ],
        "bestFor": "On-device vision, embedding, and compact SLM inference on mobile devices",
        "docsUrl": "https://pytorch.org/executorch/",
    },

    # --- 6. Full-Stack Web Ecosystem ---
    {
        "id": "fastapi",
        "category": "Backend & Web",
        "name": "FastAPI",
        "framework": "Modern Python Web Framework",
        "runtime": "Python 3.10+ (Starlette / Pydantic)",
        "maturity": "Production Ready",
        "maturityColor": "#10b981",
        "tagline": "High-performance asynchronous API framework with automatic OpenAPI documentation",
        "keyFeatures": [
            "Native async/await request handling with Uvicorn",
            "Automatic interactive Swagger & OpenAPI documentation",
            "Strict data validation with Pydantic v2",
            "Native background tasks and streaming responses",
        ],
        "bestFor": "Serving multi-agent orchestration backends and AI research agent APIs",
        "docsUrl": "https://fastapi.tiangolo.com/",
    },
    {
        "id": "vite-react",
        "category": "Backend & Web",
        "name": "Vite + React 18 / 19",
        "framework": "Modern Frontend Stack",
        "runtime": "Browser / ES Modules",
        "maturity": "Industry Standard",
        "maturityColor": "#3b82f6",
        "tagline": "Instant dev server and lightning-fast Rollup builds for modern web dashboards",
        "keyFeatures": [
            "Native ESM-based Hot Module Replacement (HMR)",
            "Zero-config JSX and CSS variable compilation",
            "Clean client-side routing and state hydration",
            "Optimized production bundle size",
        ],
        "bestFor": "High-fidelity AI dashboards and real-time telemetry control centers",
        "docsUrl": "https://vitejs.dev/",
    },
]


def list_frameworks() -> List[Dict[str, Any]]:

    """Return all registered tech frameworks."""

    return list(TECH_FRAMEWORKS_DATA)


def get_framework(framework_id: str) -> Dict[str, Any] | None:

    """Return a single framework by id, or None if not found."""

    for item in TECH_FRAMEWORKS_DATA:

        if item["id"] == framework_id:

            return item

    return None


def list_categories() -> List[str]:

    """Return sorted unique categories."""

    return sorted({item["category"] for item in TECH_FRAMEWORKS_DATA})
